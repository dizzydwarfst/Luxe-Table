import { supabase, isSupabaseEnabled } from './supabase';
import { MenuItem, Topping } from '../types';
import { MENU_ITEMS, TOPPINGS, CATEGORIES } from '../constants';

// ─── Row types for Supabase query results ─────────────────────────────────────

interface ToppingRow {
  id: string;
  name: string;
  price: number;
  model_url: string | null;
  binary_bit: number;
  emoji: string | null;
  color: string | null;
  sort_order: number;
}

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
  model_url: string | null;
  calories: number | null;
  allergens: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface MenuItemToppingRow {
  topping_id: string;
}

interface StationRow {
  id: string;
  sort_order: number;
}

/**
 * Fetch all toppings from Supabase.
 * Falls back to constants.ts if Supabase is unavailable.
 */
export async function fetchToppings(): Promise<Topping[]> {
  if (!isSupabaseEnabled || !supabase) return TOPPINGS;

  try {
    const { data, error } = await supabase
      .from('toppings')
      .select('*')
      .order('sort_order')
      .returns<ToppingRow[]>();

    if (error) throw error;
    if (!data || data.length === 0) return TOPPINGS;

    return data.map((t) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
      modelUrl: t.model_url || undefined,
      binaryBit: t.binary_bit,
      emoji: t.emoji || undefined,
      color: t.color || undefined,
    }));
  } catch (err) {
    console.warn('[LuxeTable] Failed to fetch toppings from Supabase, using local fallback:', err);
    return TOPPINGS;
  }
}

/**
 * Fetch which toppings are available for a given menu item.
 */
async function fetchToppingsForItem(menuItemId: string, allToppings: Topping[]): Promise<Topping[] | undefined> {
  if (!isSupabaseEnabled || !supabase) return undefined;

  try {
    const { data, error } = await supabase
      .from('menu_item_toppings')
      .select('topping_id')
      .eq('menu_item_id', menuItemId)
      .returns<MenuItemToppingRow[]>();

    if (error) throw error;
    if (!data || data.length === 0) return undefined;

    const toppingIds = data.map((row) => row.topping_id);
    return allToppings.filter((t) => toppingIds.includes(t.id));
  } catch {
    return undefined;
  }
}

/**
 * Fetch all menu items from Supabase with their available toppings.
 * Falls back to constants.ts if Supabase is unavailable.
 */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  if (!isSupabaseEnabled || !supabase) return MENU_ITEMS;

  try {
    // Fetch menu items and toppings in parallel
    const [menuResult, allToppings] = await Promise.all([
      supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .returns<MenuItemRow[]>(),
      fetchToppings(),
    ]);

    if (menuResult.error) throw menuResult.error;
    if (!menuResult.data || menuResult.data.length === 0) return MENU_ITEMS;

    // Fetch topping associations for all items that have model_url (3D items)
    const items: MenuItem[] = await Promise.all(
      menuResult.data.map(async (row) => {
        const item: MenuItem = {
          id: row.id,
          name: row.name,
          description: row.description || '',
          price: Number(row.price),
          category: row.category as MenuItem['category'],
          image: row.image || undefined,
          modelUrl: row.model_url || undefined,
          calories: row.calories || undefined,
          allergens: row.allergens || [],
        };

        // Only fetch toppings for items that have a 3D model (like test-pizza)
        if (row.model_url) {
          const availableToppings = await fetchToppingsForItem(row.id, allToppings);
          if (availableToppings && availableToppings.length > 0) {
            item.availableToppings = availableToppings;
          }
        }

        return item;
      })
    );

    return items;
  } catch (err) {
    console.warn('[LuxeTable] Failed to fetch menu from Supabase, using local fallback:', err);
    return MENU_ITEMS;
  }
}

/**
 * Fetch categories (station IDs) from Supabase.
 * Falls back to constants.ts if Supabase is unavailable.
 */
export async function fetchCategories(): Promise<string[]> {
  if (!isSupabaseEnabled || !supabase) return [...CATEGORIES];

  try {
    const { data, error } = await supabase
      .from('stations')
      .select('id, sort_order')
      .order('sort_order')
      .returns<StationRow[]>();

    if (error) throw error;
    if (!data || data.length === 0) return [...CATEGORIES];

    return data.map((s) => s.id);
  } catch (err) {
    console.warn('[LuxeTable] Failed to fetch categories from Supabase, using local fallback:', err);
    return [...CATEGORIES];
  }
}

/**
 * Fetch all menu data at once — convenience wrapper.
 */
export async function fetchAllMenuData(): Promise<{
  menuItems: MenuItem[];
  toppings: Topping[];
  categories: string[];
}> {
  const [menuItems, toppings, categories] = await Promise.all([
    fetchMenuItems(),
    fetchToppings(),
    fetchCategories(),
  ]);

  return { menuItems, toppings, categories };
}