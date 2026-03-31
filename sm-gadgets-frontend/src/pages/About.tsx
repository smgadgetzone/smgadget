import React from 'react';
import { Badge } from '@/components/ui/badge';

const About = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 glass border-white/20">About Us</Badge>
          <h1 className="text-5xl font-playfair font-bold mb-6 gradient-text">
            Our Story of Digital Excellence
          </h1>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
            SM Gadgets has been your trusted partner for premium mobile accessories
            and gadgets. We are dedicated to providing high-quality products that enhance
            your digital lifestyle.
          </p>
        </div>

        {/* Mission Section */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-playfair font-bold mb-8">
            Our Mission
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            We believe that every device deserves the best protection and accessories. Our mission is to
            offer a curated selection of covers, chargers, and audio gear that combine functionality
            with style, ensuring you get the most out of your technology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;