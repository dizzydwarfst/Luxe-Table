import React, { useState, useCallback } from 'react';
import { View, MenuItem, CartItem, DiningStation, Topping } from './types';
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
import PageTransition from './components/PageTransition';
import OrderTracker from './components/OrderTracker';
import SplitBillCalculator from './components/SplitBillCalculator';
import { getPairingRecommendation } from './lib/gemini';
import { playDing, playPop, playSizzle, playWhoosh, playSuccess } from './lib/sounds';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('STATION');
  const [selectedStation, setSelectedStation] = useState<DiningStation | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>(MENU_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<{item: MenuItem, reason: string} | null>(null);

  // ─── New feature state ──────────────────────────────────────────────
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [orderId] = useState(() => `ORD-${Date.now().toString(36).toUpperCase()}`);

  // ─── Navigate with sound ────────────────────────────────────────────
  const navigateTo = useCallback((view: View) => {
    playWhoosh();
    setCurrentView(view);
  }, []);

  const handleStationSelect = (station: DiningStation) => {
    setSelectedStation(station);
    navigateTo('MENU');
  };

  const addToCart = async (item: MenuItem, skipSuggestion = false, toppings: Topping[] = []) => {
    // 🔊 Sound: ding on add-to-cart
    playDing();

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, selectedToppings: toppings }];
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
    // 🔊 Sound: pop on quantity change
    playPop();

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
    setSelectedToppings([]);
    navigateTo('PREVIEW');
  };

  const handleAR = (item: MenuItem, toppings: Topping[] = []) => {
    setSelectedItem(item);
    setSelectedToppings(toppings);
    // 🔊 Sound: sizzle plays inside ARScreen on dish placement
    navigateTo('AR');
  };

  const handleConfirmOrder = () => {
    // 🔊 Sound: success chime on order confirmation
    playSuccess();
    setOrderConfirmed(true);
    setShowOrderTracker(true);
    navigateTo('TRACKER');
  };

  const handleImport = (newItems: MenuItem[]) => {
    setMenu(prev => [...prev, ...newItems]);
    setIsImporterOpen(false);
  };

  // Determine transition direction based on view change
  const getTransitionDirection = (): 'left' | 'right' | 'up' | 'fade' => {
    if (currentView === 'CART' || currentView === 'PREVIEW') return 'left';
    if (currentView === 'AR') return 'up';
    return 'fade';
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-white dark:bg-slate-950 overflow-hidden relative shadow-2xl font-display">

      {/* ─── Page Transition Wrapper ─────────────────────────────────── */}
      <PageTransition
        viewKey={currentView}
        direction={getTransitionDirection()}
        duration={300}
      >
        {currentView === 'STATION' && (
          <StationSelectionScreen onSelect={handleStationSelect} />
        )}

        {currentView === 'MENU' && (
          <MenuScreen
            menuItems={menu}
            onAddToCart={addToCart}
            onPreview={handlePreview}
            onAR={(item) => handleAR(item)}
            onViewCart={() => navigateTo('CART')}
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
            onBack={() => navigateTo('MENU')}
            onConfirm={handleConfirmOrder}
            onAddFromSuggestion={(item) => addToCart(item, true)}
          />
        )}

        {currentView === 'TRACKER' && (
          <TrackerScreen
            items={cart}
            menu={menu}
            onBack={() => navigateTo('MENU')}
            onAR={(item) => handleAR(item)}
            onAddToCart={(item) => addToCart(item, true)}
          />
        )}

        {currentView === 'PREVIEW' && selectedItem && (
          <PreviewScreen
            item={selectedItem}
            menu={menu}
            onBack={() => navigateTo('MENU')}
            onAR={(toppings) => handleAR(selectedItem, toppings)}
            onAddToCart={(item, toppings) => {
              addToCart(item, false, toppings);
              navigateTo('MENU');
            }}
          />
        )}

        {currentView === 'AR' && selectedItem && (
          <ARScreen
            item={selectedItem}
            selectedToppings={selectedToppings}
            onBack={() => {
              if (orderConfirmed) navigateTo('TRACKER');
              else navigateTo('PREVIEW');
            }}
          />
        )}
      </PageTransition>

      {/* ─── Order Tracker Overlay ──────────────────────────────────── */}
      {showOrderTracker && orderConfirmed && (
        <OrderTracker
          orderId={orderId}
          onClose={() => setShowOrderTracker(false)}
        />
      )}

      {/* ─── Split Bill Calculator Overlay ──────────────────────────── */}
      {showSplitBill && (
        <SplitBillCalculator
          items={cart}
          onClose={() => setShowSplitBill(false)}
        />
      )}

      {/* ─── Existing Overlays ─────────────────────────────────────── */}
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
            navigateTo('CART');
          }}
        />
      )}

      {isImporterOpen && (
        <MenuImporter
          onClose={() => setIsImporterOpen(false)}
          onImport={handleImport}
        />
      )}

      {/* ─── AI Chef FAB ───────────────────────────────────────────── */}
      {currentView !== 'STATION' && currentView !== 'AR' && currentView !== 'TRACKER' && !isChatOpen && !isQuestionnaireOpen && !isImporterOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="absolute right-6 bottom-32 z-50 bg-navy text-primary h-14 w-14 rounded-full flex items-center justify-center shadow-2xl shadow-navy/50 border-2 border-primary animate-float"
        >
          <span className="material-icons-round text-2xl">smart_toy</span>
        </button>
      )}

      {/* ─── Bottom Navigation ─────────────────────────────────────── */}
      {(currentView === 'MENU' || (currentView === 'TRACKER' && orderConfirmed)) && (
        <nav className="absolute bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-8 pt-3 px-6 flex justify-between items-center z-40 animate-slide-up">
          <button
            onClick={() => navigateTo('MENU')}
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
            onClick={() => {
              if (orderConfirmed) {
                navigateTo('TRACKER');
              }
            }}
            className={`flex flex-col items-center gap-1 ${currentView === 'TRACKER' ? 'text-primary' : 'text-slate-400'} ${!orderConfirmed && 'opacity-30'}`}
          >
            <span className="material-icons-round text-xl">timer</span>
            <span className="text-[10px] font-bold">Status</span>
          </button>
        </nav>
      )}

      {/* ─── Tracker screen action buttons ─────────────────────────── */}
      {currentView === 'TRACKER' && orderConfirmed && (
        <div className="absolute bottom-24 left-0 right-0 z-30 flex justify-center gap-3 px-6">
          {/* Live order tracking button */}
          <button
            onClick={() => setShowOrderTracker(true)}
            className="flex items-center gap-2 bg-navy text-white px-5 py-3 rounded-2xl shadow-xl active:scale-95 transition-transform"
          >
            <span className="material-icons-round text-primary text-lg">wifi</span>
            <span className="text-xs font-black uppercase tracking-wide">Live Track</span>
          </button>

          {/* Split bill button */}
          <button
            onClick={() => setShowSplitBill(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-navy dark:text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
          >
            <span className="material-icons-round text-primary text-lg">group</span>
            <span className="text-xs font-black uppercase tracking-wide">Split Bill</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
