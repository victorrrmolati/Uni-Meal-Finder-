import { Home, Calendar, ShoppingCart, Utensils, LogOut } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentPage: 'vendors' | 'meal-plans' | 'cart' | 'checkout';
  onNavigate: (page: 'vendors' | 'meal-plans' | 'cart' | 'checkout') => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { cartCount } = useCart();
  const { signOut } = useAuth();

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6 text-yellow-500" strokeWidth={2.5} />
            <h1 className="text-xl font-bold">Uni Meal Finder</h1>
          </div>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('vendors')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentPage === 'vendors'
                  ? 'text-yellow-500'
                  : 'text-white hover:text-yellow-500'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>

            <button
              onClick={() => onNavigate('meal-plans')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentPage === 'meal-plans'
                  ? 'text-yellow-500'
                  : 'text-white hover:text-yellow-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Meal Plans</span>
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors relative ${
                currentPage === 'cart' || currentPage === 'checkout'
                  ? 'text-yellow-500'
                  : 'text-white hover:text-yellow-500'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
