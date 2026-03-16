import { VercelRequest, VercelResponse } from '@vercel/node';
import supabase from '../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  if (req.method === 'GET') {
    const { data: bot, error: botError } = await supabase.from('bots').select('*').eq('id', id).single();
    if (botError || !bot) return res.status(404).json({ error: 'Bot not found' });

    const { data: holdings } = await supabase.from('holdings').select('*').eq('bot_id', id);
    const { data: trades } = await supabase.from('simulated_trades').select('*').eq('bot_id', id).order('timestamp', { ascending: false });
    const { data: snapshots } = await supabase.from('portfolio_snapshots').select('*').eq('bot_id', id).order('timestamp', { ascending: true });

    return res.json({ bot, holdings, trades, snapshots });
  }

  if (req.method === 'PUT') {
    const { name, coins, allocations, trigger_type, threshold_value, time_interval, trigger_prices, take_profit, stop_loss } = req.body;
    
    try {
      await supabase.from('bots').update({
        name,
        coins: JSON.stringify(coins),
        allocations: JSON.stringify(allocations),
        trigger_type,
        threshold_value,
        time_interval,
        trigger_prices: trigger_prices ? JSON.stringify(trigger_prices) : null,
        take_profit: take_profit ? parseFloat(take_profit) : null,
        stop_loss: stop_loss ? parseFloat(stop_loss) : null
      }).eq('id', id);
      
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update bot' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await Promise.all([
        supabase.from('holdings').delete().eq('bot_id', id),
        supabase.from('simulated_trades').delete().eq('bot_id', id),
        supabase.from('portfolio_snapshots').delete().eq('bot_id', id)
      ]);
      await supabase.from('bots').delete().eq('id', id);
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete bot' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
