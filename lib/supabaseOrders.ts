import { supabase, isSupabaseEnabled } from './supabase';
import { CartItem } from '../types';

/**
 * Create an order in Supabase and return the order UUID.
 * Returns null if Supabase is unavailable — caller should fall back to simulated mode.
 */
export async function createSupabaseOrder(opts: {
  displayId: string;
  tableId?: string;
  stationId?: string;
  items: CartItem[];
  userId?: string;
}): Promise<string | null> {
  if (!isSupabaseEnabled || !supabase) return null;

  try {
    // Calculate totals
    const subtotal = opts.items.reduce((sum, item) => {
      const toppingsPrice = (item.selectedToppings || []).reduce((t, top) => t + (top.price ?? 0), 0);
      return sum + (item.price + toppingsPrice) * item.quantity;
    }, 0);
    const tax = subtotal * 0.13; // 13% tax
    const total = subtotal + tax;

    // 1. Insert the order using raw rpc-style to avoid type issues
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        display_id: opts.displayId,
        table_id: opts.tableId || null,
        station_id: opts.stationId || null,
        status: 'pending',
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        guest_count: 1,
        user_id: opts.userId || null,
      } as any)
      .select('id')
      .returns<{ id: string }[]>()
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('No order returned');

    // 2. Insert order line items
    const orderItems = opts.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      topping_ids: (item.selectedToppings || []).map((t) => t.id),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems as any);

    if (itemsError) {
      console.warn('[LuxeTable] Failed to insert order items:', itemsError);
      // Order was still created, so continue
    }

    // 3. Insert initial "pending" event
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: order.id,
        stage: 'pending',
        message: 'Order sent to kitchen...',
        estimated_minutes: 15,
      } as any);

    if (eventError) {
      console.warn('[LuxeTable] Failed to insert initial order event:', eventError);
    }

    console.log(`[LuxeTable] Order created in Supabase: ${order.id}`);
    return order.id;
  } catch (err) {
    console.error('[LuxeTable] Failed to create order in Supabase:', err);
    return null;
  }
}

/**
 * Update the status of an order (used by kitchen dashboard).
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;

  try {
    const { error } = await (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', orderId);
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[LuxeTable] Failed to update order status:', err);
    return false;
  }
}

/**
 * Push a new kitchen event for an order (used by kitchen dashboard).
 */
export async function pushKitchenEvent(opts: {
  orderId: string;
  stage: string;
  message: string;
  chefName?: string;
  estimatedMinutes?: number;
}): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;

  try {
    const { error } = await supabase
      .from('order_events')
      .insert({
        order_id: opts.orderId,
        stage: opts.stage,
        message: opts.message,
        chef_name: opts.chefName || null,
        estimated_minutes: opts.estimatedMinutes ?? null,
      } as any);

    if (error) throw error;

    // Also update the order's status column
    await updateOrderStatus(opts.orderId, opts.stage);

    return true;
  } catch (err) {
    console.error('[LuxeTable] Failed to push kitchen event:', err);
    return false;
  }
}