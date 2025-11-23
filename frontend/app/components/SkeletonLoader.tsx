import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen bg-cream flex items-center justify-center ${className}`}>
      <div className="w-full max-w-md px-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

