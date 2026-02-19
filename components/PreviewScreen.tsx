import React, { useState } from 'react';
import { MenuItem, Topping } from '../types';
import PizzaViewer from './PizzaViewer';

const ModelViewer = 'model-viewer' as any;

interface Props {
  item: MenuItem;
  menu: MenuItem[];
  onBack: () => void;
  onAR: (selectedToppings: Topping[]) => void;
  onAddToCart: (item: MenuItem, selectedToppings: Topping[]) => void;
}

const PreviewScreen: React.FC<Props> = ({ item, menu, onBack, onAR, onAddToCart }) => {
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const getBinaryId = (): string | null => {
    const value = selectedToppings.reduce((acc, t) => acc + t.binaryBit, 0);
    if (value === 0) return null;
    const bits = Math.max(3, item.availableToppings?.length ?? 3);
    return value.toString(2).padStart(bits, '0');
  };

  const totalPrice = (item.price + selectedToppings.reduce((acc, t) => acc + t.price, 0)).toFixed(2);
  const binaryId = getBinaryId();
  const hasToppings = item.availableToppings && item.availableToppings.length > 0;

  const toggleTopping = (topping: Topping) => {
    const isSelected = selectedToppings.some(t => t.id === topping.id);
    if (isSelected) {
      setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
    } else {
      setJustAddedId(topping.id);
      setTimeout(() => setJustAddedId(null), 800);
      setSelectedToppings(prev => [...prev, topping]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 filter blur-sm"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80')` }}
      />

      <div className="relative z-10 flex flex-col h-full">

        {/* Header */}
        <header className="flex justify-between items-center px-6 pt-12 pb-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(242,185,13,0.8)]"></span>
            <span className="text-white text-sm font-semibold tracking-wide">{item.name}</span>
            {binaryId && (
              <span className="ml-2 font-mono text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                #{binaryId}
              </span>
            )}
          </div>
          <button onClick={onBack} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-3 transition-all">
            <span className="material-icons-round text-primary text-2xl">close</span>
          </button>
        </header>

        {/* 3D Viewer — takes most of the screen on mobile */}
        <div className="relative w-full flex-1" style={{ minHeight: 0 }}>

          {/* Binary badge */}
          {binaryId && (
            <div className="absolute top-3 left-6 z-50 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary/40">
              <span className="font-mono text-primary text-[11px] font-black tracking-widest">#{binaryId}</span>
              <span className="text-white/30 text-[8px] uppercase">Combo</span>
            </div>
          )}

          {item.modelUrl ? (
            <PizzaViewer
              pizzaUrl={item.modelUrl}
              selectedToppings={selectedToppings}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ModelViewer
                src={item.modelUrl}
                camera-controls
                auto-rotate
                shadow-intensity="1"
                environment-image="neutral"
                poster={item.image}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Toppings selector — compact, doesn't push pizza up */}
        {hasToppings && (
          <div className="px-5 py-3 bg-slate-900/95 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="material-icons-round text-primary text-sm">add_circle</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Build Your Pizza</span>
              {binaryId && (
                <span className="ml-auto font-mono text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  Combo #{binaryId}
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {item.availableToppings!.map(topping => {
                const isSelected = selectedToppings.some(t => t.id === topping.id);
                const isAnimating = justAddedId === topping.id;
                return (
                  <button
                    key={topping.id}
                    onClick={() => toggleTopping(topping)}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-bold text-xs
                      transition-all duration-300 active:scale-95
                      ${isSelected
                        ? 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/10'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                      }
                      ${isAnimating ? 'scale-105' : 'scale-100'}
                    `}
                  >
                    <span className="text-base">{topping.emoji}</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span>{topping.name}</span>
                      <span className={`text-[9px] font-black ${isSelected ? 'text-primary/60' : 'text-white/25'}`}>
                        +${topping.price.toFixed(2)}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="material-icons-round text-sm text-primary">check_circle</span>
                    )}
                    <span className={`
                      absolute -top-2 -right-2 font-mono text-[8px] font-black px-1.5 py-0.5 rounded-full border
                      ${isSelected ? 'bg-primary text-navy border-primary' : 'bg-slate-800 text-white/20 border-white/10'}
                    `}>
                      {topping.binaryBit.toString(2).padStart(3, '0')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-5 pb-10 pt-3 flex flex-col gap-3 bg-slate-900/95">
          <button
            onClick={() => onAR(selectedToppings)}
            className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-bold text-base py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <span className="material-icons-round text-xl">view_in_ar</span>
            View in AR
            {selectedToppings.length > 0 && (
              <span className="bg-slate-950/20 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                +{selectedToppings.length} topping{selectedToppings.length > 1 ? 's' : ''}
              </span>
            )}
          </button>
          <button
            onClick={() => onAddToCart(item, selectedToppings)}
            className="w-full bg-white/5 border border-white/10 text-white font-medium text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-white/10"
          >
            Add to Order ·&nbsp;<span className="font-black text-primary">${totalPrice}</span>
            {selectedToppings.length > 0 && (
              <span className="text-white/30 text-xs">(incl. toppings)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewScreen;
