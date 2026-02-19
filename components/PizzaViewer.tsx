import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Topping } from '../types';

// 5 positions on the pizza surface (X, Z) — kept in inner zone away from crust
// Y is set slightly above pizza surface
const TOPPING_SPOTS: [number, number][] = [
  [ 0.00,  0.00],  // center
  [-0.06, -0.06],  // upper left
  [ 0.06, -0.05],  // upper right
  [ 0.06,  0.06],  // lower right
  [-0.05,  0.07],  // lower left
];

interface Props {
  pizzaUrl: string;
  selectedToppings: Topping[];
}

const PizzaViewer: React.FC<Props> = ({ pizzaUrl, selectedToppings }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pizzaGroupRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  const toppingMeshesRef = useRef<THREE.Object3D[]>([]);

  // — Init Three.js scene once —
  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    camera.position.set(0, 0.35, 0.55);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
    dirLight.position.set(2, 4, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-2, 1, -2);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2.2;
    controlsRef.current = controls;

    // Pizza group — everything goes inside this so toppings rotate together
    const pizzaGroup = new THREE.Group();
    scene.add(pizzaGroup);
    pizzaGroupRef.current = pizzaGroup;

    // Load pizza GLB
    const loader = new GLTFLoader();
    loader.load(pizzaUrl, (gltf) => {
      const model = gltf.scene;
      // Center and scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 0.28 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      pizzaGroup.add(model);
    });

    // Animate loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
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

  // — Load/update toppings whenever selectedToppings changes —
  useEffect(() => {
    const pizzaGroup = pizzaGroupRef.current;
    if (!pizzaGroup) return;

    // Remove old topping meshes
    toppingMeshesRef.current.forEach(m => pizzaGroup.remove(m));
    toppingMeshesRef.current = [];

    if (selectedToppings.length === 0) return;

    const loader = new GLTFLoader();

    selectedToppings.forEach((topping) => {
      // Load one copy of the topping GLB, then clone it to all spots
      loader.load(topping.modelUrl, (gltf) => {
        const original = gltf.scene;

        // Scale topping relative to pizza
        const box = new THREE.Box3().setFromObject(original);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const toppingScale = 0.038 / maxDim; // small relative to pizza

        TOPPING_SPOTS.forEach(([x, z], i) => {
          const clone = original.clone(true);
          clone.scale.setScalar(toppingScale);

          // Center the clone
          const cloneBox = new THREE.Box3().setFromObject(clone);
          const cloneCenter = cloneBox.getCenter(new THREE.Vector3());
          const cloneSize = cloneBox.getSize(new THREE.Vector3());
          clone.position.set(
            x - cloneCenter.x * toppingScale,
            cloneSize.y * toppingScale * 0.5 + 0.012, // sit ON TOP of pizza
            z - cloneCenter.z * toppingScale
          );

          // Slight random rotation so they don't all look identical
          clone.rotation.y = (i * 1.3) % (Math.PI * 2);

          // Animate drop-in
          const startY = clone.position.y + 0.25;
          clone.position.y = startY;
          const targetY = 0.012 + cloneSize.y * toppingScale * 0.5;
          const delay = i * 80;
          const duration = 500;
          const startTime = performance.now() + delay;

          const dropAnimate = () => {
            const now = performance.now();
            if (now < startTime) {
              requestAnimationFrame(dropAnimate);
              return;
            }
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Ease out bounce
            const eased = t < 0.5
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2;
            clone.position.y = startY + (targetY - startY) * eased;
            if (t < 1) requestAnimationFrame(dropAnimate);
          };
          requestAnimationFrame(dropAnimate);

          pizzaGroup.add(clone);
          toppingMeshesRef.current.push(clone);
        });
      });
    });
  }, [selectedToppings]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default PizzaViewer;