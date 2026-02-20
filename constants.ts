import { Topping } from './types';

// Each topping gets a unique power of 2 so any combination maps to a unique binary ID
// e.g. mushroom (1) + pepper (4) + olive (8) = 13 = binary 001101
export const TOPPINGS: Topping[] = [
  {
    id:        'mushroom',
    name:      'Mushroom',
    emoji:     '🍄',
    binaryBit: 1,
    price:     0.75,
    color:     '#8B5E3C',
    modelUrl:  '/models/toppings/mushroom.glb',
  },
  {
    id:        'pepper',
    name:      'Pepper',
    emoji:     '🌶️',
    binaryBit: 2,
    price:     0.75,
    color:     '#ef4444',
    modelUrl:  '/models/toppings/pepper.glb',
  },
  {
    id:        'olive',
    name:      'Olive',
    emoji:     '🫒',
    binaryBit: 4,
    price:     0.60,
    color:     '#4a4a6a',
    modelUrl:  '/models/toppings/olive.glb',
  },
  {
    id:        'basil',
    name:      'Basil',
    emoji:     '🌿',
    binaryBit: 8,
    price:     0.50,
    color:     '#2d8a4e',
    modelUrl:  '/models/toppings/basil.glb',
  },
  // ── New toppings ──────────────────────────────────────────────────────────
  {
    id:        'extra-cheese',
    name:      'Extra Cheese',
    emoji:     '🧀',
    binaryBit: 16,
    price:     1.00,
    color:     '#f5c518',
    modelUrl:  '/models/toppings/cheese.glb',
  },
  {
    id:        'onion',
    name:      'Red Onion',
    emoji:     '🧅',
    binaryBit: 32,
    price:     0.60,
    color:     '#c084fc',
    modelUrl:  '/models/toppings/onion.glb',
  },
  {
    id:        'tomato',
    name:      'Sun Tomato',
    emoji:     '🍅',
    binaryBit: 64,
    price:     0.70,
    color:     '#f97316',
    modelUrl:  '/models/toppings/tomato.glb',
  },
  {
    id:        'bacon',
    name:      'Crispy Bacon',
    emoji:     '🥓',
    binaryBit: 128,
    price:     1.25,
    color:     '#b45309',
    modelUrl:  '/models/toppings/bacon.glb',
  },
];

// Helper: decode a binary ID back to a topping combo
// e.g. binaryIdToToppings(13) → [mushroom, pepper, olive]
export function binaryIdToToppings(value: number): Topping[] {
  return TOPPINGS.filter(t => (value & t.binaryBit) !== 0);
}

// Helper: get total price for a set of toppings
export function toppingsTotalPrice(toppings: Topping[]): number {
  return toppings.reduce((acc, t) => acc + (t.price ?? 0), 0);
}
