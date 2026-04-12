// ============================================================
//  src/types/index.ts  (or wherever your types file is)
//  Replace your existing types with these — they now match
//  the columns returned by your MySQL backend.
// ============================================================

export interface Vendor {
  id: number;
  name: string;
  description: string;
  location: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface Meal {
  id: number;
  vendor_id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

export interface CartItem {
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

export interface Order {
  id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  payment_method: 'on_delivery' | 'on_pickup';
  total_price: number;
  created_at: string;
  vendor_name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'vendor';
}
