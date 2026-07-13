import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  Loader2,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// Services
import {
  createBlog,
  updateBlog,
  getBlogBySlug,
  uploadInlineImage,
  resolveImageUrl,
  getBlogGenres,
  BlogPost
} from "@/services/blogService";
import { searchAnime } from "@/services/api";
import { mangaService } from "@/services/mangaService";

// TipTap Editor
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

const AdminBlogEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  
  // Relations
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [relatedAnimeId, setRelatedAnimeId] = useState<number | null>(null);
  const [relatedMangaId, setRelatedMangaId] = useState<number | null>(null);

  // Lists & Searches
  const [allGenres, setAllGenres] = useState<Array<{ id: number; name: string }>>([]);
  const [animeSearchQuery, setAnimeSearchQuery] = useState("");
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [mangaSearchQuery, setMangaSearchQuery] = useState("");
  const [mangaList, setMangaList] = useState<any[]>([]);

  // Loaders
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);

  // TipTap configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg border shadow-md max-w-full my-4"
        }
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer"
        }
      }),
      Placeholder.configure({
        placeholder: "Start writing your amazing article content here..."
      })
    ],
    content: "",
  });

  // Slug auto-generation from Title
  useEffect(() => {
    if (!isEditMode && title) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
      setSlug(generated);
    }
  }, [title, isEditMode]);

  // Fetch Genres from admin endpoint (returns ALL genres, not just anime-linked ones)
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genres = await getBlogGenres();
        setAllGenres(genres);
      } catch (e) {
        console.error("Failed to load genres", e);
      }
    };
    fetchGenres();
  }, []);

  // Fetch Anime lookup
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (animeSearchQuery.trim().length > 1) {
        try {
          const response = await searchAnime(animeSearchQuery, 1, 10);
          setAnimeList(response.data || []);
        } catch (e) {
          console.error("Anime search error", e);
        }
      } else {
        setAnimeList([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [animeSearchQuery]);

  // Fetch Manga lookup
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (mangaSearchQuery.trim().length > 1) {
        try {
          const response = await mangaService.searchManga(mangaSearchQuery, 1, 10);
          if (response.success) {
            setMangaList(response.data.data || []);
          }
        } catch (e) {
          console.error("Manga search error", e);
        }
      } else {
        setMangaList([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [mangaSearchQuery]);

  // Load existing blog details if editing
  useEffect(() => {
    if (isEditMode) {
      const loadBlog = async () => {
        try {
          setIsLoadingBlog(true);
          // Wait, is there a getBlogById endpoint?
          // Public routes only has GET /api/blogs/:slug.
          // Since we might not have slug on page load, wait, let's see.
          // Actually, we can fetch all blogs and find the one with matching ID, OR if we had a getBlogById endpoint on the backend.
          // Wait! In content-service routes we have:
          // admin.blog.routes.js -> PUT /:id
          // blog.controller.js -> getBlogPostBySlug checks GET /api/blogs/:slug
          // Can we fetch by slug? But how do we get the slug if we only have the ID in the route URL `/admin/blogs/edit/:id`?
          // Ah! Let's check if the backend has a get blog by ID or if we can make a query.
          // Wait! Is there an endpoint GET /api/blogs/:slug? Yes.
          // If the edit route URL has the ID, how do we load it?
          // Let's check if we can write a simple endpoint or fetch it.
          // Wait! The backend has:
          // `GET /api/blogs/:slug`
          // Let's modify the frontend edit route to pass the SLUG instead of ID! Or we can load the blog details.
          // Wait, let's check what routes are registered.
          // In `App.tsx` we can define:
          // `/admin/blogs/edit/:slug` instead of `/admin/blogs/edit/:id`!
          // Yes! Since slug is unique and URL-friendly, passing the slug to the edit route is extremely easy and works perfectly because we have `getBlogBySlug(slug)` ready!
          // Let's use `slug` instead of `id` in the editor page parameter!
          // Let's name the URL parameter `slug`. E.g. `/admin/blogs/edit/:slug`.
          // That is a genius and clean solution that bypasses having to add a new GET by ID endpoint!
          // Let's check. Yes, that is very simple!
        } catch (e) {
          // ignore
        }
      };
      loadBlog();
    }
  }, [id]);

  // Helper to load blog details using the slug
  useEffect(() => {
    if (isEditMode && id) {
      const loadBlogData = async () => {
        try {
          setIsLoadingBlog(true);
          const blog = await getBlogBySlug(id); // here `id` is the slug parameter
          setTitle(blog.title);
          setSlug(blog.slug);
          setSummary(blog.summary);
          setStatus(blog.status);
          setSelectedGenres(blog.genres.map(g => g.id));
          setRelatedAnimeId(blog.animeId || null);
          setRelatedMangaId(blog.mangaId || null);
          if (blog.coverImage) {
            setCoverImageUrl(resolveImageUrl(blog.coverImage));
          }
          if (editor && blog.content) {
            editor.commands.setContent(blog.content);
          }
        } catch (error) {
          toast.error("Failed to load article details");
          navigate("/admin/blogs");
        } finally {
          setIsLoadingBlog(false);
        }
      };
      if (editor) {
        loadBlogData();
      }
    }
  }, [id, editor]);

  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  // Inline image insertion inside TipTap
  const handleInsertImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e: any) => {
      if (e.target.files && e.target.files[0] && editor) {
        const file = e.target.files[0];
        const loadingToast = toast.loading("Uploading image...");
        try {
          const relativeUrl = await uploadInlineImage(file);
          const absoluteUrl = resolveImageUrl(relativeUrl);
          
          // Prompt for alignment
          const align = prompt("Align image? Enter: left, right, or center", "center") || "center";
          const alignmentClass = `align-${align.trim()}`;
          
          // Insert image HTML with class
          editor
            .chain()
            .focus()
            .insertContent(`<img src="${absoluteUrl}" class="${alignmentClass}" alt="Image" />`)
            .run();

          toast.dismiss(loadingToast);
          toast.success("Image uploaded and inserted");
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload image");
        }
      }
    };
    fileInput.click();
  };

  // Submit / Save
  const handleSave = async (saveStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!editor || editor.isEmpty) {
      toast.error("Please write some content");
      return;
    }

    try {
      setIsSaving(true);
      const contentHtml = editor.getHTML();
      
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", contentHtml);
      formData.append("summary", summary.trim());
      formData.append("status", saveStatus);
      
      if (coverImageFile) {
        formData.append("coverImage", coverImageFile);
      } else if (coverImageUrl && !coverImageUrl.startsWith("blob:")) {
        // If we have an existing cover image path, send it as coverImageUrl
        const relativePath = coverImageUrl.replace(resolveImageUrl(""), "");
        formData.append("coverImageUrl", relativePath);
      }

      if (relatedAnimeId) formData.append("animeId", relatedAnimeId.toString());
      if (relatedMangaId) formData.append("mangaId", relatedMangaId.toString());
      
      // Serialize genres array to JSON string for backend multer parser
      formData.append("genres", JSON.stringify(selectedGenres));

      if (isEditMode) {
        // Wait, for update we need the database ID of the blog.
        // Let's get it. Since we fetched the blog details, we can keep the database ID in a state.
        // Let's find out if getBlogBySlug returns the database ID.
        // Yes, getBlogBySlug returns BlogPost which has `id: number`!
        // Let's load the blog object when fetching, and save it in state.
        const blogObj = await getBlogBySlug(id!); // fetch again or use a local state.
        await updateBlog(blogObj.id, formData);
        toast.success("Article updated successfully");
      } else {
        await createBlog(formData);
        toast.success("Article created successfully");
      }

      navigate("/admin/blogs");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save article");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  if (isLoadingBlog) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 font-medium">Loading article data...</span>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/blogs")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-anime-primary to-anime-secondary bg-clip-text text-transparent">
                {isEditMode ? "Edit Article" : "Compose New Article"}
              </h1>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => handleSave("DRAFT")}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave("PUBLISHED")}
                disabled={isSaving}
                className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-secondary hover:from-primary/95 hover:to-secondary/95 text-white"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Metadata Settings (Left Sidebar) */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border shadow-md">
                <CardContent className="p-6 space-y-5">
                  <h3 className="font-semibold text-lg border-b pb-2">Article Metadata</h3>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="blog-title">Title</Label>
                    <Input
                      id="blog-title"
                      placeholder="e.g. Solo Leveling Season 2 Review"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <Label htmlFor="blog-slug">URL Slug</Label>
                    <Input
                      id="blog-slug"
                      placeholder="auto-generated-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="bg-background font-mono text-xs"
                    />
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <Label htmlFor="blog-summary">Summary (Card Snippet)</Label>
                    <Textarea
                      id="blog-summary"
                      placeholder="Write a brief catchphrase summary (max 200 chars)..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value.slice(0, 200))}
                      rows={3}
                      className="bg-background resize-none text-sm"
                    />
                    <div className="text-[10px] text-right text-muted-foreground">
                      {summary.length}/200 characters
                    </div>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <Label>Cover Image Banner</Label>
                    {coverImageUrl ? (
                      <div className="relative group rounded-lg overflow-hidden border aspect-video">
                        <img
                          src={coverImageUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer bg-primary text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary/90 flex items-center gap-1.5">
                            <Upload className="h-3 w-3" />
                            Change Banner
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors aspect-video">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                        <span className="text-xs font-medium">Select Cover Image file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Genre Multi-Select */}
                  <div className="space-y-2">
                    <Label>Article Genres</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border rounded-md bg-background">
                      {allGenres.map((genre) => {
                        const isSelected = selectedGenres.includes(genre.id);
                        return (
                          <Badge
                            key={genre.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer text-xs transition-colors"
                            onClick={() => toggleGenre(genre.id)}
                          >
                            {genre.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Anime Reference Link */}
                  <div className="space-y-2">
                    <Label>Link to Anime (Optional)</Label>
                    <Input
                      placeholder="Search Anime..."
                      value={animeSearchQuery}
                      onChange={(e) => setAnimeSearchQuery(e.target.value)}
                      className="bg-background text-sm"
                    />
                    {animeList.length > 0 && (
                      <div className="border rounded-md bg-card shadow-lg max-h-40 overflow-y-auto text-xs p-1 space-y-1">
                        {animeList.map((a: any) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setRelatedAnimeId(a.id);
                              setAnimeSearchQuery(a.title);
                              setAnimeList([]);
                            }}
                            className={`p-2 rounded hover:bg-primary/20 cursor-pointer ${relatedAnimeId === a.id ? "bg-primary/30" : ""}`}
                          >
                            {a.title}
                          </div>
                        ))}
                      </div>
                    )}
                    {relatedAnimeId && (
                      <div className="flex justify-between items-center text-xs bg-primary/10 border p-2 rounded">
                        <span>Linked to Anime ID: {relatedAnimeId}</span>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setRelatedAnimeId(null);
                            setAnimeSearchQuery("");
                          }}
                          className="h-auto p-1 text-destructive"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Manga Reference Link */}
                  <div className="space-y-2">
                    <Label>Link to Manga (Optional)</Label>
                    <Input
                      placeholder="Search Manga..."
                      value={mangaSearchQuery}
                      onChange={(e) => setMangaSearchQuery(e.target.value)}
                      className="bg-background text-sm"
                    />
                    {mangaList.length > 0 && (
                      <div className="border rounded-md bg-card shadow-lg max-h-40 overflow-y-auto text-xs p-1 space-y-1">
                        {mangaList.map((m: any) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setRelatedMangaId(m.id);
                              setMangaSearchQuery(m.title);
                              setMangaList([]);
                            }}
                            className={`p-2 rounded hover:bg-primary/20 cursor-pointer ${relatedMangaId === m.id ? "bg-primary/30" : ""}`}
                          >
                            {m.title}
                          </div>
                        ))}
                      </div>
                    )}
                    {relatedMangaId && (
                      <div className="flex justify-between items-center text-xs bg-primary/10 border p-2 rounded">
                        <span>Linked to Manga ID: {relatedMangaId}</span>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setRelatedMangaId(null);
                            setMangaSearchQuery("");
                          }}
                          className="h-auto p-1 text-destructive"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rich Text Editor (Right Main Section) */}
            <div className="lg:col-span-8 flex flex-col space-y-2">
              <Label className="text-base font-semibold">Article Content</Label>
              
              {editor && (
                <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-t-md border-x border-t">
                  <Button
                    size="sm"
                    variant={editor.isActive("bold") ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("italic") ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("blockquote") ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("codeBlock") ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("bulletList") ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={editor.isActive("orderedList") ? "default" : "ghost"}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleInsertImage}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Insert Image
                  </Button>
                </div>
              )}

              <div className="tiptap-editor overflow-y-auto">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBlogEditor;
