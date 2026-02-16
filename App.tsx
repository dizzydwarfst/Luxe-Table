
import React, { useState } from 'react';
import { View, MenuItem, CartItem, DiningStation } from './types';
import { MENU_ITEMS } from './constants';
import StationSelectionScreen from './components/StationSelectionScreen';
import MenuScreen from './components/MenuScreen';
import CartScreen from './components/CartScreen';
import TrackerScreen from './components/TrackerScreen';
import PreviewScreen from './components/PreviewScreen';
import ARScreen from './components/ARScreen';
import AIChefChat from './components/AIChefChat';
import Questionnaire from './components/Questionnaire';
import MenuImporter from './components/MenuImporter';
import ChefPairingToast from './components/ChefPairingToast';
import { getPairingRecommendation } from './lib/gemini';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('STATION');
  const [selectedStation, setSelectedStation] = useState<DiningStation | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>(MENU_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<{item: MenuItem, reason: string} | null>(null);

  const handleStationSelect = (station: DiningStation) => {
    setSelectedStation(station);
    setCurrentView('MENU');
  };

  const addToCart = async (item: MenuItem, skipSuggestion = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    if (!skipSuggestion && !orderConfirmed) {
      try {
        const suggestion = await getPairingRecommendation(item, menu);
        if (suggestion && suggestion.name) {
          const suggestedItem = menu.find(m => m.name.toLowerCase().includes(suggestion.name.toLowerCase())) || 
                                menu.find(m => suggestion.name.toLowerCase().includes(m.name.toLowerCase()));
          if (suggestedItem && !cart.some(c => c.id === suggestedItem.id)) {
            setActiveSuggestion({ item: suggestedItem, reason: suggestion.reason });
          }
        }
      } catch (e) {
        console.error("Chef suggestion failed", e);
      }
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handlePreview = (item: MenuItem) => {
    setSelectedItem(item);
    setCurrentView('PREVIEW');
  };

  const handleAR = (item: MenuItem) => {
    setSelectedItem(item);
    setCurrentView('AR');
  };

  const handleImport = (newItems: MenuItem[]) => {
    setMenu(prev => [...prev, ...newItems]);
    setIsImporterOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-white dark:bg-slate-950 overflow-hidden relative shadow-2xl font-display">
      {currentView === 'STATION' && (
        <StationSelectionScreen onSelect={handleStationSelect} />
      )}
      
      {currentView === 'MENU' && (
        <MenuScreen 
          menuItems={menu}
          onAddToCart={addToCart} 
          onPreview={handlePreview} 
          onViewCart={() => setCurrentView('CART')}
          onOpenQuestionnaire={() => setIsQuestionnaireOpen(true)}
          onOpenImporter={() => setIsImporterOpen(true)}
          cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
          stationName={selectedStation?.name || 'Main Dining'}
        />
      )}
      
      {currentView === 'CART' && (
        <CartScreen 
          items={cart} 
          menu={menu}
          onUpdateQty={updateQuantity} 
          onBack={() => setCurrentView('MENU')} 
          onConfirm={() => {
            setOrderConfirmed(true);
            setCurrentView('TRACKER');
          }}
          onAddFromSuggestion={(item) => addToCart(item, true)}
        />
      )}
      
      {currentView === 'TRACKER' && (
        <TrackerScreen 
          items={cart}
          onBack={() => setCurrentView('MENU')} 
          onAR={() => {
              if (cart.length > 0) handleAR(cart[0]);
          }}
        />
      )}
      
      {currentView === 'PREVIEW' && selectedItem && (
        <PreviewScreen 
          item={selectedItem} 
          menu={menu}
          onBack={() => setCurrentView('MENU')} 
          onAR={() => handleAR(selectedItem)}
          onAddToCart={(item) => {
              addToCart(item);
              setCurrentView('MENU');
          }}
        />
      )}
      
      {currentView === 'AR' && selectedItem && (
        <ARScreen 
          item={selectedItem} 
          onBack={() => {
              if (orderConfirmed) setCurrentView('TRACKER');
              else setCurrentView('PREVIEW');
          }} 
        />
      )}

      {/* Overlays & Alerts */}
      {activeSuggestion && (
        <ChefPairingToast 
          suggestion={activeSuggestion}
          onClose={() => setActiveSuggestion(null)}
          onAdd={() => {
            addToCart(activeSuggestion.item, true);
            setActiveSuggestion(null);
          }}
        />
      )}

      <AIChefChat isOpen={isChatOpen} menu={menu} onClose={() => setIsChatOpen(false)} />
      
      {isQuestionnaireOpen && (
        <Questionnaire 
          menuItems={menu}
          onClose={() => setIsQuestionnaireOpen(false)} 
          onAddItems={(items) => {
            items.forEach(item => addToCart(item, true));
            setCurrentView('CART');
          }} 
        />
      )}
      
      {isImporterOpen && (
        <MenuImporter 
          onClose={() => setIsImporterOpen(false)}
          onImport={handleImport}
        />
      )}

      {/* Floating UI Elements */}
      {currentView !== 'STATION' && currentView !== 'AR' && !isChatOpen && !isQuestionnaireOpen && !isImporterOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="absolute right-6 bottom-32 z-50 bg-navy text-primary h-14 w-14 rounded-full flex items-center justify-center shadow-2xl shadow-navy/50 border-2 border-primary animate-float"
        >
          <span className="material-icons-round text-2xl">smart_toy</span>
        </button>
      )}

      {/* Persistent Bottom Nav */}
      {(currentView === 'MENU' || (currentView === 'TRACKER' && orderConfirmed)) && (
        <nav className="absolute bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-8 pt-3 px-6 flex justify-between items-center z-40 animate-slide-up">
          <button 
            onClick={() => setCurrentView('MENU')}
            className={`flex flex-col items-center gap-1 ${currentView === 'MENU' ? 'text-primary' : 'text-slate-400'}`}
          >
            <span className="material-icons-round text-xl">restaurant_menu</span>
            <span className="text-[10px] font-bold">Menu</span>
          </button>
          
          <button onClick={() => setIsQuestionnaireOpen(true)} className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-icons-round text-xl">auto_awesome</span>
            <span className="text-[10px] font-medium">Choose</span>
          </button>

          <div className="relative -top-8">
            <button className="bg-navy text-primary h-14 w-14 rounded-full flex items-center justify-center shadow-xl shadow-navy/30 border-4 border-white dark:border-slate-900 active:scale-95 transition-transform">
              <span className="material-icons-round text-2xl">qr_code_scanner</span>
            </button>
          </div>

          <button onClick={() => setIsChatOpen(true)} className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-icons-round text-xl">forum</span>
            <span className="text-[10px] font-medium">Chef</span>
          </button>

          <button 
            onClick={() => orderConfirmed && setCurrentView('TRACKER')}
            className={`flex flex-col items-center gap-1 ${currentView === 'TRACKER' ? 'text-primary' : 'text-slate-400'} ${!orderConfirmed && 'opacity-30'}`}
          >
            <span className="material-icons-round text-xl">timer</span>
            <span className="text-[10px] font-bold">Status</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
