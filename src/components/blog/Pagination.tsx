import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers with ellipses
  const getPages = () => {
    const pages: (number | string)[] = [];
    const range = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - range && i <= currentPage + range)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-8 sm:mt-12 flex-wrap">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (currentPage > 1) {
            onPageChange(currentPage - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        disabled={currentPage === 1}
        className="px-2.5 sm:px-3.5 text-xs h-8 sm:h-9 bg-[#0c0c0e]/95 hover:bg-white/5 border-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Previous Page"
      >
        Prev
      </Button>

      {/* Page numbers */}
      {pages.map((p, idx) => {
        if (p === "...") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="text-muted-foreground px-1 sm:px-2 text-xs"
            >
              ...
            </span>
          );
        }

        const isCurrent = currentPage === p;

        return (
          <Button
            key={`page-${p}`}
            variant={isCurrent ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onPageChange(p as number);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs font-semibold rounded-xl transition-all ${
              isCurrent
                ? "bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white shadow-md shadow-primary/20 scale-105 border-none"
                : "bg-[#0c0c0e]/95 hover:bg-white/5 border-white/5 text-muted-foreground hover:text-white"
            }`}
            aria-label={`Page ${p}`}
            aria-current={isCurrent ? "page" : undefined}
          >
            {p}
          </Button>
        );
      })}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        disabled={currentPage === totalPages}
        className="px-2.5 sm:px-3.5 text-xs h-8 sm:h-9 bg-[#0c0c0e]/95 hover:bg-white/5 border-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Next Page"
      >
        Next
      </Button>
    </div>
  );
}
