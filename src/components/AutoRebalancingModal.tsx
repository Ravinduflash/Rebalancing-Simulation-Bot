import { X } from 'lucide-react';

export type RebalanceMode = 'close' | 'momentum' | 'periodic' | 'threshold';

interface AutoRebalancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: RebalanceMode;
  onSelect: (mode: RebalanceMode) => void;
}

const MODES: { value: RebalanceMode; label: string; badge?: string }[] = [
  { value: 'close', label: 'Close' },
  { value: 'momentum', label: 'Momentum Rebalancing', badge: 'NEW' },
  { value: 'periodic', label: 'Periodic' },
  { value: 'threshold', label: 'Threshold' },
];

export function getRebalanceModeLabel(mode: RebalanceMode): string {
  const found = MODES.find(m => m.value === mode);
  return found ? found.label : 'Close';
}

export default function AutoRebalancingModal({ isOpen, onClose, currentMode, onSelect }: AutoRebalancingModalProps) {
  if (!isOpen) return null;

  const handleSelect = (mode: RebalanceMode) => {
    onSelect(mode);
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
        <div className="px-6 pb-4 pt-2">
          <h2 className="text-xl font-bold text-zinc-100 text-center">Automatic Rebalancing</h2>
        </div>

        {/* Options */}
        <div className="px-6 pb-4 space-y-2">
          {MODES.map(({ value, label, badge }) => {
            const isSelected = currentMode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleSelect(value)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/5'
                    : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isSelected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    {label}
                  </span>
                  {badge && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-zinc-950 px-1.5 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                </div>
                {/* Radio indicator */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-emerald-500' : 'border-zinc-600'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
              </button>
            );
          })}
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
