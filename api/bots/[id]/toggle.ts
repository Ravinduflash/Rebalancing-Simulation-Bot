import { VercelRequest, VercelResponse } from '@vercel/node';
import supabase from '../../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  const { data: bot, error } = await supabase.from('bots').select('status').eq('id', id).single();
  if (error || !bot) return res.status(404).json({ error: 'Bot not found' });

  const newStatus = bot.status === 'active' ? 'paused' : 'active';
  await supabase.from('bots').update({ status: newStatus }).eq('id', id);
  return res.json({ success: true, status: newStatus });
}
