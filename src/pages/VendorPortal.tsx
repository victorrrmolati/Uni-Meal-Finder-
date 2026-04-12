// ============================================================
//  src/pages/VendorPortal.tsx
//  Replace your existing VendorPortal.tsx with this.
//  Adds a tab bar — vendors switch between Menu and Orders.
// ============================================================

import { useState } from 'react';
import { LogOut, UtensilsCrossed, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import VendorMenu from './VendorMenu';
import VendorOrders from './VendorOrders';

export default function VendorPortal() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('orders');

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Top identity bar */}
      <div style={{ background: '#0f172a', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: '#16a34a', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: 'white',
          }}>
            {initials(user?.name || 'V')}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>Vendor Portal</div>
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, padding: '7px 12px', color: '#94a3b8',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        background: '#0f172a', padding: '0 20px 0',
        display: 'flex', gap: 4, borderBottom: '2px solid #1e293b',
      }}>
        {[
          { key: 'orders', label: 'Orders', Icon: ClipboardList },
          { key: 'menu',   label: 'My Menu', Icon: UtensilsCrossed },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'menu' | 'orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '12px 18px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: activeTab === key ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 700,
              borderBottom: activeTab === key ? '2px solid #16a34a' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'orders' ? <VendorOrders /> : <VendorMenu />}
    </div>
  );
}
