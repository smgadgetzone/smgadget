import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ProductSkeleton = () => {
  return (
    <Card className="product-card border-white/10 h-full flex flex-col bg-background/50 backdrop-blur-sm overflow-hidden min-h-[350px]">
      {/* Image Skeleton */}
      <div className="relative aspect-square bg-white/5 animate-pulse overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      
      <CardContent className="p-3 flex flex-col flex-1 space-y-3">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded animate-pulse w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
          <div className="h-4 bg-white/5 rounded animate-pulse w-2/3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-border/50">
          {/* Price Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-5 bg-white/10 rounded animate-pulse w-1/3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          
          {/* Button Skeleton */}
          <div className="flex gap-2 mt-1 w-full">
            <div className="w-8 h-8 rounded-md bg-white/5 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
            <div className="flex-1 h-8 rounded-md bg-white/10 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSkeleton;
