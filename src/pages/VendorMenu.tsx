// ============================================================
//  src/pages/VendorMenu.tsx
//  Create this as a NEW file in src/pages.
//  This is the menu management tab of the vendor portal.
//  (The old VendorPortal meal management code, now separated.)
// ============================================================

import { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
}

function getMealPhoto(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80';
  if (n.includes('fries') || n.includes('chips')) return 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&q=80';
  if (n.includes('kota')) return 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&q=80';
  if (n.includes('russian') || n.includes('sausage')) return 'https://images.unsplash.com/photo-1619881590738-a111d176d906?w=300&q=80';
  if (n.includes('makoenya') || n.includes('fatcake')) return 'https://images.unsplash.com/photo-1612487439139-c2d7bac13577?w=300&q=80';
  if (n.includes('scone') || n.includes('muffin') || n.includes('bun')) return 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=300&q=80';
  if (n.includes('bread')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80';
  if (n.includes('muesli') || n.includes('oat') || n.includes('corn')) return 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=300&q=80';
  if (n.includes('combo')) return 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80';
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80';
}

export default function VendorMenu() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchVendorData(); }, []);

  const fetchVendorData = async () => {
    try {
      const vendors = await apiFetch('/vendors/all');
      const mine = vendors.find((v: any) => v.user_id === user?.id);
      if (mine) {
        setVendorId(mine.id);
        setVendorName(mine.name);
        const mealData = await apiFetch(`/vendors/${mine.id}/meals`);
        setMeals(mealData);
      } else {
        setError('No vendor profile found for this account.');
      }
    } catch {
      setError('Failed to load your vendor data.');
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleAddMeal = async () => {
    if (!newName || !newPrice) { flash('Name and price are required', true); return; }
    setFormLoading(true);
    try {
      await apiFetch('/meals', {
        method: 'POST',
        body: JSON.stringify({ name: newName, description: newDesc, price: parseFloat(newPrice) }),
      });
      flash(`"${newName}" added to your menu`);
      setNewName(''); setNewDesc(''); setNewPrice(''); setShowForm(false);
      await fetchVendorData();
    } catch (err: any) {
      flash(err.message, true);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (meal: Meal) => {
    try {
      await apiFetch(`/meals/${meal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_available: !meal.is_available }),
      });
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, is_available: !m.is_available } : m));
    } catch { flash('Failed to update', true); }
  };

  const handleDelete = async (meal: Meal) => {
    if (!window.confirm(`Delete "${meal.name}"?`)) return;
    try {
      await apiFetch(`/meals/${meal.id}`, { method: 'DELETE' });
      setMeals(prev => prev.filter(m => m.id !== meal.id));
      flash(`"${meal.name}" deleted`);
    } catch { flash('Failed to delete', true); }
  };

  const available = meals.filter(m => m.is_available).length;

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading menu...</div>
    );
  }

  return (
    <div style={{ padding: 16, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total meals', value: meals.length, color: '#0f172a' },
          { label: 'Available', value: available, color: '#16a34a' },
          { label: 'Unavailable', value: meals.length - available, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12, padding: '12px',
            textAlign: 'center', border: '0.5px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {success && (
        <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12, border: '1px solid #bbf7d0' }}>{success}</div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}

      {/* Add meal button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: '100%', background: showForm ? '#f1f5f9' : '#16a34a',
          color: showForm ? '#64748b' : 'white', border: showForm ? '1.5px solid #e2e8f0' : 'none',
          borderRadius: 14, padding: '14px 16px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 14,
        }}
      >
        {showForm ? <ChevronDown size={18} /> : <Plus size={18} />}
        {showForm ? 'Cancel' : 'Add New Meal'}
      </button>

      {/* Add meal form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 18, padding: 18, border: '0.5px solid #e2e8f0', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>New Meal Details</div>
          {[
            { label: 'MEAL NAME *', value: newName, onChange: setNewName, placeholder: 'e.g. Chicken Burger' },
            { label: 'DESCRIPTION', value: newDesc, onChange: setNewDesc, placeholder: 'e.g. Crispy chicken fillet with chips' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
                  border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a',
                  background: '#f8fafc', outline: 'none',
                }}
              />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .6, display: 'block', marginBottom: 6 }}>PRICE (M) *</label>
            <input
              type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
              placeholder="e.g. 45" min="0" step="0.50"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
                border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a',
                background: '#f8fafc', outline: 'none',
              }}
            />
          </div>
          <button
            onClick={handleAddMeal} disabled={formLoading}
            style={{
              width: '100%', background: formLoading ? '#86efac' : '#16a34a', color: 'white',
              border: 'none', borderRadius: 12, padding: '13px', fontSize: 14,
              fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {formLoading ? 'Adding...' : 'Add to Menu'}
          </button>
        </div>
      )}

      {/* Meals list */}
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
        {vendorName} Menu
      </div>

      {meals.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center', border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🍽️</div>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No meals yet — add your first one above</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meals.map(meal => (
            <div
              key={meal.id}
              style={{
                background: 'white', borderRadius: 16, padding: 12,
                display: 'flex', gap: 12, alignItems: 'center',
                border: '0.5px solid #e2e8f0', opacity: meal.is_available ? 1 : .65,
                boxShadow: '0 1px 4px rgba(0,0,0,.04)',
              }}
            >
              <img
                src={getMealPhoto(meal.name)} alt={meal.name}
                style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{meal.name}</span>
                  <span style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 6, fontWeight: 700,
                    background: meal.is_available ? '#dcfce7' : '#fee2e2',
                    color: meal.is_available ? '#166534' : '#dc2626',
                  }}>
                    {meal.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{meal.description}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>M{Number(meal.price).toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <button onClick={() => handleToggle(meal)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {meal.is_available
                    ? <ToggleRight size={28} color="#16a34a" />
                    : <ToggleLeft size={28} color="#cbd5e1" />}
                </button>
                <button
                  onClick={() => handleDelete(meal)}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: '1.5px solid #fee2e2',
                    background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Trash2 size={13} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
