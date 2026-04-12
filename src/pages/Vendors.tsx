import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Vendor } from '../types';

interface VendorsProps {
  onSelectVendor: (vendor: Vendor) => void;
}

// Static cover images per vendor name — fallback to generic food photo
const vendorImages: Record<string, string> = {
  'The Nile': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Bohlale Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  'OB Joint': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
};
const fallbackImg = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';

export default function Vendors({ onSelectVendor }: VendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, signOut } = useAuth();

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const data = await apiFetch('/vendors');
      setVendors(data);
    } catch {
      setError('Could not load vendors. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: .8, marginBottom: 1 }}>UNI MEAL FINDER</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: -.3 }}>
            Hey {user?.name?.split(' ')[0]} 👋
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: '#1e293b', border: '1.5px solid #334155',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
            onClick={signOut}
            title="Sign out"
          >
            {initials(user?.name || 'U')}
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div style={{ background: '#0f172a', padding: '0 20px 24px' }}>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>What are you eating today?</p>
        <div style={{
          background: '#1e293b', borderRadius: 16, padding: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 4 }}>TODAY'S PICK</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Fresh & Hot</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Order from campus vendors</div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&q=80"
            alt="food"
            style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Vendors */}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Campus Vendors</h2>
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{vendors.length} open</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading vendors...</div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {vendors.map(vendor => (
            <button
              key={vendor.id}
              onClick={() => onSelectVendor(vendor)}
              style={{
                background: 'white', borderRadius: 20, overflow: 'hidden',
                border: '0.5px solid #e2e8f0', cursor: 'pointer', textAlign: 'left',
                padding: 0, width: '100%',
                boxShadow: '0 2px 12px rgba(0,0,0,.06)',
              }}
            >
              <img
                src={vendorImages[vendor.name] || fallbackImg}
                alt={vendor.name}
                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{vendor.name}</span>
                  <span style={{
                    fontSize: 10, background: '#dcfce7', color: '#166534',
                    padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                  }}>Open</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{vendor.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>📍 {vendor.location}</span>
                  <span style={{
                    background: '#0f172a', color: 'white', borderRadius: 10,
                    padding: '7px 14px', fontSize: 12, fontWeight: 700,
                  }}>
                    Order →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
