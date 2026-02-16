
import React, { useEffect, useState } from 'react';
import { MenuItem } from '../types';
import { getPairingRecommendation } from '../lib/gemini';

interface Props {
  item: MenuItem;
  // Added menu prop to provide context for pairing logic
  menu: MenuItem[];
  onBack: () => void;
  onAR: () => void;
  onAddToCart: (item: MenuItem) => void;
}

const PreviewScreen: React.FC<Props> = ({ item, menu, onBack, onAR, onAddToCart }) => {
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  useEffect(() => {
    const fetchTip = async () => {
      setLoadingTip(true);
      try {
        // Fix: Added missing second argument 'menu' as required by getPairingRecommendation definition
        const tip = await getPairingRecommendation(item, menu);
        // Fix: Extract the recommendation reason string from the returned JSON object
        setAiTip(tip?.reason || tip?.name || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTip(false);
      }
    };
    fetchTip();
  }, [item, menu]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-10 filter blur-sm"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <header className="flex justify-between items-center p-6 pt-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(242,185,13,0.8)]"></span>
            <span className="text-white text-sm font-semibold tracking-wide">{item.name}</span>
          </div>
          <button onClick={onBack} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-3 transition-all">
            <span className="material-icons-round text-primary text-2xl">close</span>
          </button>
        </header>

        <div className="flex-1 relative flex items-center justify-center w-full">
          <div className="relative z-10 w-80 h-80 animate-[float_6s_ease-in-out_infinite]">
            <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* AI Pairing Recommendation */}
        <div className="px-6 mb-4">
          <div className="bg-navy/80 backdrop-blur-md border border-primary/30 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-round text-primary text-sm">auto_awesome</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Chef's Pairing Tip</span>
            </div>
            {loadingTip ? (
              <div className="h-4 w-3/4 bg-white/10 animate-pulse rounded"></div>
            ) : (
              <p className="text-sm italic text-white/90 leading-relaxed">
                "{aiTip || "This selection pairs beautifully with our house red."}"
              </p>
            )}
          </div>
        </div>

        <div className="w-full pb-10 pt-4 px-6 flex flex-col items-center space-y-4 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent">
          <div className="w-full space-y-3">
            <button 
              onClick={onAR}
              className="w-full bg-primary hover:bg-amber-500 text-slate-950 font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <span className="material-icons-round text-xl">view_in_ar</span>
              View in AR
            </button>
            <button 
              onClick={() => onAddToCart(item)}
              className="w-full bg-white/10 border border-white/10 text-white font-medium text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Add to Order • ${item.price.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default PreviewScreen;
