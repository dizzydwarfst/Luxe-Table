
import React, { useState, useRef, useEffect } from 'react';
import { MenuItem } from '../types';
import { CATEGORIES } from '../constants';

interface Props {
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  onPreview: (item: MenuItem) => void;
  onAR: (item: MenuItem) => void;
  onViewCart: () => void;
  onOpenQuestionnaire: () => void;
  onOpenImporter: () => void;
  cartCount: number;
  stationName: string;
}

const MenuScreen: React.FC<Props> = ({ menuItems, onAddToCart, onPreview, onAR, onViewCart, onOpenQuestionnaire, onOpenImporter, cartCount, stationName }) => {
  const [activeCat, setActiveCat] = useState<string>(() => {
    return CATEGORIES.includes(stationName as any) ? stationName : CATEGORIES[0];
  });
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (CATEGORIES.includes(stationName as any)) {
      setActiveCat(stationName);
      
      const timer = setTimeout(() => {
        const activeButton = scrollContainerRef.current?.querySelector(`[data-cat="${stationName}"]`);
        if (activeButton) {
          activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stationName]);

  const handleCategoryClick = (cat: string) => {
    setActiveCat(cat);
  };

  const getIcon = (cat: string) => {
    switch(cat) {
      case 'Apps': return 'tapas';
      case 'Salads': return 'eco';
      case 'Panfry': return 'flatware';
      case 'Entree': return 'restaurant';
      case 'Ovens': return 'outdoor_grill';
      case 'Bar': return 'liquor';
      default: return 'restaurant';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <header className="bg-navy pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-2xl z-20 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-transparent to-primary opacity-20"></div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{stationName} • Table 12</span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Luxe Selection</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenImporter}
              className="p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 text-primary border border-white/10 transition-all active:scale-95"
              title="Import from Web"
            >
              <span className="material-icons-round text-xl">language</span>
            </button>
            <button 
              onClick={onViewCart}
              className="relative p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/10 transition-all group active:scale-95"
            >
              <span className="material-icons-round text-white group-hover:text-primary transition-colors text-xl">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-[10px] font-black text-navy rounded-full flex items-center justify-center border-2 border-navy ring-2 ring-primary/20">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <button 
          onClick={onOpenQuestionnaire}
          className="w-full mb-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/50 transition-all overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-primary text-navy p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
              <span className="material-icons-round text-lg">auto_awesome</span>
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-extrabold">Not sure what to eat?</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Let The Chef decide for you</p>
            </div>
          </div>
          <span className="material-icons-round text-primary/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        <div className="relative mt-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 material-icons-round">search</span>
          <input 
            className="w-full bg-white dark:bg-slate-900 text-navy dark:text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-xl placeholder-slate-400 font-bold text-sm border-none" 
            placeholder="Search our culinary library..." 
            type="text"
          />
        </div>
      </header>

      {/* Tighter, more elegant Category Nav */}
      <div className="relative -mt-6 z-30 px-6">
        <div 
          ref={scrollContainerRef}
          className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth snap-x py-3"
        >
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              data-cat={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`snap-start flex-shrink-0 px-4 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex items-center gap-2 shadow-md ${
                activeCat === cat 
                  ? 'bg-navy text-primary border-primary shadow-primary/10' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border-white dark:border-slate-800'
              }`}
            >
              <span className={`material-icons-round text-base ${activeCat === cat ? 'text-primary' : 'text-slate-300'}`}>
                {getIcon(cat)}
              </span>
              {cat}
            </button>
          ))}
          <div className="flex-shrink-0 w-8"></div>
        </div>
      </div>

      <main className="flex-1 px-6 pb-28 overflow-y-auto no-scrollbar pt-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-navy dark:text-white uppercase tracking-tight flex items-center gap-2">
              {activeCat} Selection
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Station 0{CATEGORIES.indexOf(activeCat as any) + 1}</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
             <span className="text-[10px] font-black text-navy dark:text-primary uppercase tracking-widest">
              {menuItems.filter(item => item.category === activeCat).length} Results
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {menuItems.filter(item => item.category === activeCat).length > 0 ? (
            menuItems.filter(item => item.category === activeCat).map((item, idx) => (
              <div 
                key={item.id} 
                className="group bg-white dark:bg-slate-900 rounded-[2rem] p-3 shadow-xl hover:shadow-2xl transition-all duration-500 relative border border-slate-100 dark:border-slate-800 animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div 
                  onClick={() => onPreview(item)}
                  className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden mb-4 bg-slate-50 dark:bg-slate-950 cursor-pointer shadow-inner"
                >
                  <img src={item.image} alt={item.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <button 
                    aria-label="View in AR" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAR(item);
                    }}
                    className="absolute top-3 right-3 bg-navy/80 backdrop-blur-md p-2 rounded-2xl text-primary hover:bg-navy transition-all shadow-xl z-10 border border-white/10 active:scale-90"
                  >
                    <span className="material-icons-round text-sm">view_in_ar</span>
                  </button>
                </div>
                <div className="space-y-1.5 px-1">
                  <h3 className="font-extrabold text-navy dark:text-white text-sm leading-tight line-clamp-1">{item.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium line-clamp-2 h-7 leading-relaxed">{item.description}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-black text-navy dark:text-primary text-base tracking-tighter">${item.price.toFixed(2)}</span>
                    <button 
                      onClick={() => onAddToCart(item)}
                      className="bg-primary hover:bg-navy hover:text-primary text-navy p-2 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-90"
                    >
                      <span className="material-icons-round text-sm font-black">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <span className="material-icons-round text-3xl">inventory_2</span>
              </div>
              <h3 className="text-lg font-extrabold text-navy dark:text-white mb-2">Empty Station</h3>
              <p className="text-xs text-slate-400 font-medium px-12 leading-relaxed">No items assigned to {activeCat}. Use the Smart Importer to add some!</p>
              <button 
                onClick={onOpenImporter}
                className="mt-6 bg-navy text-primary text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
              >
                <span className="material-icons-round text-sm">language</span>
                Import Menu
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { 
          animation: slide-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; 
        }
      `}</style>
    </div>
  );
};

export default MenuScreen;
