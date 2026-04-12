// ============================================================
//  src/contexts/CartContext.tsx
//  Replace your entire existing CartContext with this.
// ============================================================

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './AuthContext';

interface CartItem {
  id: number;
  quantity: number;
  menu_items: {
    name: string;
    description: string;
    price: number;
    image_url?: string;
  };
  vendors: {
    name: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (menuItem: any, vendor: any) => Promise<void>;
  updateQuantity: (cartItemId: number, newQuantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart whenever the user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/cart');
      // Shape the response to match what Cart.tsx expects
      const shaped = data.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        menu_items: {
          name: item.name,
          description: item.description || '',
          price: parseFloat(item.price),
          image_url: item.image_url,
        },
        vendors: {
          name: item.vendor_name,
        },
      }));
      setCartItems(shaped);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (menuItem: any, vendor: any) => {
    try {
      await apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ meal_id: menuItem.id, quantity: 1 }),
      });
      await fetchCart(); // refresh cart after adding
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }
    // Update locally for instant UI response
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = async (cartItemId: number) => {
    try {
      await apiFetch(`/cart/${cartItemId}`, { method: 'DELETE' });
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const clearCart = async () => {
    try {
      await apiFetch('/cart', { method: 'DELETE' });
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, cartCount, addToCart, updateQuantity, removeFromCart, clearCart, loading }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
