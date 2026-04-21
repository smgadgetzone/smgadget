import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ProductSkeleton = () => {
  return (
    <Card className="product-card border-white/10 h-full flex flex-col bg-background/20 backdrop-blur-sm overflow-hidden min-h-[350px]">
      {/* Image Skeleton - darker base for better visibility */}
      <div className="relative aspect-square bg-white/10 animate-pulse overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      </div>
      
      <CardContent className="p-3 flex flex-col flex-1 space-y-4 pt-4">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded animate-pulse w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
          </div>
          <div className="h-4 bg-white/10 rounded animate-pulse w-2/3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
          </div>
        </div>
        
        <div className="flex flex-col gap-4 mt-auto pt-4 border-t border-white/5">
          {/* Price Skeleton */}
          <div className="h-6 bg-white/20 rounded animate-pulse w-1/3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
          </div>
          
          {/* Button Skeleton */}
          <div className="flex gap-2 w-full">
            <div className="w-10 h-10 rounded-md bg-white/10 animate-pulse relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            </div>
            <div className="flex-1 h-10 rounded-md bg-white/20 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSkeleton;
