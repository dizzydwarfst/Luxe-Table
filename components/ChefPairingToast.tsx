
import React from 'react';
import { MenuItem } from '../types';

interface Props {
  suggestion: { item: MenuItem, reason: string };
  onClose: () => void;
  onAdd: () => void;
}

const ChefPairingToast: React.FC<Props> = ({ suggestion, onClose, onAdd }) => {
  return (
    <div className="fixed bottom-28 left-6 right-6 z-[100] animate-slide-up">
      <div className="bg-navy rounded-3xl p-5 shadow-2xl border border-primary/30 flex items-center gap-4 relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-white shadow-lg border border-white/10">
          <img src={suggestion.item.image} className="w-full h-full object-cover" alt={suggestion.item.name} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="material-icons-round text-[14px] text-primary">auto_awesome</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Chef's Selection</span>
          </div>
          <h4 className="text-white text-sm font-bold truncate">Pair with {suggestion.item.name}?</h4>
          <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed italic mt-0.5">
            "{suggestion.reason}"
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onAdd}
            className="bg-primary text-navy font-bold text-[10px] px-4 py-2 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            Add +${suggestion.item.price}
          </button>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest text-center"
          >
            No thanks
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};

export default ChefPairingToast;
