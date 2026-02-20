import React, { useState, useEffect } from 'react';
import PizzaViewer from './PizzaViewer';
import { MenuItem, Topping } from '../types';

interface Props {
  item: MenuItem;
  menu: MenuItem[];
  onAddToCart: (item: MenuItem, toppings: Topping[]) => void;
  onAR: (toppings: Topping[]) => void;
  onBack: () => void;
}

const PreviewScreen: React.FC<Props> = ({
  item,
  menu,
  onAddToCart,
  onAR,
  onBack,
}) => {
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [isExploded, setIsExploded]             = useState(false);
  const [showHint, setShowHint]                 = useState(true);
  const [added, setAdded]                       = useState(false);

  // Hide rotate hint after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings(prev =>
      prev.find(t => t.id === topping.id)
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const handleAddToCart = () => {
    onAddToCart(item, selectedToppings);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const allToppings = item.availableToppings ?? [];
  const totalPrice = item.price + selectedToppings.reduce((acc, t) => acc + (t.price ?? 0), 0);

  const getBinaryId = () => {
    if (selectedToppings.length === 0) return null;
    const value = selectedToppings.reduce((acc, t) => acc + t.binaryBit, 0);
    const bits  = Math.max(3, selectedToppings.length + 1);
    return value.toString(2).padStart(bits, '0');
  };

  const binaryId = getBinaryId();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-12 px-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-full bg-white/8 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <span className="material-icons-round">arrow_back</span>
        </button>

        <div className="flex items-center gap-2">
          {binaryId && (
            <div className="bg-primary/20 border border-primary/40 px-3 py-1.5 rounded-full">
              <span className="font-mono text-primary text-[10px] font-black">#{binaryId}</span>
            </div>
          )}

          {/* Exploded view toggle */}
          <button
            onClick={() => setIsExploded(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-black text-xs uppercase tracking-wide transition-all active:scale-95 ${
              isExploded
                ? 'bg-primary text-navy border-primary shadow-lg shadow-primary/30'
                : 'bg-white/8 text-white/70 border-white/10'
            }`}
          >
            <span className="material-icons-round text-sm">layers</span>
            {isExploded ? 'Collapse' : 'Explode'}
          </button>
        </div>
      </div>

      {/* ── 3D Viewer ──────────────────────────────────────────────────── */}
      <div className="relative flex-1" style={{ minHeight: '55%' }}>
        <PizzaViewer
          pizzaUrl={item.modelUrl ?? ''}
          selectedToppings={selectedToppings}
          isExploded={isExploded}
        />

        {/* Rotate & zoom hint */}
        {showHint && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full animate-fade-in pointer-events-none">
            <span className="material-icons-round text-primary text-sm">touch_app</span>
            <span className="text-white/70 text-[11px] font-medium">Drag to rotate · Pinch to zoom</span>
          </div>
        )}

        {/* Exploded view label */}
        {isExploded && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex items-center gap-2 bg-primary/90 text-navy px-4 py-1.5 rounded-full shadow-lg">
              <span className="material-icons-round text-sm">layers</span>
              <span className="text-[10px] font-black uppercase tracking-wide">Exploded View</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom sheet ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0d1117] rounded-t-3xl border-t border-white/8 px-6 pt-5 pb-10"
           style={{ maxHeight: '50%', overflowY: 'auto' }}>

        {/* Item info */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-black">{item.name}</h1>
            <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{item.description}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-primary text-xl font-black">£{totalPrice.toFixed(2)}</p>
            {selectedToppings.length > 0 && (
              <p className="text-white/30 text-[10px]">+extras</p>
            )}
          </div>
        </div>

        {/* Toppings */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-xs font-black uppercase tracking-widest">Toppings</p>
            {selectedToppings.length > 0 && (
              <button
                onClick={() => setSelectedToppings([])}
                className="text-white/30 text-[10px] font-bold hover:text-white/60 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {allToppings.map(topping => {
              const isSelected = selectedToppings.some(t => t.id === topping.id);
              return (
                <button
                  key={topping.id}
                  onClick={() => toggleTopping(topping)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-primary/15 border-primary shadow-inner'
                      : 'bg-white/4 border-white/8 hover:bg-white/8'
                  }`}
                >
                  <span className="text-xl">{topping.emoji}</span>
                  <span className={`text-[9px] font-black text-center leading-tight ${
                    isSelected ? 'text-primary' : 'text-white/60'
                  }`}>{topping.name}</span>
                  {topping.price && (
                    <span className={`text-[8px] font-bold ${
                      isSelected ? 'text-primary/80' : 'text-white/30'
                    }`}>+£{topping.price.toFixed(2)}</span>
                  )}
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <span className="material-icons-round text-navy text-[10px]">check</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onAR(selectedToppings)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/8 border border-white/10 text-white font-black text-sm uppercase tracking-wide active:scale-95 transition-all hover:bg-white/12"
          >
            <span className="material-icons-round text-primary">view_in_ar</span>
            View in AR
          </button>

          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-wide active:scale-95 transition-all shadow-xl ${
              added
                ? 'bg-green-500 text-white shadow-green-500/30'
                : 'bg-primary text-navy shadow-primary/30'
            }`}
          >
            <span className="material-icons-round text-base">
              {added ? 'check_circle' : 'add_shopping_cart'}
            </span>
            {added ? 'Added!' : `Add · £${totalPrice.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewScreen;
