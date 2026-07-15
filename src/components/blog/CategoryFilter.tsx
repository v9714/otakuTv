import { Genre } from "@/services/genreService";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1.2s infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
      `}} />

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Explore Topics
        </h2>
        <span className="text-xs sm:text-sm font-semibold text-primary/90 flex items-center gap-1 select-none">
          Swipe to explore 
          <span className="inline-block animate-bounce-x text-primary font-bold">→</span>
        </span>
      </div>
      
      {/* Relative container with edge fade masks to signal horizontal scrolling availability */}
      <div className="relative group/scroll">
        {/* Right edge fade overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#060608] via-[#060608]/70 to-transparent pointer-events-none z-10" />
        
        {/* Left edge fade overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#060608] to-transparent pointer-events-none z-10 opacity-40" />

        {/* Category Pills container - scrollable and no scrollbar */}
        <div 
          className="flex gap-2 overflow-x-auto pb-2.5 pt-0.5 scroll-smooth select-none no-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex gap-2 pr-16 no-scrollbar">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => onSelectCategory(category)}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl border transition-all duration-200 transform active:scale-95 shrink-0 text-xs font-semibold ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-accent border-none text-white shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-[#0c0c0e]/95 hover:bg-white/5 border-white/5 text-muted-foreground hover:text-white"
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${category}`}
                >
                  <span>🏷️</span>
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
