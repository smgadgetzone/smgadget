import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen py-16 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 glass border-white/20"><Shield className="w-4 h-4 mr-2"/>Legal Docs</Badge>
          <h1 className="text-4xl font-playfair font-bold mb-6 gradient-text">Privacy Policy</h1>
        </div>
        <div className="glass border-white/20 p-8 rounded-2xl text-muted-foreground space-y-6 leading-relaxed">
          <p>SM Gadgets understands that your privacy is critical. This Privacy Policy describes how your personal information is collected, used, and shared.</p>
          
          <h3 className="text-xl font-semibold text-foreground">1. Personal Information We Collect</h3>
          <p>When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, and some of the cookies that are installed on your device.</p>

          <h3 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h3>
          <p>We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).</p>

          <h3 className="text-xl font-semibold text-foreground">3. Sharing Your Personal Information</h3>
          <p>We share your Personal Information with third parties to help us use your Personal Information, such as payment gateways like Razorpay which adhere to strict PCI-DSS compliance.</p>
          
          <h3 className="text-xl font-semibold text-foreground">4. Contact Us</h3>
          <p>For more information about our privacy practices, please contact us by email at <strong>smgadget.in@gmail.com</strong>.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
