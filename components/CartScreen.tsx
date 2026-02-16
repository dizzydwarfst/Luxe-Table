
import React from 'react';
import { CartItem, MenuItem } from '../types';

interface Props {
  items: CartItem[];
  menu: MenuItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  onAddFromSuggestion: (item: MenuItem) => void;
}

const CartScreen: React.FC<Props> = ({ items, menu, onUpdateQty, onBack, onConfirm, onAddFromSuggestion }) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Simple logic to find items not in cart for recommendations
  // Fix: Changed 'Dessert' to 'Bar' to match MenuItem category types
  const recommendations = menu
    .filter(m => !items.some(i => i.id === m.id) && (m.category === 'Bar' || m.category === 'Apps'))
    .slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-slate-950">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
            <span className="material-icons-round text-slate-600 dark:text-slate-300 group-hover:text-primary">arrow_back</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-navy dark:text-white">Your Selection</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Table 12 • Live Order</p>
          </div>
          <button className="p-2 -mr-2 text-sm font-bold text-rose-500">Reset</button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-40 overflow-y-auto no-scrollbar space-y-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
              <span className="material-icons-round text-5xl">shopping_cart</span>
            </div>
            <p className="font-bold text-lg text-navy dark:text-white">Your tray is empty</p>
            <p className="text-sm mt-2">Add some delicacies from the menu</p>
            <button onClick={onBack} className="mt-8 bg-navy text-primary px-8 py-3 rounded-xl font-bold">Browse Menu</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 animate-fade-in">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-navy dark:text-white text-sm leading-tight">{item.name}</h3>
                        <span className="font-black text-primary text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-slate-400">Qty: {item.quantity}</span>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-100 dark:border-slate-800">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500"><span className="material-icons-round text-sm">remove</span></button>
                        <span className="w-6 text-center text-xs font-black text-navy dark:text-white">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-primary"><span className="material-icons-round text-sm">add</span></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chef's Upsell Section */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-4 px-2">
                <span className="material-icons-round text-primary text-sm">auto_awesome</span>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chef's Recommendations</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-2">
                {recommendations.map(rec => (
                  <div key={rec.id} className="flex-shrink-0 w-44 bg-white dark:bg-slate-800 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                    <img src={rec.image} className="w-16 h-16 rounded-2xl object-cover mb-2 shadow-md" alt={rec.name} />
                    <h4 className="text-[11px] font-bold text-navy dark:text-white truncate w-full">{rec.name}</h4>
                    <span className="text-[10px] font-black text-primary my-1">${rec.price}</span>
                    <button 
                      onClick={() => onAddFromSuggestion(rec)}
                      className="mt-2 w-full py-2 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-navy dark:text-white rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-primary hover:text-navy transition-colors"
                    >
                      Add to Order
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 space-y-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Subtotal</span>
                <span className="text-navy dark:text-white font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Kitchen Tax (8%)</span>
                <span className="text-navy dark:text-white font-bold">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Bill</span>
                  <span className="text-2xl font-black text-navy dark:text-white tracking-tighter">${total.toFixed(2)}</span>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <span className="material-icons-round">receipt_long</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {items.length > 0 && (
        <footer className="absolute bottom-0 w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 py-5 pb-10 z-40">
          <button 
            onClick={onConfirm}
            className="w-full bg-navy text-white font-black text-lg py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-4 group transition-all active:scale-[0.98] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span>Send to Kitchen</span>
            <span className="material-icons-round text-primary group-hover:translate-x-1 transition-transform">bolt</span>
          </button>
        </footer>
      )}
    </div>
  );
};

export default CartScreen;
