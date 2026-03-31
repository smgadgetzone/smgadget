import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, Shield, ArrowLeft, CheckCircle, PartyPopper, Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, dispatch, getTotalPrice, getTotalItems, user } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discountType: string, discountValue: number} | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'upi'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const subtotal = getTotalPrice();
  const shipping = 99; // Flat shipping rate

  // Current selected payment method check
  const isCod = formData.paymentMethod === 'cod';

  let discount = 0;
  if (appliedCoupon && !isCod) {
    if (appliedCoupon.discountType === 'percent') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discount = appliedCoupon.discountValue;
    }
  }

  discount = Math.min(discount, subtotal); // Prevent negative total
  const discountedSubtotal = subtotal - discount;
  const tax = Math.round(discountedSubtotal * 0.05); // 5% GST
  const total = discountedSubtotal + shipping + tax;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (isCod) {
      toast({ title: 'Not Applicable', description: 'Coupons are only valid for Online (UPI) payments.', variant: 'destructive' });
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Invalid Coupon', description: err.message || 'Coupon not found.', variant: 'destructive' });
        setAppliedCoupon(null);
        return;
      }

      const data = await res.json();
      setAppliedCoupon(data);
      toast({ title: 'Coupon Applied!', description: `Discount applied successfully.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Verification failed.', variant: 'destructive' });
    } finally {
      setCouponLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const submitOrder = async (paymentDetails?: any) => {
    try {
      const orderData = {
        userId: user ? user.id : 'guest',
        products: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity
        })),
        couponCode: (appliedCoupon && formData.paymentMethod !== 'cod') ? appliedCoupon.code : undefined,
        amount: total,
        paymentMethod: formData.paymentMethod,
        paymentDetails: paymentDetails,
        address: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        }
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Order placement failed');
      }

      const savedOrder = await response.json();

      dispatch({ type: 'ADD_ORDER', payload: { ...savedOrder, id: savedOrder._id } });
      dispatch({ type: 'CLEAR_CART' });

      toast({
        title: 'Order Placed Successfully!',
        description: `Your order #${savedOrder._id.slice(-6).toUpperCase()} has been confirmed.`
      });

      setOrderSuccessData(savedOrder);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!termsAccepted) {
      toast({ title: 'Agreement Required', description: 'Please agree to the Terms & Conditions to proceed.', variant: 'destructive' });
      return;
    }

    const required = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    const missing = required.filter(field => !(formData as any)[field]?.trim());
    if (missing.length > 0) {
      toast({
        title: 'Missing Fields',
        description: `Please fill in: ${missing.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    if (!formData.email.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email.', variant: 'destructive' });
      return;
    }

    if (isCod) {
      setIsProcessing(true);
      await submitOrder();
    } else {
      setIsProcessing(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast({ title: 'Payment Check', description: 'Failed to load Razorpay SDK', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }

      try {
        const rpRes = await fetch('/api/orders/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total })
        });
        
        if (!rpRes.ok) throw new Error('Could not initialize payment session');
        const rpData = await rpRes.json();
        
        const configRes = await fetch('/api/orders/razorpay-config');
        const configData = await configRes.json();
        
        const options = {
          key: configData.key,
          amount: rpData.amount,
          currency: rpData.currency,
          name: 'SM Gadgets',
          description: 'Secure Online Payment',
          order_id: rpData.id,
          handler: async function (response: any) {
             setIsProcessing(true);
             const paymentDetails = {
               razorpay_order_id: response.razorpay_order_id,
               razorpay_payment_id: response.razorpay_payment_id,
               razorpay_signature: response.razorpay_signature
             };
             await submitOrder(paymentDetails);
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#10b981'
          }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', function (response: any) {
            setIsProcessing(false);
            toast({ title: 'Payment Failed', description: response.error.description, variant: 'destructive' });
        });
        paymentObject.open();

        // Intentionally NOT setting isProcessing(false) here because the modal stays open.
        // The modal handler will reset it, or the user closes it manually.
        paymentObject.on('payment.closed', function() {
            setIsProcessing(false);
        });

      } catch (err: any) {
        setIsProcessing(false);
        toast({ title: 'Error', description: err.message || 'Could not initialize payment.', variant: 'destructive' });
      }
    }
  };

  useEffect(() => {
    if (orderSuccessData) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [orderSuccessData]);

  if (orderSuccessData) {
    return (
      <div className="min-h-screen py-16 px-4 flex flex-col items-start md:items-center justify-start md:justify-center text-center relative overflow-hidden bg-background/50">
        <style>{`
          .success-path {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: dash 1s ease-out forwards 0.3s;
          }
          @keyframes dash {
            to { stroke-dashoffset: 0; }
          }
          .success-pulse {
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .success-circle-pop {
            opacity: 0;
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.2s;
          }
        `}</style>
        
        <div className="max-w-md w-full glass p-8 md:p-10 rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 shadow-[0_0_80px_rgba(16,185,129,0.1)] animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 mt-10 md:mt-0">
          
          {/* Animated Checkmark UI */}
          <div className="relative mb-8 flex justify-center items-center">
            {/* Pulsing Rings */}
            <div className="absolute w-28 h-28 bg-emerald-500/20 rounded-full success-pulse"></div>
            <div className="absolute w-28 h-28 bg-emerald-500/10 rounded-full success-pulse" style={{ animationDelay: '0.4s' }}></div>
            
            {/* Central SVG element */}
            <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 success-circle-pop">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                 <path className="success-path" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-playfair font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-3 animate-in fade-in zoom-in-95 duration-700 delay-300">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground mb-6 text-sm md:text-base animate-in fade-in duration-700 delay-500">
            Your order has been confirmed.
            <br className="md:hidden" />
            <span className="md:ml-2 font-mono font-medium opacity-80">ID: #{orderSuccessData._id.slice(-6).toUpperCase()}</span>
          </p>
          
          <div className="bg-background/60 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/5 text-left animate-in slide-in-from-bottom-4 fade-in duration-700 delay-700">
            <h3 className="font-semibold mb-3 text-foreground/90">Order Summary</h3>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-primary">₹{orderSuccessData.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="capitalize text-foreground/80">{formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/profile')}>
              View Order in Dashboard
            </Button>
            <Button variant="outline" className="w-full glass border-white/20" onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-playfair font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-4xl font-playfair font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="glass border-white/20"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="glass border-white/20"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="glass border-white/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="glass border-white/20"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="glass border-white/20"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="glass border-white/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="glass border-white/20"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <div className="flex items-center space-x-2 p-4 rounded-lg border border-white/20">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center cursor-pointer">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Online Payment (Razorpay)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border border-white/20">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center cursor-pointer">
                      <Truck className="h-4 w-4 mr-2" />
                      Cash on Delivery
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="glass border-white/20 sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Coupon Code Block */}
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Enter Coupon Code" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="glass font-medium uppercase placeholder:normal-case"
                    disabled={appliedCoupon !== null}
                  />
                  {appliedCoupon && !isCod ? (
                    <Button variant="destructive" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}>Remove</Button>
                  ) : (
                    <Button variant="secondary" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                      {couponLoading ? "..." : "Apply"}
                    </Button>
                  )}
                </div>
                
                {isCod && appliedCoupon && (
                  <p className="text-xs text-destructive">Coupons not applicable on Cash on Delivery.</p>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && !isCod && (
                    <div className="flex items-center justify-between text-emerald-400 font-medium">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
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
                </div>

                <div className="flex items-start space-x-2 py-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary"
                    required
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-normal cursor-pointer">
                    I agree to the <Link to="/terms-and-conditions" className="text-primary hover:underline">Terms & Conditions</Link>, <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, <Link to="/shipping-policy" className="text-primary hover:underline">Shipping Policy</Link>, and <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> (No refunds/cancellations).
                  </Label>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Order...
                    </div>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  🔒 Your payment information is secure and encrypted
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;