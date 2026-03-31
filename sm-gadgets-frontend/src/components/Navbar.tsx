import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/context/AppContext';
import logo from '@/assets/logo_new.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cart, wishlist, user, dispatch, getTotalItems, getTotalPrice } = useApp();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    dispatch({ type: 'SET_USER', payload: null });
  };

  const categories = [
    { name: 'Chargers', path: '/shop?category=chargers' },
    { name: 'Headphones', path: '/shop?category=headphones' },
    { name: 'Smart Watches', path: '/shop?category=smart-watches' },
    { name: 'Viral Gadgets', path: '/shop?category=viral' },
    { name: 'Electronics Devices', path: '/shop?category=electronics-devices' },
    { name: 'Toys', path: '/shop?category=toys' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 md:space-x-3 group min-w-0">
            <img
              src={logo}
              alt="SM Gadgets"
              className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-full transition-transform group-hover:scale-110 flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-base md:text-2xl font-bold font-playfair gradient-text tracking-tight whitespace-nowrap truncate">
                SM Gadgets
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest hidden sm:block">
                Premium Store
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors hover:text-primary ${isActive('/') ? 'text-primary' : 'text-foreground'
                }`}
            >
              Home
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 font-medium transition-colors hover:text-primary">
                <span>Shop</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass border-white/20">
                <DropdownMenuItem asChild>
                  <Link to="/shop">All Products</Link>
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem key={category.name} asChild>
                    <Link to={category.path}>{category.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/about"
              className={`font-medium transition-colors hover:text-primary ${isActive('/about') ? 'text-primary' : 'text-foreground'
                }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`font-medium transition-colors hover:text-primary ${isActive('/contact') ? 'text-primary' : 'text-foreground'
                }`}
            >
              Contact
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search gadgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass border-white/20"
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-2">
            {/* Wishlist */}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/wishlist" className="relative">
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                  >
                    {wishlist.length}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                  >
                    {getTotalItems()}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* User Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-white/20">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile & Orders</Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search gadgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass border-white/20"
                />
              </div>

              {/* Mobile Navigation Links */}
              <Link to="/" className="font-medium py-2" onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link to="/shop" className="font-medium py-2" onClick={() => setIsOpen(false)}>
                Shop
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  className="font-medium py-2 pl-4 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link to="/about" className="font-medium py-2" onClick={() => setIsOpen(false)}>
                About
              </Link>
              <Link to="/contact" className="font-medium py-2" onClick={() => setIsOpen(false)}>
                Contact
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Cart Total Display */}
      {getTotalItems() > 0 && (
        <div className="hidden md:block absolute top-full right-4 mt-2">
          <div className="glass rounded-lg p-2 text-sm">
            {getTotalItems()} items • ₹{getTotalPrice().toLocaleString()}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;