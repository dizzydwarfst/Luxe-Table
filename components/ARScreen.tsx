import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MenuItem, Topping } from '../types';

const TOPPING_SPOTS: [number, number][] = [
  [ 0.00,  0.00],
  [-0.06, -0.06],
  [ 0.06, -0.05],
  [ 0.06,  0.06],
  [-0.05,  0.07],
  [ 0.00, -0.09],
  [ 0.09,  0.00],
];

const FALLBACK_COLORS: Record<string, number> = {
  default:  0xff6b35,
  mushroom: 0x8B5E3C,
  pepper:   0x2d8a4e,
  olive:    0x1a1a2e,
  basil:    0x2d8a4e,
  cheese:   0xf5c518,
  onion:    0xc084fc,
  tomato:   0xef4444,
};

function makeFallbackMesh(topping: Topping): THREE.Mesh {
  const colorKey = Object.keys(FALLBACK_COLORS).find(k =>
    topping.name.toLowerCase().includes(k)
  ) || 'default';
  const geo = new THREE.SphereGeometry(0.018, 10, 10);
  const mat = new THREE.MeshStandardMaterial({
    color: FALLBACK_COLORS[colorKey], roughness: 0.5, metalness: 0.1,
  });
  return new THREE.Mesh(geo, mat);
}

type ARPhase = 'scanning' | 'placing' | 'placed';

interface Props {
  item: MenuItem;
  selectedToppings?: Topping[];
  onBack: () => void;
}

const ARScreen: React.FC<Props> = ({ item, selectedToppings = [], onBack }) => {
  const mountRef        = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const sceneRef        = useRef<THREE.Scene | null>(null);
  const rendererRef     = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef       = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef     = useRef<OrbitControls | null>(null);
  const dishGroupRef    = useRef<THREE.Group | null>(null);
  const toppingGroupRef = useRef<THREE.Group | null>(null);
  const gridRef         = useRef<THREE.Group | null>(null);
  const frameRef        = useRef<number>(0);
  const streamRef       = useRef<MediaStream | null>(null);

  const [phase, setPhase]             = useState<ARPhase>('scanning');
  const [showNutrition, setShowNutrition] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const phaseRef = useRef<ARPhase>('scanning');

  const getBinaryId = () => {
    const value = selectedToppings.reduce((acc, t) => acc + t.binaryBit, 0);
    if (value === 0) return null;
    const bits = Math.max(3, selectedToppings.length + 1);
    return value.toString(2).padStart(bits, '0');
  };

  // ─── Camera setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },  // rear camera preferred
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('Camera access failed:', err);
        setCameraError(err.name === 'NotAllowedError'
          ? 'Camera permission denied. Grant access to use AR.'
          : 'Camera not available on this device.');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ─── Scene setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const w  = el.clientWidth;
    const h  = el.clientHeight;

    // Renderer — transparent so the camera video shows through
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // fully transparent
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 100);
    camera.position.set(0, 0.55, 0.75);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0xfff5e0, 0x334466, 1.4));
    const key = new THREE.DirectionalLight(0xfff0cc, 3.2);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.001;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xaaccff, 1.1);
    fill.position.set(-3, 1, -2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(0, -1, -4);
    scene.add(rim);
    const pt = new THREE.PointLight(0xffddaa, 0.6, 2);
    pt.position.set(0, -0.3, 0);
    scene.add(pt);

    // ── Table surface (shadow catcher) ────────────────────────────────────────
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e, roughness: 0.9, metalness: 0.0,
      transparent: true, opacity: 0,
    });
    const table = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), tableMat);
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    table.userData.isTable = true;
    scene.add(table);

    // ── Scanning grid ─────────────────────────────────────────────────────────
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridRef.current = gridGroup;

    const ringGeo = new THREE.RingGeometry(0.28, 0.30, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf2b90d, side: THREE.DoubleSide, transparent: true, opacity: 0.8,
    });
    gridGroup.add(new THREE.Mesh(ringGeo, ringMat));

    for (let angle = 0; angle < Math.PI; angle += Math.PI / 4) {
      const pts = [
        new THREE.Vector3(Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28),
        new THREE.Vector3(-Math.cos(angle) * 0.28, 0, -Math.sin(angle) * 0.28),
      ];
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xf2b90d, transparent: true, opacity: 0.4,
      });
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }

    const bracketPts = (ox: number, oz: number) => {
      const s = 0.06;
      return [
        new THREE.Vector3(ox + Math.sign(ox) * -s, 0, oz),
        new THREE.Vector3(ox, 0, oz),
        new THREE.Vector3(ox, 0, oz + Math.sign(oz) * -s),
      ];
    };
    for (const [ox, oz] of [[-0.25,-0.25],[0.25,-0.25],[0.25,0.25],[-0.25,0.25]]) {
      const bMat = new THREE.LineBasicMaterial({ color: 0xf2b90d, transparent: true, opacity: 0.9 });
      gridGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(bracketPts(ox, oz)), bMat
      ));
    }
    gridGroup.rotation.x = -Math.PI / 2;
    gridGroup.position.y = 0.001;

    // ── Dish group (hidden until placed) ──────────────────────────────────────
    const dishGroup   = new THREE.Group();
    dishGroup.visible = false;
    dishGroup.scale.setScalar(0.001); // start near-zero, not exactly 0 (avoids NaN)
    scene.add(dishGroup);
    dishGroupRef.current = dishGroup;

    const toppingGroup = new THREE.Group();
    dishGroup.add(toppingGroup);
    toppingGroupRef.current = toppingGroup;

    // ── Controls ──────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan    = false;
    controls.enableZoom   = true;
    controls.autoRotate   = false;
    controls.minPolarAngle = Math.PI / 8;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance  = 0.3;
    controls.maxDistance  = 1.4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enabled = false;
    controlsRef.current = controls;

    // ── Animate ───────────────────────────────────────────────────────────────
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      if (phaseRef.current === 'scanning') {
        gridGroup.rotation.z += 0.008;
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
        gridGroup.children.forEach(c => {
          const m = (c as any).material;
          if (m && m.opacity !== undefined) {
            m.opacity = Math.min(1, pulse * 0.9);
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const w2 = mountRef.current.clientWidth;
      const h2 = mountRef.current.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', onResize);

    // Auto-advance scanning → placing after 2s
    const scanTimer = setTimeout(() => {
      phaseRef.current = 'placing';
      setPhase('placing');
    }, 2000);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(scanTimer);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // ─── Load dish model ────────────────────────────────────────────────────────
  useEffect(() => {
    const dishGroup = dishGroupRef.current;
    if (!dishGroup || !item.modelUrl) return;

    const loader = new GLTFLoader();
    loader.load(item.modelUrl, (gltf) => {
      const model = gltf.scene;
      model.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });
      const box   = new THREE.Box3().setFromObject(model);
      const size  = box.getSize(new THREE.Vector3());
      // Larger scale for AR so the dish is clearly visible on-screen
      const scale = 0.5 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center.multiplyScalar(scale));
      dishGroup.add(model);
    });
  }, [item.modelUrl]);

  // ─── Load toppings ──────────────────────────────────────────────────────────
  useEffect(() => {
    const toppingGroup = toppingGroupRef.current;
    if (!toppingGroup) return;

    while (toppingGroup.children.length) {
      const child = toppingGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      toppingGroup.remove(child);
    }
    if (selectedToppings.length === 0) return;

    const loader = new GLTFLoader();
    const baseY  = 0.015;

    selectedToppings.forEach((topping, ti) => {
      const onLoaded = (obj: THREE.Object3D) => {
        const box   = new THREE.Box3().setFromObject(obj);
        const size  = box.getSize(new THREE.Vector3());
        const scale = 0.036 / Math.max(size.x, size.y, size.z);
        obj.scale.setScalar(scale);

        TOPPING_SPOTS.forEach(([x, z], i) => {
          const clone = obj.clone(true);
          clone.traverse(c => { if ((c as THREE.Mesh).isMesh) c.castShadow = true; });
          const cBox    = new THREE.Box3().setFromObject(clone);
          const ch      = cBox.getSize(new THREE.Vector3()).y;
          const targetY = baseY + ch * 0.5;
          const startY  = targetY + 0.3;
          clone.position.set(
            x - cBox.getCenter(new THREE.Vector3()).x * scale,
            startY,
            z - cBox.getCenter(new THREE.Vector3()).z * scale,
          );
          clone.rotation.y = ((ti * 7 + i) * 1.3) % (Math.PI * 2);
          clone.userData.baseY = targetY;
          toppingGroup.add(clone);

          const delay    = (ti * 7 + i) * 70;
          const duration = 520;
          const start    = performance.now() + delay;
          const drop = () => {
            const now = performance.now();
            if (now < start) { requestAnimationFrame(drop); return; }
            const t   = Math.min((now - start) / duration, 1);
            const overshoot = 1.5;
            const eased = t < 0.5
              ? 4 * t * t * t
              : 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
            clone.position.y = startY + (targetY - startY) * Math.min(eased, 1);
            clone.rotation.y += 0.08 * (1 - t);
            if (t < 1) requestAnimationFrame(drop);
          };
          requestAnimationFrame(drop);
        });
      };

      if (topping.modelUrl) {
        loader.load(topping.modelUrl, (gltf) => onLoaded(gltf.scene), undefined,
          () => onLoaded(makeFallbackMesh(topping)));
      } else {
        onLoaded(makeFallbackMesh(topping));
      }
    });
  }, [selectedToppings]);

  // ─── Place dish on tap ────────────────────────────────────────────────────
  const handlePlace = () => {
    if (phase !== 'placing') return;
    const dishGroup = dishGroupRef.current;
    const gridRef_  = gridRef.current;
    const controls  = controlsRef.current;
    const scene     = sceneRef.current;
    if (!dishGroup || !gridRef_ || !controls || !scene) return;

    phaseRef.current = 'placed';
    setPhase('placed');
    controls.enabled    = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    dishGroup.visible = true;

    // Fade out grid
    const fadeDuration = 400;
    const fadeStart    = performance.now();
    const fadeGrid = () => {
      const t = Math.min((performance.now() - fadeStart) / fadeDuration, 1);
      gridRef_.children.forEach(c => {
        const m = (c as any).material;
        if (m && m.opacity !== undefined) m.opacity = (1 - t) * 0.8;
      });
      if (t < 1) requestAnimationFrame(fadeGrid);
      else scene.remove(gridRef_);
    };
    requestAnimationFrame(fadeGrid);

    // Fade in table shadow surface
    scene.traverse(c => {
      if (c.userData.isTable) {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const start = performance.now();
        const fade = () => {
          const t = Math.min((performance.now() - start) / 500, 1);
          m.opacity = t * 0.15;
          if (t < 1) requestAnimationFrame(fade);
        };
        requestAnimationFrame(fade);
      }
    });

    // Pop-in scale animation — target scale 1.0 (full size)
    const popDuration = 700;
    const popStart    = performance.now();
    const popIn = () => {
      const t     = Math.min((performance.now() - popStart) / popDuration, 1);
      // Smooth overshoot easing for a satisfying pop
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 + 2.5 * Math.pow(t - 1, 3) + 2.5 * Math.pow(t - 1, 2);
      const s = Math.max(0.001, eased);
      dishGroup.scale.setScalar(s);
      if (t < 1) requestAnimationFrame(popIn);
      else dishGroup.scale.setScalar(1); // ensure we land exactly at 1
    };
    requestAnimationFrame(popIn);
  };

  const binaryId = getBinaryId();

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex flex-col" style={{ background: '#000' }}>

      {/* ── Live Camera Feed ───────────────────────────────────────────── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: 'scaleX(1)' }}
      />

      {/* Fallback background when camera is unavailable */}
      {cameraError && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 70%, #1a1a2e 0%, #0d0d1a 60%, #050508 100%)',
          }}/>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(rgba(242,185,13,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(242,185,13,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: 'perspective(400px) rotateX(55deg) translateY(30%)',
            transformOrigin: '50% 100%',
          }}/>
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-80 h-24 rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #f2b90d 0%, transparent 70%)', filter: 'blur(20px)' }}
          />
          {/* Camera error notice */}
          <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-red-500/40 px-5 py-3 rounded-2xl z-50 max-w-[80%]">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-red-400 text-sm">videocam_off</span>
              <span className="text-red-300 text-xs font-bold">{cameraError}</span>
            </div>
            <p className="text-white/40 text-[10px] mt-1">Using simulated environment instead.</p>
          </div>
        </div>
      )}

      {/* ── Three.js canvas (transparent, overlays camera) ─────────────── */}
      <div
        ref={mountRef}
        className="absolute inset-0 z-10"
        onClick={handlePlace}
        style={{ cursor: phase === 'placing' ? 'crosshair' : 'default' }}
      />

      {/* ── Phase overlays ─────────────────────────────────────────────── */}
      {phase === 'scanning' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-40 pointer-events-none">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-primary/40 px-6 py-3 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping"/>
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Scanning Surface...</span>
          </div>
          <p className="text-white/40 text-xs mt-3 font-medium">Point at a flat surface</p>
        </div>
      )}

      {phase === 'placing' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-40 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 bg-primary/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl shadow-primary/30">
              <span className="material-icons-round text-navy text-xl">touch_app</span>
              <span className="text-navy font-black text-sm uppercase tracking-widest">Tap to Place Dish</span>
            </div>
            <p className="text-white/40 text-xs font-medium">Surface detected ✓</p>
          </div>
        </div>
      )}

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-12 px-6 flex items-start justify-between pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <span className="material-icons-round">arrow_back</span>
        </button>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-primary text-navy px-4 py-2 rounded-full shadow-lg">
            <span className="material-icons-round text-sm">view_in_ar</span>
            <span className="text-[10px] font-black uppercase tracking-wide">AR Live</span>
          </div>
          {binaryId && (
            <div className="bg-black/70 backdrop-blur-md border border-primary/40 px-3 py-1.5 rounded-full">
              <span className="font-mono text-primary text-[10px] font-black">#{binaryId}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Toppings bar ─────────────────────────────────────────────────── */}
      {selectedToppings.length > 0 && phase === 'placed' && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center gap-2 px-6 flex-wrap pointer-events-none">
          {selectedToppings.map(t => (
            <div key={t.id} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
              <span>{t.emoji}</span>
              <span className="text-white text-[10px] font-bold">{t.name}</span>
              <span className="font-mono text-[8px] text-primary/70">{t.binaryBit.toString(2).padStart(3,'0')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Nutrition overlay ────────────────────────────────────────────── */}
      {phase === 'placed' && (
        <div className="absolute bottom-32 right-4 z-30">
          <button
            onClick={() => setShowNutrition(v => !v)}
            className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-white flex items-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-icons-round text-primary text-lg">info</span>
            {!showNutrition && <span className="text-[10px] font-bold text-white/70">Nutrition</span>}
          </button>

          {showNutrition && (
            <div className="absolute bottom-14 right-0 w-52 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 animate-fade-in">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Nutritional Info</p>
              <div className="space-y-2">
                {[
                  { label: 'Calories', value: `${(item.calories ?? 750) + selectedToppings.length * 45} kcal`, color: 'text-yellow-400' },
                  { label: 'Protein',  value: '24g',  color: 'text-blue-400' },
                  { label: 'Carbs',    value: '68g',  color: 'text-orange-400' },
                  { label: 'Fat',      value: '18g',  color: 'text-red-400' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-white/60 text-[10px]">{row.label}</span>
                    <span className={`${row.color} text-[11px] font-black`}>{row.value}</span>
                  </div>
                ))}
                {selectedToppings.length > 0 && (
                  <p className="text-[8px] text-white/30 mt-2 pt-2 border-t border-white/10">
                    +{selectedToppings.length} topping{selectedToppings.length > 1 ? 's' : ''} included
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Item name + calories ─────────────────────────────────────────── */}
      {phase === 'placed' && (
        <div className="absolute top-12 right-6 z-30 bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
          <span className="text-white text-xs font-black">
            {(item.calories ?? 750) + selectedToppings.length * 45} kcal
          </span>
        </div>
      )}
    </div>
  );
};

export default ARScreen;
