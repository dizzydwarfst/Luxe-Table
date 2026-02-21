import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MenuItem, Topping } from '../types';
import { generateToppingPlacements } from './toppingPlacement';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ARDish {
  id: string;
  item: MenuItem;
  toppings: Topping[];
  group: THREE.Group;
  /** Position on the AR table surface */
  position: { x: number; z: number };
}

// ─── Layout Constants ───────────────────────────────────────────────────────

/** Predefined table positions for 1–6 dishes, arranged like a dining table */
const TABLE_LAYOUTS: Record<number, Array<{ x: number; z: number }>> = {
  1: [{ x: 0, z: 0 }],
  2: [{ x: -0.2, z: 0 }, { x: 0.2, z: 0 }],
  3: [{ x: -0.22, z: -0.08 }, { x: 0.22, z: -0.08 }, { x: 0, z: 0.16 }],
  4: [
    { x: -0.2, z: -0.12 }, { x: 0.2, z: -0.12 },
    { x: -0.2, z: 0.12 },  { x: 0.2, z: 0.12 },
  ],
  5: [
    { x: -0.24, z: -0.12 }, { x: 0, z: -0.14 }, { x: 0.24, z: -0.12 },
    { x: -0.14, z: 0.12 },  { x: 0.14, z: 0.12 },
  ],
  6: [
    { x: -0.24, z: -0.12 }, { x: 0, z: -0.14 }, { x: 0.24, z: -0.12 },
    { x: -0.24, z: 0.12 },  { x: 0, z: 0.14 },  { x: 0.24, z: 0.12 },
  ],
};

function getTablePositions(count: number): Array<{ x: number; z: number }> {
  const clamped = Math.min(Math.max(count, 1), 6);
  return TABLE_LAYOUTS[clamped] || TABLE_LAYOUTS[1];
}

// ─── Multi-Dish Manager ─────────────────────────────────────────────────────

export class MultiDishManager {
  private scene: THREE.Scene;
  private dishes: ARDish[] = [];
  private loader = new GLTFLoader();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Current number of dishes on the table */
  get count(): number {
    return this.dishes.length;
  }

  get allDishes(): ARDish[] {
    return [...this.dishes];
  }

  /**
   * Add a new dish to the AR table. Automatically rearranges all existing
   * dishes to accommodate the new layout.
   */
  addDish(item: MenuItem, toppings: Topping[] = []): Promise<ARDish> {
    return new Promise((resolve) => {
      const group = new THREE.Group();
      group.visible = false;
      group.scale.setScalar(0.001);
      this.scene.add(group);

      const dish: ARDish = {
        id: `dish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        item,
        toppings,
        group,
        position: { x: 0, z: 0 },
      };

      this.dishes.push(dish);

      // Load model
      if (item.modelUrl) {
        this.loader.load(item.modelUrl, (gltf) => {
          const model = gltf.scene;
          model.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const box   = new THREE.Box3().setFromObject(model);
          const size  = box.getSize(new THREE.Vector3());
          // Smaller scale for multi-dish (0.3 vs 0.5 for single)
          const scale = 0.3 / Math.max(size.x, size.y, size.z);
          model.scale.setScalar(scale);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center.multiplyScalar(scale));
          group.add(model);

          // Add toppings
          this.addToppingsToGroup(group, toppings);

          // Rearrange all dishes
          this.rearrangeDishes();

          resolve(dish);
        });
      } else {
        this.rearrangeDishes();
        resolve(dish);
      }
    });
  }

  /**
   * Remove a dish from the AR table by ID. Rearranges remaining dishes.
   */
  removeDish(dishId: string): void {
    const idx = this.dishes.findIndex(d => d.id === dishId);
    if (idx === -1) return;

    const dish = this.dishes[idx];
    this.scene.remove(dish.group);
    dish.group.traverse(child => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    });

    this.dishes.splice(idx, 1);
    this.rearrangeDishes();
  }

  /** Remove all dishes */
  clear(): void {
    this.dishes.forEach(dish => {
      this.scene.remove(dish.group);
    });
    this.dishes = [];
  }

  /**
   * Show all dishes with staggered pop-in animation.
   */
  revealAll(): void {
    this.dishes.forEach((dish, i) => {
      const group    = dish.group;
      group.visible  = true;

      const popDelay    = i * 250;
      const popDuration = 600;
      const popStart    = performance.now() + popDelay;

      const popIn = () => {
        const now = performance.now();
        if (now < popStart) { requestAnimationFrame(popIn); return; }

        const t = Math.min((now - popStart) / popDuration, 1);
        const eased = t < 0.5
          ? 4 * t * t * t
          : 1 + 2.5 * Math.pow(t - 1, 3) + 2.5 * Math.pow(t - 1, 2);

        group.scale.setScalar(Math.max(0.001, eased));
        if (t < 1) requestAnimationFrame(popIn);
        else group.scale.setScalar(1);
      };

      requestAnimationFrame(popIn);
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private rearrangeDishes(): void {
    const positions = getTablePositions(this.dishes.length);
    const duration  = 400;
    const startTime = performance.now();

    // Capture starting positions
    const starts = this.dishes.map(d => ({
      x: d.group.position.x,
      z: d.group.position.z,
    }));

    const animate = () => {
      const t     = Math.min((performance.now() - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      this.dishes.forEach((dish, i) => {
        const target = positions[i] || { x: 0, z: 0 };
        const start  = starts[i];

        dish.group.position.x = THREE.MathUtils.lerp(start.x, target.x, eased);
        dish.group.position.z = THREE.MathUtils.lerp(start.z, target.z, eased);
        dish.position = target;
      });

      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  private addToppingsToGroup(group: THREE.Group, toppings: Topping[]): void {
    if (toppings.length === 0) return;

    const toppingGroup = new THREE.Group();
    group.add(toppingGroup);

    const placements = generateToppingPlacements(toppings);
    const baseY      = 0.012;

    // Group by topping
    const byTopping = new Map<string, typeof placements>();
    for (const p of placements) {
      const arr = byTopping.get(p.topping.id) || [];
      arr.push(p);
      byTopping.set(p.topping.id, arr);
    }

    byTopping.forEach((spots) => {
      const topping = spots[0].topping;

      const loadFallback = () => {
        const colorKey = ['mushroom', 'pepper', 'olive', 'basil', 'cheese', 'onion', 'tomato']
          .find(k => topping.name.toLowerCase().includes(k)) || 'default';
        const colors: Record<string, number> = {
          default: 0xff6b35, mushroom: 0x8B5E3C, pepper: 0x2d8a4e,
          olive: 0x1a1a2e, basil: 0x2d8a4e, cheese: 0xf5c518,
          onion: 0xc084fc, tomato: 0xef4444,
        };

        spots.forEach(spot => {
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.014, 8, 8),
            new THREE.MeshStandardMaterial({ color: colors[colorKey], roughness: 0.5 }),
          );
          mesh.position.set(spot.x, baseY, spot.z);
          mesh.rotation.y = spot.rotation;
          mesh.castShadow = true;
          toppingGroup.add(mesh);
        });
      };

      if (topping.modelUrl) {
        this.loader.load(
          topping.modelUrl,
          (gltf) => {
            const obj   = gltf.scene;
            const box   = new THREE.Box3().setFromObject(obj);
            const size  = box.getSize(new THREE.Vector3());
            const scale = 0.028 / Math.max(size.x, size.y, size.z);
            obj.scale.setScalar(scale);

            spots.forEach(spot => {
              const clone = obj.clone(true);
              clone.traverse(c => { if ((c as THREE.Mesh).isMesh) c.castShadow = true; });
              clone.position.set(spot.x, baseY, spot.z);
              clone.rotation.y = spot.rotation;
              toppingGroup.add(clone);
            });
          },
          undefined,
          loadFallback,
        );
      } else {
        loadFallback();
      }
    });
  }
}
