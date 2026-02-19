export type View = 'STATION' | 'MENU' | 'CART' | 'TRACKER' | 'PREVIEW' | 'AR';

export interface Topping {
  id: string;
  name: string;
  price: number;
  modelUrl: string;
  binaryBit: number; // Powers of 2: 1, 2, 4, 8, 16...
  emoji: string;
  color: string; // accent color for UI badge
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Apps' | 'Salads' | 'Panfry' | 'Entree' | 'Ovens' | 'Bar';
  image: string;
  modelUrl?: string;
  calories?: number;
  allergens?: string[];
  availableToppings?: Topping[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedToppings?: Topping[];
}

export enum OrderStatus {
  RECEIVED = 'Received',
  PREPARING = 'Preparing',
  COOKING = 'Cooking',
  PLATING = 'Plating',
  COMING = 'Coming'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: any[];
}

export interface AIRecommendation {
  text: string;
  itemIds: string[];
}

export interface DiningStation {
  id: string;
  name: string;
  icon: string;
  description: string;
  tablePrefix: string;
}
