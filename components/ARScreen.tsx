import React, { useEffect, useState, useRef } from 'react';
import { MenuItem, Topping } from '../types';

const ModelViewer = 'model-viewer' as any;

// Spread toppings around the pizza in AR (offset from center in meters)
const AR_TOPPING_OFFSETS = [
  { x: -0.06, z: -0.06 },
  { x:  0.07, z: -0.04 },
  { x:  0.05, z:  0.07 },
  { x: -0.07, z:  0.05 },
  { x:  0.00, z: -0.08 },
];

interface Props {
  item: MenuItem;
  selectedToppings?: Topping[];
  onBack: () => void;
}

const ARScreen: React.FC<Props> = ({ item, selectedToppings = [], onBack }) => {
  const [placed, setPlaced] = useState(false);
  const modelRef = useRef<any>(null);

  const handleEnterAR = () => {
    if (modelRef.current?.activateAR) {
      modelRef.current.activateAR();
    }
  };

  const getBinaryId = (): string | null => {
    const value = selectedToppings.reduce((acc, t) => acc + t.binaryBit, 0);
    if (value === 0) return null;
    const bits = Math.max(3, selectedToppings.length + 1);
    return value.toString(2).padStart(bits, '0');
  };

  const binaryId = getBinaryId();

  // --- Real 3D model path (uses model-viewer's AR) ---
  if (item.modelUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col">
        {/* Base pizza model-viewer with AR */}
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
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        />

        {/* Topping model-viewers overlaid in preview (not in real AR session — WebXR limitation) */}
        {selectedToppings.map((topping, ti) =>
          AR_TOPPING_OFFSETS.slice(0, 5).map((offset, i) => (
            <div
              key={`${topping.id}-ar-${i}`}
              className="absolute pointer-events-none"
              style={{
                bottom: `${38 + (i * 3)}%`,
                left: `${30 + (ti * 12) + (i * 8)}%`,
                width: '60px',
                height: '60px',
                animation: `toppingDrop 0.6s cubic-bezier(0.22,1,0.36,1) ${(ti * 5 + i) * 60}ms both`,
                zIndex: 20 + i,
              }}
            >
              <ModelViewer
                src={topping.modelUrl}
                auto-rotate
                rotation-per-second="30deg"
                shadow-intensity="0.4"
                environment-image="neutral"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ))
        )}

        {/* AR Place Button */}
        <div className="absolute inset-x-0 bottom-12 flex justify-center z-50">
          <button
            onClick={handleEnterAR}
            className="bg-primary text-navy font-black px-10 py-5 rounded-2xl shadow-2xl flex items-center gap-3 active:scale-95 transition-transform"
          >
            <span className="material-icons-round">view_in_ar</span>
            Place on Table
          </button>
        </div>

        {/* HUD */}
        <div className="absolute top-12 left-6 z-[110]">
          <button onClick={onBack} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center">
            <span className="material-icons-round">arrow_back</span>
          </button>
        </div>

        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2">
          <div className="flex items-center gap-2 bg-primary text-navy px-4 py-2 rounded-full shadow-lg">
            <span className="material-icons-round text-sm animate-spin">psychology</span>
            <span className="text-[10px] font-bold uppercase tracking-wide">3D Preview Active</span>
          </div>
          {binaryId && (
            <div className="bg-black/70 backdrop-blur-md border border-primary/40 px-3 py-2 rounded-full">
              <span className="font-mono text-primary text-[10px] font-black">#{binaryId}</span>
            </div>
          )}
        </div>

        {selectedToppings.length > 0 && (
          <div className="absolute top-28 left-0 right-0 flex justify-center gap-2 z-[110] px-6 flex-wrap">
            {selectedToppings.map(t => (
              <div key={t.id} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
                <span>{t.emoji}</span>
                <span className="text-white text-[10px] font-bold">{t.name}</span>
                <span className="font-mono text-[8px] text-primary/70">{t.binaryBit.toString(2).padStart(3,'0')}</span>
              </div>
            ))}
          </div>
        )}

        {item.calories && (
          <div className="absolute top-12 right-6 z-[110] bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-black">{item.calories} kcal</span>
          </div>
        )}

        <style>{`
          @keyframes toppingDrop {
            0%   { opacity:0; transform: translateY(-80px) rotate(-20deg) scale(0.2); }
            60%  { opacity:1; transform: translateY(8px)   rotate(5deg)  scale(1.08); }
            100% { opacity:1; transform: translateY(0)     rotate(0deg)  scale(1);    }
          }
        `}</style>
      </div>
    );
  }

  // --- Simulated AR (no .glb file) ---
  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjkxCF-eaqfkL72GvDVqmHAFVOyVzpi8sgQuzlyE6s8YA2vmeLfT0jFUfoK_h0Lk4b4Nx4w6VWQ875A0UTtLoHCZr-wSMEMYEfMixbe0BQZDAWuv4XgxUJNVdNNd1I4Se6P4zAPuWSaZS1UXbPL5WzffD1NZacwJZIaF5ldCmvbQ4vMcEewhds6dWUqTp4_PjhHv4xx5KoKoIRaSrI-GRGQxiBUbk9R5xujiJbPcN0MuY6hbGd6zAXDKxf9mjUEeJdLU_0AFhmDow-')` }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Base item */}
      <div
        onClick={() => setPlaced(true)}
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${placed ? 'scale-100' : 'scale-90 opacity-60'}`}
      >
        <div className="relative w-72 h-72 animate-[arFloat_5s_ease-in-out_infinite]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/40 blur-2xl rounded-[100%] scale-x-150"></div>
          <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-2xl relative z-10" />

          {/* Topping emoji overlays for simulated AR */}
          {placed && selectedToppings.map((topping, ti) =>
            AR_TOPPING_OFFSETS.slice(0, 5).map((_, i) => (
              <div
                key={`${topping.id}-sim-${i}`}
                className="absolute text-2xl"
                style={{
                  top: `${25 + (i * 12)}%`,
                  left: `${15 + (ti * 20) + (i * 10)}%`,
                  animation: `toppingDrop 0.6s cubic-bezier(0.22,1,0.36,1) ${(ti * 5 + i) * 80}ms both`,
                  zIndex: 20,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                }}
              >
                {topping.emoji}
              </div>
            ))
          )}

          {/* Binary + calorie badge */}
          <div className="absolute -top-4 -right-4 flex flex-col gap-1 z-30">
            {binaryId && (
              <div className="bg-primary/90 backdrop-blur-md rounded-lg px-3 py-1 border border-primary/30 flex items-center gap-1">
                <span className="font-mono text-navy text-xs font-black">#{binaryId}</span>
              </div>
            )}
            <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-1 border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-black">{item.calories || 450} kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* HUD */}
      <div className="relative z-50 flex flex-col justify-between h-full p-6 pt-12">
        <div className="flex items-start justify-between">
          <button onClick={onBack} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center">
            <span className="material-icons-round">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-primary text-navy px-4 py-2 rounded-full shadow-lg">
              <span className="material-icons-round text-sm animate-spin">view_in_ar</span>
              <span className="text-xs font-bold uppercase tracking-wide">AR Active</span>
            </div>
          </div>
          <div className="w-12"></div>
        </div>

        {selectedToppings.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {selectedToppings.map(t => (
              <div key={t.id} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
                <span>{t.emoji}</span>
                <span className="text-white text-[10px] font-bold">{t.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-white font-medium text-lg tracking-wide flex items-center justify-center gap-2">
              <span className="material-icons-round text-primary text-xl">crop_free</span>
              {placed ? 'Pizza Placed!' : 'Tap to place pizza'}
            </p>
            <p className="text-white/70 text-sm font-light">
              {placed ? 'Toppings are live in AR' : 'Move phone to scan surface'}
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
          50%       { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes toppingDrop {
          0%   { opacity:0; transform: translateY(-60px) scale(0.3); }
          60%  { opacity:1; transform: translateY(6px)  scale(1.1); }
          100% { opacity:1; transform: translateY(0)    scale(1);   }
        }
      `}</style>
    </div>
  );
};

export default ARScreen;
