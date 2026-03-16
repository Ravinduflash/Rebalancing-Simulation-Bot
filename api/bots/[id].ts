import { Handler } from '@netlify/functions';
import supabase from '../db';

export const handler: Handler = async (event, context) => {
  // Extract ID from the path since Netlify does not auto-map dynamic segments
  const idMatch = event.path.match(/\/api\/bots\/([^/]+)/);
  const id = idMatch ? idMatch[1] : null;

  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid ID' }) };

  if (event.httpMethod === 'GET') {
    const { data: bot, error: botError } = await supabase.from('bots').select('*').eq('id', id).single();
    if (botError || !bot) return { statusCode: 404, body: JSON.stringify({ error: 'Bot not found' }) };

    const { data: holdings } = await supabase.from('holdings').select('*').eq('bot_id', id);
    const { data: trades } = await supabase.from('simulated_trades').select('*').eq('bot_id', id).order('timestamp', { ascending: false });
    const { data: snapshots } = await supabase.from('portfolio_snapshots').select('*').eq('bot_id', id).order('timestamp', { ascending: true });

    return {
        statusCode: 200,
        body: JSON.stringify({ bot, holdings, trades, snapshots })
    };
  }

  if (event.httpMethod === 'PUT') {
    const { name, coins, allocations, trigger_type, threshold_value, time_interval, trigger_prices, take_profit, stop_loss } = JSON.parse(event.body || '{}');
    
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
      
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
      console.error(error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update bot' }) };
    }
  }

  if (event.httpMethod === 'DELETE') {
    try {
      await Promise.all([
        supabase.from('holdings').delete().eq('bot_id', id),
        supabase.from('simulated_trades').delete().eq('bot_id', id),
        supabase.from('portfolio_snapshots').delete().eq('bot_id', id)
      ]);
      await supabase.from('bots').delete().eq('id', id);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
      console.error(error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to delete bot' }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
