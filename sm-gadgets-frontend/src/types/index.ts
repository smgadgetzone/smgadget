export interface Product {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  price: number;
  originalPrice?: number | string;
  description: string;
  category: 'chargers' | 'headphones' | 'smart-watches' | 'viral' | 'electronics-devices' | 'toys' | 'daily-wear' | string;
  categories?: string[];
  image: string;
  images?: string[];
  rating: number | string;
  reviews: number | string;
  inStock: boolean;
  featured?: boolean;
  discount?: number | string;
  size?: string;
  color?: string;
  desc?: string; // Backend field
  img?: string; // Backend field
  video?: string; // Base64 video string
  features?: string[]; // Array of feature bullets
  isTrending?: boolean; // Highlighted on homepage
  quantity?: number; // Stock quantity
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  token?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  orderDate: string;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}