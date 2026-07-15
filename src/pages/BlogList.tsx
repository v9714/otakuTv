import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO, BreadcrumbSchema } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import { getBlogs, BlogPost } from "@/services/blogService";
import { genreService } from "@/services/genreService";
import { toast } from "sonner";

// Reusable Subcomponents
import BlogCard from "@/components/blog/BlogCard";
import FeaturedArticle from "@/components/blog/FeaturedArticle";
import CategoryFilter from "@/components/blog/CategoryFilter";
import BlogCardSkeleton from "@/components/blog/BlogCardSkeleton";
import EmptyState from "@/components/blog/EmptyState";
import Pagination from "@/components/blog/Pagination";

export default function BlogList() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All Stories");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Genre Categories
  const requestedCategories = [
    "All Stories",
    "Action",
    "Adventure",
    "Award Winning",
    "Comedy",
    "Dark Fantasy",
    "Drama",
    "Ecchi",
    "Fantasy",
    "Girls",
    "Manga",
    "Reviews and Editorials"
  ];
  const [categories, setCategories] = useState<string[]>(requestedCategories);

  // Load genres from dynamic API and merge with requested categories
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await genreService.getAllGenres();
        if (response.success) {
          const apiGenreNames = response.data.map(g => g.name);
          const merged = Array.from(new Set([...requestedCategories, ...apiGenreNames]));
          setCategories(merged);
        }
      } catch (e) {
        console.error("Failed to load genres", e);
      }
    };
    fetchGenres();
  }, []);

  // Fetch blogs with dynamic query filtering
  useEffect(() => {
    setLoading(true);
    setError(false);

    const fetchBlogData = async () => {
      try {
        const data = await getBlogs({
          page: currentPage,
          limit: 8,
          search: searchQuery || undefined,
          genre: (selectedGenre === "All Stories" || selectedGenre === "All") ? undefined : selectedGenre
        });
        setBlogs(data.blogs);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError(true);
        toast.error("Failed to load articles");
      } finally {
        setLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      fetchBlogData();
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchQuery, selectedGenre]);

  // Reading time estimation helper
  const getReadingTime = (content: string | undefined): string => {
    if (!content) return "2 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.max(Math.ceil(words / 200), 1);
    return `${minutes} min read`;
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedGenre("All Stories");
    setCurrentPage(1);
  };

  // Determine if featured article should be displayed
  const isFirstPageAll = currentPage === 1 && !searchQuery && (selectedGenre === "All Stories" || selectedGenre === "All");
  const featuredBlog = isFirstPageAll && blogs.length > 0 ? blogs[0] : null;
  const gridBlogs = featuredBlog ? blogs.slice(1) : blogs;

  return (
    <Layout>
      <SEO
        title="Anime Blogs, News & Reviews | OtakuTV"
        description="Read the latest anime & manga reviews, character analysis, season guides, and editorials. High-quality articles curated for otaku community by OtakuTV editors."
        keywords="anime blogs, manga reviews, anime recommendations, otaku articles, anime news, watch anime online, OtakuTV editorials, anime analysis, my anime list reviews"
        url="/blogs"
      />
      
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://otakutv.in" },
          { name: "Blogs", url: "https://otakutv.in/blogs" }
        ]}
      />

      <div className="min-h-screen bg-[#060608] text-foreground relative overflow-hidden py-8 sm:py-12">
        {/* Subtle background glow blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[130px] animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-accent/4 rounded-full blur-[140px] animate-pulse-slow pointer-events-none" />
        <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />

        <div className="container mx-auto px-4 max-w-[1400px] space-y-12 relative z-10">
          
          {/* 1. Blog Introduction Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0c0e]/95 to-[#13131c]/40 backdrop-blur-xl border border-white/5 p-6 md:p-10 shadow-2xl transition-all duration-300 hover:border-white/10">
            <div className="absolute inset-0 bg-grid-white/[0.015] pointer-events-none" />
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
              <div className="space-y-3.5 lg:max-w-2xl md:max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  ⚡ OtakuTV Editorial
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
                  Anime News, Reviews & <span className="text-primary font-black">Editorials</span>
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm max-w-xl leading-relaxed">
                  Discover deep dives, rankings, reviews, and opinion pieces on your favorite anime shows, movies, and manga series.
                </p>
              </div>

              {/* Attractive Search & Stats Card Section */}
              <div className="relative w-full lg:w-[450px] md:w-[400px] p-6 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/5 shadow-xl space-y-4 shrink-0 hover:border-primary/30 focus-within:border-primary/40 transition-all duration-300 group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />
                
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Find Articles</span>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 pr-8 py-3 bg-background/40 border-white/10 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all duration-300 rounded-xl text-foreground placeholder:text-muted-foreground/45 text-xs h-9.5 w-full"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                        }}
                        className="absolute right-3 text-muted-foreground hover:text-white transition-colors duration-150 text-xs font-semibold"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="pt-2.5 border-t border-white/5 space-y-2.5 relative z-10">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Platform
                    </span>
                    <span>Updated Daily</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 text-center">
                    <span className="block font-black text-white text-xs">8</span>
                    <span className="text-muted-foreground text-[8px] uppercase tracking-wide">Editorials Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Category Filter Section */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedGenre}
            onSelectCategory={(category) => {
              setSelectedGenre(category);
              setCurrentPage(1);
            }}
          />

          {/* Error State */}
          {error && (
            <div className="text-center py-16 px-6 border border-dashed border-red-500/20 rounded-3xl bg-red-950/[0.02] max-w-lg mx-auto space-y-6">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Failed to Load Content</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  An error occurred while trying to connect to the server. Please check your connection and try again.
                </p>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  setCurrentPage(currentPage);
                }}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-white text-xs font-semibold rounded-xl px-5 py-2.5 transition-all duration-200"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* 2. Featured Article (Hidden when loading or on errors) */}
          {!loading && !error && featuredBlog && (
            <FeaturedArticle 
              blog={featuredBlog} 
              getReadingTime={getReadingTime} 
            />
          )}

          {/* 4. Latest Stories Section */}
          {!error && (
            <div className="space-y-6">
              {!loading && gridBlogs.length > 0 && (
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h2 className="text-lg font-black tracking-tight text-white/90">
                    Latest Stories
                  </h2>
                  {featuredBlog && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      View All Articles
                    </button>
                  )}
                </div>
              )}

              {/* Grid Layout: Skeletons vs Cards */}
              {loading ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <BlogCardSkeleton key={idx} />
                  ))}
                </div>
              ) : gridBlogs.length === 0 ? (
                /* 5. Empty State */
                <EmptyState onReset={handleResetFilters} />
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {gridBlogs.map((blog) => (
                    <BlogCard 
                      key={blog.id} 
                      blog={blog} 
                      getReadingTime={getReadingTime} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. Pagination */}
          {!loading && !error && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}

        </div>
      </div>
    </Layout>
  );
}
