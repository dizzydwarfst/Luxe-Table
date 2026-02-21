import React, { useState } from 'react';
import { CartItem } from '../types';

interface Props {
  items: CartItem[];
  onClose: () => void;
}

const SplitBillCalculator: React.FC<Props> = ({ items, onClose }) => {
  const [guests, setGuests]     = useState(2);
  const [tipPct, setTipPct]     = useState(18);
  const [customTip, setCustomTip] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const tax      = subtotal * 0.08;
  const tipRate  = useCustom ? (parseFloat(customTip) || 0) : tipPct;
  const tipAmt   = subtotal * (tipRate / 100);
  const total    = subtotal + tax + tipAmt;
  const perPerson = total / Math.max(guests, 1);

  const tipPresets = [15, 18, 20, 25];

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl flex flex-col animate-slide-up overflow-hidden max-h-[85vh]">

        {/* Header */}
        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-navy shadow-lg shadow-primary/20">
              <span className="material-icons-round text-2xl">group</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy dark:text-white">Split the Bill</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Fair & Square</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors"
          >
            <span className="material-icons-round text-xl">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 space-y-8">

          {/* Guest Counter */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">
              Number of Guests
            </label>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-navy dark:text-white border-2 border-slate-200 dark:border-slate-700 active:scale-90 transition-transform hover:border-primary"
              >
                <span className="material-icons-round text-2xl">remove</span>
              </button>

              <div className="flex flex-col items-center">
                <span className="text-5xl font-black text-navy dark:text-white tabular-nums">{guests}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {guests === 1 ? 'Person' : 'People'}
                </span>
              </div>

              <button
                onClick={() => setGuests(Math.min(20, guests + 1))}
                className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center text-primary border-2 border-navy active:scale-90 transition-transform shadow-lg"
              >
                <span className="material-icons-round text-2xl">add</span>
              </button>
            </div>

            {/* Quick presets */}
            <div className="flex justify-center gap-2 mt-4">
              {[2, 3, 4, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setGuests(n)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    guests === n
                      ? 'bg-primary text-navy shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Tip Selection */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">
              Tip
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {tipPresets.map(pct => (
                <button
                  key={pct}
                  onClick={() => { setTipPct(pct); setUseCustom(false); }}
                  className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                    !useCustom && tipPct === pct
                      ? 'bg-navy text-primary shadow-lg'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Custom %"
                value={customTip}
                onFocus={() => setUseCustom(true)}
                onChange={(e) => { setCustomTip(e.target.value); setUseCustom(true); }}
                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all ${
                  useCustom
                    ? 'border-primary ring-4 ring-primary/10 text-navy dark:text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-3 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold text-navy dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax (8%)</span>
              <span className="font-bold text-navy dark:text-white">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tip ({tipRate}%)</span>
              <span className="font-bold text-primary">${tipAmt.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
              <span className="text-slate-500 text-sm">Total</span>
              <span className="text-lg font-black text-navy dark:text-white">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Per Person Result */}
          <div className="bg-navy rounded-2xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Each Person Pays</p>
            <p className="text-4xl font-black text-white tracking-tight">${perPerson.toFixed(2)}</p>
            <p className="text-xs text-white/40 mt-2">
              ${total.toFixed(2)} ÷ {guests} {guests === 1 ? 'person' : 'people'}
            </p>

            {/* Visual guest icons */}
            <div className="flex justify-center gap-1.5 mt-4 flex-wrap max-w-[200px] mx-auto">
              {Array.from({ length: Math.min(guests, 12) }).map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="material-icons-round text-primary text-[14px]">person</span>
                </div>
              ))}
              {guests > 12 && (
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <span className="text-[8px] font-black text-primary">+{guests - 12}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items breakdown per person */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Per Person Breakdown</p>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-8 h-8 rounded-lg object-cover" alt={item.name} />
                    <div>
                      <p className="text-xs font-bold text-navy dark:text-white line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-slate-400">×{item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-primary">
                    ${((item.price * item.quantity) / Math.max(guests, 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pb-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full bg-navy text-white font-black text-lg py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <span className="material-icons-round text-primary">check_circle</span>
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};

export default SplitBillCalculator;
