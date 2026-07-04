import React from 'react';
import { Loader2 } from 'lucide-react';

export function FullPageLoader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-foreground mb-4" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export function InlineSpinner({ size = "sm", className = "" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-current ${className}`} />
  );
}

export function Skeleton({ className }) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 saas-card flex flex-col space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-1/4 rounded-md" />
      </div>
    </div>
  );
}

export function DashboardSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
