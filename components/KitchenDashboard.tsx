import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { pushKitchenEvent } from '../lib/supabaseOrders';
import { OrderStage, STAGE_CONFIG } from '../lib/useOrderSync';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string;
  display_id: string;
  table_id: string | null;
  station_id: string | null;
  status: string;
  subtotal: number | null;
  total: number | null;
  guest_count: number;
  chef_name: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  topping_ids: string[];
  menu_item_name?: string;
}

interface OrderEventRow {
  id: string;
  stage: string;
  message: string;
  chef_name: string | null;
  estimated_minutes: number | null;
  created_at: string;
}

interface FullOrder extends OrderRow {
  items: OrderItemRow[];
  events: OrderEventRow[];
}

// ─── Stage Flow ─────────────────────────────────────────────────────────────

const STAGE_FLOW: OrderStage[] = ['pending', 'confirmed', 'preparing', 'cooking', 'plating', 'ready', 'served'];

const STAGE_MESSAGES: Record<OrderStage, string> = {
  pending: 'Order sent to kitchen...',
  confirmed: 'Order accepted by kitchen',
  preparing: 'Gathering ingredients',
  cooking: 'Dish is on the heat — smells amazing!',
  plating: 'Carefully plating the dish',
  ready: 'Order is ready! 🎉',
  served: 'Enjoy your meal!',
};

const STAGE_EST: Record<OrderStage, number> = {
  pending: 15,
  confirmed: 12,
  preparing: 10,
  cooking: 6,
  plating: 2,
  ready: 0,
  served: 0,
};

// ─── Chef Name Input ────────────────────────────────────────────────────────

const SAVED_CHEF_KEY = 'luxetable_chef_name';

function getSavedChef(): string {
  try { return localStorage.getItem(SAVED_CHEF_KEY) || ''; } catch { return ''; }
}
function saveChef(name: string) {
  try { localStorage.setItem(SAVED_CHEF_KEY, name); } catch { /* noop */ }
}

// ─── Component ──────────────────────────────────────────────────────────────

const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [menuNames, setMenuNames] = useState<Record<string, string>>({});
  const [chefName, setChefName] = useState(getSavedChef());
  const [isSetup, setIsSetup] = useState(!!getSavedChef());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ─── Fetch menu item names for display ──────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('menu_items')
      .select('id, name')
      .then(({ data }: any) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((r: any) => { map[r.id] = r.name; });
          setMenuNames(map);
        }
      });
  }, []);

  // ─── Fetch orders ───────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!supabase) return;

    try {
      // Fetch orders
      const { data: orderRows, error: ordersErr } = await (supabase as any)
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersErr) throw ordersErr;
      if (!orderRows || orderRows.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const orderIds = orderRows.map((o: any) => o.id);

      // Fetch items and events for all orders in parallel
      const [itemsRes, eventsRes] = await Promise.all([
        (supabase as any)
          .from('order_items')
          .select('*')
          .in('order_id', orderIds),
        (supabase as any)
          .from('order_events')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: true }),
      ]);

      const items: any[] = itemsRes.data || [];
      const events: any[] = eventsRes.data || [];

      // Group by order
      const fullOrders: FullOrder[] = orderRows.map((order: any) => ({
        ...order,
        items: items.filter((i: any) => i.order_id === order.id),
        events: events.filter((e: any) => e.order_id === order.id),
      }));

      setOrders(fullOrders);
    } catch (err) {
      console.error('[Kitchen] Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, lastRefresh]);

  // ─── Realtime subscription for new orders & events ──────────────────
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('kitchen-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' } as any, () => {
        fetchOrders();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events' } as any, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // ─── Advance order to next stage ────────────────────────────────────
  const advanceOrder = useCallback(async (order: FullOrder) => {
    const currentIdx = STAGE_FLOW.indexOf(order.status as OrderStage);
    if (currentIdx === -1 || currentIdx >= STAGE_FLOW.length - 1) return;

    const nextStage = STAGE_FLOW[currentIdx + 1];
    setUpdating(order.id);

    const success = await pushKitchenEvent({
      orderId: order.id,
      stage: nextStage,
      message: `${chefName || 'Kitchen'}: ${STAGE_MESSAGES[nextStage]}`,
      chefName: chefName || undefined,
      estimatedMinutes: STAGE_EST[nextStage],
    });

    if (success) {
      setLastRefresh(Date.now());
    }

    setUpdating(null);
  }, [chefName]);

  // ─── Filter orders ──────────────────────────────────────────────────
  const filteredOrders = filter === 'active'
    ? orders.filter(o => !['served', 'cancelled'].includes(o.status))
    : orders;

  const ordersByStatus = STAGE_FLOW.reduce((acc, stage) => {
    acc[stage] = filteredOrders.filter(o => o.status === stage);
    return acc;
  }, {} as Record<string, FullOrder[]>);

  // ─── Chef Setup Screen ─────────────────────────────────────────────
  if (!isSetup) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-icons-round text-primary text-3xl">restaurant</span>
            </div>
            <h1 className="text-2xl font-black text-white">Kitchen Dashboard</h1>
            <p className="text-slate-400 text-sm mt-2">Enter your name to get started</p>
          </div>

          <input
            type="text"
            value={chefName}
            onChange={(e) => setChefName(e.target.value)}
            placeholder="e.g. Chef Marco"
            className="w-full bg-slate-800 text-white px-5 py-4 rounded-2xl border border-slate-700 focus:border-primary focus:outline-none text-center font-bold text-lg mb-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && chefName.trim()) {
                saveChef(chefName.trim());
                setIsSetup(true);
              }
            }}
          />

          <button
            onClick={() => {
              if (chefName.trim()) {
                saveChef(chefName.trim());
                setIsSetup(true);
              }
            }}
            disabled={!chefName.trim()}
            className="w-full bg-primary text-navy font-black text-lg py-4 rounded-2xl shadow-xl shadow-primary/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            Enter Kitchen
          </button>
        </div>
      </div>
    );
  }

  // ─── Not configured ─────────────────────────────────────────────────
  if (!isSupabaseEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <span className="material-icons-round text-red-500 text-5xl mb-4">error</span>
          <h1 className="text-xl font-bold text-white">Supabase Not Configured</h1>
          <p className="text-slate-400 mt-2">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local</p>
        </div>
      </div>
    );
  }

  // ─── Main Dashboard ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <span className="material-icons-round text-primary text-xl">restaurant</span>
            </div>
            <div>
              <h1 className="text-lg font-black">Kitchen Dashboard</h1>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-primary font-bold">{chefName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter toggle */}
            <div className="flex bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  filter === 'active' ? 'bg-primary text-navy' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  filter === 'all' ? 'bg-primary text-navy' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => { setLoading(true); setLastRefresh(Date.now()); }}
              className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <span className={`material-icons-round text-slate-400 ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>

            {/* Order count */}
            <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-black text-primary">{filteredOrders.length}</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Orders</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stage Columns */}
      <div className="max-w-7xl mx-auto p-6">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="material-icons-round text-slate-700 text-6xl mb-4">inbox</span>
              <h2 className="text-xl font-bold text-slate-500">No orders yet</h2>
              <p className="text-slate-600 mt-2 text-sm">Orders will appear here when diners place them</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {STAGE_FLOW.filter(s => s !== 'served' || filter === 'all').map(stage => {
              const stageOrders = ordersByStatus[stage] || [];
              const config = STAGE_CONFIG[stage as OrderStage];
              if (stageOrders.length === 0 && filter === 'active') return null;

              return (
                <div key={stage} className="flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${config.color}30` }}
                    >
                      <span className="material-icons-round text-sm" style={{ color: config.color }}>
                        {config.icon}
                      </span>
                    </div>
                    <span className="text-sm font-black uppercase tracking-wider" style={{ color: config.color }}>
                      {config.label}
                    </span>
                    <span className="ml-auto bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {stageOrders.length}
                    </span>
                  </div>

                  {/* Order cards */}
                  <div className="space-y-3">
                    {stageOrders.map(order => {
                      const currentIdx = STAGE_FLOW.indexOf(order.status as OrderStage);
                      const nextStage = currentIdx < STAGE_FLOW.length - 1 ? STAGE_FLOW[currentIdx + 1] : null;
                      const nextConfig = nextStage ? STAGE_CONFIG[nextStage] : null;
                      const isUpdating = updating === order.id;
                      const orderTime = new Date(order.created_at);
                      const minutesAgo = Math.floor((Date.now() - orderTime.getTime()) / 60000);

                      return (
                        <div
                          key={order.id}
                          className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors"
                        >
                          {/* Order header */}
                          <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
                            <div>
                              <span className="text-sm font-black text-white">{order.display_id}</span>
                              {order.table_id && (
                                <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                                  {order.table_id}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 font-medium">
                                {minutesAgo === 0 ? 'Just now' : `${minutesAgo}m ago`}
                              </p>
                              {order.total && (
                                <p className="text-xs font-bold text-primary">
                                  £{Number(order.total).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Items */}
                          <div className="px-4 py-3">
                            {order.items.length > 0 ? (
                              <div className="space-y-1.5">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-primary w-5 text-center">
                                        {item.quantity}×
                                      </span>
                                      <span className="text-sm text-white font-medium">
                                        {menuNames[item.menu_item_id] || item.menu_item_id}
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      £{(item.unit_price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                                {order.items.some(i => i.topping_ids && i.topping_ids.length > 0) && (
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    + custom toppings
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-600 italic">No items loaded</p>
                            )}
                          </div>

                          {/* Latest event */}
                          {order.events.length > 0 && (
                            <div className="px-4 pb-2">
                              <p className="text-[10px] text-slate-500 truncate">
                                💬 {order.events[order.events.length - 1].message}
                              </p>
                            </div>
                          )}

                          {/* Action button */}
                          {nextStage && nextConfig && (
                            <div className="px-4 pb-4 pt-1">
                              <button
                                onClick={() => advanceOrder(order)}
                                disabled={isUpdating}
                                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
                                style={{
                                  background: `${nextConfig.color}20`,
                                  color: nextConfig.color,
                                  border: `1px solid ${nextConfig.color}40`,
                                }}
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span className="material-icons-round text-base">{nextConfig.icon}</span>
                                    Move to {nextConfig.label}
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Realtime indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 shadow-xl">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Realtime Connected</span>
      </div>
    </div>
  );
};

export default KitchenDashboard;
