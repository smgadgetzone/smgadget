import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Zap, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useApp } from '@/context/AppContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { products, addToCart, addToWishlist, wishlist } = useApp();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');

  const product = products.find(p => p.id === id);

  React.useEffect(() => {
    // Reset selected color if product changes so they must pick again
    setSelectedColor('');
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button asChild>
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const isInWishlist = wishlist.includes(product.id);

  const productImages = product.images || [product.image];

  const mockReviews = [
    {
      id: '1',
      userName: 'Priya Sharma',
      rating: 5,
      comment: 'Absolutely beautiful! The quality is amazing and it looks exactly like the pictures.',
      date: '2024-01-15'
    },
    {
      id: '2',
      userName: 'Anita Patel',
      rating: 4,
      comment: 'Love this piece! Very elegant and goes with everything. Fast delivery too.',
      date: '2024-01-10'
    },
    {
      id: '3',
      userName: 'Sneha Reddy',
      rating: 5,
      comment: 'Perfect gift for my sister. She absolutely loved it! Highly recommend.',
      date: '2024-01-05'
    }
  ];

  const [api, setApi] = useState<CarouselApi>();

  // Sync thumbnail selection with carousel
  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setSelectedImageIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollToSlide = (index: number) => {
    api?.scrollTo(index);
  };

  const productMedia = [...productImages, ...(product.video ? [{ type: 'video', src: product.video }] : [])];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-8 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-primary">Home</Link>
          <span className="text-muted-foreground">/</span>
          <Link to="/shop" className="text-muted-foreground hover:text-primary">Shop</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground capitalize">{product.category}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Media Slider */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg glass border-white/10">
              <Carousel
                setApi={setApi}
                plugins={[
                  Autoplay({
                    delay: 3000,
                    stopOnInteraction: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent>
                  {productMedia.map((media, index) => (
                    <CarouselItem key={index}>
                      <div className="flex items-center justify-center p-0 h-[400px] lg:h-[600px] w-full bg-black/5">
                        {typeof media === 'string' ? (
                          <img
                            src={media}
                            alt={`${product.name} view ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <video
                            src={media.src}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {productMedia.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>

              {product.discount && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground z-10">
                  {product.discount}% OFF
                </Badge>
              )}
            </div>

            {productMedia.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {productMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSlide(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImageIndex === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-primary/50'
                      }`}
                  >
                    {typeof media === 'string' ? (
                      <img
                        src={media}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <span className="text-xs text-white">Video</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-playfair font-bold mb-2">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(Number(product.rating))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>
              <Badge variant={product.inStock ? 'default' : 'secondary'}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-bold text-primary">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.discount && (
                <Badge className="bg-green-100 text-green-800">
                  Save ₹{(Number(product.originalPrice) - product.price).toLocaleString()}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Features (if any) */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="leading-relaxed">{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Colors (if any) */}
            {product.color && product.color.split(',').filter(Boolean).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {product.color.split(',').map(c => c.trim()).filter(Boolean).map((colorOption, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(colorOption)}
                      className={`w-10 h-10 rounded-full border border-gray-200 transition-all flex items-center justify-center relative ${
                        selectedColor === colorOption 
                        ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-md' 
                        : 'hover:scale-105 shadow-sm'
                      }`}
                      style={{ backgroundColor: colorOption }}
                      title={colorOption}
                    >
                      {selectedColor === colorOption && <Check className="w-5 h-5 text-white mix-blend-difference drop-shadow-md absolute" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full">
              <Button
                variant="secondary"
                className="flex-1 h-16 text-lg font-bold rounded-xl shadow-[0_4px_14px_rgb(0,0,0,0.05)] hover:bg-primary/20 bg-primary/10 text-primary transition-transform active:scale-95"
                onClick={() => {
                  const hasColors = product.color && product.color.split(',').filter(Boolean).length > 0;
                  if (hasColors && !selectedColor) {
                    toast({ title: 'Pick a Color', description: 'Please select a color option before adding to cart', variant: 'destructive' });
                    return;
                  }
                  addToCart({ ...product, color: selectedColor || undefined });
                }}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-3" />
                Add to Cart
              </Button>
              <Button
                className="flex-[1.5] h-16 text-xl font-bold rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-[1.02] transition-transform active:scale-95 bg-primary text-primary-foreground"
                onClick={() => {
                  const hasColors = product.color && product.color.split(',').filter(Boolean).length > 0;
                  if (hasColors && !selectedColor) {
                    toast({ title: 'Pick a Color', description: 'Please select a color option before shopping', variant: 'destructive' });
                    return;
                  }
                  addToCart({ ...product, color: selectedColor || undefined });
                  navigate('/cart');
                }}
                disabled={!product.inStock}
              >
                <Zap className="h-5 w-5 mr-3 fill-current" />
                Shop Now
              </Button>
              <Button
                variant="outline"
                onClick={() => addToWishlist(product.id)}
                className="w-16 h-16 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary transition-colors flex-shrink-0 flex items-center justify-center p-0"
              >
                <Heart className={`h-7 w-7 transition-transform ${isInWishlist ? 'fill-primary' : ''}`} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 glass rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium">Free Shipping</div>
                  <div className="text-sm text-muted-foreground">On orders above ₹999</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 glass rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium">Authentic</div>
                  <div className="text-sm text-muted-foreground">100% genuine products</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 glass rounded-lg">
                <RotateCcw className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium">Easy Returns</div>
                  <div className="text-sm text-muted-foreground">7-day return policy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-playfair font-bold mb-8">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockReviews.map((review) => (
              <Card key={review.id} className="glass border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-3">{review.comment}</p>
                  <p className="font-medium text-sm">— {review.userName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-playfair font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="group"
                >
                  <Card className="product-card border-white/20">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {relatedProduct.discount && (
                        <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
                          {relatedProduct.discount}% OFF
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-playfair font-semibold mb-2 line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ₹{relatedProduct.price.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {relatedProduct.rating}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;