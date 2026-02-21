import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { playLayerReveal, playSizzle } from './sounds';

/**
 * Plating layer definition.
 * Each layer animates in sequence: rise from below → settle into position → reveal next.
 */
export interface PlatingLayer {
  label: string;
  /** Meshes or groups belonging to this layer */
  objects: THREE.Object3D[];
  /** Final resting Y position */
  targetY: number;
  /** Duration of this layer's entrance in ms */
  duration?: number;
  /** Optional callback when this layer finishes */
  onComplete?: () => void;
}

interface PlatingOptions {
  /** Delay between layers in ms (default 600) */
  layerGap?: number;
  /** How far below each layer starts (default 0.15) */
  dropHeight?: number;
  /** Overall callback when entire sequence finishes */
  onAllComplete?: () => void;
}

/**
 * Hook that provides an `animate` function to run a chef-style plating
 * sequence on an array of PlatingLayers.
 *
 * Usage:
 *   const { runPlating, isPlating } = usePlatingAnimation();
 *   runPlating(layers, { layerGap: 500 });
 */
export function usePlatingAnimation() {
  const isPlatingRef = useRef(false);
  const cancelRef    = useRef(false);

  const runPlating = useCallback((
    layers: PlatingLayer[],
    opts: PlatingOptions = {},
  ) => {
    const { layerGap = 600, dropHeight = 0.15, onAllComplete } = opts;

    if (isPlatingRef.current) return; // already running
    isPlatingRef.current = true;
    cancelRef.current    = false;

    // Hide all layers initially
    layers.forEach(layer => {
      layer.objects.forEach(obj => {
        obj.visible = false;
        obj.position.y = layer.targetY - dropHeight;
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.transparent !== undefined) {
            mat.transparent = true;
            mat.opacity = 0;
          }
        }
      });
    });

    let layerIndex = 0;

    const animateLayer = () => {
      if (cancelRef.current || layerIndex >= layers.length) {
        isPlatingRef.current = false;
        onAllComplete?.();
        return;
      }

      const layer    = layers[layerIndex];
      const duration = layer.duration ?? 500;
      const startY   = layer.targetY - dropHeight;
      const startT   = performance.now();

      // Play sound for this layer
      if (layerIndex === 0) {
        playSizzle();
      } else {
        playLayerReveal(1 + layerIndex * 0.15);
      }

      // Make objects visible
      layer.objects.forEach(obj => { obj.visible = true; });

      const tick = () => {
        if (cancelRef.current) {
          isPlatingRef.current = false;
          return;
        }

        const elapsed = performance.now() - startT;
        const t       = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);

        layer.objects.forEach(obj => {
          // Rise into position
          obj.position.y = THREE.MathUtils.lerp(startY, layer.targetY, eased);

          // Fade in
          if ((obj as THREE.Mesh).material) {
            const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat.opacity !== undefined) {
              mat.opacity = eased;
              mat.needsUpdate = true;
            }
          }

          // Slight rotation during entrance for organic feel
          obj.rotation.y += 0.002 * (1 - t);
        });

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          // Ensure final state
          layer.objects.forEach(obj => {
            obj.position.y = layer.targetY;
            if ((obj as THREE.Mesh).material) {
              const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat.opacity !== undefined) {
                mat.opacity = 1;
                mat.needsUpdate = true;
              }
            }
          });

          layer.onComplete?.();
          layerIndex++;

          // Schedule next layer
          setTimeout(animateLayer, layerGap);
        }
      };

      requestAnimationFrame(tick);
    };

    // Kick off the first layer
    animateLayer();
  }, []);

  const cancelPlating = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return {
    runPlating,
    cancelPlating,
    get isPlating() { return isPlatingRef.current; },
  };
}
