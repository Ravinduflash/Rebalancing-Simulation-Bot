import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrices } from './pionex';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const prices = await getPrices();
    return res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
}
