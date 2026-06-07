import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { buildWorkshopContext, WORKSHOP_SYSTEM_PROMPT } from '../services/aiService';

let Anthropic: typeof import('@anthropic-ai/sdk').default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Anthropic = require('@anthropic-ai/sdk').default;
} catch {
  console.warn('⚠️  @anthropic-ai/sdk not installed. AI features disabled.');
}

export const chatStream = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!Anthropic) {
    res.status(503).json({ message: 'Service IA non disponible. Installez @anthropic-ai/sdk.' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ message: 'ANTHROPIC_API_KEY non configurée.' });
    return;
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ message: 'Messages requis' });
    return;
  }
  if (messages.length > 50) {
    res.status(400).json({ message: 'Trop de messages (max 50)' });
    return;
  }
  const ALLOWED_ROLES = new Set(['user', 'assistant']);
  for (const m of messages) {
    if (!m || typeof m !== 'object') { res.status(400).json({ message: 'Message invalide' }); return; }
    if (!ALLOWED_ROLES.has(m.role)) { res.status(400).json({ message: 'Rôle de message invalide' }); return; }
    if (typeof m.content !== 'string' || m.content.length > 8000) { res.status(400).json({ message: 'Contenu de message invalide ou trop long' }); return; }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const context = await buildWorkshopContext();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: WORKSHOP_SYSTEM_PROMPT + context,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    console.error('[AI] chatStream error:', err instanceof Error ? err.message : err);
    res.write(`data: ${JSON.stringify({ error: 'Erreur du service IA' })}\n\n`);
    res.end();
  }
};

export const analyzeWorkshop = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!Anthropic) {
    res.status(503).json({ message: 'Service IA non disponible.' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ message: 'ANTHROPIC_API_KEY non configurée.' });
    return;
  }

  try {
    const { question } = req.body;
    const context = await buildWorkshopContext();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: WORKSHOP_SYSTEM_PROMPT + context,
      messages: [{ role: 'user', content: question || 'Analyse générale de l\'atelier' }]
    });

    res.json({
      answer: response.content[0].type === 'text' ? response.content[0].text : ''
    });
  } catch {
    res.status(500).json({ message: 'Erreur analyse IA' });
  }
};
