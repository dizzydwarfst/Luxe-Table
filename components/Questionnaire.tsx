
import React, { useState } from 'react';
import { chooseForMe } from '../lib/gemini';
import { MenuItem } from '../types';

interface Props {
  menuItems: MenuItem[];
  onClose: () => void;
  onAddItems: (items: MenuItem[]) => void;
}

const Questionnaire: React.FC<Props> = ({ menuItems, onClose, onAddItems }) => {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({ hunger: '', spice: '', mood: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ recommendationText: string, items: MenuItem[] } | null>(null);

  const questions = [
    { key: 'hunger', label: 'How hungry are you today?', options: ['Light snack', 'Average hunger', 'Starving!'] },
    { key: 'spice', label: 'Spice preference?', options: ['Mild & Comforting', 'Balanced', 'Burn my tongue!'] },
    { key: 'mood', label: 'What is your mood?', options: ['Celebrating', 'Adventurous', 'Relaxed'] }
  ];

  const handleSelect = (val: string) => {
    setPrefs(p => ({ ...p, [questions[step].key]: val }));
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      // Fix: Added missing second argument 'menuItems' as required by chooseForMe definition
      const recommendation = await chooseForMe(prefs, menuItems);
      if (recommendation) {
        // Filter from current menuItems instead of constants
        const items = menuItems.filter(m => recommendation.itemIds.includes(m.id));
        setResult({ recommendationText: recommendation.recommendationText, items });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-navy flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>

        {!result && !loading && (
          <div className="relative z-10">
            <button onClick={onClose} className="absolute -top-2 -right-2 p-2 text-slate-400">
              <span className="material-icons-round">close</span>
            </button>
            <div className="mb-8">
              <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full rounded-full mb-6">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              <h3 className="text-xl font-bold text-navy dark:text-white mb-2">{questions[step].label}</h3>
              <p className="text-sm text-slate-500">Step {step + 1} of 3</p>
            </div>
            <div className="space-y-3">
              {questions[step].options.map(opt => (
                <button 
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className="w-full p-4 text-left rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center relative z-10">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-navy dark:text-white mb-2">The Chef is Thinking...</h3>
            <p className="text-sm text-slate-500">Curating your perfect menu based on your mood.</p>
          </div>
        )}

        {result && (
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-navy dark:text-white mb-4">Chef's Choice</h3>
            <div className="bg-primary/10 rounded-2xl p-4 mb-6 border border-primary/20">
              <p className="text-sm italic text-slate-700 dark:text-slate-200 leading-relaxed">
                "{result.recommendationText}"
              </p>
            </div>
            <div className="space-y-3 mb-8">
              {result.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt={item.name} />
                  <div>
                    <p className="text-xs font-bold text-navy dark:text-white line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.category}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-primary">${item.price}</span>
                </div>
              ))}
              {result.items.length === 0 && <p className="text-xs text-slate-400">Items could not be matched.</p>}
            </div>
            <div className="flex flex-col gap-3">
              {result.items.length > 0 && (
                <button 
                  onClick={() => {
                    onAddItems(result.items);
                    onClose();
                  }}
                  className="w-full bg-navy text-primary font-bold py-4 rounded-xl shadow-lg"
                >
                  Add All to Cart
                </button>
              )}
              <button onClick={onClose} className="w-full py-2 text-slate-400 text-sm font-medium">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questionnaire;
