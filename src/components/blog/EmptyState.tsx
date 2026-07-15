import { Button } from "@/components/ui/button";
import { BookOpen, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset: () => void;
}

export default function EmptyState({
  title = "No Articles Found",
  description = "We couldn't find any articles matching your search query or selected topic filter.",
  onReset
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] max-w-lg mx-auto space-y-6">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 animate-pulse-slow">
        <BookOpen className="h-8 w-8" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
          {description}
        </p>
      </div>
      
      <Button
        variant="outline"
        onClick={onReset}
        className="bg-primary/5 hover:bg-primary/10 border-primary/30 text-white text-xs font-semibold rounded-xl px-5 py-2.5 transition-all duration-200 flex items-center gap-2 group"
      >
        <RotateCcw className="h-3.5 w-3.5 group-hover:rotate-45 transition-transform duration-200" />
        Reset Filters
      </Button>
    </div>
  );
}
