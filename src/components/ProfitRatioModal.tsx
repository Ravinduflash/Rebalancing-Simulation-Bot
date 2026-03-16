import { X } from 'lucide-react';

const RATIOS = ['1', '3', '5', '10', '15', '20', '25', '30'];

interface ProfitRatioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRatio: string;
  onSelect: (ratio: string) => void;
}

export default function ProfitRatioModal({ isOpen, onClose, currentRatio, onSelect }: ProfitRatioModalProps) {
  if (!isOpen) return null;

  const handleSelect = (ratio: string) => {
    onSelect(ratio);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Title */}
        <div className="px-6 pb-5 pt-2">
          <h2 className="text-xl font-bold text-zinc-100 text-center">The profits ratio start rebalancing</h2>
        </div>

        {/* Ratio grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {RATIOS.map(ratio => {
              const isSelected = currentRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => handleSelect(ratio)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-2 border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 bg-zinc-800/30'
                  }`}
                >
                  {ratio}%
                </button>
              );
            })}
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-center pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
