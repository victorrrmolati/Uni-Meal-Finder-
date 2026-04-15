// ============================================================
//  src/App.tsx — Replace your existing App.tsx with this.
//  Adds Orders tab in navigation and OrderHistory page.
// ============================================================

import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MealPlans from './pages/MealPlans';
import VendorPortal from './pages/VendorPortal';
import OrderHistory from './pages/OrderHistory';
import Header from './components/Header';
import { Vendor } from './types';

type Page = 'vendors' | 'vendor-detail' | 'meal-plans' | 'cart' | 'checkout' | 'orders';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('vendors');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setCurrentPage('vendor-detail');
  };

  const handleBackToVendors = () => {
    setCurrentPage('vendors');
    setSelectedVendor(null);
  };

  const handleNavigate = (page: 'vendors' | 'meal-plans' | 'cart' | 'checkout' | 'orders') => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  // Vendor sees their portal
  if (user.role === 'vendor') return <VendorPortal />;

  // Students and staff see the ordering app
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage={currentPage === 'vendor-detail' ? 'vendors' : currentPage}
        onNavigate={handleNavigate}
      />

      {currentPage === 'vendors' && (
        <Vendors onSelectVendor={handleSelectVendor} />
      )}

      {currentPage === 'vendor-detail' && selectedVendor && (
        <VendorDetail vendor={selectedVendor} onBack={handleBackToVendors} />
      )}

      {currentPage === 'meal-plans' && <MealPlans />}

      {currentPage === 'orders' && <OrderHistory />}

      {currentPage === 'cart' && (
        <Cart
          onCheckout={() => setCurrentPage('checkout')}
          onContinueShopping={handleBackToVendors}
        />
      )}

      {currentPage === 'checkout' && (
        <Checkout onOrderPlaced={() => setCurrentPage('orders')} />
      )}

      <footer className="bg-slate-900 text-gray-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2026 Uni Meal Finder. Fresh meals delivered to your campus.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
