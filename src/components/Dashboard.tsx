import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Play, Pause, TrendingUp, TrendingDown, Clock, Activity, Trash2, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/bots');
      const data = await res.json();
      setBots(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async (id: number) => {
    try {
      await fetch(`/api/bots/${id}/toggle`, { method: 'POST' });
      fetchBots();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBot = async (id: number) => {
    try {
      await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      fetchBots();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Activity className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  const totalValue = bots.reduce((sum, bot) => sum + bot.current_value, 0);
  const totalInvestment = bots.reduce((sum, bot) => sum + bot.initial_investment, 0);
  const totalProfit = totalValue - totalInvestment;
  const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-zinc-400 text-sm font-medium mb-2">Total Portfolio Value</h3>
          <div className="text-4xl font-bold font-mono tracking-tight">{totalValue.toFixed(2)} USDT</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-zinc-400 text-sm font-medium mb-2">Total Profit/Loss</h3>
          <div className={`text-4xl font-bold font-mono tracking-tight flex items-center gap-2 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            {Math.abs(totalProfit).toFixed(2)} USDT
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-zinc-400 text-sm font-medium mb-2">Return on Investment</h3>
          <div className={`text-4xl font-bold font-mono tracking-tight ${profitPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Active Bots</h2>
        </div>
        
        {bots.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl">
            <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No bots running</h3>
            <p className="text-zinc-500 mb-6">Create your first rebalancing bot to start simulating.</p>
            <Link to="/create" className="bg-emerald-500 text-zinc-950 font-medium px-6 py-2.5 rounded-full hover:bg-emerald-400 transition-colors">
              Create Bot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map(bot => {
              const profit = bot.current_value - bot.initial_investment;
              const profitPct = (profit / bot.initial_investment) * 100;
              const coins = JSON.parse(bot.coins);
              
              return (
                <div key={bot.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Link to={`/bot/${bot.id}`} className="text-lg font-bold hover:text-emerald-400 transition-colors">
                          {bot.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${bot.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {bot.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {bot.trigger_type === 'time' ? `Every ${bot.time_interval / 60000}m` : `>${bot.threshold_value * 100}% dev`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/edit/${bot.id}`} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors" title="Edit Bot">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => deleteBot(bot.id)}
                          className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          title="Delete Bot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleBot(bot.id)}
                          className={`p-2 rounded-full ${bot.status === 'active' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                          title={bot.status === 'active' ? 'Pause Bot' : 'Resume Bot'}
                        >
                          {bot.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mb-6 flex-wrap">
                      {coins.map((c: string) => (
                        <span key={c} className="bg-zinc-800 px-2 py-1 rounded text-xs font-mono text-zinc-300">
                          {c}
                        </span>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Current Value</div>
                        <div className="font-mono font-medium">{bot.current_value.toFixed(2)} USDT</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Profit/Loss</div>
                        <div className={`font-mono font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profitPct.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-950 px-6 py-3 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between items-center">
                    <span>Created {formatDistanceToNow(bot.created_at)} ago</span>
                    <Link to={`/bot/${bot.id}`} className="text-emerald-400 hover:text-emerald-300 font-medium">View Details &rarr;</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
