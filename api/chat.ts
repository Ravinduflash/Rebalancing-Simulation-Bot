import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: 'You are an expert trading assistant. Help users understand portfolio rebalancing, markets (crypto, spot, tokenized stocks, leveraged tokens), and how to optimize their bot strategies. Be concise and helpful.',
      }
    });
    return res.json({ text: response.text });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
