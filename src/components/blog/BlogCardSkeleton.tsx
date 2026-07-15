import { Card, CardContent } from "@/components/ui/card";

export default function BlogCardSkeleton() {
  return (
    <Card className="border border-white/5 bg-[#0c0c10]/95 rounded-2xl flex flex-col h-full overflow-hidden animate-pulse">
      {/* Cover image skeleton */}
      <div className="aspect-video bg-white/5 w-full" />
      
      <CardContent className="p-4 flex flex-col flex-1 space-y-3">
        {/* Metadata line skeleton */}
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-white/5 rounded" />
          <div className="h-3 w-4 bg-white/5 rounded" />
          <div className="h-3 w-16 bg-white/5 rounded" />
        </div>
        
        {/* Title line skeletons */}
        <div className="space-y-2 py-1">
          <div className="h-4 bg-white/10 rounded w-[90%]" />
          <div className="h-4 bg-white/10 rounded w-[60%]" />
        </div>
        
        {/* Description line skeletons */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-[80%]" />
        </div>
        
        {/* Footer line skeleton */}
        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-white/5" />
            <div className="h-3 w-12 bg-white/5 rounded" />
          </div>
          <div className="h-3 w-12 bg-white/5 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
