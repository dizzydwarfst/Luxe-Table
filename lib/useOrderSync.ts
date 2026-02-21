import { useState, useEffect, useRef, useCallback } from 'react';
import { playNotification, playSuccess } from './sounds';

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

// ─── Simulated WebSocket Mode ───────────────────────────────────────────────
// When no real WS endpoint is available, this simulates kitchen updates
// with realistic timing. Replace `SIMULATED_WS` with your real endpoint.

const SIMULATED_WS = true;
const WS_ENDPOINT  = 'wss://your-kitchen-api.example.com/orders';

const CHEF_NAMES = ['Chef Marco', 'Chef Yuki', 'Chef Priya', 'Chef Alex', 'Chef Luna'];

function randomChef(): string {
  return CHEF_NAMES[Math.floor(Math.random() * CHEF_NAMES.length)];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useOrderSync(orderId: string | null): OrderSyncState & {
  /** Manually push the order to the kitchen (triggers the simulation or WS message) */
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

  const wsRef      = useRef<WebSocket | null>(null);
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      wsRef.current?.close();
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

    if (SIMULATED_WS) {
      // Simulated kitchen timeline
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
    } else {
      // Real WebSocket connection
      try {
        const ws = new WebSocket(`${WS_ENDPOINT}/${orderId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setState(prev => ({ ...prev, connected: true }));
          ws.send(JSON.stringify({ type: 'submit_order', orderId }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as KitchenEvent;
            addEvent(data.stage, data.message, data.estimatedMinutes, data.chefName);
          } catch (e) {
            console.warn('Invalid kitchen event:', e);
          }
        };

        ws.onerror = () => {
          setState(prev => ({ ...prev, connected: false }));
        };

        ws.onclose = () => {
          setState(prev => ({ ...prev, connected: false }));
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setState(prev => ({ ...prev, connected: false }));
      }
    }
  }, [orderId, addEvent]);

  return {
    ...state,
    submitOrder,
    stageConfig: STAGE_CONFIG[state.currentStage],
  };
}
