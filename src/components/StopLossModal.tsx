import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StopLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStopLoss: string;
  onConfirm: (stopLoss: string) => void;
}

export default function StopLossModal({ isOpen, onClose, initialStopLoss, onConfirm }: StopLossModalProps) {
  const [stopLoss, setStopLoss] = useState<string>(initialStopLoss);

  useEffect(() => {
    if (isOpen) {
      setStopLoss(initialStopLoss);
    }
  }, [isOpen, initialStopLoss]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(stopLoss);
    onClose();
  };

  const handleDiscard = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Stop loss percentage</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1">
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">-</span>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Percentage(>-100, one decimal)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-8 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              step="0.1"
              min="0"
              max="100"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">%</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-800 mb-4">
            <span className="text-sm text-zinc-400">Total PnL%</span>
            <span className="text-sm font-medium text-zinc-100">{stopLoss ? `-${stopLoss}%` : '--'}</span>
          </div>

          <p className="text-sm text-zinc-500">
            When the Total PnL Rate reaches the set value, the bot will immediately close and sell all coins at market price.
          </p>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-4">
          <button 
            onClick={handleDiscard}
            className="flex-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium py-3 rounded-xl transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 bg-[#FF5722] text-white hover:bg-[#F4511E] font-medium py-3 rounded-xl transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
