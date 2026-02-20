import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Topping } from '../types';

// Where each topping sits on the pizza surface
const TOPPING_SPOTS: [number, number][] = [
  [ 0.00,  0.00],
  [-0.06, -0.06],
  [ 0.06, -0.05],
  [ 0.06,  0.06],
  [-0.05,  0.07],
  [ 0.00, -0.09],
  [ 0.09,  0.00],
];

// Procedural fallback shapes when no .glb is available
const FALLBACK_COLORS: Record<string, number> = {
  default:    0xff6b35,
  mushroom:   0x8B5E3C,
  pepper:     0x2d8a4e,
  olive:      0x1a1a2e,
  basil:      0x2d8a4e,
  cheese:     0xf5c518,
  onion:      0xc084fc,
  tomato:     0xef4444,
};

function makeFallbackMesh(topping: Topping): THREE.Mesh {
  const colorKey = Object.keys(FALLBACK_COLORS).find(k =>
    topping.name.toLowerCase().includes(k)
  ) || 'default';
  const geo = new THREE.SphereGeometry(0.018, 10, 10);
  const mat = new THREE.MeshStandardMaterial({
    color: FALLBACK_COLORS[colorKey],
    roughness: 0.5,
    metalness: 0.1,
  });
  return new THREE.Mesh(geo, mat);
}

// Exploded layer config — rendered under/over the pizza to show cross-section
interface LayerConfig {
  label: string;
  color: number;
  y: number;        // rest position
  explodeY: number; // target when exploded
  radius: number;
  height: number;
}

const PIZZA_LAYERS: LayerConfig[] = [
  { label: 'Dough',       color: 0xd4a96a, y: -0.018, explodeY: -0.12, radius: 0.16, height: 0.012 },
  { label: 'Tomato Sauce',color: 0xc0392b, y: -0.005, explodeY:  0.00, radius: 0.14, height: 0.006 },
  { label: 'Mozzarella',  color: 0xfdf6ec, y:  0.005, explodeY:  0.10, radius: 0.13, height: 0.007 },
];

interface Props {
  pizzaUrl: string;
  selectedToppings: Topping[];
  isExploded?: boolean;
}

const PizzaViewer: React.FC<Props> = ({ pizzaUrl, selectedToppings, isExploded = false }) => {
  const mountRef    = useRef<HTMLDivElement>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pizzaGroupRef   = useRef<THREE.Group | null>(null);
  const toppingGroupRef = useRef<THREE.Group | null>(null);
  const layerGroupRef   = useRef<THREE.Group | null>(null);
  const labelGroupRef   = useRef<THREE.Group | null>(null);
  const frameRef    = useRef<number>(0);
  const explodedRef = useRef<boolean>(false);

  // ─── Scene setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const w  = el.clientWidth;
    const h  = el.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 100);
    camera.position.set(0, 0.28, 0.48);
    cameraRef.current = camera;

    // ── Lighting ──────────────────────────────────────────────────────────────
    // Hemisphere — sky/ground ambient
    const hemi = new THREE.HemisphereLight(0xfff5e0, 0x334466, 1.4);
    scene.add(hemi);

    // Key light — warm overhead
    const key = new THREE.DirectionalLight(0xfff0cc, 3.2);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far  = 20;
    key.shadow.camera.left = key.shadow.camera.bottom = -1;
    key.shadow.camera.right = key.shadow.camera.top   =  1;
    key.shadow.bias = -0.001;
    scene.add(key);

    // Fill light — cool opposite side
    const fill = new THREE.DirectionalLight(0xaaccff, 1.1);
    fill.position.set(-3, 1, -2);
    scene.add(fill);

    // Rim light — back highlight
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(0, -1, -4);
    scene.add(rim);

    // Subtle point light below for reflection
    const bottom = new THREE.PointLight(0xffddaa, 0.6, 2);
    bottom.position.set(0, -0.3, 0);
    scene.add(bottom);

    // ── Shadow catcher ────────────────────────────────────────────────────────
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 64),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.025;
    shadow.receiveShadow = true;
    scene.add(shadow);

    // ── Controls ──────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan    = false;
    controls.enableZoom   = true;
    controls.autoRotate   = true;
    controls.autoRotateSpeed = 1.8;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance  = 0.25;
    controls.maxDistance  = 0.9;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    // ── Groups ────────────────────────────────────────────────────────────────
    const pizzaGroup   = new THREE.Group(); scene.add(pizzaGroup);   pizzaGroupRef.current   = pizzaGroup;
    const toppingGroup = new THREE.Group(); scene.add(toppingGroup); toppingGroupRef.current = toppingGroup;
    const layerGroup   = new THREE.Group(); scene.add(layerGroup);   layerGroupRef.current   = layerGroup;
    const labelGroup   = new THREE.Group(); scene.add(labelGroup);   labelGroupRef.current   = labelGroup;

    // ── Load pizza model ──────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(pizzaUrl, (gltf) => {
      const model = gltf.scene;
      model.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });
      const box   = new THREE.Box3().setFromObject(model);
      const size  = box.getSize(new THREE.Vector3());
      const scale = 0.34 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center.multiplyScalar(scale));
      pizzaGroup.add(model);
    });

    // ── Build layer discs (hidden until exploded) ─────────────────────────────
    PIZZA_LAYERS.forEach(cfg => {
      const geo  = new THREE.CylinderGeometry(cfg.radius, cfg.radius, cfg.height, 64);
      const mat  = new THREE.MeshStandardMaterial({
        color: cfg.color, roughness: 0.7, metalness: 0.0,
        transparent: true, opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y      = cfg.y;
      mesh.castShadow      = true;
      mesh.receiveShadow   = true;
      mesh.userData.layer  = cfg;
      layerGroup.add(mesh);
    });

    // ── Animate ───────────────────────────────────────────────────────────────
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mountRef.current) return;
      const w2 = mountRef.current.clientWidth;
      const h2 = mountRef.current.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [pizzaUrl]);

  // ─── Toppings ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const toppingGroup = toppingGroupRef.current;
    if (!toppingGroup) return;

    // Clear old toppings
    while (toppingGroup.children.length) {
      const child = toppingGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      toppingGroup.remove(child);
    }
    if (selectedToppings.length === 0) return;

    const loader   = new GLTFLoader();
    const spots    = TOPPING_SPOTS.slice(0, 7);
    const baseY    = 0.015;

    selectedToppings.forEach((topping, ti) => {
      const onLoaded = (obj: THREE.Object3D) => {
        const box   = new THREE.Box3().setFromObject(obj);
        const size  = box.getSize(new THREE.Vector3());
        const scale = 0.036 / Math.max(size.x, size.y, size.z);
        obj.scale.setScalar(scale);

        spots.forEach(([ x, z ], i) => {
          const clone = obj.clone(true);
          clone.traverse(c => {
            if ((c as THREE.Mesh).isMesh) {
              c.castShadow = true;
            }
          });
          const cloneBox = new THREE.Box3().setFromObject(clone);
          const ch       = cloneBox.getSize(new THREE.Vector3()).y;
          const targetY  = baseY + ch * 0.5;
          const startY   = targetY + 0.3;

          clone.position.set(
            x - cloneBox.getCenter(new THREE.Vector3()).x * scale,
            startY,
            z - cloneBox.getCenter(new THREE.Vector3()).z * scale,
          );
          clone.rotation.y = ((ti * 7 + i) * 1.3) % (Math.PI * 2);

          // Store target for explode
          clone.userData.baseY    = targetY;
          clone.userData.toppingIndex = ti;
          clone.userData.spotIndex    = i;
          toppingGroup.add(clone);

          // Bouncy drop animation
          const delay    = (ti * 7 + i) * 70;
          const duration = 520;
          const start    = performance.now() + delay;

          const drop = () => {
            const now     = performance.now();
            if (now < start) { requestAnimationFrame(drop); return; }
            const elapsed = now - start;
            const t       = Math.min(elapsed / duration, 1);
            // Overshoot bounce easing
            const overshoot = 1.5;
            const eased = t < 0.5
              ? 4 * t * t * t
              : 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
            clone.position.y = startY + (targetY - startY) * Math.min(eased, 1);
            // Spin while falling
            clone.rotation.y += 0.08 * (1 - t);
            if (t < 1) requestAnimationFrame(drop);
          };
          requestAnimationFrame(drop);
        });
      };

      if (topping.modelUrl) {
        loader.load(
          topping.modelUrl,
          (gltf) => onLoaded(gltf.scene),
          undefined,
          () => { onLoaded(makeFallbackMesh(topping)); }
        );
      } else {
        onLoaded(makeFallbackMesh(topping));
      }
    });
  }, [selectedToppings]);

  // ─── Exploded view ────────────────────────────────────────────────────────
  useEffect(() => {
    explodedRef.current = isExploded;
    const layerGroup   = layerGroupRef.current;
    const toppingGroup = toppingGroupRef.current;
    const pizzaGroup   = pizzaGroupRef.current;
    if (!layerGroup || !toppingGroup || !pizzaGroup) return;

    const duration = 700;
    const startTime = performance.now();

    // Snapshot starting positions
    const layerStarts  = layerGroup.children.map(c => c.position.y);
    const toppingStarts = toppingGroup.children.map(c => c.position.y);
    const pizzaStart   = pizzaGroup.position.y;

    const animateExplode = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      // Pizza base moves down when exploded
      pizzaGroup.position.y = THREE.MathUtils.lerp(
        pizzaStart,
        isExploded ? -0.06 : 0,
        eased
      );

      // Layer discs
      layerGroup.children.forEach((child, i) => {
        const cfg    = (child as THREE.Mesh).userData.layer as LayerConfig;
        const mat    = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const startY = layerStarts[i];
        const targetY = isExploded ? cfg.explodeY : cfg.y;
        child.position.y = THREE.MathUtils.lerp(startY, targetY, eased);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, isExploded ? 0.92 : 0, eased);
        mat.needsUpdate = true;
      });

      // Toppings float up
      toppingGroup.children.forEach((child, i) => {
        const baseY  = child.userData.baseY ?? 0.015;
        const ti     = child.userData.toppingIndex ?? 0;
        const startY = toppingStarts[i];
        const targetY = isExploded ? baseY + 0.08 + ti * 0.06 : baseY;
        child.position.y = THREE.MathUtils.lerp(startY, targetY, eased);
      });

      if (t < 1) requestAnimationFrame(animateExplode);
    };
    requestAnimationFrame(animateExplode);
  }, [isExploded]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default PizzaViewer;
