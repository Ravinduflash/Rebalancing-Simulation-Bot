import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TriggerPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: { symbol: string, weight: number }[];
  prices: Record<string, number>;
  initialTriggerPrices: Record<string, string>;
  onConfirm: (triggerPrices: Record<string, string>) => void;
}

export default function TriggerPriceModal({ isOpen, onClose, coins, prices, initialTriggerPrices, onConfirm }: TriggerPriceModalProps) {
  const [triggerPrices, setTriggerPrices] = useState<Record<string, string>>(initialTriggerPrices);

  useEffect(() => {
    if (isOpen) {
      setTriggerPrices(initialTriggerPrices);
    }
  }, [isOpen, initialTriggerPrices]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(triggerPrices);
    onClose();
  };

  const handleChange = (symbol: string, value: string) => {
    setTriggerPrices(prev => ({
      ...prev,
      [symbol]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Set trigger price</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-zinc-400 mb-6">
            You could set trigger prices for one or more coins.<br/>
            The bot will start running when any coin reached its trigger price
          </p>

          <div className="space-y-3">
            {coins.map(coin => (
              <div key={coin.symbol} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-28 bg-zinc-800/50 px-3 py-3 rounded-xl border border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {coin.symbol.charAt(0)}
                  </div>
                  <span className="font-medium text-zinc-200">{coin.symbol}</span>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={triggerPrices[coin.symbol] || ''}
                    onChange={(e) => handleChange(coin.symbol, e.target.value)}
                    placeholder={`Current price: ${prices[coin.symbol] ? prices[coin.symbol].toFixed(2) : '...'}`}
                    className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <button 
            onClick={handleConfirm}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-white font-medium py-3 rounded-xl transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
