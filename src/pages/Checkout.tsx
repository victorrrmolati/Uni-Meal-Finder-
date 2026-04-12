import { useState } from 'react';
import { Check, Truck, ShoppingBag, CreditCard, Smartphone } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useCart } from '../contexts/CartContext';

export default function Checkout() {
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'on_delivery' | 'on_pickup'>('on_delivery');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const { clearCart, cartItems } = useCart();

  const total = cartItems.reduce((s, i) => s + (i.menu_items?.price || 0) * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (deliveryMethod === 'delivery' && !address.trim()) {
      setError('Please enter your delivery address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          delivery_type: deliveryMethod,
          delivery_address: deliveryMethod === 'delivery' ? address : null,
          payment_method: paymentMethod,
        }),
      });
      setOrderId(data.orderId);
      await clearCart();
      setConfirmed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ background: '#0f172a', padding: '14px 20px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Order Confirmed</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{
            width: 80, height: 80, background: '#dcfce7', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <Check size={40} color="#16a34a" strokeWidth={3} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>
            Your order is confirmed!
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6, textAlign: 'center' }}>
            Order #{orderId} has been placed successfully
          </p>
          <div style={{
            background: 'white', borderRadius: 16, padding: '16px 20px', width: '100%',
            border: '0.5px solid #e2e8f0', marginTop: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Order type</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{deliveryMethod}</span>
            </div>
            {deliveryMethod === 'delivery' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Deliver to</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{address}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Payment</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                {paymentMethod === 'on_delivery' ? 'Cash on delivery' : 'Pay on pickup'}
              </span>
            </div>
          </div>
          <div style={{
            background: '#0f172a', borderRadius: 14, padding: '12px 20px',
            width: '100%', marginTop: 12, textAlign: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Total paid</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>M{total.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }

  const MethodBtn = ({ active, onClick, icon, label, sub }: any) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '14px 10px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
        border: active ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
        background: active ? '#f0fdf4' : 'white',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#166534' : '#0f172a' }}>{label}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
      {active && (
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 18, height: 18, background: '#16a34a', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={10} color="white" strokeWidth={3} />
          </div>
        </div>
      )}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ background: '#0f172a', padding: '14px 20px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Checkout</h1>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{cartItems.length} item{cartItems.length > 1 ? 's' : ''} · M{total.toFixed(2)}</p>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Delivery method */}
        <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>How do you want it?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <MethodBtn
              active={deliveryMethod === 'delivery'}
              onClick={() => { setDeliveryMethod('delivery'); setPaymentMethod('on_delivery'); }}
              icon={<Truck size={22} color={deliveryMethod === 'delivery' ? '#16a34a' : '#94a3b8'} />}
              label="Delivery"
              sub="To your location"
            />
            <MethodBtn
              active={deliveryMethod === 'pickup'}
              onClick={() => { setDeliveryMethod('pickup'); setPaymentMethod('on_pickup'); }}
              icon={<ShoppingBag size={22} color={deliveryMethod === 'pickup' ? '#16a34a' : '#94a3b8'} />}
              label="Pickup"
              sub="Collect yourself"
            />
          </div>
        </div>

        {/* Address */}
        {deliveryMethod === 'delivery' && (
          <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', border: '0.5px solid #e2e8f0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Delivery Address</div>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Dorm 3, Room 204"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
                background: '#f8fafc', outline: 'none',
              }}
            />
          </div>
        )}

        {/* Payment method */}
        <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>How do you want to pay?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <MethodBtn
              active={paymentMethod === 'on_delivery'}
              onClick={() => setPaymentMethod('on_delivery')}
              icon={<CreditCard size={22} color={paymentMethod === 'on_delivery' ? '#16a34a' : '#94a3b8'} />}
              label="On Delivery"
              sub="Pay the driver"
            />
            <MethodBtn
              active={paymentMethod === 'on_pickup'}
              onClick={() => setPaymentMethod('on_pickup')}
              icon={<Smartphone size={22} color={paymentMethod === 'on_pickup' ? '#16a34a' : '#94a3b8'} />}
              label="On Pickup"
              sub="Pay at stall"
            />
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background: '#0f172a', borderRadius: 18, padding: '18px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 12 }}>Order Summary</div>
          {cartItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.menu_items?.name} x{item.quantity}</span>
              <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>
                M{((item.menu_items?.price || 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1e293b', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#4ade80' }}>M{total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 14px', borderRadius: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          style={{
            width: '100%', background: loading ? '#86efac' : '#16a34a', color: 'white',
            border: 'none', borderRadius: 14, padding: 16, fontSize: 15,
            fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Placing order...' : `Place Order — M${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
