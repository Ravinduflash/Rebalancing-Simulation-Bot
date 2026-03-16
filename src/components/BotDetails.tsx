import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Activity, Play, Pause, RefreshCw, Trash2, Edit } from 'lucide-react';

export default function BotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1H');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/bots/${id}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async () => {
    try {
      await fetch(`/api/bots/${id}/toggle`, { method: 'POST' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBot = async () => {
    try {
      await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Activity className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  if (!data || !data.bot) return <div className="text-center py-16 text-zinc-500">Bot not found</div>;

  const { bot, holdings, trades, snapshots } = data;
  const allocations = JSON.parse(bot.allocations);
  
  const profit = bot.current_value - bot.initial_investment;
  const profitPct = (profit / bot.initial_investment) * 100;

  // Filter snapshots based on timeframe (mock logic for demo)
  const now = Date.now();
  let filteredSnapshots = snapshots;
  if (timeframe === '1H') {
    filteredSnapshots = snapshots.filter((s: any) => now - s.timestamp <= 60 * 60 * 1000);
  } else if (timeframe === '24H') {
    filteredSnapshots = snapshots.filter((s: any) => now - s.timestamp <= 24 * 60 * 60 * 1000);
  } else if (timeframe === '7D') {
    filteredSnapshots = snapshots.filter((s: any) => now - s.timestamp <= 7 * 24 * 60 * 60 * 1000);
  }

  const chartData = filteredSnapshots.map((s: any) => ({
    time: format(new Date(s.timestamp), 'HH:mm:ss'),
    value: s.total_value_usd
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{bot.name}</h1>
          <span className={`px-2 py-1 rounded text-xs font-medium ${bot.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
            {bot.status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            to={`/edit/${id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button 
            onClick={deleteBot}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button 
            onClick={toggleBot}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${bot.status === 'active' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'}`}
          >
            {bot.status === 'active' ? <><Pause className="w-4 h-4" /> Pause Bot</> : <><Play className="w-4 h-4" /> Resume Bot</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Current Value</div>
          <div className="text-2xl font-bold font-mono tracking-tight">{bot.current_value.toFixed(2)} USDT</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Initial Investment</div>
          <div className="text-2xl font-bold font-mono tracking-tight">{bot.initial_investment.toFixed(2)} USDT</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Total Profit/Loss</div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profitPct.toFixed(2)}%)
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="text-sm text-zinc-500 mb-1">Trigger Condition</div>
          <div className="text-lg font-medium tracking-tight flex items-center gap-2 mt-1">
            <RefreshCw className="w-5 h-5 text-emerald-500" />
            {bot.trigger_type === 'time' ? `Every ${bot.time_interval / 60000}m` : `>${bot.threshold_value * 100}% dev`}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Performance History</h2>
          <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
            {['1H', '24H', '7D', 'All'].map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeframe === t ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val.toFixed(0)} USDT`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#34d399' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#34d399' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">Not enough data points yet.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-medium">Current Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Asset</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Target Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {holdings.map((h: any) => (
                  <tr key={h.coin} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">{h.coin[0]}</div>
                      {h.coin}
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-300">{h.amount.toFixed(6)}</td>
                    <td className="px-6 py-4 font-mono text-zinc-300">{(allocations[h.coin] * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-medium">Trade History</h2>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Reason</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No trades executed yet.</td>
                  </tr>
                ) : (
                  trades.map((t: any) => (
                    <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-3 text-zinc-400">{format(new Date(t.timestamp), 'HH:mm:ss')}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.side === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {t.side.toUpperCase()} {t.coin}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {t.reason === 'initial' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400 tracking-wide">INITIAL</span>}
                        {t.reason === 'rebalance' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 tracking-wide">REBALANCE</span>}
                        {t.reason === 'take_profit' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 tracking-wide">TAKE PROFIT</span>}
                        {t.reason === 'stop_loss' && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 tracking-wide">STOP LOSS</span>}
                      </td>
                      <td className="px-6 py-3 font-mono text-zinc-300">{t.amount.toFixed(6)}</td>
                      <td className="px-6 py-3 font-mono text-zinc-300">{t.price.toFixed(2)} USDT</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
