import { BlogPost, resolveImageUrl, getFitFromUrl } from "@/services/blogService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeaturedArticleProps {
  blog: BlogPost;
  getReadingTime: (content: string | undefined) => string;
}

export default function FeaturedArticle({ blog, getReadingTime }: FeaturedArticleProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/blogs/${blog.slug}`)}
      className="group relative overflow-hidden border border-primary/20 bg-gradient-to-br from-[#0e0e15] via-[#12121c] to-[#1a1a2e] hover:border-primary/40 transition-all duration-300 shadow-xl hover:shadow-primary/5 cursor-pointer rounded-2xl md:p-1"
      tabIndex={0}
      aria-label={`Read Featured Article: ${blog.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/blogs/${blog.slug}`);
        }
      }}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Left side cover image */}
        <div className="relative w-full md:w-[50%] lg:w-[55%] aspect-video md:aspect-[1.6] overflow-hidden bg-muted/20 md:rounded-l-xl">
          <img
            src={resolveImageUrl(blog.coverImage)}
            alt={blog.title}
            className={`w-full h-full object-${getFitFromUrl(blog.coverImage) || "cover"} group-hover:scale-[1.01] transition-transform duration-500 ease-out`}
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#12121c]/90 via-transparent to-transparent opacity-90" />
          
          {/* Featured badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-gradient-to-r from-primary to-accent border-none text-white text-[10px] font-bold py-1 px-3 shadow-md shadow-primary/20 flex items-center gap-1 rounded-full uppercase tracking-wider">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Featured
            </Badge>
            {blog.genres && blog.genres.length > 0 && (
              <Badge className="bg-black/75 text-foreground backdrop-blur-sm border border-white/5 text-[9px] font-semibold py-1 px-2.5 rounded-md uppercase">
                {blog.genres[0].name}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Right side contents */}
        <CardContent className="p-6 md:p-8 flex flex-col justify-center flex-1 w-full md:w-[50%] lg:w-[45%]">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4 font-semibold">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {new Date(blog.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {getReadingTime(blog.content)}
            </span>
            {blog.views !== undefined && blog.views !== null && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  {blog.views} views
                </span>
              </>
            )}
          </div>
          
          {/* Title */}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight mb-3 group-hover:text-primary transition-colors duration-200">
            {blog.title}
          </h2>
          
          {/* Excerpt description */}
          <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed mb-6 line-clamp-3">
            {blog.summary}
          </p>
          
          {/* Author footer */}
          <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-r from-primary to-accent p-[1px] flex items-center justify-center">
                <div className="h-full w-full rounded-full bg-[#12121c] flex items-center justify-center text-primary font-black text-xs uppercase">
                  {blog.author?.displayName?.substring(0, 2) || "AD"}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-none">
                  {blog.author?.displayName || "Admin"}
                </span>
                <span className="text-[10px] text-muted-foreground/75 mt-0.5">OtakuTV Editor</span>
              </div>
            </div>
            
            <Button
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white text-[11px] font-bold h-9 px-4 rounded-xl shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 border-none group/btn hover:scale-[1.01]"
            >
              Read Full Article
              <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
