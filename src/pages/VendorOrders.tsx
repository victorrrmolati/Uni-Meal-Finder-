// ============================================================
//  src/pages/VendorOrders.tsx
//  Create this as a NEW file in your src/pages folder.
//  Shows incoming orders for the vendor with auto-refresh.
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery_type: 'delivery' | 'pickup';
  delivery_address: string | null;
  payment_method: 'on_delivery' | 'on_pickup';
  total_price: number;
  created_at: string;
  customer_name: string;
  items: OrderItem[];
}

const STATUS_FLOW: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'New Order',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready:     'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  preparing: { bg: '#fed7aa', text: '#9a3412', border: '#fb923c' },
  ready:     { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  delivered: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const NEXT_ACTION: Record<string, string> = {
  pending:   'Confirm Order',
  confirmed: 'Start Preparing',
  preparing: 'Mark Ready',
  ready:     'Mark Delivered',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function VendorOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState('');

  const fetchVendorId = useCallback(async () => {
    try {
      const vendors = await apiFetch('/vendors/all');
      const mine = vendors.find((v: any) => v.user_id === user?.id);
      if (mine) setVendorId(mine.id);
    } catch {
      setError('Could not find your vendor profile.');
    }
  }, [user?.id]);

  const fetchOrders = useCallback(async () => {
    if (!vendorId) return;
    try {
      const data = await apiFetch(`/vendors/${vendorId}/orders`);
      setOrders(data);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  // Load vendor ID once on mount
  useEffect(() => { fetchVendorId(); }, [fetchVendorId]);

  // Fetch orders when vendorId is ready
  useEffect(() => {
    if (vendorId) fetchOrders();
  }, [vendorId, fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!vendorId) return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [vendorId, fetchOrders]);

  const handleUpdateStatus = async (order: Order) => {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;
    setUpdatingId(order.id);
    try {
      await apiFetch(`/orders/${order.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      setOrders(prev =>
        prev.map(o => o.id === order.id ? { ...o, status: nextStatus as Order['status'] } : o)
      );
    } catch {
      setError('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (order: Order) => {
    if (!window.confirm(`Cancel order #${order.id}?`)) return;
    setUpdatingId(order.id);
    try {
      await apiFetch(`/orders/${order.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      setOrders(prev =>
        prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o)
      );
    } catch {
      setError('Failed to cancel order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(o => {
    if (activeFilter === 'active') return ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status);
    if (activeFilter === 'done') return ['delivered', 'cancelled'].includes(o.status);
    return true;
  });

  const activeCount = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length;
  const newCount    = orders.filter(o => o.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#0f172a', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: .8, marginBottom: 3 }}>INCOMING ORDERS</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Order Management</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s
            </div>
          </div>
          <button
            onClick={fetchOrders}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              color: '#94a3b8', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'New', value: newCount, color: '#fde047' },
            { label: 'Active', value: activeCount, color: '#4ade80' },
            { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#94a3b8' },
            { label: 'Total', value: orders.length, color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1e293b', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ background: 'white', borderBottom: '0.5px solid #e2e8f0', padding: '12px 20px', display: 'flex', gap: 8 }}>
        {[
          { key: 'active', label: `Active (${activeCount})` },
          { key: 'done',   label: 'Completed' },
          { key: 'all',    label: 'All Orders' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeFilter === f.key ? '#0f172a' : '#f1f5f9',
              color: activeFilter === f.key ? 'white' : '#64748b',
              fontSize: 12, fontWeight: 700,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: '12px 16px 0', background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Orders list */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', border: '0.5px solid #e2e8f0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              {activeFilter === 'active' ? 'No active orders' : 'No orders yet'}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {activeFilter === 'active' ? 'New orders will appear here automatically' : 'Orders will show once customers start ordering'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(order => {
              const sc = STATUS_COLORS[order.status];
              const nextAction = NEXT_ACTION[order.status];
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  style={{
                    background: 'white', borderRadius: 18, overflow: 'hidden',
                    border: `0.5px solid ${sc.border}`,
                    boxShadow: order.status === 'pending' ? `0 0 0 2px ${sc.border}` : '0 1px 4px rgba(0,0,0,.05)',
                  }}
                >
                  {/* Order header */}
                  <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Order #{order.id}</span>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                      }}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.status === 'pending' && (
                        <span style={{ fontSize: 10, background: '#fef9c3', color: '#854d0e', padding: '3px 8px', borderRadius: 20, fontWeight: 700, border: '1px solid #fde047' }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(order.created_at)}</span>
                  </div>

                  {/* Customer + delivery info */}
                  <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #f1f5f9', display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>CUSTOMER</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{order.customer_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>TYPE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                        {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏃 Pickup'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>PAYMENT</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {order.payment_method === 'on_delivery' ? 'On delivery' : 'On pickup'}
                      </div>
                    </div>
                  </div>

                  {/* Delivery address if applicable */}
                  {order.delivery_type === 'delivery' && order.delivery_address && (
                    <div style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '0.5px solid #f1f5f9' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>DELIVER TO: </span>
                      <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600 }}>{order.delivery_address}</span>
                    </div>
                  )}

                  {/* Meal items */}
                  <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>ORDER ITEMS</div>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#0f172a' }}>
                          {item.name}
                          <span style={{ color: '#94a3b8', fontSize: 12 }}> × {item.quantity}</span>
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                          M{(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total + actions */}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Total</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>M{Number(order.total_price).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {nextAction && (
                        <button
                          onClick={() => handleUpdateStatus(order)}
                          disabled={isUpdating}
                          style={{
                            background: isUpdating ? '#86efac' : '#16a34a',
                            color: 'white', border: 'none', borderRadius: 10,
                            padding: '10px 16px', fontSize: 12, fontWeight: 700,
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isUpdating ? '...' : nextAction}
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <button
                          onClick={() => handleCancel(order)}
                          disabled={isUpdating}
                          style={{
                            background: '#fef2f2', color: '#dc2626',
                            border: '1.5px solid #fee2e2', borderRadius: 10,
                            padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
