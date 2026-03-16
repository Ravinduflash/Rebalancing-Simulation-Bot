import { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  availableCoins: string[];
  selectedSymbol: string;
}

export default function AssetSelectorModal({ isOpen, onClose, onSelect, availableCoins, selectedSymbol }: AssetSelectorModalProps) {
  const [activeTab, setActiveTab] = useState('Spot');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Spot', 'Tokenized Stocks', 'Index', 'Leveraged'];

  const categorizedAssets = useMemo(() => {
    const result = {
      'Spot': [] as string[],
      'Tokenized Stocks': [] as string[],
      'Index': [] as string[],
      'Leveraged': [] as string[]
    };

    availableCoins.forEach(symbol => {
      if (symbol.match(/\d+[LS]$/)) {
        result['Leveraged'].push(symbol);
      } else if (
        (symbol.endsWith('X') && symbol.length > 3 && !symbol.includes('BTC') && !symbol.includes('ETH')) ||
        ['QQQ', 'SPY', 'ARKK', 'VOO'].includes(symbol)
      ) {
        result['Tokenized Stocks'].push(symbol);
      } else if (symbol.includes('INDEX') || symbol.includes('DEFI') || symbol.includes('NFT')) {
        result['Index'].push(symbol);
      } else {
        result['Spot'].push(symbol);
      }
    });

    // Add some mock tokenized stocks and indices if they don't exist in the API
    if (result['Tokenized Stocks'].length === 0) {
      result['Tokenized Stocks'] = ['AAPLX', 'TSLAX', 'AMZNX', 'GOOGLX', 'MSFTX', 'AAOIX'];
    }
    if (result['Index'].length === 0) {
      result['Index'] = ['DEFI_INDEX', 'NFT_INDEX', 'LAYER2_INDEX', 'METAVERSE_INDEX'];
    }

    return result;
  }, [availableCoins]);

  if (!isOpen) return null;

  const topcapSpot = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'USDT', 'mBTC', 'mETH'];
  
  const currentAssets = categorizedAssets[activeTab as keyof typeof categorizedAssets] || [];
  const filteredAssets = currentAssets.filter(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

  const topcapFiltered = activeTab === 'Spot' ? filteredAssets.filter(a => topcapSpot.includes(a)) : [];
  const othersFiltered = activeTab === 'Spot' ? filteredAssets.filter(a => !topcapSpot.includes(a)) : filteredAssets;

  const isSearching = searchQuery.trim().length > 0;

  const renderSearchResults = () => {
    let hasResults = false;
    const results = categories.map(cat => {
      const catAssets = categorizedAssets[cat as keyof typeof categorizedAssets] || [];
      const filtered = catAssets.filter(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      if (filtered.length === 0) return null;
      hasResults = true;
      return (
        <div key={cat} className="mb-4">
          <h3 className="px-3 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{cat}</h3>
          {filtered.map(symbol => (
            <AssetRow key={symbol} symbol={symbol} isSelected={selectedSymbol === symbol} onSelect={() => { onSelect(symbol); onClose(); }} />
          ))}
        </div>
      );
    });

    if (!hasResults) {
      return <div className="p-8 text-center text-zinc-500 text-sm">No assets found</div>;
    }

    return results;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 w-full max-w-md h-[85vh] max-h-[800px] rounded-2xl flex flex-col overflow-hidden border border-zinc-800 shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-medium">Choose asset</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {!isSearching && (
          <div className="flex overflow-x-auto border-b border-zinc-800 hide-scrollbar shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === cat ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isSearching ? renderSearchResults() : (
            <>
              {activeTab === 'Spot' && topcapFiltered.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-3 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Topcap assets</h3>
                  {topcapFiltered.map(symbol => (
                    <AssetRow key={symbol} symbol={symbol} isSelected={selectedSymbol === symbol} onSelect={() => { onSelect(symbol); onClose(); }} />
                  ))}
                </div>
              )}

              <div>
                {activeTab === 'Spot' && othersFiltered.length > 0 && (
                  <h3 className="px-3 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Other assets</h3>
                )}
                {othersFiltered.map(symbol => (
                  <AssetRow key={symbol} symbol={symbol} isSelected={selectedSymbol === symbol} onSelect={() => { onSelect(symbol); onClose(); }} />
                ))}
                {filteredAssets.length === 0 && (
                  <div className="p-8 text-center text-zinc-500 text-sm">No assets found</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';

const AssetRow: React.FC<{ symbol: string, isSelected: boolean, onSelect: () => void }> = ({ symbol, isSelected, onSelect }) => {
  return (
    <button 
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${isSelected ? 'bg-emerald-500/10' : 'hover:bg-zinc-800/50'}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
          {symbol[0]}
        </div>
        <span className="font-medium text-zinc-200">{symbol}</span>
      </div>
      {isSelected && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
    </button>
  );
}
