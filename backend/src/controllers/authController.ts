import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ message: 'Compte désactivé' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' as unknown as number }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Email déjà utilisé' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: role || 'MANAGER' },
      select: { id: true, email: true, name: true, role: true }
    });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true }
    });
    const config = await prisma.workshopConfig.findFirst();
    res.json({ user, config });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const existing = await prisma.workshopConfig.findFirst();
    const config = existing
      ? await prisma.workshopConfig.update({ where: { id: existing.id }, data })
      : await prisma.workshopConfig.create({ data });
    res.json(config);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour config' });
  }
};
