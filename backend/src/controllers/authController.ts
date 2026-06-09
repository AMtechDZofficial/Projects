import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

const ALLOWED_CONFIG_FIELDS = ['companyName', 'numberOfOperators', 'workDaysPerMonth', 'hoursPerDay', 'targetEfficiency', 'coutMinuteBase'];

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email et mot de passe requis' });
      return;
    }
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
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

const ALLOWED_ROLES = ['MANAGER', 'OPERATOR'];

// Register requires an authenticated ADMIN — enforced at the route level
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role: requestedRole } = req.body;
    const role = ALLOWED_ROLES.includes(requestedRole) ? requestedRole : 'MANAGER';
    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, mot de passe et nom requis' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Email déjà utilisé' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role },
      select: { id: true, email: true, name: true, role: true }
    });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
  } catch {
    res.status(500).json({ message: "Erreur lors de l'inscription" });
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

// Requires ADMIN — enforced at the route level
export const updateConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only allow specific config fields — never pass req.body directly
    const data: Record<string, unknown> = {};
    for (const field of ALLOWED_CONFIG_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    const existing = await prisma.workshopConfig.findFirst();
    const config = existing
      ? await prisma.workshopConfig.update({ where: { id: existing.id }, data })
      : await prisma.workshopConfig.create({ data });
    res.json(config);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour config' });
  }
};
