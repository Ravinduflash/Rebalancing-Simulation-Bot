import { Handler } from '@netlify/functions';
import { runSimulationTick } from './engine';

export const handler: Handler = async (event, context) => {
  try {
    await runSimulationTick();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Simulation tick executed successfully' })
    };
  } catch (error) {
    console.error('Simulation tick error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Simulation tick failed' })
    };
  }
};
