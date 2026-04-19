import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product, CartItem, User, Order } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/api';

interface AppState {
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  user: User | null;
  orders: Order[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_WISHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'SET_WISHLIST'; payload: string[] }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string };

const initialState: AppState = {
  products: [],
  cart: [],
  wishlist: [],
  user: null,
  orders: [],
  isLoading: true,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, isLoading: false };

    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }]
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };

    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_CART':
      return { ...state, cart: action.payload };

    case 'ADD_TO_WISHLIST':
      if (state.wishlist.includes(action.payload)) return state;
      return {
        ...state,
        wishlist: [...state.wishlist, action.payload]
      };

    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: state.wishlist.filter(id => id !== action.payload)
      };

    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'ADD_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.payload]
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload]
      };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        )
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      };

    default:
      return state;
  }
};

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  fetchProducts: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch products from API
  const fetchProducts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(getApiUrl('/api/products'));
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      // Map MongoDB document structure to Frontend Product interface
      const mappedProducts = data.map((p: any) => ({
        id: p._id,
        name: p.title || p.name || 'Untitled Product',
        price: p.price || 0,
        description: p.desc || p.description || '',
        category: (p.categories && p.categories[0]) || p.category || 'daily-wear',
        image: p.img || p.image || 'https://via.placeholder.com/400',
        rating: Number(p.rating) || 4.5,
        reviews: Number(p.reviews) || 0,
        inStock: p.inStock !== undefined ? p.inStock : true,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        discount: p.discount ? Number(p.discount) : undefined,
        images: p.images || [],
        video: p.video || '',
        categories: p.categories || [],
        color: p.color || '',
        features: p.features || [],
        isTrending: p.isTrending || false,
        isCombo: p.isCombo || false,
        priority: Number(p.priority) || 0,
        quantity: p.quantity !== undefined ? Number(p.quantity) : 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      // Sort products: Priority (Highest first) -> CreatedAt (Newest first)
      const sortedProducts = mappedProducts.sort((a: any, b: any) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      dispatch({ type: 'SET_PRODUCTS', payload: sortedProducts });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load data from localStorage and fetch products
  useEffect(() => {
    fetchProducts();

    // Use SET_CART and SET_WISHLIST to avoid duplication bug
    const savedCart = localStorage.getItem('sm-gadgets-cart');
    const savedWishlist = localStorage.getItem('sm-gadgets-wishlist');
    const savedUser = localStorage.getItem('sm-gadgets-user');

    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        dispatch({ type: 'SET_CART', payload: cart });
      } catch (e) { /* ignore corrupt data */ }
    }

    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist);
        dispatch({ type: 'SET_WISHLIST', payload: wishlist });
      } catch (e) { /* ignore corrupt data */ }
    }

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (e) { /* ignore corrupt data */ }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('sm-gadgets-cart', JSON.stringify(state.cart));
  }, [state.cart]);

  useEffect(() => {
    localStorage.setItem('sm-gadgets-wishlist', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem('sm-gadgets-user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('sm-gadgets-user');
    }
  }, [state.user]);

  // Auto Logout on Inactivity
  useEffect(() => {
    if (!state.user) return;

    let lastActivity = Date.now();
    const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const checkInactivity = () => {
      if (Date.now() - lastActivity > TIMEOUT_MS) {
        dispatch({ type: 'SET_USER', payload: null });
        localStorage.removeItem('sm-gadgets-user');
        toast({
          title: 'Session Expired',
          description: 'You have been logged out due to inactivity.',
          variant: 'destructive',
        });
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    const interval = setInterval(checkInactivity, 60000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(interval);
    };
  }, [state.user]);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    toast({
      title: 'Removed from Cart',
      description: 'Item has been removed from your cart.',
    });
  };

  const addToWishlist = (productId: string) => {
    if (!state.wishlist.includes(productId)) {
      dispatch({ type: 'ADD_TO_WISHLIST', payload: productId });
      toast({
        title: 'Added to Wishlist',
        description: 'Item has been added to your wishlist.',
      });
    }
  };

  const removeFromWishlist = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId });
    toast({
      title: 'Removed from Wishlist',
      description: 'Item has been removed from your wishlist.',
    });
  };

  const getTotalPrice = () => {
    return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return state.cart.reduce((total, item) => total + item.quantity, 0);
  };

  const contextValue: AppContextType = {
    ...state,
    dispatch,
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    getTotalPrice,
    getTotalItems,
    fetchProducts,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};