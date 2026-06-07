import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

async function generateInvoiceNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.invoice.count({
    where: { invoiceDate: { gte: new Date(`${year}-01-01`) } }
  });
  return `FAC-${year}-${String(count + 1).padStart(5, '0')}`;
}

// Round to 2 decimal places to avoid IEEE-754 artifacts in financial math
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, status } = req.query;
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { name: true, code: true } },
        delivery: { select: { deliveryNumber: true, deliveryDate: true } },
        payments: true
      },
      orderBy: { invoiceDate: 'desc' }
    });
    res.json(invoices);
  } catch { res.status(500).json({ message: 'Erreur chargement factures' }); }
};

export const getInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        delivery: { include: { lines: { include: { model: true } } } },
        payments: { orderBy: { paymentDate: 'desc' } }
      }
    });
    if (!invoice) { res.status(404).json({ message: 'Facture non trouvée' }); return; }
    res.json(invoice);
  } catch { res.status(500).json({ message: 'Erreur chargement facture' }); }
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deliveryId, tvaRate = 19, timbre = 0, dueDate, notes } = req.body;

    // Validate financial fields
    const parsedTvaRate = Number(tvaRate);
    const parsedTimbre = Number(timbre);
    if (!Number.isFinite(parsedTvaRate) || parsedTvaRate < 0 || parsedTvaRate > 100) {
      res.status(400).json({ message: 'TVA doit être entre 0 et 100' });
      return;
    }
    if (!Number.isFinite(parsedTimbre) || parsedTimbre < 0) {
      res.status(400).json({ message: 'Timbre fiscal invalide' });
      return;
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            client: true,
            lines: { select: { modelId: true, unitPrice: true } }
          }
        },
        lines: { select: { modelId: true, quantity: true } }
      }
    });
    if (!delivery) { res.status(404).json({ message: 'Livraison non trouvée' }); return; }

    // Guard: only SIGNE deliveries can be invoiced
    if (delivery.status !== 'SIGNE') {
      res.status(400).json({ message: 'Seules les livraisons signées peuvent être facturées' });
      return;
    }

    // Compute subtotal from this delivery's lines × order unit prices
    const orderPriceMap = new Map(delivery.order.lines.map(l => [l.modelId, Number(l.unitPrice)]));
    const subtotal = round2(
      delivery.lines.reduce((s, l) => s + l.quantity * (orderPriceMap.get(l.modelId) ?? 0), 0)
    );
    const tvaAmount = round2(subtotal * parsedTvaRate / 100);
    const totalAmount = round2(subtotal + tvaAmount + parsedTimbre);

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber: await generateInvoiceNumber(tx),
          deliveryId,
          clientId: delivery.order.clientId,
          invoiceDate: new Date(),
          dueDate: dueDate
            ? new Date(dueDate)
            : new Date(Date.now() + delivery.order.client.paymentTerms * 86400000),
          subtotal,
          tvaRate: parsedTvaRate,
          tvaAmount,
          timbre: parsedTimbre,
          totalAmount,
          notes
        },
        include: { client: { select: { name: true } }, delivery: { select: { deliveryNumber: true } } }
      });
      await tx.clientOrder.update({
        where: { id: delivery.orderId },
        data: { status: 'FACTUREE' }
      });
      return inv;
    });

    res.status(201).json(invoice);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(409).json({ message: 'Une facture existe déjà pour cette livraison' });
    } else {
      res.status(500).json({ message: 'Erreur création facture' });
    }
  }
};

export const addPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, method, reference, paymentDate, notes } = req.body;

    // Validate payment amount — must be a positive finite number
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ message: 'Le montant doit être un nombre positif' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: req.params.id },
        include: { payments: true, delivery: { select: { orderId: true } } }
      });
      if (!invoice) throw Object.assign(new Error('Facture non trouvée'), { statusCode: 404 });
      if (invoice.status === 'ANNULEE') {
        throw Object.assign(new Error('Facture annulée'), { statusCode: 400 });
      }

      // Prevent overpayment
      const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = round2(Number(invoice.totalAmount) - alreadyPaid);
      if (parsedAmount > remaining + 0.01) {
        throw Object.assign(
          new Error(`Montant dépasse le solde restant (${remaining.toLocaleString('fr-DZ')} DZD)`),
          { statusCode: 400 }
        );
      }

      // Duplicate reference check
      if (reference) {
        const dup = await tx.payment.findFirst({ where: { invoiceId: invoice.id, reference } });
        if (dup) throw Object.assign(new Error('Référence de paiement déjà enregistrée'), { statusCode: 409 });
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId: req.params.id,
          amount: parsedAmount,
          method,
          reference,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes
        }
      });

      // Recompute inside transaction to avoid race
      const totalPaid = round2(alreadyPaid + parsedAmount);
      const newStatus = totalPaid >= Number(invoice.totalAmount) - 0.01
        ? 'PAYEE'
        : 'PARTIELLEMENT_PAYEE';

      await tx.invoice.update({
        where: { id: req.params.id },
        data: { amountPaid: totalPaid, status: newStatus }
      });

      if (newStatus === 'PAYEE' && invoice.delivery?.orderId) {
        await tx.clientOrder.update({
          where: { id: invoice.delivery.orderId },
          data: { status: 'PAYEE' }
        }).catch(() => {});
      }

      return payment;
    });

    res.status(201).json(result);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode) {
      res.status(e.statusCode).json({ message: e.message });
    } else {
      res.status(500).json({ message: 'Erreur enregistrement paiement' });
    }
  }
};

export const getInvoiceSummary = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, unpaid, overdue, caMonth] = await Promise.all([
      prisma.invoice.count({ where: { status: { not: 'ANNULEE' } } }),
      prisma.invoice.count({ where: { status: { in: ['EMISE', 'PARTIELLEMENT_PAYEE'] } } }),
      prisma.invoice.count({ where: { status: { in: ['EMISE', 'PARTIELLEMENT_PAYEE'] }, dueDate: { lt: new Date() } } }),
      prisma.invoice.aggregate({
        where: {
          invoiceDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          status: { not: 'ANNULEE' }
        },
        _sum: { totalAmount: true }
      })
    ]);
    res.json({ total, unpaid, overdue, caMonth: caMonth._sum.totalAmount || 0 });
  } catch { res.status(500).json({ message: 'Erreur résumé factures' }); }
};
