// ============================================================
//  src/pages/OrderHistory.tsx
//  Create this as a NEW file in src/pages.
//  Shows the user's order history and lets them edit
//  a pending order (change meals, delivery type, address).
// ============================================================

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  status: string;
  delivery_type: string;
  delivery_address: string | null;
  payment_method: string;
  total_price: number;
  created_at: string;
  vendor_name: string;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef9c3', text: '#854d0e' },
  confirmed: { bg: '#dbeafe', text: '#1e40af' },
  preparing: { bg: '#fed7aa', text: '#9a3412' },
  ready:     { bg: '#dcfce7', text: '#166534' },
  delivered: { bg: '#f1f5f9', text: '#475569' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editDeliveryType, setEditDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [editAddress, setEditAddress] = useState('');
  const [editPayment, setEditPayment] = useState<'on_delivery' | 'on_pickup'>('on_delivery');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/orders');
      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        data.map(async (order: Order) => {
          const detail = await apiFetch(`/orders/${order.id}`);
          return { ...order, items: detail.items || [] };
        })
      );
      setOrders(ordersWithItems);
    } catch (err) {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    setEditDeliveryType(order.delivery_type as 'delivery' | 'pickup');
    setEditAddress(order.delivery_address || '');
    setEditPayment(order.payment_method as 'on_delivery' | 'on_pickup');
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    if (editDeliveryType === 'delivery' && !editAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/orders/${editingOrder.id}/edit`, {
        method: 'PUT',
        body: JSON.stringify({
          delivery_type: editDeliveryType,
          delivery_address: editDeliveryType === 'delivery' ? editAddress : null,
          payment_method: editPayment,
        }),
      });
      setSuccess('Order updated successfully!');
      setEditingOrder(null);
      await fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Cancel order #${order.id}?`)) return;
    try {
      await apiFetch(`/orders/${order.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      await fetchOrders();
    } catch {
      setError('Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
        Loading your orders...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ background: '#0f172a', padding: '14px 20px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>My Orders</h1>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      </div>

      <div style={{ padding: 16 }}>
        {success && (
          <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12, border: '1px solid #bbf7d0' }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', border: '0.5px solid #e2e8f0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No orders yet</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Your order history will appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => {
              const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              const canEdit = order.status === 'pending';

              return (
                <div
                  key={order.id}
                  style={{
                    background: 'white', borderRadius: 18, overflow: 'hidden',
                    border: '0.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                  }}
                >
                  {/* Order header */}
                  <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Order #{order.id}</span>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                        background: sc.bg, color: sc.text,
                      }}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Vendor + delivery info */}
                  <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>{order.vendor_name}</div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>TYPE</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                          {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏃 Pickup'}
                        </div>
                      </div>
                      {order.delivery_address && (
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>ADDRESS</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{order.delivery_address}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>PAYMENT</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                          {order.payment_method === 'on_delivery' ? 'On delivery' : 'On pickup'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #f1f5f9' }}>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#0f172a' }}>
                          {item.name} <span style={{ color: '#94a3b8' }}>× {item.quantity}</span>
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
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleEditClick(order)}
                          style={{
                            background: '#0f172a', color: 'white', border: 'none',
                            borderRadius: 10, padding: '9px 16px', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Edit Order
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order)}
                          style={{
                            background: '#fef2f2', color: '#dc2626',
                            border: '1.5px solid #fee2e2', borderRadius: 10,
                            padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Edit form — shown inline when editing */}
                  {editingOrder?.id === order.id && (
                    <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                        Edit Order #{order.id}
                      </div>

                      {/* Delivery type */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 8 }}>
                          DELIVERY TYPE
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['delivery', 'pickup'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => {
                                setEditDeliveryType(type);
                                setEditPayment(type === 'delivery' ? 'on_delivery' : 'on_pickup');
                              }}
                              style={{
                                flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
                                border: editDeliveryType === type ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                                background: editDeliveryType === type ? '#f0fdf4' : 'white',
                                color: editDeliveryType === type ? '#166534' : '#64748b',
                                fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                              }}
                            >
                              {type === 'delivery' ? '🚚 Delivery' : '🏃 Pickup'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Address */}
                      {editDeliveryType === 'delivery' && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 6 }}>
                            DELIVERY ADDRESS
                          </label>
                          <input
                            value={editAddress}
                            onChange={e => setEditAddress(e.target.value)}
                            placeholder="e.g. Dorm 3, Room 204"
                            style={{
                              width: '100%', padding: '11px 14px', borderRadius: 10,
                              border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a',
                              background: 'white', outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      )}

                      {/* Payment method */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 8 }}>
                          PAYMENT METHOD
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[
                            { value: 'on_delivery', label: '💵 On Delivery' },
                            { value: 'on_pickup',   label: '🤝 On Pickup' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setEditPayment(opt.value as 'on_delivery' | 'on_pickup')}
                              style={{
                                flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
                                border: editPayment === opt.value ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                                background: editPayment === opt.value ? '#f0fdf4' : 'white',
                                color: editPayment === opt.value ? '#166534' : '#64748b',
                                fontSize: 12, fontWeight: 700,
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {error && (
                        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                          {error}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          style={{
                            flex: 1, background: saving ? '#86efac' : '#16a34a', color: 'white',
                            border: 'none', borderRadius: 12, padding: '12px', fontSize: 13,
                            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => { setEditingOrder(null); setError(''); }}
                          style={{
                            flex: 1, background: 'white', color: '#64748b',
                            border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
