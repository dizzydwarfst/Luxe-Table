import { useState, useEffect, useRef, useCallback } from 'react';
import { playNotification, playSuccess } from './sounds';
import { supabase, isSupabaseEnabled } from './supabase';

// ─── Order Status Types ─────────────────────────────────────────────────────

export type OrderStage =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'cooking'
  | 'plating'
  | 'ready'
  | 'served';

export interface KitchenEvent {
  orderId: string;
  stage: OrderStage;
  message: string;
  timestamp: number;
  estimatedMinutes?: number;
  chefName?: string;
}

export interface OrderSyncState {
  connected: boolean;
  currentStage: OrderStage;
  events: KitchenEvent[];
  estimatedReady: number | null;   // minutes remaining
  chefName: string | null;
}

// ─── Stage Config ───────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<OrderStage, {
  icon: string;
  label: string;
  color: string;
  message: string;
}> = {
  pending:   { icon: 'schedule',       label: 'Pending',      color: '#94a3b8', message: 'Waiting for kitchen to accept...' },
  confirmed: { icon: 'thumb_up',       label: 'Confirmed',    color: '#60a5fa', message: 'Kitchen has received your order!' },
  preparing: { icon: 'restaurant',     label: 'Preparing',    color: '#f59e0b', message: 'Ingredients being prepped...' },
  cooking:   { icon: 'local_fire_department', label: 'Cooking', color: '#ef4444', message: 'Your dish is on the heat!' },
  plating:   { icon: 'dinner_dining',  label: 'Plating',      color: '#a855f7', message: 'Chef is plating your dish...' },
  ready:     { icon: 'notifications_active', label: 'Ready!', color: '#22c55e', message: 'Your order is ready for pickup!' },
  served:    { icon: 'check_circle',   label: 'Served',       color: '#22c55e', message: 'Enjoy your meal!' },
};

export { STAGE_CONFIG };

// ─── Mode Detection ─────────────────────────────────────────────────────────
// Uses simulated mode when:
// 1. VITE_USE_SIMULATED_KITCHEN is 'true' (explicit)
// 2. Supabase is not configured
// 3. No supabaseOrderId is provided (order wasn't created in DB)

const USE_SIMULATED = import.meta.env.VITE_USE_SIMULATED_KITCHEN === 'true' || !isSupabaseEnabled;

const CHEF_NAMES = ['Chef Marco', 'Chef Yuki', 'Chef Priya', 'Chef Alex', 'Chef Luna'];

function randomChef(): string {
  return CHEF_NAMES[Math.floor(Math.random() * CHEF_NAMES.length)];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useOrderSync(orderId: string | null, supabaseOrderId?: string | null): OrderSyncState & {
  /** Manually push the order to the kitchen (triggers the simulation or Realtime subscription) */
  submitOrder: () => void;
  /** Get display config for current stage */
  stageConfig: typeof STAGE_CONFIG[OrderStage];
} {
  const [state, setState] = useState<OrderSyncState>({
    connected: false,
    currentStage: 'pending',
    events: [],
    estimatedReady: null,
    chefName: null,
  });

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);

  // Determine if we should use Realtime or simulated
  const useRealtime = !USE_SIMULATED && isSupabaseEnabled && !!supabaseOrderId;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
      }
    };
  }, []);

  const addEvent = useCallback((stage: OrderStage, message: string, est?: number, chef?: string) => {
    const event: KitchenEvent = {
      orderId: orderId || 'unknown',
      stage,
      message,
      timestamp: Date.now(),
      estimatedMinutes: est,
      chefName: chef,
    };

    setState(prev => ({
      ...prev,
      currentStage: stage,
      events: [...prev.events, event],
      estimatedReady: est ?? prev.estimatedReady,
      chefName: chef ?? prev.chefName,
    }));

    // Sound effects for key stages
    if (stage === 'ready') {
      playSuccess();
    } else if (stage !== 'pending') {
      playNotification();
    }
  }, [orderId]);

  const submitOrder = useCallback(() => {
    if (!orderId) return;

    setState(prev => ({
      ...prev,
      connected: true,
      currentStage: 'pending',
      events: [],
      estimatedReady: null,
      chefName: null,
    }));

    if (useRealtime && supabase && supabaseOrderId) {
      // ─── Supabase Realtime Mode ───────────────────────────────────
      console.log('[LuxeTable] Subscribing to Realtime for order:', supabaseOrderId);

      // Add the initial pending event
      addEvent('pending', 'Order sent to kitchen...', 15);

      // First, fetch any existing events for this order
      supabase
        .from('order_events')
        .select('*')
        .eq('order_id', supabaseOrderId)
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            // Replay existing events (in case we reconnected)
            data.forEach((row: any) => {
              addEvent(
                row.stage as OrderStage,
                row.message,
                row.estimated_minutes ?? undefined,
                row.chef_name ?? undefined,
              );
            });
          }
        });

      // Subscribe to new events via Realtime
      const channel = supabase
        .channel(`order-events-${supabaseOrderId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_events',
            filter: `order_id=eq.${supabaseOrderId}`,
          },
          (payload: any) => {
            const row = payload.new;
            if (row) {
              console.log('[LuxeTable] Realtime event received:', row.stage);
              addEvent(
                row.stage as OrderStage,
                row.message,
                row.estimated_minutes ?? undefined,
                row.chef_name ?? undefined,
              );
            }
          }
        )
        .subscribe((status: string) => {
          console.log('[LuxeTable] Realtime subscription status:', status);
          setState(prev => ({
            ...prev,
            connected: status === 'SUBSCRIBED',
          }));
        });

      channelRef.current = channel;

    } else {
      // ─── Simulated Kitchen Mode ───────────────────────────────────
      console.log('[LuxeTable] Using simulated kitchen mode');
      const chef = randomChef();

      const timeline: Array<{
        delay: number;
        stage: OrderStage;
        message: string;
        est?: number;
        chef?: string;
      }> = [
        { delay: 1500,  stage: 'confirmed',  message: 'Order accepted by kitchen', est: 12, chef },
        { delay: 5000,  stage: 'preparing',  message: `${chef} is gathering ingredients`, est: 10 },
        { delay: 12000, stage: 'cooking',    message: 'Dish is on the heat — smells amazing!', est: 6 },
        { delay: 22000, stage: 'plating',    message: `${chef} is carefully plating your dish`, est: 2 },
        { delay: 28000, stage: 'ready',      message: 'Your order is ready! 🎉', est: 0 },
      ];

      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];

      addEvent('pending', 'Order sent to kitchen...', 15);

      timeline.forEach(({ delay, stage, message, est, chef: c }) => {
        const timer = setTimeout(() => {
          addEvent(stage, message, est, c);
        }, delay);
        timersRef.current.push(timer);
      });
    }
  }, [orderId, supabaseOrderId, useRealtime, addEvent]);

  return {
    ...state,
    submitOrder,
    stageConfig: STAGE_CONFIG[state.currentStage],
  };
}
