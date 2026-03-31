import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen py-16 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 glass border-white/20"><Shield className="w-4 h-4 mr-2"/>Legal Docs</Badge>
          <h1 className="text-4xl font-playfair font-bold mb-6 gradient-text">Terms & Conditions</h1>
        </div>
        <div className="glass border-white/20 p-8 rounded-2xl text-muted-foreground space-y-6 leading-relaxed">
          <p>Welcome to SM Gadgets. By accessing our website and purchasing our products, you agree to be bound by the following terms and conditions.</p>
          
          <h3 className="text-xl font-semibold text-foreground">1. General Overview</h3>
          <p>These Terms of Service apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/ or contributors of content. By accessing or using any part of the site, you agree to be bound by these Terms.</p>

          <h3 className="text-xl font-semibold text-foreground">2. Products & Services</h3>
          <p>Certain products or services may be available exclusively online through the website. We have made every effort to display as accurately as possible the colors and images of our products. All descriptions of products or product pricing are subject to change at any time without notice.</p>

          <h3 className="text-xl font-semibold text-foreground">3. Accuracy of Billing</h3>
          <p>You agree to provide current, complete and accurate purchase and account information for all purchases made at our store. We reserve the right to refuse any order you place with us.</p>
          
          <h3 className="text-xl font-semibold text-foreground">4. Contact Information</h3>
          <p>Questions about the Terms of Service should be sent to us at <strong>smgadget.in@gmail.com</strong>.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
