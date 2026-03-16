import { X, Check } from 'lucide-react';

interface DeviationThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThreshold: string;
  onSelect: (threshold: string) => void;
}

const THRESHOLDS = [
  '0.25%', '0.5%', '0.75%', '1%',
  '2%', '3%', '4%', '5%'
];

export default function DeviationThresholdModal({ isOpen, onClose, currentThreshold, onSelect }: DeviationThresholdModalProps) {
  if (!isOpen) return null;

  const handleSelect = (threshold: string) => {
    onSelect(threshold);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:w-[500px] bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-zinc-700/50 rounded-full" />
        </div>

        {/* Title */}
        <div className="px-6 pb-5 pt-2">
          <h2 className="text-xl font-bold text-zinc-100 text-center">Threshold</h2>
        </div>

        {/* Threshold grid */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-4 gap-3">
            {THRESHOLDS.map((threshold) => {
              const isSelected = currentThreshold === threshold.replace('%', '');
              
              return (
                <button
                  key={threshold}
                  onClick={() => handleSelect(threshold.replace('%', ''))}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                    isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                      : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {threshold}
                  </span>
                  
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Close Button Container */}
        <div className="px-6 pb-8 flex justify-center border-t border-zinc-800/50 pt-6">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
