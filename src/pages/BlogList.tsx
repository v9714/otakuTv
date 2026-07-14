import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO, BreadcrumbSchema } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Calendar, User, BookOpen, Clock, Loader2, ArrowRight } from "lucide-react";
import { getBlogs, BlogPost, resolveImageUrl } from "@/services/blogService";
import { genreService, Genre } from "@/services/genreService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function BlogList() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await genreService.getAllGenres();
        if (response.success) {
          setGenres(response.data);
        }
      } catch (e) {
        console.error("Failed to load genres", e);
      }
    };
    fetchGenres();
  }, []);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true);
        const data = await getBlogs({
          page: currentPage,
          limit: 9,
          search: searchQuery || undefined,
          genre: selectedGenre === "All" ? undefined : selectedGenre
        });
        setBlogs(data.blogs);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        toast.error("Failed to load articles");
      } finally {
        setLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      fetchBlogData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchQuery, selectedGenre]);

  // Reading time estimation helper
  const getReadingTime = (content: string | undefined): string => {
    if (!content) return "2 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.max(Math.ceil(words / 200), 1);
    return `${minutes} min read`;
  };

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

      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-[1400px] space-y-8">
            
            {/* Header Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border p-8 md:p-12">
              <div className="absolute inset-0 bg-grid-white/5" />
              <div className="relative max-w-2xl space-y-4">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                  OtakuTV Editorial
                </Badge>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                  Anime News, Reviews & Articles
                </h1>
                <p className="text-muted-foreground text-base md:text-lg">
                  Explore deep dives, rankings, and structural reviews of your favorite anime series and manga chapters.
                </p>
              
              {/* Search input */}
              <div className="relative max-w-md pt-2">
                <Search className="absolute left-3.5 top-5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  placeholder="Search articles, series reviews..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 py-5 bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Genre Filters Scrollable tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            <Button
              variant={selectedGenre === "All" ? "default" : "outline"}
              onClick={() => {
                setSelectedGenre("All");
                setCurrentPage(1);
              }}
              size="sm"
              className="rounded-full text-xs font-semibold shrink-0"
            >
              All Topics
            </Button>
            {genres.map((genre) => (
              <Button
                key={genre.id}
                variant={selectedGenre === genre.name ? "default" : "outline"}
                onClick={() => {
                  setSelectedGenre(genre.name);
                  setCurrentPage(1);
                }}
                size="sm"
                className="rounded-full text-xs font-semibold shrink-0"
              >
                {genre.name}
              </Button>
            ))}
          </div>

          {/* Blogs Grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden border border-border bg-card">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-5 space-y-3">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />
                      <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-xl bg-card">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-xl font-bold">No articles found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                We couldn't find any articles matching "{searchQuery}" under {selectedGenre}. Try resetting filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
              {blogs.map((blog) => (
                <Card
                  key={blog.id}
                  onClick={() => navigate(`/blogs/${blog.slug}`)}
                  className="group overflow-hidden border border-border bg-gradient-to-br from-card via-card/95 to-card/90 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-lg cursor-pointer"
                >
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={resolveImageUrl(blog.coverImage)}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <CardContent className="p-5 flex flex-col justify-between h-[230px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(blog.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getReadingTime(blog.content)}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {blog.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {blog.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate max-w-[100px] font-medium text-foreground">
                          {blog.author?.displayName || "Admin"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {blog.views}
                        </span>
                        <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                          Read <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages >= 1 && (
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 pt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 text-xs sm:text-sm h-8 sm:h-10"
              >
                Previous
              </Button>
              {(() => {
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
                return pages.map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className="text-muted-foreground px-1 sm:px-2 text-xs sm:text-sm">
                        ...
                      </span>
                    );
                  }
                  return (
                    <Button
                      key={`page-${p}`}
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(p as number);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                        currentPage === p ? "shadow-md shadow-primary/20 scale-105" : ""
                      }`}
                    >
                      {p}
                    </Button>
                  );
                });
              })()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 text-xs sm:text-sm h-8 sm:h-10"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
