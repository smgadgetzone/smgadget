import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Star, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

import { Product } from '@/types/index';

interface QuickViewModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
    const { dispatch } = useApp();

    if (!product) return null;

    const addToCart = () => {
        dispatch({ type: 'ADD_TO_CART', payload: product });
        toast({
            title: 'Added to Cart',
            description: `${product.name} has been added to your cart.`
        });
        onClose();
    };

    const addToWishlist = () => {
        dispatch({ type: 'ADD_TO_WISHLIST', payload: product.id });
        toast({
            title: 'Added to Wishlist',
            description: `${product.name} has been added to your wishlist.`
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden glass border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Product Image */}
                    <div className="relative h-64 md:h-full bg-white/50">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                        {product.discount && (
                            <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                                {product.discount}% OFF
                            </Badge>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="p-6 md:p-8 flex flex-col h-full bg-white/80 md:bg-transparent">
                        <div className="mb-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-playfair font-bold mb-2 text-left">
                                    {product.name}
                                </DialogTitle>
                                {/* Hidden Description for accessibility but kept simple for layout */}
                                <DialogDescription className="hidden">
                                    Product details
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex items-center space-x-2 mb-4">
                                <span className="text-3xl font-bold text-primary">
                                    ₹{product.price.toLocaleString()}
                                </span>
                                {product.originalPrice && (
                                    <span className="text-lg text-muted-foreground line-through">
                                        ₹{product.originalPrice.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center space-x-1 mb-6">
                                <div className="flex text-yellow-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < Math.floor(Number(product.rating)) ? 'fill-current' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground ml-2">
                                    ({product.reviews} reviews)
                                </span>
                            </div>

                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                {product.description}
                            </p>

                            <div className="bg-blue-50/50 p-3 rounded-lg mb-6 border border-blue-100">
                                <p className="text-xs text-blue-600 font-medium">
                                    ⚡ Fast Delivery available
                                </p>
                                <p className="text-xs text-blue-600 font-medium mt-1">
                                    🛡️ 1 Year Warranty
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-4 md:mt-0">
                            <Button onClick={addToCart} className="flex-1 shadow-soft" size="lg">
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                            </Button>
                            <Button onClick={addToWishlist} variant="outline" size="icon" className="h-11 w-11 shrink-0">
                                <Heart className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QuickViewModal;
