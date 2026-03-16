import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, ChevronDown, ChevronRight, CircleDollarSign, TrendingUp, TrendingDown, MoveVertical, Settings2, ChevronUp, Clock, CircleDot, BarChart3, Info } from 'lucide-react';
import AssetSelectorModal from './AssetSelectorModal';
import TriggerPriceModal from './TriggerPriceModal';
import TakeProfitModal from './TakeProfitModal';
import StopLossModal from './StopLossModal';
import SlippageControlModal, { SlippageConfig, getSlippageSummary } from './SlippageControlModal';
import AutoRebalancingModal, { RebalanceMode, getRebalanceModeLabel } from './AutoRebalancingModal';
import RotationPeriodModal from './RotationPeriodModal';
import ProfitRatioModal from './ProfitRatioModal';
import DeviationThresholdModal from './DeviationThresholdModal';

export default function EditBot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [triggerType, setTriggerType] = useState('threshold');
  const [thresholdValue, setThresholdValue] = useState('0.25'); // 0.25%
  const [timeInterval, setTimeInterval] = useState(60); // 60 minutes
  
  const [coins, setCoins] = useState<{ symbol: string, weight: number }[]>([]);
  
  const [availableCoins, setAvailableCoins] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [selectingAssetIndex, setSelectingAssetIndex] = useState<number | null>(null);
  const [isAddingNewAsset, setIsAddingNewAsset] = useState(false);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [triggerPrices, setTriggerPrices] = useState<Record<string, string>>({});
  const [isTriggerPriceModalOpen, setIsTriggerPriceModalOpen] = useState(false);
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isTakeProfitModalOpen, setIsTakeProfitModalOpen] = useState(false);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [isStopLossModalOpen, setIsStopLossModalOpen] = useState(false);
  const [slippageConfig, setSlippageConfig] = useState<SlippageConfig>({
    enabled: true,
    mode: 'ai',
    manualValue: '',
    perCoin: {},
  });
  const [isSlippageModalOpen, setIsSlippageModalOpen] = useState(false);
  const [rebalanceMode, setRebalanceMode] = useState<RebalanceMode>('close');
  const [isRebalancingModalOpen, setIsRebalancingModalOpen] = useState(false);

  // Momentum-specific state
  const [rotationPeriod, setRotationPeriod] = useState('15Min');
  const [isRotationPeriodModalOpen, setIsRotationPeriodModalOpen] = useState(false);
  const [rebalanceOnlyProfit, setRebalanceOnlyProfit] = useState(true);
  const [profitRatio, setProfitRatio] = useState('1');
  const [isProfitRatioModalOpen, setIsProfitRatioModalOpen] = useState(false);
  const [rotationRatioMode, setRotationRatioMode] = useState<'default' | 'custom'>('default');
  const [customRotationRatios, setCustomRotationRatios] = useState<number[]>([]);

  // Periodic-specific state
  const [balancingPeriod, setBalancingPeriod] = useState('15Min');
  const [isBalancingPeriodModalOpen, setIsBalancingPeriodModalOpen] = useState(false);

  // Threshold-specific state
  const [isDeviationThresholdModalOpen, setIsDeviationThresholdModalOpen] = useState(false);

  // Compute rotation ratios based on coin count
  const getDefaultRotationRatios = () => {
    const count = coins.length;
    if (count === 0) return [];
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    return coins.map((_, i) => i === count - 1 ? base + remainder : base);
  };

  const rotationRatios = rotationRatioMode === 'default' ? getDefaultRotationRatios() : customRotationRatios;
  const rotationRatioSum = rotationRatios.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (rotationRatioMode === 'custom' && customRotationRatios.length !== coins.length) {
      setCustomRotationRatios(getDefaultRotationRatios());
    }
  }, [coins.length, rotationRatioMode]);

  useEffect(() => {
    fetch('/api/prices')
      .then(res => res.json())
      .then(data => {
        setAvailableCoins(Object.keys(data).sort());
        setPrices(data);
      });

    if (id) {
      fetch(`/api/bots/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.bot) {
            setName(data.bot.name);
            setInitialInvestment(data.bot.initial_investment);
            setTriggerType(data.bot.trigger_type);
            setThresholdValue(data.bot.threshold_value * 100);
            setTimeInterval(data.bot.time_interval / 60000);
            
            if (data.bot.trigger_prices) {
              try {
                setTriggerPrices(JSON.parse(data.bot.trigger_prices));
              } catch (e) {
                // Ignore parse error
              }
            }
            
            if (data.bot.take_profit) {
              setTakeProfit(data.bot.take_profit.toString());
            }
            
            if (data.bot.stop_loss) {
              setStopLoss(data.bot.stop_loss.toString());
            }

            const parsedCoins = JSON.parse(data.bot.coins);
            const parsedAllocations = JSON.parse(data.bot.allocations);
            
            const loadedCoins = parsedCoins.map((c: string) => ({
              symbol: c,
              weight: parsedAllocations[c] * 100
            }));
            
            setCoins(loadedCoins);
          }
        });
    }
  }, [id]);

  const totalWeight = coins.reduce((sum, c) => sum + c.weight, 0);

  const handleAddCoin = () => {
    if (coins.length >= 10) return;
    setIsAddingNewAsset(true);
  };

  const handleRemoveCoin = (index: number) => {
    if (coins.length <= 2) return;
    const newCoins = [...coins];
    newCoins.splice(index, 1);
    setCoins(newCoins);
  };

  const handleUpdateCoin = (index: number, field: 'symbol' | 'weight', value: any) => {
    const newCoins = [...coins];
    newCoins[index] = { ...newCoins[index], [field]: value };
    setCoins(newCoins);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      alert('Total weight must equal 100%');
      return;
    }

    const coinSymbols = coins.map(c => c.symbol);
    const allocations: Record<string, number> = {};
    coins.forEach(c => {
      allocations[c.symbol] = c.weight / 100;
    });

    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          coins: coinSymbols,
          allocations,
          trigger_type: triggerType,
          threshold_value: thresholdValue / 100,
          time_interval: timeInterval * 60 * 1000,
          trigger_prices: Object.keys(triggerPrices).length > 0 ? triggerPrices : null,
          take_profit: takeProfit ? parseFloat(takeProfit) : null,
          stop_loss: stopLoss ? parseFloat(stopLoss) : null
        })
      });
      
      if (res.ok) {
        navigate(`/bot/${id}`);
      } else {
        alert('Failed to update bot');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (coins.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Rebalancing Bot</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Bot Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Initial Paper Investment (USDT)</label>
            <div className="relative">
              <input 
                type="number" 
                value={initialInvestment}
                disabled
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-500 opacity-70 cursor-not-allowed"
              />
              <span className="absolute right-4 top-2 text-zinc-500">USDT</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Initial investment cannot be changed after creation.</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Asset Allocations</h2>
            <div className={`text-sm font-medium px-2 py-1 rounded ${totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              Total: {totalWeight}%
            </div>
          </div>
          
          <div className="space-y-3">
            {coins.map((coin, index) => (
              <div key={index} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectingAssetIndex(index)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 flex items-center justify-between hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {coin.symbol[0]}
                    </div>
                    <span>{coin.symbol}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </button>
                
                <div className="relative w-32">
                  <input 
                    type="number" 
                    min="1" max="99"
                    value={coin.weight}
                    onChange={e => handleUpdateCoin(index, 'weight', Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-4 top-2 text-zinc-500">%</span>
                </div>
                
                <button 
                  type="button"
                  onClick={() => handleRemoveCoin(index)}
                  disabled={coins.length <= 2}
                  className="p-2 text-zinc-500 hover:text-red-400 disabled:opacity-50 disabled:hover:text-zinc-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          {coins.length < 10 && (
            <button 
              type="button"
              onClick={handleAddCoin}
              className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          )}
          
          {totalWeight !== 100 && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Allocations must add up to exactly 100%. Currently at {totalWeight}%.
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-100 hover:text-zinc-300 transition-colors"
          >
            Advanced settings <span className="text-red-400 flex items-center">{showAdvanced ? 'Fold' : 'Expand'} {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-2 pt-2">
              <div 
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
                onClick={() => setIsTriggerPriceModalOpen(true)}
              >
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <CircleDollarSign className="w-5 h-5 text-zinc-500" />
                  Trigger price
                </div>
                <div className="text-sm text-zinc-400 flex items-center gap-1">
                  {Object.keys(triggerPrices).filter(k => triggerPrices[k] !== '').length > 0 
                    ? `${Object.keys(triggerPrices).filter(k => triggerPrices[k] !== '').length} coins set` 
                    : 'Set trigger price'} <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div 
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
                onClick={() => setIsTakeProfitModalOpen(true)}
              >
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <TrendingUp className="w-5 h-5 text-zinc-500" />
                  Take profit percentage
                </div>
                <div className="text-sm text-zinc-400 flex items-center gap-1">
                  {takeProfit ? `${takeProfit}%` : 'Not Set'} <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div 
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
                onClick={() => setIsStopLossModalOpen(true)}
              >
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <TrendingDown className="w-5 h-5 text-zinc-500" />
                  Stop loss percentage
                </div>
                <div className="text-sm text-zinc-400 flex items-center gap-1">
                  {stopLoss ? `-${stopLoss}%` : 'Not Set'} <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div 
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
                onClick={() => setIsSlippageModalOpen(true)}
              >
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <MoveVertical className="w-5 h-5 text-zinc-500" />
                  Slippage Control
                </div>
                <div className="text-sm text-zinc-400 flex items-center gap-1">
                  {getSlippageSummary(slippageConfig, coins)} <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div 
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
                onClick={() => setIsRebalancingModalOpen(true)}
              >
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Settings2 className="w-5 h-5 text-zinc-500" />
                  Automatic Rebalancing
                </div>
                <div className="text-sm text-zinc-400 flex items-center gap-1">
                  {getRebalanceModeLabel(rebalanceMode)} <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              
              {rebalanceMode === 'close' && (
                <p className="text-xs text-zinc-500 mt-2 px-2">
                  Automatic rebalancing function is now closed and will not change again until reopened.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Momentum Rebalancing expanded settings */}
        {showAdvanced && rebalanceMode === 'momentum' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-1">
            {/* Row: Automatic Rebalancing */}
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
              onClick={() => setIsRebalancingModalOpen(true)}
            >
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Settings2 className="w-4 h-4 text-zinc-500" />
                Automatic Rebalancing
              </div>
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                Momentum Rebalancing <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Row: Rebalancing Method */}
            <div className="flex items-center justify-between py-3 px-2 -mx-2">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Settings2 className="w-4 h-4 text-zinc-500" />
                Rebalancing Method
              </div>
              <div className="text-sm text-zinc-200">Time</div>
            </div>

            {/* Row: Rotation Period */}
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
              onClick={() => setIsRotationPeriodModalOpen(true)}
            >
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>Rotation Period</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-zinc-800 text-xs text-zinc-300 p-2 rounded-lg w-48 shadow-xl border border-zinc-700 z-10">
                    How frequently the bot rotates positions based on momentum signals.
                  </div>
                </div>
              </div>
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                {rotationPeriod} <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Row: Rebalance Only When Profit */}
            <div className="flex items-center justify-between py-3 px-2 -mx-2">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <CircleDot className="w-4 h-4 text-zinc-500" />
                <span>Rebalance Only When Profit</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-zinc-800 text-xs text-zinc-300 p-2 rounded-lg w-48 shadow-xl border border-zinc-700 z-10">
                    Only triggers rebalancing when the position is profitable.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRebalanceOnlyProfit(!rebalanceOnlyProfit)}
                className={`relative w-12 h-6 rounded-full transition-colors ${rebalanceOnlyProfit ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${rebalanceOnlyProfit ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Row: Profit ratio starts rebalancing */}
            {rebalanceOnlyProfit && (
              <div 
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
                onClick={() => setIsProfitRatioModalOpen(true)}
              >
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <BarChart3 className="w-4 h-4 text-zinc-500" />
                  The profits ratio start rebalancing
                </div>
                <div className="text-sm text-zinc-400 flex items-center gap-1">
                  {profitRatio}% <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Rotation Ratio */}
            <div className="pt-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span>Rotation Ratio</span>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-zinc-800 text-xs text-zinc-300 p-2 rounded-lg w-52 shadow-xl border border-zinc-700 z-10">
                      Weight distribution for each rotation slot. Default distributes equally.
                    </div>
                  </div>
                </div>
                <div className="flex bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setRotationRatioMode('default')}
                    className={`px-4 py-1.5 text-xs font-medium transition-colors ${rotationRatioMode === 'default' ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-400 hover:text-zinc-300'}`}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotationRatioMode('custom')}
                    className={`px-4 py-1.5 text-xs font-medium transition-colors ${rotationRatioMode === 'custom' ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-400 hover:text-zinc-300'}`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Ratio rows */}
              <div className="space-y-2">
                {rotationRatios.map((ratio, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800/50 flex items-center justify-center text-sm text-zinc-400 font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 bg-zinc-800/30 border border-zinc-800 rounded-lg">
                      {rotationRatioMode === 'custom' ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={ratio}
                          onChange={(e) => {
                            const newRatios = [...customRotationRatios];
                            newRatios[index] = Number(e.target.value) || 0;
                            setCustomRotationRatios(newRatios);
                          }}
                          className="w-full bg-transparent px-4 py-2 text-center text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-lg"
                        />
                      ) : (
                        <div className="px-4 py-2 text-center text-sm text-zinc-300">{ratio}%</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sum */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                <span className="text-sm font-medium text-zinc-300">Current sum proportion</span>
                <span className={`text-sm font-bold ${rotationRatioSum === 100 ? 'text-emerald-400' : 'text-red-400'}`}>{rotationRatioSum}%</span>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                Rotation ratio is:<br />
                Every {rotationPeriod}, when the current position is profitable by {profitRatio}%, adjust the position ratio to: {rotationRatios.map(r => `${r}%`).join(', ')} according to the increase of the selected currency.
              </p>
            </div>
          </div>
        )}

        {/* Periodic Rebalancing expanded settings */}
        {showAdvanced && rebalanceMode === 'periodic' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-1">
            {/* Row: Automatic Rebalancing */}
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
              onClick={() => setIsRebalancingModalOpen(true)}
            >
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Settings2 className="w-4 h-4 text-zinc-500" />
                Automatic Rebalancing
              </div>
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                Periodic <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Row: Balancing Period */}
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
              onClick={() => setIsBalancingPeriodModalOpen(true)}
            >
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>Balancing Period</span>
              </div>
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                {balancingPeriod} <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Threshold settings */}
        {showAdvanced && rebalanceMode === 'threshold' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            {/* Row: Automatic Rebalancing */}
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
              onClick={() => setIsRebalancingModalOpen(true)}
            >
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Settings2 className="w-4 h-4 text-zinc-500" />
                Automatic Rebalancing
              </div>
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                Threshold <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Row: Threshold */}
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors"
              onClick={() => setIsDeviationThresholdModalOpen(true)}
            >
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>Threshold</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-zinc-800 text-xs text-zinc-300 p-2 rounded-lg w-52 shadow-xl border border-zinc-700 z-10">
                    The bot will restore the proportion when any coin changes more than this value.
                  </div>
                </div>
              </div>
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                {thresholdValue}% <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-zinc-400">Proportional Change:</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                When the proportion of any coin changes more than the value you set, the bot will help you restore the proportion to the initial ratio.
              </p>
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={totalWeight !== 100}
          className="w-full bg-emerald-500 text-zinc-950 font-bold text-lg py-4 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
        >
          Save Changes
        </button>
      </form>

      <AssetSelectorModal 
        isOpen={selectingAssetIndex !== null || isAddingNewAsset}
        onClose={() => {
          setSelectingAssetIndex(null);
          setIsAddingNewAsset(false);
        }}
        availableCoins={availableCoins}
        selectedSymbol={selectingAssetIndex !== null ? coins[selectingAssetIndex].symbol : ''}
        onSelect={(symbol) => {
          if (selectingAssetIndex !== null) {
            handleUpdateCoin(selectingAssetIndex, 'symbol', symbol);
          } else if (isAddingNewAsset) {
            setCoins([...coins, { symbol, weight: 0 }]);
          }
          setSelectingAssetIndex(null);
          setIsAddingNewAsset(false);
        }}
      />

      <TriggerPriceModal
        isOpen={isTriggerPriceModalOpen}
        onClose={() => setIsTriggerPriceModalOpen(false)}
        coins={coins}
        prices={prices}
        initialTriggerPrices={triggerPrices}
        onConfirm={setTriggerPrices}
      />

      <TakeProfitModal
        isOpen={isTakeProfitModalOpen}
        onClose={() => setIsTakeProfitModalOpen(false)}
        initialTakeProfit={takeProfit}
        onConfirm={setTakeProfit}
      />

      <StopLossModal
        isOpen={isStopLossModalOpen}
        onClose={() => setIsStopLossModalOpen(false)}
        initialStopLoss={stopLoss}
        onConfirm={setStopLoss}
      />

      <SlippageControlModal
        isOpen={isSlippageModalOpen}
        onClose={() => setIsSlippageModalOpen(false)}
        coins={coins}
        initialConfig={slippageConfig}
        onConfirm={setSlippageConfig}
      />

      <AutoRebalancingModal
        isOpen={isRebalancingModalOpen}
        onClose={() => setIsRebalancingModalOpen(false)}
        currentMode={rebalanceMode}
        onSelect={setRebalanceMode}
      />

      <RotationPeriodModal
        isOpen={isRotationPeriodModalOpen}
        onClose={() => setIsRotationPeriodModalOpen(false)}
        currentPeriod={rotationPeriod}
        onSelect={setRotationPeriod}
      />

      <ProfitRatioModal
        isOpen={isProfitRatioModalOpen}
        onClose={() => setIsProfitRatioModalOpen(false)}
        currentRatio={profitRatio}
        onSelect={setProfitRatio}
      />

      <RotationPeriodModal
        isOpen={isBalancingPeriodModalOpen}
        onClose={() => setIsBalancingPeriodModalOpen(false)}
        currentPeriod={balancingPeriod}
        onSelect={setBalancingPeriod}
        title="Balancing Period"
      />

      <DeviationThresholdModal
        isOpen={isDeviationThresholdModalOpen}
        onClose={() => setIsDeviationThresholdModalOpen(false)}
        currentThreshold={thresholdValue}
        onSelect={setThresholdValue}
      />
    </div>
  );
}
