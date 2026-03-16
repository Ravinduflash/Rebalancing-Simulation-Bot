import { Handler } from '@netlify/functions';
import { getPrices } from './pionex';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const prices = await getPrices();
    return {
      statusCode: 200,
      body: JSON.stringify(prices)
    };
  } catch (error) {
    console.error('Error fetching prices:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch prices' })
    };
  }
};
