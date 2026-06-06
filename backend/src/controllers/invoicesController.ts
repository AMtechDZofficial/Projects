import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `FAC-${year}-${rand}`;
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
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: { include: { client: true, lines: true } } }
    });
    if (!delivery) { res.status(404).json({ message: 'Livraison non trouvée' }); return; }
    const subtotal = Number(delivery.order.totalAmount);
    const tvaAmount = subtotal * (Number(tvaRate) / 100);
    const totalAmount = subtotal + tvaAmount + Number(timbre);
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        deliveryId,
        clientId: delivery.order.clientId,
        invoiceDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + delivery.order.client.paymentTerms * 86400000),
        subtotal,
        tvaRate,
        tvaAmount,
        timbre,
        totalAmount,
        notes
      },
      include: { client: { select: { name: true } }, delivery: { select: { deliveryNumber: true } } }
    });
    // Update order status
    await prisma.clientOrder.update({ where: { id: delivery.orderId }, data: { status: 'FACTUREE' } });
    res.status(201).json(invoice);
  } catch { res.status(500).json({ message: 'Erreur création facture' }); }
};

export const addPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, method, reference, paymentDate, notes } = req.body;
    const payment = await prisma.payment.create({
      data: { invoiceId: req.params.id, amount, method, reference, paymentDate: paymentDate ? new Date(paymentDate) : new Date(), notes }
    });
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { payments: true, delivery: { select: { orderId: true } } }
    });
    if (invoice) {
      const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      const newStatus = totalPaid >= Number(invoice.totalAmount) ? 'PAYEE' : totalPaid > 0 ? 'PARTIELLEMENT_PAYEE' : invoice.status;
      await prisma.invoice.update({ where: { id: req.params.id }, data: { amountPaid: totalPaid, status: newStatus } });
      if (newStatus === 'PAYEE' && invoice.delivery?.orderId) {
        await prisma.clientOrder.update({ where: { id: invoice.delivery.orderId }, data: { status: 'PAYEE' } }).catch(() => {});
      }
    }
    res.status(201).json(payment);
  } catch { res.status(500).json({ message: 'Erreur enregistrement paiement' }); }
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
