import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen py-16 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 glass border-white/20"><Shield className="w-4 h-4 mr-2"/>Legal Docs</Badge>
          <h1 className="text-4xl font-playfair font-bold mb-6 gradient-text">Return & Refund Policy</h1>
        </div>
        <div className="glass border-white/20 p-8 rounded-2xl text-muted-foreground space-y-6 leading-relaxed">
          <p>Please read our return and refund policy carefully before engaging with our platform and purchasing a product.</p>
          
          <h3 className="text-2xl font-bold text-red-500 mb-2">No Refunds & No Cancellations</h3>
          <p className="text-lg">
            At SM Gadgets, we strive to provide the best quality electronic products to our customers. 
            However, we maintain a strict <strong>NO REFUND and NO CANCELLATION</strong> policy on all orders placed through our website.
          </p>

          <h3 className="text-xl font-semibold text-foreground mt-8">1. Order Placement Policy</h3>
          <p>Once an order has been successfully placed and payment has been verified via our gateway (Razorpay), it enters our dispatch processing pipeline immediately. Therefore, we do not accept order cancellations under any circumstances.</p>

          <h3 className="text-xl font-semibold text-foreground">2. Defective Items Policy</h3>
          <p>If you receive a defective or damaged item, please contact us strictly within 24-48 hours of delivery with photographic evidence. While we do not issue refunds, we may, at our sole discretion, offer a replacement for genuinely defective items returned to us securely. Shipping return costs are the responsibility of the buyer.</p>

          <h3 className="text-xl font-semibold text-foreground">3. Contact Us</h3>
          <p>For any queries regarding product defects or damage during transit, please email us directly at <strong>smgadget.in@gmail.com</strong>.</p>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
