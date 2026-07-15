import { BlogPost, resolveImageUrl, getFitFromUrl } from "@/services/blogService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BlogCardProps {
  blog: BlogPost;
  getReadingTime: (content: string | undefined) => string;
}

export default function BlogCard({ blog, getReadingTime }: BlogCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/blogs/${blog.slug}`)}
      className="group relative overflow-hidden border border-white/5 bg-gradient-to-br from-[#0c0c10]/95 via-[#111116]/80 to-[#161620]/50 hover:border-primary/40 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-primary/5 cursor-pointer rounded-2xl flex flex-col h-full focus-within:ring-2 focus-within:ring-primary/50 outline-none"
      tabIndex={0}
      aria-label={`Read article: ${blog.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/blogs/${blog.slug}`);
        }
      }}
    >
      {/* Top line indicator glow */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary to-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
      
      {/* Image cover with fixed aspect ratio */}
      <div className="aspect-video relative overflow-hidden bg-muted/20 rounded-t-2xl">
        <img
          src={resolveImageUrl(blog.coverImage)}
          alt={blog.title}
          loading="lazy"
          className={`w-full h-full object-${getFitFromUrl(blog.coverImage) || "cover"} group-hover:scale-[1.02] transition-transform duration-300 ease-out`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-90" />
        
        {/* Genre Tags */}
        {blog.genres && blog.genres.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {blog.genres.slice(0, 2).map((g) => (
              <Badge 
                key={g.id} 
                className="bg-black/85 text-foreground backdrop-blur-sm border border-white/5 text-[9px] font-semibold py-0.5 px-2 rounded-md uppercase"
              >
                {g.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* Content details */}
      <CardContent className="p-4 flex flex-col flex-1">
        {/* Metadata section */}
        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground mb-2.5 font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            {new Date(blog.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />
            {getReadingTime(blog.content)}
          </span>
        </div>
        
        {/* Title and Excerpt */}
        <h3 className="font-bold text-sm leading-snug line-clamp-2 text-white group-hover:text-primary transition-colors duration-150 mb-1.5 min-h-[2.5rem]">
          {blog.title}
        </h3>
        
        <p className="text-[11px] text-muted-foreground/80 line-clamp-3 leading-relaxed mb-4">
          {blog.summary}
        </p>
        
        {/* Footer info (Aligned to bottom) */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[9px] uppercase">
              {blog.author?.displayName?.substring(0, 2) || "AD"}
            </div>
            <span className="truncate max-w-[80px] text-[10px] font-semibold text-white">
              {blog.author?.displayName || "Admin"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {blog.views !== undefined && blog.views !== null && (
              <span className="flex items-center gap-0.5">
                <Eye className="h-3.5 w-3.5" />
                {blog.views}
              </span>
            )}
            <span className="text-primary font-bold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform duration-150">
              Read <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
