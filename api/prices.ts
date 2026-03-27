import { Handler } from '@netlify/functions';

async function getPrices(): Promise<Record<string, number>> {
  try {
    const prices: Record<string, number> = {};
    const btcPairs: Record<string, number> = {};
    const ethPairs: Record<string, number> = {};

    try {
      const response = await fetch('https://api.pionex.com/api/v1/market/tickers');
      const data = await response.json();
      if (data.result && data.data && data.data.tickers) {
        for (const ticker of data.data.tickers) {
          if (ticker.symbol.endsWith('_USDT')) {
            prices[ticker.symbol.replace('_USDT', '')] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_USDC')) {
            const coin = ticker.symbol.replace('_USDC', '');
            if (!prices[coin]) prices[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_BTC')) {
            btcPairs[ticker.symbol.replace('_BTC', '')] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_ETH')) {
            ethPairs[ticker.symbol.replace('_ETH', '')] = parseFloat(ticker.close);
          }
        }
      }
    } catch (e) { console.error('Tickers error:', e); }

    try {
      const respIndex = await fetch('https://api.pionex.com/api/v1/market/indexes');
      const dataIndex = await respIndex.json();
      if (dataIndex.result && dataIndex.data && dataIndex.data.indexes) {
        for (const indexData of dataIndex.data.indexes) {
          if (indexData.symbol.endsWith('_USDT_PERP')) {
            const coin = indexData.symbol.replace('_USDT_PERP', '');
            if (!prices[coin]) prices[coin] = parseFloat(indexData.indexPrice);
          }
        }
      }
    } catch (e) { console.error('Indexes error:', e); }

    prices['USDT'] = 1.0;
    prices['USDC'] = 1.0;
    const btcPrice = prices['BTC'] || 0;
    const ethPrice = prices['ETH'] || 0;
    if (btcPrice > 0) {
      for (const [coin, p] of Object.entries(btcPairs)) { if (!prices[coin]) prices[coin] = p * btcPrice; }
    }
    if (ethPrice > 0) {
      for (const [coin, p] of Object.entries(ethPairs)) { if (!prices[coin]) prices[coin] = p * ethPrice; }
    }
    return prices;
  } catch (error) {
    console.error('getPrices error:', error);
    return {};
  }
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const prices = await getPrices();
    return { statusCode: 200, body: JSON.stringify(prices) };
  } catch (error) {
    console.error('Error fetching prices:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch prices' }) };
  }
};
