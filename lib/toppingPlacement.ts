import { Topping } from '../types';

// Pizza surface geometry constants
const PIZZA_INNER_RADIUS = 0.11;   // max distance from center (inside crust)
const MIN_DISTANCE       = 0.028;  // minimum gap between any two toppings
const TOPPINGS_PER_KIND  = 6;      // how many clones per topping type
const MAX_ATTEMPTS       = 80;     // rejection sampling attempts per placement

export interface PlacedTopping {
  topping: Topping;
  toppingIndex: number;
  spotIndex: number;
  x: number;
  z: number;
  rotation: number;
}

/**
 * Attempt to place a point inside the pizza radius, not overlapping
 * any already-placed point by at least MIN_DISTANCE.
 */
function tryPlace(placed: { x: number; z: number }[]): { x: number; z: number } | null {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Random point in a circle (uniform distribution via sqrt)
    const angle  = Math.random() * Math.PI * 2;
    const radius = PIZZA_INNER_RADIUS * Math.sqrt(Math.random());
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Check distance against every existing placement
    let valid = true;
    for (const p of placed) {
      const dx = x - p.x;
      const dz = z - p.z;
      if (Math.sqrt(dx * dx + dz * dz) < MIN_DISTANCE) {
        valid = false;
        break;
      }
    }
    if (valid) return { x, z };
  }
  return null; // couldn't place — skip this one
}

/**
 * Given an array of selected toppings, returns an array of concrete
 * placement positions with no overlaps and no crust/edge spill.
 */
export function generateToppingPlacements(
  selectedToppings: Topping[],
  countPerTopping: number = TOPPINGS_PER_KIND,
): PlacedTopping[] {
  const allPlaced: { x: number; z: number }[] = [];
  const results: PlacedTopping[] = [];

  selectedToppings.forEach((topping, ti) => {
    for (let i = 0; i < countPerTopping; i++) {
      const pos = tryPlace(allPlaced);
      if (!pos) continue; // skip if we truly can't fit more

      allPlaced.push(pos);
      results.push({
        topping,
        toppingIndex: ti,
        spotIndex: i,
        x: pos.x,
        z: pos.z,
        rotation: Math.random() * Math.PI * 2,
      });
    }
  });

  return results;
}
