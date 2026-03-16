import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface SlippageConfig {
  enabled: boolean;
  mode: 'ai' | 'manual';
  manualValue: string;
  perCoin: Record<string, string>;
}

interface SlippageControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: { symbol: string; weight: number }[];
  initialConfig: SlippageConfig;
  onConfirm: (config: SlippageConfig) => void;
}

const AI_SLIPPAGE: Record<string, string> = {
  BTC: '0.0001',
  ETH: '0.0001',
  USDT: '0.0001',
  BNB: '0.0005',
  SOL: '0.0012',
  XRP: '0.0008',
  DOGE: '0.0073',
  ADA: '0.0045',
  AVAX: '0.0038',
  DOT: '0.0042',
  MATIC: '0.0055',
  LINK: '0.0033',
  TRX: '0.0015',
  SHIB: '0.012',
  LTC: '0.0009',
};

function getAiSlippage(symbol: string): string {
  return AI_SLIPPAGE[symbol] || ((Math.random() * 1.8 + 0.2).toFixed(4));
}

export function getSlippageSummary(config: SlippageConfig, coins: { symbol: string }[]): string {
  if (!config.enabled) return 'Off';
  if (config.mode === 'manual') return `${config.manualValue || '0'}% (Manual)`;

  const values = coins.map(c => parseFloat(config.perCoin[c.symbol] || getAiSlippage(c.symbol)));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return `${min}%~${max}% (AI Rec.)`;
}

export default function SlippageControlModal({ isOpen, onClose, coins, initialConfig, onConfirm }: SlippageControlModalProps) {
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [mode, setMode] = useState<'ai' | 'manual'>(initialConfig.mode);
  const [manualValue, setManualValue] = useState(initialConfig.manualValue);
  const [perCoin, setPerCoin] = useState<Record<string, string>>(initialConfig.perCoin);

  useEffect(() => {
    if (isOpen) {
      setEnabled(initialConfig.enabled);
      setMode(initialConfig.mode);
      setManualValue(initialConfig.manualValue);
      setPerCoin(initialConfig.perCoin);
    }
  }, [isOpen, initialConfig]);

  // Populate AI values for any coin not yet set
  useEffect(() => {
    if (mode === 'ai' && coins.length > 0) {
      const updated = { ...perCoin };
      let changed = false;
      for (const coin of coins) {
        if (!updated[coin.symbol]) {
          updated[coin.symbol] = getAiSlippage(coin.symbol);
          changed = true;
        }
      }
      if (changed) setPerCoin(updated);
    }
  }, [mode, coins]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalPerCoin: Record<string, string> = {};
    if (mode === 'ai') {
      for (const coin of coins) {
        finalPerCoin[coin.symbol] = perCoin[coin.symbol] || getAiSlippage(coin.symbol);
      }
    } else {
      for (const coin of coins) {
        finalPerCoin[coin.symbol] = manualValue || '0';
      }
    }
    onConfirm({ enabled, mode, manualValue, perCoin: finalPerCoin });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Build the grid data
  const gridCoins = coins.map(c => ({
    symbol: c.symbol,
    slippage: mode === 'ai'
      ? (perCoin[c.symbol] || getAiSlippage(c.symbol))
      : (manualValue || '0'),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Title */}
        <div className="px-6 pb-4 pt-2">
          <h2 className="text-xl font-bold text-zinc-100 text-center">Slippage Control</h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-200">Slippage Setting</span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {enabled && (
            <>
              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('ai')}
                  className={`relative p-3 rounded-xl border text-left transition-all ${
                    mode === 'ai'
                      ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {mode === 'ai' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`text-sm font-semibold mb-0.5 ${mode === 'ai' ? 'text-emerald-400' : 'text-zinc-300'}`}>Use AI Rec.</div>
                  <div className="text-xs text-zinc-500 leading-tight">Different slippage settings will be used for each coin.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`relative p-3 rounded-xl border text-left transition-all ${
                    mode === 'manual'
                      ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {mode === 'manual' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`text-sm font-semibold mb-0.5 ${mode === 'manual' ? 'text-emerald-400' : 'text-zinc-300'}`}>Set Manually</div>
                  <div className="text-xs text-zinc-500 leading-tight">The same slippage setting will be used for all coins.</div>
                </button>
              </div>

              {/* Manual input */}
              {mode === 'manual' && (
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="100"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder="Enter slippage %"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                </div>
              )}

              {/* Per-coin slippage grid */}
              <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-800">
                <div className="text-sm font-medium text-zinc-300 mb-3">Slippage Control</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {gridCoins.map(({ symbol, slippage }) => (
                    <div key={symbol} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{symbol}</span>
                      <span className="text-sm text-zinc-200 font-mono">{slippage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <p className="text-xs text-zinc-500 leading-relaxed">
                <span className="text-zinc-400 font-medium">Tip:</span> Slippage control will make your Avg.Cost closer to the expected price, especially in volatile markets. You can also manually adjust slippage setting during the opening process. Turn off slippage control will result in market price execution.
              </p>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium py-3 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold py-3 rounded-xl transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
