import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CartProps {
  onCheckout: () => void;
  onContinueShopping: () => void;
}

function getMealPhoto(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80';
  if (n.includes('fries') || n.includes('chips')) return 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=200&q=80';
  if (n.includes('kota')) return 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=200&q=80';
  if (n.includes('russian') || n.includes('sausage')) return 'https://images.unsplash.com/photo-1619881590738-a111d176d906?w=200&q=80';
  if (n.includes('makoenya') || n.includes('fatcake')) return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80';
  if (n.includes('scone') || n.includes('muffin') || n.includes('bun')) return 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=200&q=80';
  if (n.includes('bread')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80';
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80';
}

export default function Cart({ onCheckout, onContinueShopping }: CartProps) {
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const subtotal = cartItems.reduce((s, i) => s + (i.menu_items?.price || 0) * i.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ background: '#0f172a', padding: '14px 20px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Your Cart</h1>
        </div>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Your cart is empty</div>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Add some meals to get started</p>
          <button
            onClick={onContinueShopping}
            style={{
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Browse Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onContinueShopping} style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'white', flex: 1 }}>Your Cart</h1>
        <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
      </div>

      <div style={{ padding: 16 }}>
        {/* Cart items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {cartItems.map(item => (
            <div
              key={item.id}
              style={{
                background: 'white', borderRadius: 16, padding: 12,
                display: 'flex', gap: 12, alignItems: 'center',
                border: '0.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
              }}
            >
              <img
                src={getMealPhoto(item.menu_items?.name || '')}
                alt={item.menu_items?.name}
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>
                  {item.vendors?.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  {item.menu_items?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>
                    M{((item.menu_items?.price || 0) * item.quantity).toFixed(2)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: 26, height: 26, borderRadius: 8, border: '1.5px solid #e2e8f0',
                        background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Minus size={12} color="#64748b" />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 16, textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: 26, height: 26, borderRadius: 8, border: 'none',
                        background: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Plus size={12} color="white" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        width: 26, height: 26, borderRadius: 8, border: '1.5px solid #fee2e2',
                        background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4,
                      }}
                    >
                      <Trash2 size={12} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{
          background: '#0f172a', borderRadius: 20, padding: 20, marginBottom: 14,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 14 }}>Order Summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Subtotal</span>
            <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>M{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Delivery</span>
            <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>Free</span>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>M{subtotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          style={{
            width: '100%', background: '#16a34a', color: 'white', border: 'none',
            borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          Proceed to Checkout →
        </button>
        <button
          onClick={onContinueShopping}
          style={{
            width: '100%', background: 'transparent', color: '#64748b', border: 'none',
            borderRadius: 14, padding: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
