
import React, { useEffect, useState, useRef } from 'react';
import { MenuItem } from '../types';

// Use a constant for custom elements to avoid global JSX shadowing issues that block standard HTML tags
const ModelViewer = 'model-viewer' as any;

interface Props {
  item: MenuItem;
  onBack: () => void;
}

const ARScreen: React.FC<Props> = ({ item, onBack }) => {
  const [placed, setPlaced] = useState(false);
  const modelRef = useRef<any>(null);

  const handleEnterAR = () => {
    if (modelRef.current?.activateAR) {
      modelRef.current.activateAR();
    }
  };

  if (item.modelUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col">
        <ModelViewer
          ref={modelRef}
          src={item.modelUrl}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          ar-placement="floor"
          style={{ width: '100%', height: '100%' }}
          className="w-full h-full"
        >
          {/* Custom AR Button UI */}
          <div className="absolute inset-x-0 bottom-12 flex justify-center z-50">
             <button 
              onClick={handleEnterAR}
              className="bg-primary text-navy font-black px-10 py-5 rounded-2xl shadow-2xl flex items-center gap-3 active:scale-95 transition-transform"
            >
              <span className="material-icons-round">view_in_ar</span>
              Place on Table
            </button>
          </div>
        </ModelViewer>

        {/* HUD Controls */}
        <div className="absolute top-12 left-6 z-[110]">
          <button onClick={onBack} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center">
            <span className="material-icons-round">arrow_back</span>
          </button>
        </div>

        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[110]">
          <div className="flex items-center gap-2 bg-primary text-navy px-4 py-2 rounded-full shadow-lg">
            <span className="material-icons-round text-sm animate-spin">psychology</span>
            <span className="text-[10px] font-bold uppercase tracking-wide">3D Preview Active</span>
          </div>
        </div>

        <div className="absolute top-32 left-0 right-0 text-center px-6 z-[110]">
           <p className="text-white/80 text-sm font-medium">Rotate and zoom to preview dish details</p>
        </div>

        {item.calories && (
           <div className="absolute top-12 right-6 z-[110] bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-black">{item.calories} kcal</span>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col">
      {/* Simulating camera feed */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjkxCF-eaqfkL72GvDVqmHAFVOyVzpi8sgQuzlyE6s8YA2vmeLfT0jFUfoK_h0Lk4b4Nx4w6VWQ875A0UTtLoHCZr-wSMEMYEfMixbe0BQZDAWuv4XgxUJNVdNNd1I4Se6P4zAPuWSaZS1UXbPL5WzffD1NZacwJZIaF5ldCmvbQ4vMcEewhds6dWUqTp4_PjhHv4xx5KoKoIRaSrI-GRGQxiBUbk9R5xujiJbPcN0MuY6hbGd6zAXDKxf9mjUEeJdLU_0AFhmDow-')` }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* AR Model Simulation */}
      <div 
        onClick={() => setPlaced(true)}
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${placed ? 'scale-100' : 'scale-90 opacity-60'}`}
      >
        <div className="relative w-72 h-72 animate-[arFloat_5s_ease-in-out_infinite]">
          {/* Shadow on table */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/40 blur-2xl rounded-[100%] scale-x-150"></div>
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-contain drop-shadow-2xl relative z-10" 
          />
          <div className="absolute -top-4 -right-4 bg-black/50 backdrop-blur-md rounded-lg px-3 py-1 border border-white/20 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">{item.calories || 450} kcal</span>
          </div>
        </div>
      </div>

      {/* Interface HUD */}
      <div className="relative z-50 flex flex-col justify-between h-full p-6 pt-12">
        <div className="flex items-start justify-between">
          <button onClick={onBack} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center">
            <span className="material-icons-round">arrow_back</span>
          </button>
          <div className="flex items-center gap-2 bg-primary text-navy px-4 py-2 rounded-full shadow-lg">
            <span className="material-icons-round text-sm animate-spin">view_in_ar</span>
            <span className="text-xs font-bold uppercase tracking-wide">AR Active</span>
          </div>
          <div className="w-12"></div>
        </div>

        <div className="flex flex-col items-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-white font-medium text-lg tracking-wide flex items-center justify-center gap-2 shadow-sm">
              <span className="material-icons-round text-primary text-xl">crop_free</span>
              {placed ? 'Dish Placed' : 'Move phone to scan table'}
            </p>
            <p className="text-white/70 text-sm font-light">
              {placed ? 'Swipe to rotate or pinch to scale' : 'Tap anywhere to place dish'}
            </p>
          </div>

          <div className="flex items-center justify-center w-full relative">
            <button className="absolute left-4 w-12 h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <span className="material-icons-round text-white/80">photo_library</span>
            </button>
            
            <button className="relative group p-1">
              <div className="w-20 h-20 rounded-full border-4 border-white/30 group-active:border-primary/50 transition-all"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full shadow-lg active:scale-90 transition-all"></div>
            </button>

            <button className="absolute right-4 w-12 h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <span className="material-icons-round text-white/80">flash_off</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes arFloat {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default ARScreen;
