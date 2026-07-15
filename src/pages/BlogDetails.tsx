import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO, BreadcrumbSchema } from "@/components/SEO";
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
  Loader2,
  Bookmark,
  Copy,
  FileText,
  Send,
  Image
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

// Modals & Auth
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Comments Section
import { CommentsSection } from "@/components/anime/watch/CommentsSection";

// Services
import { 
  getBlogBySlug, 
  BlogPost, 
  resolveImageUrl, 
  toggleBlogLike, 
  getBlogLikeStatus, 
  toggleBlogBookmark, 
  getBlogBookmarkStatus,
  incrementBlogViews,
  getFitFromUrl,
  getSuggestedBlogs
} from "@/services/blogService";
import { getAnimeById } from "@/services/api";
import { mangaService } from "@/services/mangaService";

export default function BlogDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestedBlogs, setSuggestedBlogs] = useState<BlogPost[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);

  // Interaction State
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(false);

  // Auth Modals State
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");
  const [promptAction, setPromptAction] = useState("like this article");

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);

  // References state
  const [linkedAnime, setLinkedAnime] = useState<any>(null);
  const [linkedManga, setLinkedManga] = useState<any>(null);

  // Scroll Progress indicator
  const [scrollProgress, setScrollProgress] = useState(0);

  // View count increment tracker
  const viewIncremented = useRef(false);

  // Reset view tracker when slug changes
  useEffect(() => {
    viewIncremented.current = false;
  }, [slug]);

  // Increment view count exactly once per session per blog post
  useEffect(() => {
    if (blog && !viewIncremented.current) {
      viewIncremented.current = true;
      const sessionKey = `viewed_blog_${blog.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "true");
        // Optimistically increment local views count
        setBlog(prev => prev ? { ...prev, views: prev.views + 1 } : null);
        incrementBlogViews(blog.slug).catch(err => {
          console.error("Failed to increment views:", err);
        });
      }
    }
  }, [blog]);

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

  // Fetch blog details
  useEffect(() => {
    const loadBlog = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await getBlogBySlug(slug);
        setBlog(data);
        
        // Use the actual likesCount from backend
        setLikesCount(data.likesCount || 0);

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

  // Fetch suggested blogs
  useEffect(() => {
    const loadSuggested = async () => {
      if (!slug) return;
      try {
        setSuggestedLoading(true);
        const data = await getSuggestedBlogs(slug);
        setSuggestedBlogs(data || []);
      } catch (error) {
        console.error("Error loading suggested blogs:", error);
      } finally {
        setSuggestedLoading(false);
      }
    };
    loadSuggested();
  }, [slug]);

  // Fetch like & bookmark status when currentUser or blog changes
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!blog) return;

      // Fetch like status if logged in
      if (currentUser) {
        try {
          const statusRes = await getBlogLikeStatus(blog.id);
          if (statusRes.success) {
            setLiked(statusRes.data.isLiked);
            setLikesCount(statusRes.data.totalLikes);
          }
        } catch (e) {
          console.error("Failed to get like status:", e);
        }

        try {
          const bookmarkRes = await getBlogBookmarkStatus(blog.id);
          if (bookmarkRes.success) {
            setBookmarked(bookmarkRes.data.isBookmarked);
          }
        } catch (e) {
          console.error("Failed to get bookmark status:", e);
        }
      }
    };

    fetchStatuses();
  }, [blog, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      setPromptAction("like this article");
      setShowLoginPrompt(true);
      return;
    }

    if (!blog || interactionLoading) return;

    try {
      setInteractionLoading(true);
      const newStatus = !liked;
      
      // Optimistic update
      setLiked(newStatus);
      setLikesCount(prev => newStatus ? prev + 1 : Math.max(0, prev - 1));

      const res = await toggleBlogLike(blog.id);
      if (res.success) {
        setLiked(res.data.isLiked);
        setLikesCount(res.data.totalLikes);
        toast.success(res.data.isLiked ? "Liked article!" : "Removed like");
      } else {
        // Revert
        setLiked(!newStatus);
        setLikesCount(prev => newStatus ? Math.max(0, prev - 1) : prev + 1);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to toggle like");
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      setPromptAction("bookmark this article");
      setShowLoginPrompt(true);
      return;
    }

    if (!blog || interactionLoading) return;

    try {
      setInteractionLoading(true);
      const newStatus = !bookmarked;

      // Optimistic update
      setBookmarked(newStatus);

      const res = await toggleBlogBookmark(blog.id);
      if (res.success) {
        setBookmarked(res.data.isBookmarked);
        toast.success(res.data.isBookmarked ? "Bookmarked article!" : "Removed bookmark");
      } else {
        setBookmarked(!newStatus);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to toggle bookmark");
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleSignIn = () => {
    setShowLoginPrompt(false);
    setAuthView("signin");
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setShowLoginPrompt(false);
    setAuthView("signup");
    setShowAuthModal(true);
  };

  const getReadingTime = (content: string | undefined): string => {
    if (!content) return "2 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.max(Math.ceil(words / 200), 1);
    return `${minutes} min read`;
  };

  const getReadableContent = (htmlContent: string) => {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    return doc.body.textContent || "";
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleCopyFormatted = () => {
    if (!blog) return;
    const dateStr = new Date(blog.createdAt).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    
    const formatted = `=========================================
📖 ARTICLE: ${blog.title}
=========================================
✍️ Author: ${blog.author?.displayName || "Admin"}
📅 Published: ${dateStr}
⏱️ Reading Time: ${getReadingTime(blog.content)}
🔗 Article URL: ${window.location.href}

📝 SUMMARY:
"${blog.summary}"

-----------------------------------------
CONTENT:
${getReadableContent(blog.content || "")}
-----------------------------------------
✨ Shared via OtakuTV`;

    navigator.clipboard.writeText(formatted);
    toast.success("Formatted blog copied to clipboard!");
  };

  const getAbsoluteImageUrl = (path: string) => {
    const resolved = resolveImageUrl(path);
    if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
      return resolved;
    }
    const origin = window.location.origin;
    return `${origin}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
  };

  const fetchImageAsPngBlob = async (url: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas conversion to blob failed"));
          }
        }, "image/png");
      };
      img.onerror = () => {
        reject(new Error("Failed to load image resource"));
      };
      img.src = url;
    });
  };

  const handleCopyWithCover = async () => {
    if (!blog) return;
    const absoluteImgUrl = getAbsoluteImageUrl(blog.coverImage);
    const dateStr = new Date(blog.createdAt).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    
    const plainText = `📖 ARTICLE: ${blog.title}
✍️ Author: ${blog.author?.displayName || "Admin"}
📅 Published: ${dateStr}
🔗 URL: ${window.location.href}

📝 SUMMARY:
"${blog.summary}"

${getReadableContent(blog.content || "")}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #111; max-width: 650px; line-height: 1.6; padding: 16px; border: 1px solid #eaeaea; border-radius: 12px; background: #fff;">
        <img src="${absoluteImgUrl}" alt="${blog.title}" style="width: 100%; border-radius: 8px; margin-bottom: 16px; aspect-ratio: 16/9; object-fit: cover;" />
        <h1 style="color: #6d28d9; margin-bottom: 8px; font-size: 24px;">${blog.title}</h1>
        <p style="color: #666; font-size: 13px; margin-bottom: 16px;">
          <strong>Author:</strong> ${blog.author?.displayName || "Admin"} | 
          <strong>Published:</strong> ${dateStr} | 
          <strong>Link:</strong> <a href="${window.location.href}">${window.location.href}</a>
        </p>
        <blockquote style="border-left: 4px solid #6d28d9; padding-left: 12px; color: #444; font-style: italic; margin-bottom: 20px; font-size: 14px; background: #f9f9f9; padding: 10px 12px; border-radius: 0 8px 8px 0;">
          "${blog.summary}"
        </blockquote>
        <div style="font-size: 14px; color: #333;">
          ${blog.content || ""}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 24px;" />
        <p style="font-size: 11px; color: #999; text-align: center; margin-bottom: 0;">Shared via OtakuTV</p>
      </div>
    `;
    
    toast.loading("Processing cover image...");
    
    try {
      const imageBlob = await fetchImageAsPngBlob(absoluteImgUrl);
      const textBlob = new Blob([plainText], { type: "text/plain" });
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      
      const clipboardItem = new ClipboardItem({
        "image/png": imageBlob,
        "text/plain": textBlob,
        "text/html": htmlBlob
      });
      
      toast.dismiss();
      await navigator.clipboard.write([clipboardItem]);
      toast.success("Article text and Cover Image copied successfully!");
    } catch (err) {
      console.warn("Failed to copy binary image blob directly, copying HTML template fallback:", err);
      try {
        const textBlob = new Blob([plainText], { type: "text/plain" });
        const htmlBlob = new Blob([htmlContent], { type: "text/html" });
        
        const clipboardItem = new ClipboardItem({
          "text/plain": textBlob,
          "text/html": htmlBlob
        });
        
        toast.dismiss();
        await navigator.clipboard.write([clipboardItem]);
        toast.success("Copied article with cover URL (Image copy restricted by browser settings)");
      } catch (fallbackErr) {
        toast.dismiss();
        navigator.clipboard.writeText(plainText);
        toast.success("Copied article content (plain text)");
      }
    }
  };

  const handleNativeShare = async () => {
    if (!blog) return;
    try {
      await navigator.share({
        title: blog.title,
        text: blog.summary,
        url: window.location.href
      });
      toast.success("Shared successfully!");
    } catch (e: any) {
      // AbortError is normal when user cancels the native share sheet
      if (e.name !== 'AbortError') {
        console.error("Native share failed", e);
        toast.error("Native share is not supported on this browser");
      }
    }
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

  // Dynamically generate SEO-friendly keywords from title and genres
  const blogKeywords = blog.genres && blog.genres.length > 0
    ? blog.genres.map(g => g.name.toLowerCase()).join(", ")
    : "anime, manga, review, news, guide";
  const titleKeywords = blog.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(" ")
    .filter(w => w.length > 3)
    .slice(0, 8)
    .join(", ");
  const seoKeywords = `${titleKeywords}, ${blogKeywords}, otakutv, watch anime online, free anime streaming`;

  return (
    <Layout>
      {/* Article Schema SEO JSON-LD */}
      <SEO
        title={`${blog.title} | OtakuTV Blog`}
        description={blog.summary}
        image={resolveImageUrl(blog.coverImage)}
        url={`/blogs/${blog.slug}`}
        keywords={seoKeywords}
      />
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://otakutv.in" },
          { name: "Blogs", url: "https://otakutv.in/blogs" },
          { name: blog.title, url: absoluteUrl }
        ]}
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
            "keywords": seoKeywords,
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

      <div className="min-h-screen bg-background pb-24 pt-6">
        <div className="container mx-auto px-4 max-w-[1400px]">
          
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
            
            {/* Left sidebar widgets: Likes, Bookmarks, Shares */}
            <div className="hidden lg:flex lg:col-span-1 lg:flex-col lg:items-center justify-start gap-4 lg:sticky lg:top-24 h-fit">
              <Button
                variant={liked ? "default" : "outline"}
                size="icon"
                onClick={handleLike}
                disabled={interactionLoading}
                className={`rounded-full shadow-md transition-all duration-300 ${
                  liked
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500 scale-110"
                    : "hover:text-red-500 hover:border-red-500"
                }`}
                title="Like Article"
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
              </Button>
              <div className="text-[10px] text-muted-foreground font-semibold lg:-mt-2 lg:mb-2 text-center w-full">
                {likesCount}
              </div>

              <Button
                variant={bookmarked ? "default" : "outline"}
                size="icon"
                onClick={handleBookmark}
                disabled={interactionLoading}
                className={`rounded-full shadow-md transition-all duration-300 ${
                  bookmarked
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary scale-110"
                    : "hover:text-primary hover:border-primary"
                }`}
                title="Bookmark Article"
              >
                <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowShareModal(true)}
                className="rounded-full shadow-md hover:text-primary hover:border-primary transition-colors"
                title="Share Article"
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
                  className={`w-full h-full object-${getFitFromUrl(blog.coverImage)}`}
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

              {/* Comments Section */}
              <div id="comments-section" className="border-t pt-8 space-y-4">
                <CommentsSection contentType="blog" contentId={String(blog.id)} />
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

              {/* Suggested Blogs Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Suggested Reads
                  </h3>
                </div>
                
                {suggestedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex gap-3 animate-pulse">
                        <div className="w-20 h-14 bg-muted rounded-lg" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 bg-muted rounded w-3/4" />
                          <div className="h-2 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestedBlogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No suggested blogs found.</p>
                ) : (
                  <div className="space-y-3">
                    {suggestedBlogs.map((item) => (
                      <Link 
                        key={item.id} 
                        to={`/blogs/${item.slug}`}
                        className="group flex gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-white/5"
                      >
                        <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted/20">
                          <img
                            src={resolveImageUrl(item.coverImage)}
                            alt={item.title}
                            className={`w-full h-full object-${getFitFromUrl(item.coverImage) || "cover"} group-hover:scale-[1.05] transition-transform duration-300`}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                          <h4 className="font-semibold text-xs text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-2.5 w-2.5" />
                              {item.views} views
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border/60 bg-background/80 backdrop-blur-lg shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <div className="flex justify-around items-center py-2.5 px-4 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={interactionLoading}
            className={`flex flex-col gap-0.5 items-center h-auto py-1 hover:bg-transparent ${
              liked ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            <span className="text-[10px] font-semibold">{likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={interactionLoading}
            className={`flex flex-col gap-0.5 items-center h-auto py-1 hover:bg-transparent ${
              bookmarked ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
            <span className="text-[10px] font-semibold">{bookmarked ? "Saved" : "Save"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const commentsEl = document.getElementById("comments-section");
              if (commentsEl) {
                commentsEl.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="flex flex-col gap-0.5 items-center h-auto py-1 text-muted-foreground hover:bg-transparent"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Comment</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="flex flex-col gap-0.5 items-center h-auto py-1 text-muted-foreground hover:bg-transparent"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Share</span>
          </Button>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-[420px] rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Share2 className="h-5 w-5 text-primary" />
              Share Article
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Choose how you want to share this article with your friends.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 mt-4">
            {typeof navigator.share !== "undefined" && (
              <Button onClick={handleNativeShare} className="w-full flex items-center justify-start gap-3 bg-primary hover:bg-primary/95 text-white">
                <Send className="h-4 w-4" />
                <span>Native Share</span>
              </Button>
            )}

            <Button onClick={handleCopyLink} variant="outline" className="w-full flex items-center justify-start gap-3 hover:bg-primary/5 hover:text-primary transition-all">
              <Copy className="h-4 w-4" />
              <span>Copy Link Only</span>
            </Button>

            <Button onClick={handleCopyFormatted} variant="outline" className="w-full flex items-center justify-start gap-3 hover:bg-primary/5 hover:text-primary transition-all">
              <FileText className="h-4 w-4" />
              <span>Copy Formatted Article Text</span>
            </Button>

            <Button onClick={handleCopyWithCover} variant="outline" className="w-full flex items-center justify-start gap-3 hover:bg-primary/5 hover:text-primary transition-all">
              <Image className="h-4 w-4" />
              <span>Copy with Cover Image</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Modals */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        action={promptAction}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView={authView}
      />
    </Layout>
  );
}
