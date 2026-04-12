import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Vendor } from '../types';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

interface VendorDetailProps {
  vendor: Vendor;
  onBack: () => void;
}

interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

// Meal photo map — matches by meal name keywords
function getMealPhoto(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80';
  if (n.includes('fries') || n.includes('chips')) return 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80';
  if (n.includes('kota')) return 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80';
  if (n.includes('russian') || n.includes('sausage') || n.includes('vienna')) return 'https://images.unsplash.com/photo-1619881590738-a111d176d906?w=400&q=80';
  if (n.includes('makoenya') || n.includes('fatcake')) return 'https://images.unsplash.com/photo-1612487439139-c2d7bac13577?w=400&q=80';
  if (n.includes('scone') || n.includes('muffin') || n.includes('bun')) return 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=400&q=80';
  if (n.includes('bread')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80';
 if (n.includes('muesli') || n.includes('oat') || n.includes('corn')) return 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400&q=80';
  if (n.includes('combo') || n.includes('meal')) return 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80';
  if (n.includes('rice')) return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80';
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80';
}

const vendorBanners: Record<string, string> = {
  'The Nile': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&q=80',
  'Bohlale Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80',
  'OB Joint': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80',
};
const fallbackBanner = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80';

export default function VendorDetail({ vendor, onBack }: VendorDetailProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const { addToCart, cartItems } = useCart();
  const { showToast } = useToast();

  useEffect(() => { fetchMeals(); }, [vendor.id]);

  const fetchMeals = async () => {
    try {
      const data = await apiFetch(`/vendors/${vendor.id}/meals`);
      setMeals(data);
    } catch (err) {
      console.error('Error fetching meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (meal: Meal) => {
    await addToCart(meal, vendor);
    showToast(`Added ${meal.name} to cart`, `From ${vendor.name}`);
  };

  // Build category filters from meal names
  const getCategory = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('burger')) return 'Burgers';
    if (n.includes('fries') || n.includes('chips')) return 'Fries';
    if (n.includes('kota')) return 'Kota';
    if (n.includes('bread') || n.includes('scone') || n.includes('bun') || n.includes('muffin')) return 'Baked';
    if (n.includes('combo') || n.includes('meal')) return 'Combos';
    return 'Other';
  };

  const categories = ['All', ...Array.from(new Set(meals.map(m => getCategory(m.name))))];
  const filtered = activeFilter === 'All' ? meals : meals.filter(m => getCategory(m.name) === activeFilter);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + (i.menu_items?.price || 0) * i.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Vendor hero */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img
          src={vendorBanners[vendor.name] || fallbackBanner}
          alt={vendor.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.5)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(15,23,42,.9) 100%)' }} />
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.2)', borderRadius: 10,
            color: 'white', padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 18px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 3 }}>{vendor.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{vendor.description}</div>
          <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>📍 {vendor.location}</div>
        </div>
      </div>

      {/* Category filters */}
      <div style={{ background: 'white', borderBottom: '0.5px solid #e2e8f0', padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            style={{
              flexShrink: 0, padding: '7px 16px', borderRadius: 20, border: 'none',
              background: activeFilter === cat ? '#0f172a' : '#f1f5f9',
              color: activeFilter === cat ? 'white' : '#64748b',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Meals grid */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading menu...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map(meal => (
              <div
                key={meal.id}
                style={{
                  background: 'white', borderRadius: 16, overflow: 'hidden',
                  border: '0.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,.05)',
                  opacity: meal.is_available ? 1 : .6,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={meal.image_url || getMealPhoto(meal.name)}
                    alt={meal.name}
                    style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                  />
                  {!meal.is_available && (
                    <div style={{
                      position: 'absolute', top: 8, left: 8,
                      background: '#ef4444', color: 'white',
                      fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                    }}>
                      SOLD OUT
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{meal.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4 }}>{meal.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>M{Number(meal.price).toFixed(2)}</span>
                    <button
                      onClick={() => handleAdd(meal)}
                      disabled={!meal.is_available}
                      style={{
                        width: 30, height: 30, background: meal.is_available ? '#16a34a' : '#e2e8f0',
                        color: 'white', border: 'none', borderRadius: 9,
                        fontSize: 20, fontWeight: 700, cursor: meal.is_available ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'sticky', bottom: 16, margin: '0 16px',
          background: '#0f172a', borderRadius: 16, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0,0,0,.25)',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{cartCount} item{cartCount > 1 ? 's' : ''} in cart</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>M{cartTotal.toFixed(2)}</div>
          </div>
          <button
            onClick={onBack}
            style={{
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            View Cart →
          </button>
        </div>
      )}
    </div>
  );
}
