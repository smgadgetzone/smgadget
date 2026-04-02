import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/context/AppContext';

const Cart = () => {
  const { cart, dispatch, getTotalPrice, getTotalItems } = useApp();

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity: newQuantity } });
    }
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-playfair font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button size="lg" asChild>
            <Link to="/shop">
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = 59; // Flat shipping rate globally
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            You have {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Cart Items</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear Cart
              </Button>
            </div>

            {cart.map((item) => (
              <Card key={item.id} className="glass border-white/20">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="sm:w-32 sm:h-32 w-full h-48">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 space-y-2">
                      <Link
                        to={`/product/${item.id}`}
                        className="text-lg font-playfair font-semibold hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-muted-foreground text-sm capitalize">
                        Category: {item.category.replace('-', ' ')}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-primary">
                          ₹{item.price.toLocaleString()}
                        </span>
                        {item.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{item.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="glass border-white/20 sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      Shipping
                    </span>
                    <span>₹{shipping}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>GST (5%)</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{total.toLocaleString()}</span>
                  </div>

                  <Separator />

                  <div className="space-y-3 pt-4">
                    <Button className="w-full" size="lg" asChild>
                      <Link to="/checkout">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/shop">Continue Shopping</Link>
                    </Button>
                  </div>

                  {/* Security Badge */}
                  <div className="text-center pt-4">
                    <p className="text-xs text-muted-foreground">
                      🔒 Secure checkout with 256-bit SSL encryption
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;