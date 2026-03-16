import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { message } = JSON.parse(event.body || '{}');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: 'You are an expert trading assistant. Help users understand portfolio rebalancing, markets (crypto, spot, tokenized stocks, leveraged tokens), and how to optimize their bot strategies. Be concise and helpful.',
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text })
    };
  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate response' })
    };
  }
};
