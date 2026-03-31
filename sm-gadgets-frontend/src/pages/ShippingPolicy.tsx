import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen py-16 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 glass border-white/20"><Shield className="w-4 h-4 mr-2"/>Legal Docs</Badge>
          <h1 className="text-4xl font-playfair font-bold mb-6 gradient-text">Shipping & Delivery Policy</h1>
        </div>
        <div className="glass border-white/20 p-8 rounded-2xl text-muted-foreground space-y-6 leading-relaxed">
          <h3 className="text-2xl font-bold text-emerald-500 mb-2">Standard Delivery Window</h3>
          <p className="text-lg">
            We offer Pan-India shipping across the country. Our standard automated delivery timeline is <strong>5 to 6 working days</strong> from the date of final order processing and dispatch.
          </p>

          <h3 className="text-xl font-semibold text-foreground mt-8">1. Order Processing Time</h3>
          <p>All orders are processed within 24-48 hours. Orders are not shipped or delivered on weekends or public holidays.</p>

          <h3 className="text-xl font-semibold text-foreground">2. Shipping Address Constraints</h3>
          <p>Please ensure you provide accurate shipping addresses including accurate pincodes. We are not liable for delayed deliveries caused by incomplete or misspelled destination addresses provided during checkout.</p>
          
          <h3 className="text-xl font-semibold text-foreground">3. Shipping Rates</h3>
          <p>A standard flat-rate nominal shipping fee is dynamically calculated and applied to your total invoice before the final payment is initialized based on standard courier charges.</p>

          <h3 className="text-xl font-semibold text-foreground">4. Contact</h3>
          <p>If you have any questions about the shipping status of your order, reach out to us at <strong>smgadget.in@gmail.com</strong>.</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
