import React, { useState } from 'react';
import { Phone, Mail, Instagram, MessageCircle, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone Numbers',
      details: ['+91 9146381153'],
      color: 'bg-gradient-primary'
    },
    {
      icon: Mail,
      title: 'Email Address',
      details: ['smgadget.in@gmail.com'],
      color: 'bg-gradient-to-br from-blue-500 to-cyan-400'
    },
    {
      icon: Instagram,
      title: 'Social Media',
      details: ['@smgadgetzone.in'],
      color: 'bg-gradient-to-br from-pink-500 to-purple-500'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      details: ['Chat with us'],
      color: 'bg-gradient-to-br from-green-500 to-emerald-400'
    }
  ];

  const businessHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 8:00 PM' },
    { day: 'Saturday', hours: '10:00 AM - 6:00 PM' },
    { day: 'Sunday', hours: '12:00 PM - 5:00 PM' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Error',
        description: 'Please fill in your name, email, and message.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      toast({
        title: 'Message Sent! ✉️',
        description: data.message || 'We\'ll get back to you within 24 hours.',
      });

      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 glass border-white/20">Contact Us</Badge>
          <h1 className="text-5xl font-playfair font-bold mb-6 gradient-text">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <Card key={index} className="glass border-white/20 hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{info.title}</h3>
                    {info.details.map((detail, idx) => {
                      let href = '#';
                      let target = '_self';

                      if (info.title.includes('Phone')) {
                        href = `tel:${detail.replace(/\s+/g, '')}`;
                      } else if (info.title.includes('Email')) {
                        href = `mailto:${detail}`;
                      } else if (info.title.includes('Social')) {
                        href = 'https://www.instagram.com/smgadgetzone.in';
                        target = '_blank';
                      } else if (info.title.includes('WhatsApp')) {
                        href = 'https://wa.me/919146381153';
                        target = '_blank';
                      }

                      return (
                        <a
                          key={idx}
                          href={href}
                          target={target}
                          rel={target === '_blank' ? "noopener noreferrer" : undefined}
                          className="text-muted-foreground text-sm block hover:text-primary transition-colors py-0.5"
                        >
                          {detail}
                        </a>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contact Form + Business Hours */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="glass border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="h-5 w-5 mr-2 text-primary" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-name">Name *</Label>
                        <Input
                          id="contact-name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your name"
                          className="glass border-white/20"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-email">Email *</Label>
                        <Input
                          id="contact-email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          className="glass border-white/20"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-phone">Phone</Label>
                        <Input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 XXXXX XXXXX"
                          className="glass border-white/20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-subject">Subject</Label>
                        <Input
                          id="contact-subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="What's this about?"
                          className="glass border-white/20"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="contact-message">Message *</Label>
                      <Textarea
                        id="contact-message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us how we can help..."
                        className="glass border-white/20 min-h-[120px]"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full shadow-soft"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Business Hours */}
            <div>
              <Card className="glass border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {businessHours.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                        <span className="text-sm font-medium">{item.day}</span>
                        <span className="text-sm text-muted-foreground">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm text-primary font-medium">📍 Shipping Pan India</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We deliver across India with fast & reliable shipping.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card className="glass border-white/20 overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                Find Us
              </CardTitle>
            </CardHeader>
            <div className="h-[350px] w-full">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3745.242!2d77.834!3d20.306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd114b0b1eb124d%3A0x6b447432ea76b0!2s4XX5%2B7P4%2C%20Jawala%2C%20Maharashtra%20445105!5e0!3m2!1sen!2sin!4v1703080000000!5m2!1sen!2sin"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;