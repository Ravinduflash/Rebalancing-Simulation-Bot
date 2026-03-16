import { VercelRequest, VercelResponse } from '@vercel/node';
import { runSimulationTick } from './engine';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests for security (optional depending on how Vercel Cron hits it)
  // Actually Vercel Cron sends GET requests, but includes a specific auth header. 
  // For now, we will just open it or check for a custom secret.
  
  try {
    // Basic protection (optional but recommended in production)
    // Removed CRON_SECRET check to allow free external services like cron-job.org to ping the endpoint without authentication.

    await runSimulationTick();
    
    return res.status(200).json({ success: true, message: 'Simulation tick executed successfully' });
  } catch (error) {
    console.error('Simulation tick error:', error);
    return res.status(500).json({ error: 'Simulation tick failed' });
  }
}
