
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo_new.png';

const Footer = () => {
    return (
        <footer className="bg-background border-t border-white/10 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center space-x-2">
                            <img
                                src={logo}
                                alt="SM Gadgets"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="text-xl font-bold font-playfair gradient-text">
                                SM Gadgets
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Your one-stop destination for premium mobile accessories, smart gadgets, and trending tech essentials.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="https://www.instagram.com/smgadgetzone.in" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://www.facebook.com/share/181tMUR8qj/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="mailto:smgadget.in@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold mb-6">Quick Links</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                            </li>
                            <li>
                                <Link to="/shop" className="hover:text-primary transition-colors">Shop All</Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold mb-6">Legal</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link to="/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
                            </li>
                            <li>
                                <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund & Cancellation</Link>
                            </li>
                            <li>
                                <Link to="/shipping-policy" className="hover:text-primary transition-colors">Shipping Policy</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="font-semibold mb-6">Categories</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link to="/shop?category=chargers" className="hover:text-primary transition-colors">Chargers</Link>
                            </li>
                            <li>
                                <Link to="/shop?category=headphones" className="hover:text-primary transition-colors">Headphones</Link>
                            </li>
                            <li>
                                <Link to="/shop?category=smart-watches" className="hover:text-primary transition-colors">Smart Watches</Link>
                            </li>
                            <li>
                                <Link to="/shop?category=viral" className="hover:text-primary transition-colors">Viral Gadgets</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-semibold mb-6">Contact Us</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start space-x-3">
                                <Phone className="h-4 w-4 mt-1 shrink-0" />
                                <span>+91 9146381153</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Mail className="h-4 w-4 mt-1 shrink-0" />
                                <span>smgadget.in@gmail.com</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="h-4 w-4 mt-1 shrink-0" />
                                <span>Shipping Pan India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} SM Gadgets. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
