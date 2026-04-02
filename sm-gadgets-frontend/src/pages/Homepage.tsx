import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Battery, Headphones, Watch, Zap, Eye, TrendingUp, Monitor, Gamepad2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useApp } from '@/context/AppContext';
import heroBg from '@/assets/hero_bg.png';
import QuickViewModal from '@/components/QuickViewModal';

import { Product } from '@/types/index';

const Homepage = () => {
  const { products, addToCart } = useApp();
  const [quickViewProduct, setQuickViewProduct] = React.useState<Product | null>(null);
  const featuredProducts = products.filter(product => product.featured).slice(0, 3);

  const categories = [
    {
      id: 'chargers',
      name: 'Chargers',
      icon: Battery,
      path: '/shop?category=chargers',
      description: 'Fast charging solutions',
      color: 'bg-green-100'
    },
    {
      id: 'headphones',
      name: 'Headphones',
      icon: Headphones,
      path: '/shop?category=headphones',
      description: 'Immersive audio experience',
      color: 'bg-purple-100'
    },
    {
      id: 'smart-watches',
      name: 'Smart Watches',
      icon: Watch,
      path: '/shop?category=smart-watches',
      description: 'Stay connected in style',
      color: 'bg-orange-100'
    },
    {
      id: 'viral',
      name: 'Viral Gadgets',
      icon: TrendingUp,
      path: '/shop?category=viral',
      description: 'Trending social media tech',
      color: 'bg-yellow-100'
    },
    {
      id: 'electronics-devices',
      name: 'Electronics Devices',
      icon: Monitor,
      path: '/shop?category=electronics-devices',
      description: 'Essential home electronics',
      color: 'bg-blue-100'
    },
    {
      id: 'toys',
      name: 'Toys',
      icon: Gamepad2,
      path: '/shop?category=toys',
      description: 'Fun for all ages',
      color: 'bg-pink-100'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Mobile Store Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-4 py-1 text-sm">
            Premium Mobile Accessories
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-playfair mb-6 leading-tight tracking-tight">
            <span className="gradient-text">SM Gadgets</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg hover-scale shadow-glow" onClick={() => window.location.href = '/shop'}>
              Shop Now
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg hover-scale glass" onClick={() => window.location.href = '/contact'}>
              Visit Store
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Products Section */}
      {products.some(p => p.isTrending) && (
        <section className="py-12 px-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 border-y border-amber-500/20" />
          <div className="container mx-auto relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-playfair font-bold mb-2 flex items-center gap-3">
                  <TrendingUp className="h-7 w-7 text-orange-500 animate-pulse" />
                  Trending Hot
                </h2>
                <p className="text-muted-foreground text-sm">Most sought after gadgets right now</p>
              </div>
            </div>
            
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {products.filter(p => p.isTrending).map((product) => (
                  <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <Link to={`/product/${product.id}`} className="group h-full block">
                      <Card className="product-card border-orange-500/20 shadow-glow-sm h-full hover:border-orange-500/50 transition-colors flex flex-col bg-background/50 backdrop-blur-sm">
                        <div className="relative overflow-hidden rounded-t-lg aspect-square">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          {product.discount && (
                            <Badge className="absolute top-2 left-2 bg-destructive text-[10px] px-1.5 h-5">{product.discount}%</Badge>
                          )}
                          <Button variant="secondary" size="icon" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md rounded-full bg-white/90 hover:bg-white text-foreground h-8 w-8" onClick={(e) => { e.preventDefault(); setQuickViewProduct(product); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardContent className="p-3 flex flex-col flex-1">
                          <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors h-[40px]">
                            {product.name}
                          </h3>
                          <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-primary">₹{product.price.toLocaleString()}</span>
                              {product.originalPrice && (
                                <span className="text-[10px] text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-1 w-full">
                              <Button 
                                size="sm" variant="secondary"
                                onClick={(e) => { e.preventDefault(); addToCart(product); }}
                                disabled={!product.inStock}
                                className="w-8 shrink-0 rounded-md h-8 text-primary bg-primary/10 hover:bg-primary/20 px-0"
                              >
                                <ShoppingCart className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm" onClick={(e) => { e.preventDefault(); addToCart(product); window.location.href='/cart'; }}
                                disabled={!product.inStock}
                                className="flex-1 h-8 text-[11px] font-bold rounded-md shadow-sm px-1 min-w-0"
                              >
                                <span className="whitespace-nowrap">Shop Now</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>
      )}

      {/* Category Icons Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-playfair font-bold text-center mb-4">
            Explore Categories
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Find exactly what you need for your device
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link
                  key={category.name}
                  to={category.path}
                  className="group"
                >
                  <Card className="glass border-white/10 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 h-full">
                    <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                      <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                        <IconComponent className="h-8 w-8 text-foreground/80" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category Sections */}
      <div className="space-y-12 pb-20">
        {categories.map((category) => {
          const categoryProducts = products
            .filter(product => {
              // Simple text matching or exact match.
              // Assuming product.category is the ID or comparable string.
              return product.category === category.id ||
                (category.id === 'viral' && (product.category === 'viral' || Number(product.rating) > 4.8)) ||
                (category.id === 'electronics-devices' && product.category === 'electronics-devices') ||
                (category.id === 'toys' && product.category === 'toys');
            })
            .slice(0, 7);

          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} className="py-8 px-4">
              <div className="container mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-playfair font-bold mb-1">{category.name}</h2>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </div>
                  <Button variant="ghost" asChild className="hidden sm:flex group">
                    <Link to={category.path}>
                      View All <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                <Carousel
                  opts={{
                    align: "start",
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {categoryProducts.map((product) => (
                      <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                        <Link to={`/product/${product.id}`} className="group h-full block">
                          <Card className="product-card border-white/10 h-full hover:border-primary/50 transition-colors">
                            <div className="relative overflow-hidden rounded-t-lg aspect-square">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              {product.discount && (
                                <Badge className="absolute top-2 left-2 bg-destructive text-[10px] px-1.5 h-5">
                                  {product.discount}%
                                </Badge>
                              )}

                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md rounded-full bg-white/90 hover:bg-white text-foreground h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setQuickViewProduct(product);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                            <CardContent className="p-3">
                              <h3 className="font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-border/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-primary">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-[10px] text-muted-foreground line-through">
                                      ₹{product.originalPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2 mt-1 w-full">
                                  <Button 
                                    size="sm" variant="secondary"
                                    onClick={(e) => { e.preventDefault(); addToCart(product); }}
                                    disabled={!product.inStock}
                                    className="w-8 shrink-0 rounded-md h-8 text-primary bg-primary/10 hover:bg-primary/20 px-0"
                                  >
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm" onClick={(e) => { e.preventDefault(); addToCart(product); window.location.href='/cart'; }}
                                    disabled={!product.inStock}
                                    className="flex-1 h-8 text-[10px] sm:text-[11px] font-bold rounded-md shadow-sm px-0.5 min-w-0"
                                  >
                                    <span className="whitespace-nowrap">Shop Now</span>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </CarouselItem>
                    ))}

                    {/* View All Card */}
                    <CarouselItem className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                      <Link to={category.path} className="group h-full block">
                        <Card className="product-card border-white/10 h-full flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer border-dashed border-2 min-h-[250px]">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ArrowRight className="h-6 w-6 text-primary" />
                          </div>
                          <span className="font-semibold text-primary">View All</span>
                          <span className="text-xs text-muted-foreground mt-1">{category.name}</span>
                        </Card>
                      </Link>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex" />
                  <CarouselNext className="hidden md:flex" />
                </Carousel>
              </div>
            </section>
          );
        })}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div >
  );
};

export default Homepage;