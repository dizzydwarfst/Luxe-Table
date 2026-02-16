
export type View = 'STATION' | 'MENU' | 'CART' | 'TRACKER' | 'PREVIEW' | 'AR';

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
}

export interface CartItem extends MenuItem {
  quantity: number;
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