import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Grid, List, Star, Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import QuickViewModal from '@/components/QuickViewModal';
import { Product } from '@/types/index';

const Shop = () => {
  const { products, addToCart, addToWishlist, wishlist } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState('name');

  const categoryParam = searchParams.get('category');

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Category filter via URL parameter
      if (categoryParam && product.category !== categoryParam) {
        return false;
      }
      return true;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return Number(b.rating) - Number(a.rating);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [products, categoryParam, sortBy]);

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold mb-2">Shop Collection</h1>
          <p className="text-muted-foreground">
            Discover our premium mobile accessories and gadgets
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Products Section */}
          <div className="w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} products found
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] glass border-white/20">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/20">
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1'
                }`}>
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="product-card border-white/20 group">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`object-cover group-hover:scale-105 transition-transform duration-500 ${viewMode === 'grid' ? 'w-full aspect-square' : 'w-full h-48'
                            }`}
                        />
                      </Link>

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.discount && (
                          <Badge className="bg-destructive text-destructive-foreground">
                            {product.discount}% OFF
                          </Badge>
                        )}
                        {!product.inStock && (
                          <Badge variant="secondary">Out of Stock</Badge>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                        onClick={() => addToWishlist(product.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''
                            }`}
                        />
                      </Button>

                      {/* Quick View Button (Only in Grid Mode) */}
                      {viewMode === 'grid' && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-14 right-4 shadow-md rounded-full bg-white/90 hover:bg-white text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            setQuickViewProduct(product);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="text-xl font-playfair font-semibold mb-2 hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Rating */}
                      <div className="flex flex-col items-start gap-1 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(Number(product.rating))
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {product.rating} ({product.reviews} reviews)
                        </span>
                      </div>

                      {/* Price and Add to Cart */}
                      <div className="flex flex-col gap-3 mt-auto pt-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-primary">
                            ₹{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 w-full mt-1">
                          <Button 
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(product);
                            }}
                            disabled={!product.inStock}
                            className="w-10 shrink-0 rounded-xl h-10 font-semibold shadow-sm text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-0"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(product);
                              navigate('/cart');
                            }}
                            disabled={!product.inStock}
                            className="flex-1 shadow-md h-10 text-[13px] font-bold rounded-xl transition-transform hover:scale-[1.02] active:scale-95 bg-primary text-primary-foreground min-w-0 px-1"
                          >
                            <span className="whitespace-nowrap">Shop Now</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default Shop;