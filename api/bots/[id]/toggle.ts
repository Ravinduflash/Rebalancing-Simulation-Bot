import { Handler } from '@netlify/functions';
import supabase from '../../db';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const idMatch = event.path.match(/\/api\/bots\/([^/]+)\/toggle/);
  const id = idMatch ? idMatch[1] : null;

  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid ID' }) };

  const { data: bot, error } = await supabase.from('bots').select('status').eq('id', id).single();
  if (error || !bot) return { statusCode: 404, body: JSON.stringify({ error: 'Bot not found' }) };

  const newStatus = bot.status === 'active' ? 'paused' : 'active';
  await supabase.from('bots').update({ status: newStatus }).eq('id', id);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, status: newStatus })
  };
};
