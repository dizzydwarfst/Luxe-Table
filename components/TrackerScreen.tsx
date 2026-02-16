
import React, { useState, useEffect } from 'react';
import { CartItem, MenuItem } from '../types';
import { getPairingRecommendation } from '../lib/gemini';

interface Props {
  items: CartItem[];
  menu: MenuItem[];
  onBack: () => void;
  onAR: (item: CartItem) => void;
  onAddToCart?: (item: MenuItem) => void;
}

const TrackerScreen: React.FC<Props> = ({ items, menu, onBack, onAR, onAddToCart }) => {
  // Cooldown State for Call Server
  const [serverCalled, setServerCalled] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(600);

  // AI Pairing Recommendation State
  const [suggestion, setSuggestion] = useState<{ name: string; reason: string } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);

  // Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (serverCalled && cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    } else if (cooldownSeconds === 0) {
      setServerCalled(false);
      setCooldownSeconds(600);
    }
    return () => clearInterval(interval);
  }, [serverCalled, cooldownSeconds]);

  // AI Recommendation effect
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (items.length === 0) return;
      setLoadingSuggestion(true);
      try {
        const result = await getPairingRecommendation(items[0], menu);
        if (result && result.name && result.reason) {
          setSuggestion(result);
        }
      } catch (e) {
        console.error("Failed to fetch tracker suggestion", e);
      } finally {
        setLoadingSuggestion(false);
      }
    };
    fetchSuggestion();
  }, [items, menu]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCallServer = () => {
    if (!serverCalled) {
      setServerCalled(true);
      // alert('Server has been notified! They will be with you shortly.'); // Removed per request but logically assumed if desired
    }
  };

  // Find the menu item matching the suggestion
  const suggestedMenuItem = suggestion ? menu.find(m => 
    m.name.toLowerCase().includes(suggestion.name.toLowerCase()) || 
    suggestion.name.toLowerCase().includes(m.name.toLowerCase())
  ) : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      <header className="absolute top-0 left-0 right-0 z-20 pt-12 pb-4 px-6 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onBack} className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10">
          <span className="material-icons-round text-xl">arrow_back</span>
        </button>
        <h1 className="text-white font-semibold text-lg tracking-wide">Table #14</h1>
        <button className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10">
          <span className="material-icons-round text-xl">receipt_long</span>
        </button>
      </header>

      <div className="relative h-[40vh] w-full bg-slate-800">
        <img 
          alt="Chef cooking" 
          className="w-full h-full object-cover opacity-90" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOEk9vLePIeaEpLXM3yra1xPlfHnYMGHjmrGe8G8JwHEJs-o1HRVacBRcDiy-sqhYnhB1vxzJkY60KhXT_fh1bfMxD09ck1M3YoE3d2JoNnU0TKRn6KpAlKYTrmm_EBNElmWNI-2DprS_glAeEsikES7ZVtNxQv-fDHWXED8pjkcA1qrgohDxqTKp-mPbjG-v6rL2HK-SK7VTXGY1SIiokTulxOUZioeqh9G8WIVxJEz3hiuTMobJ9mDK8noMKpQA4C7IxxPm4if-X" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-black/30"></div>
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 shadow-xl px-6 py-4 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-800 w-[85%] z-10">
          <div className="bg-primary/10 p-3 rounded-full">
            <span className="material-icons-round text-primary text-2xl animate-pulse">restaurant_menu</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Current Stage</p>
            <p className="text-xl font-bold text-navy dark:text-white leading-tight">Plating</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">Time left</p>
            <p className="text-lg font-bold text-primary dark:text-white">~5m</p>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-6 px-8 pb-32 overflow-y-auto no-scrollbar -mt-6 bg-white dark:bg-slate-950 rounded-t-3xl relative z-10">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8"></div>
        
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-navy dark:text-white">Kitchen Live</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Order #8492 • {items.length} Items</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold border border-green-100 dark:border-green-800">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            In Progress
          </span>
        </div>

        {/* Your Order Section */}
        {items.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-icons-round text-primary text-sm">shopping_bag</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Order</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
              {items.map(item => (
                <div key={item.id} className="flex-shrink-0 w-64 bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 flex gap-3 items-center">
                  <img src={item.image} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-navy dark:text-white truncate">{item.name}</h4>
                    <p className="text-[10px] font-black text-primary mt-0.5">${item.price.toFixed(2)}</p>
                    <button 
                      onClick={() => onAR(item)}
                      className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase text-navy dark:text-primary bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
                    >
                      <span className="material-icons-round text-[12px]">view_in_ar</span>
                      AR Plate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-10">
          <div className="relative pl-8 opacity-40 grayscale">
            <div className="absolute -left-[27px] top-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-4 border-white dark:border-slate-950 z-10">
              <span className="material-icons-round text-white text-[16px]">done</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-navy dark:text-white text-base">Order Received</h3>
                <p className="text-xs text-slate-500 mt-1">Waitstaff confirmed selection.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">7:15 PM</span>
            </div>
          </div>

          <div className="relative pl-8">
            <div className="absolute -left-[27px] top-0 h-7 w-7 rounded-full bg-navy dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-lg shadow-primary/30 z-10">
              <span className="material-icons-round text-primary text-[16px]">whatshot</span>
            </div>
            <div className="w-full">
              <h3 className="font-bold text-navy dark:text-white text-lg">In the Oven</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Cooking to perfection.</p>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img 
                      alt="Chef" 
                      className="w-12 h-12 rounded-lg object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDk0f2bpbTIltoj5EG6k9EBtaTEWx-LMCnD278mKQv0b4BS63JSm5AelEC__XdBJuX7-7SV_jHiqhDPYaJLZbTTTF7BRQpMFPxHWtjzZhIyOxXeUcLFI2zbbQBClXPkeYOs9n-1XFZRBvDFNlii9dGg6Bb1XJphr7nwslKKrWRaQlrtzLsznyVsmXbeXJQl7aYUMSUU6T6om8qSeGnn3EVHqSIQ1QqQ4PW1-NaU7NdTgs1U8jDHInSYRN6nyI1IhUTlrdiT5npXIi_u" 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-primary border-2 border-white dark:border-slate-950 rounded-full p-0.5">
                      <span className="material-icons-round text-white text-[10px] block">local_fire_department</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy dark:text-white">Main Station</p>
                    <p className="text-xs text-slate-500">Chef Michael is searing</p>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Rare</span>
                  <span className="text-primary">Medium Rare</span>
                  <span>Well Done</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-[65%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pl-8 opacity-40">
            <div className="absolute -left-[27px] top-0 h-7 w-7 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 z-10 flex items-center justify-center">
              <span className="material-icons-round text-slate-300 dark:text-slate-600 text-[16px]">room_service</span>
            </div>
            <h3 className="font-bold text-navy dark:text-white text-base">Coming to Table</h3>
            <p className="text-xs text-slate-500 mt-1">Server is on the way.</p>
          </div>
        </div>

        {/* Pairing Suggestion Card */}
        <div className="mt-8 p-4 bg-navy rounded-xl shadow-lg text-white flex items-center justify-between border border-primary/20 animate-fade-in">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/10 p-2 rounded-lg flex-shrink-0">
              <span className="material-icons-round text-primary">wine_bar</span>
            </div>
            {loadingSuggestion ? (
              <div className="space-y-2 flex-1 pr-4">
                <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="min-w-0 pr-4">
                <p className="font-bold text-sm truncate">{suggestion ? `Pairing: ${suggestion.name}` : 'Pairing Suggestion'}</p>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {suggestion ? suggestion.reason : 'A glass of Pinot Noir fits perfectly.'}
                </p>
              </div>
            )}
          </div>
          {suggestedMenuItem && !loadingSuggestion && (
            <button 
              onClick={() => onAddToCart?.(suggestedMenuItem)}
              className="bg-primary text-navy text-[10px] font-black px-3 py-2 rounded-lg whitespace-nowrap active:scale-95 transition-transform"
            >
              Add +${suggestedMenuItem.price.toFixed(2)}
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 z-50 pb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform"
          >
            <span className="material-icons-round text-xl">menu_book</span>
            <span className="text-[10px] font-bold uppercase">Menu</span>
          </button>
          <button 
            disabled={serverCalled}
            onClick={handleCallServer}
            className={`flex-[2] font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
              serverCalled 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-navy text-white active:scale-[0.98]'
            }`}
          >
            <span className="material-icons-round text-sm">
              {serverCalled ? 'check_circle' : 'notifications_active'}
            </span>
            {serverCalled ? `Server Notified • ${formatCooldown(cooldownSeconds)}` : 'Call Server'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackerScreen;
