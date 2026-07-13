import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  User,
  Clock,
  Eye,
  Heart,
  Share2,
  ChevronLeft,
  Tv,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

// Services
import { getBlogBySlug, BlogPost, resolveImageUrl } from "@/services/blogService";
import { getAnimeById } from "@/services/api";
import { mangaService } from "@/services/mangaService";

export default function BlogDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // References state
  const [linkedAnime, setLinkedAnime] = useState<any>(null);
  const [linkedManga, setLinkedManga] = useState<any>(null);

  // Scroll Progress indicator
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch blog data
  useEffect(() => {
    const loadBlog = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await getBlogBySlug(slug);
        setBlog(data);
        
        // Randomize initial likes count based on views
        setLikesCount(Math.floor(data.views * 0.15) + 12);

        // Load linked Anime reference if exists
        if (data.animeId) {
          try {
            const animeData = await getAnimeById(data.animeId);
            if (animeData) setLinkedAnime(animeData);
          } catch (e) {
            console.error("Failed to load linked anime", e);
          }
        }

        // Load linked Manga reference if exists
        if (data.mangaId) {
          try {
            const mangaData = await mangaService.getMangaDetails(data.mangaId);
            if (mangaData.success) setLinkedManga(mangaData.data);
          } catch (e) {
            console.error("Failed to load linked manga", e);
          }
        }

      } catch (error) {
        console.error("Error loading blog details:", error);
        toast.error("Failed to load the article");
        navigate("/blogs");
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
  }, [slug, navigate]);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
      toast.success("Removed like");
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
      toast.success("Liked article!");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const getReadingTime = (content: string | undefined): string => {
    if (!content) return "2 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.max(Math.ceil(words / 200), 1);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Fetching article...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Article not found</h2>
          <Button onClick={() => navigate("/blogs")} className="mt-4">
            Return to Blogs
          </Button>
        </div>
      </Layout>
    );
  }

  const absoluteUrl = window.location.href;
  const publishedDate = new Date(blog.createdAt).toISOString();

  return (
    <Layout>
      {/* Article Schema SEO JSON-LD */}
      <SEO
        title={`${blog.title} | OtakuTV Blog`}
        description={blog.summary}
        image={resolveImageUrl(blog.coverImage)}
        url={`/blogs/${blog.slug}`}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "description": blog.summary,
            "image": resolveImageUrl(blog.coverImage),
            "url": absoluteUrl,
            "datePublished": publishedDate,
            "dateModified": publishedDate,
            "author": {
              "@type": "Person",
              "name": blog.author?.displayName || "Admin"
            },
            "publisher": {
              "@type": "Organization",
              "name": "OtakuTV",
              "logo": {
                "@type": "ImageObject",
                "url": "https://otakutv.in/favicon.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": absoluteUrl
            }
          })}
        </script>
      </Helmet>

      {/* Fixed top scroll reading progress */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-accent z-[9999] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="min-h-screen bg-background pb-20 pt-6">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/blogs")}
            className="mb-6 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Articles
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left sidebar widgets: Likes, Shares */}
            <div className="lg:col-span-1 flex lg:flex-col lg:items-center justify-start gap-4 lg:sticky lg:top-24 h-fit">
              <Button
                variant={liked ? "default" : "outline"}
                size="icon"
                onClick={handleLike}
                className={`rounded-full shadow-md transition-all duration-300 ${
                  liked
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500 scale-110"
                    : "hover:text-red-500 hover:border-red-500"
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
              </Button>
              <div className="text-[10px] text-muted-foreground font-semibold lg:-mt-2 lg:mb-2 text-center w-full">
                {likesCount}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="rounded-full shadow-md hover:text-primary hover:border-primary transition-colors"
                title="Copy Share Link"
              >
                <Share2 className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const commentsEl = document.getElementById("comments-section");
                  if (commentsEl) {
                    commentsEl.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="rounded-full shadow-md hover:text-accent hover:border-accent transition-colors"
                title="Comments"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Cover Banner */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border">
                <img
                  src={resolveImageUrl(blog.coverImage)}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Meta details over cover banner */}
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 space-y-3 w-full">
                  <div className="flex flex-wrap gap-2">
                    {blog.genres.map((g) => (
                      <Badge key={g.id} className="bg-primary/80 backdrop-blur-sm text-white">
                        {g.name}
                      </Badge>
                    ))}
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                    {blog.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {blog.author?.displayName || "Admin"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(blog.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {getReadingTime(blog.content)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {blog.views} views
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Blockquote */}
              <div className="p-4 border-l-4 border-primary bg-card/60 backdrop-blur-sm rounded-r-lg text-muted-foreground italic text-base">
                "{blog.summary}"
              </div>

              {/* Rich-Text content rendered via prose */}
              <article
                className="prose dark:prose-invert prose-purple max-w-none prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: blog.content || "" }}
              />

              {/* Comments Section placeholder */}
              <div id="comments-section" className="border-t pt-8 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Discussion (0)
                </h3>
                <div className="bg-card p-6 rounded-xl border text-center text-muted-foreground text-sm">
                  Comments are currently locked for archiving. Join our Discord server to discuss!
                </div>
              </div>

            </div>

            {/* Right sidebar references widgets: Linked Anime/Manga */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Linked Anime card */}
              {linkedAnime && (
                <Card className="border shadow-md overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    <img
                      src={linkedAnime.coverImage}
                      alt={linkedAnime.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary hover:bg-primary flex items-center gap-1">
                        <Tv className="h-3 w-3" />
                        Anime Ref
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-bold text-sm line-clamp-1">{linkedAnime.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">{linkedAnime.synopsis}</p>
                    <Link to={`/watch/${linkedAnime.id}/episode/1`}>
                      <Button className="w-full text-xs font-semibold mt-1" size="sm">
                        Watch Now
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Linked Manga card */}
              {linkedManga && (
                <Card className="border shadow-md overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    <img
                      src={linkedManga.coverImage}
                      alt={linkedManga.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-accent hover:bg-accent flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Manga Ref
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-bold text-sm line-clamp-1">{linkedManga.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">{linkedManga.description}</p>
                    <Link to={`/manga/read/${linkedManga.id}`}>
                      <Button className="w-full text-xs font-semibold mt-1" size="sm" variant="secondary">
                        Read Now
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
