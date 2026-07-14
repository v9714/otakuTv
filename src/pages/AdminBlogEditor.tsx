import "../styles/AdminBlogEditor.css";
import { useState, useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  Loader2,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Move,
  Trash2,
  Link2,
  Unlink,
  Undo2,
  Redo2,
  SeparatorHorizontal,
  Expand,
  X,
  WrapText,
  FileText,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// Services
import {
  createBlog,
  updateBlog,
  getAdminBlogById,
  uploadInlineImage,
  resolveImageUrl,
  getBlogGenres,
} from "@/services/blogService";
import { CONTENT_API_URL } from "@/utils/constants";
import { searchAnime } from "@/services/api";
import { mangaService } from "@/services/mangaService";

// TipTap Editor
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import HighlightExtension from "@tiptap/extension-highlight";
import TextAlignExtension from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

type ImageAlign = "left" | "center" | "right" | "full";
type ImageTextWrap = "none" | "left" | "right";

const imageWidthForAlign = (align: ImageAlign) => {
  if (align === "full") return "100%";
  if (align === "center") return "70%";
  return "48%";
};

const buildImageStyle = (
  width?: string | null,
  height?: string | null,
  textWrap?: ImageTextWrap | null
) => {
  const styles = [];
  if (width) styles.push(`width: ${width}`);
  if (height) styles.push(`height: ${height}`);
  styles.push("object-fit: cover");

  // Text wrapping via float
  if (textWrap === "left") styles.push("float: left");
  else if (textWrap === "right") styles.push("float: right");

  return styles.join("; ");
};

const parseImageAlign = (element: HTMLElement): ImageAlign => {
  const dataAlign = element.getAttribute("data-align") as ImageAlign | null;
  if (dataAlign && ["left", "center", "right", "full"].includes(dataAlign)) return dataAlign;
  if (element.classList.contains("align-left")) return "left";
  if (element.classList.contains("align-right")) return "right";
  if (element.classList.contains("align-full")) return "full";
  return "center";
};

const parseImageTextWrap = (element: HTMLElement): ImageTextWrap => {
  const dataWrap = element.getAttribute("data-wrap") as ImageTextWrap | null;
  if (dataWrap && ["none", "left", "right"].includes(dataWrap)) return dataWrap;
  const computedFloat = window
    .getComputedStyle(element)
    .getPropertyValue("float")
    .toLowerCase();
  if (computedFloat === "left") return "left";
  if (computedFloat === "right") return "right";
  return "none";
};

const ResizableImageView = ({ node, selected, updateAttributes, deleteNode }: any) => {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width?: string; height?: string }>({});
  const [isResizing, setIsResizing] = useState(false);

  const align = (node.attrs.align || "center") as ImageAlign;
  const textWrap = (node.attrs.textWrap || "none") as ImageTextWrap;
  const width = previewSize.width || node.attrs.width || imageWidthForAlign(align);
  const height = previewSize.height || node.attrs.height || undefined;

  const updateAlign = (nextAlign: ImageAlign) => {
    updateAttributes({
      align: nextAlign,
      width: imageWidthForAlign(nextAlign),
      height: null,
      textWrap: nextAlign === "full" ? "none" : textWrap,
    });
    setPreviewSize({});
  };

  const updateTextWrap = (nextWrap: ImageTextWrap) => {
    updateAttributes({ textWrap: nextWrap });
  };

  const resetSize = () => {
    updateAttributes({ width: null, height: null });
    setPreviewSize({});
  };

  const startResize = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const image = imgRef.current;
    const wrapper = wrapperRef.current;
    const editorRoot = wrapper?.closest(".ProseMirror") as HTMLElement | null;
    if (!image || !editorRoot) return;

    const rect = image.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;
    const aspectRatio = startWidth / startHeight || 1;
    const maxWidth = Math.max(180, editorRoot.clientWidth - 48);

    setIsResizing(true);

    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.round(
        Math.min(Math.max(160, startWidth + moveEvent.clientX - startX), maxWidth)
      );
      let nextHeight = Math.round(Math.max(90, startHeight + moveEvent.clientY - startY));
      if (moveEvent.shiftKey) {
        nextHeight = Math.round(nextWidth / aspectRatio);
      }
      setPreviewSize({ width: `${nextWidth}px`, height: `${nextHeight}px` });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setIsResizing(false);
      setPreviewSize((current) => {
        if (current.width || current.height) {
          updateAttributes({
            width: current.width || node.attrs.width,
            height: current.height || node.attrs.height,
          });
        }
        return {};
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <NodeViewWrapper
      as="figure"
      ref={wrapperRef as any}
      data-align={align}
      data-wrap={textWrap}
      className={`blog-image-node blog-image-node-${align} ${selected ? "is-selected" : ""} ${
        isResizing ? "is-resizing" : ""
      }`}
      style={{ clear: textWrap !== "none" ? "both" : "auto" }}
    >
      <div className="blog-image-frame relative group">
        {selected && (
          <div className="blog-image-controls absolute -top-10 left-0 right-0 flex gap-1 p-1 bg-slate-900 rounded-t-md shadow-lg z-20" contentEditable={false}>
            <button
              type="button"
              title="Move image"
              className="blog-image-control p-1 hover:bg-slate-700 rounded transition"
              data-drag-handle
            >
              <Move className="h-3.5 w-3.5 text-white" />
            </button>
            <div className="border-r border-slate-700" />
            <button
              type="button"
              title="Align left"
              className="blog-image-control p-1 hover:bg-slate-700 rounded transition"
              onClick={() => updateAlign("left")}
            >
              <AlignLeft className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              title="Align center"
              className="blog-image-control p-1 hover:bg-slate-700 rounded transition"
              onClick={() => updateAlign("center")}
            >
              <AlignCenter className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              title="Align right"
              className="blog-image-control p-1 hover:bg-slate-700 rounded transition"
              onClick={() => updateAlign("right")}
            >
              <AlignRight className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              title="Full width"
              className="blog-image-control p-1 hover:bg-slate-700 rounded transition"
              onClick={() => updateAlign("full")}
            >
              <Maximize2 className="h-3.5 w-3.5 text-white" />
            </button>
            <div className="border-r border-slate-700" />
            <button
              type="button"
              title="Wrap text left"
              className={`blog-image-control p-1 rounded transition ${
                textWrap === "left" ? "bg-primary text-white" : "hover:bg-slate-700"
              }`}
              onClick={() => updateTextWrap(textWrap === "left" ? "none" : "left")}
              disabled={align === "full"}
            >
              <AlignLeft className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              title="Wrap text right"
              className={`blog-image-control p-1 rounded transition ${
                textWrap === "right" ? "bg-primary text-white" : "hover:bg-slate-700"
              }`}
              onClick={() => updateTextWrap(textWrap === "right" ? "none" : "right")}
              disabled={align === "full"}
            >
              <AlignRight className="h-3.5 w-3.5 text-white" />
            </button>
            <div className="border-r border-slate-700" />
            <button
              type="button"
              title="Reset size"
              className="blog-image-control p-1 hover:bg-slate-700 rounded transition"
              onClick={resetSize}
            >
              <Undo2 className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              type="button"
              title="Remove image"
              className="blog-image-control p-1 hover:bg-red-700 rounded transition"
              onClick={deleteNode}
            >
              <Trash2 className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        )}

        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || node.attrs.caption || ""}
          title={node.attrs.title || undefined}
          draggable
          className="rounded-lg border border-slate-200 shadow-sm"
          style={{
            width: width || undefined,
            height: height || undefined,
            objectFit: "cover",
            float: textWrap === "left" || textWrap === "right" ? textWrap : undefined
          }}
        />

        {selected && (
          <button
            type="button"
            title="Drag corner to resize (hold Shift to lock aspect ratio)"
            className="blog-image-resize absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize rounded-tl-md opacity-0 group-hover:opacity-100 transition"
            contentEditable={false}
            onMouseDown={startResize}
          />
        )}

        {isResizing && (
          <div
            className="absolute bottom-2 right-2 bg-slate-900 text-white text-xs px-2 py-1 rounded pointer-events-none"
            contentEditable={false}
          >
            {(previewSize.width || "").replace("px", "")} × {(previewSize.height || "").replace("px", "")}
          </div>
        )}
      </div>

      {selected ? (
        <div className="blog-image-caption-edit mt-2" contentEditable={false}>
          <input
            type="text"
            className="w-full px-2 py-1 text-sm border border-slate-200 rounded bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Add a caption (optional)"
            value={node.attrs.caption || ""}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      ) : node.attrs.caption ? (
        <p className="blog-image-caption-text mt-1 text-xs italic text-slate-600 text-center">
          {node.attrs.caption}
        </p>
      ) : null}
    </NodeViewWrapper>
  );
};

const BlogImageExtension = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: parseImageAlign,
        renderHTML: (attributes) => ({
          "data-align": attributes.align || "center",
          class: `blog-image align-${attributes.align || "center"}`,
        }),
      },
      textWrap: {
        default: "none",
        parseHTML: parseImageTextWrap,
        renderHTML: (attributes) => ({
          "data-wrap": attributes.textWrap || "none",
        }),
      },
      width: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-width") || element.style.width || element.getAttribute("width"),
        renderHTML: (attributes) =>
          attributes.width
            ? {
                "data-width": attributes.width,
                style: buildImageStyle(attributes.width, attributes.height, attributes.textWrap),
              }
            : {},
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-height") || element.style.height || element.getAttribute("height"),
        renderHTML: (attributes) => (attributes.height ? { "data-height": attributes.height } : {}),
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") || "",
        renderHTML: (attributes) => (attributes.caption ? { "data-caption": attributes.caption } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

const AdminBlogEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Form State
  const [blogId, setBlogId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [isCommentOn, setIsCommentOn] = useState(true);

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

  // Editor UX state
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Ref for image upload handler
  const imageUploadHandlerRef = useRef<(file: File) => void>(() => {});

  // TipTap configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      BlogImageExtension.configure({
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      UnderlineExtension,
      HighlightExtension.configure({ multicolor: false }),
      TextAlignExtension.configure({
        types: ["heading", "paragraph"],
      }),
      HorizontalRule,
      CharacterCount.configure(),
      Placeholder.configure({
        placeholder: "Start writing your amazing article...",
      }),
    ],
    content: "",
    editorProps: {
      handleDrop: (_view, event, _slice, moved) => {
        const dragEvent = event as DragEvent;
        if (!moved && dragEvent.dataTransfer?.files && dragEvent.dataTransfer.files.length > 0) {
          const file = dragEvent.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            imageUploadHandlerRef.current(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              event.preventDefault();
              imageUploadHandlerRef.current(file);
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      setWordCount(editor.storage.characterCount.words());
    },
  });

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

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

  // Fetch Genres
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
    if (isEditMode && id && editor) {
      const loadBlogData = async () => {
        try {
          setIsLoadingBlog(true);
          const blog = await getAdminBlogById(parseInt(id));
          setBlogId(blog.id);
          setTitle(blog.title);
          setSlug(blog.slug);
          setSummary(blog.summary);
          setStatus(blog.status);
          setIsCommentOn(blog.isCommentOn !== undefined ? blog.isCommentOn : true);
          setSelectedGenres(blog.genres.map((g) => g.id));
          setRelatedAnimeId(blog.animeId || null);
          setRelatedMangaId(blog.mangaId || null);
          if (blog.coverImage) {
            setCoverImageUrl(resolveImageUrl(blog.coverImage));
          }
          if (blog.content) {
            editor.commands.setContent(blog.content);
          }
        } catch (error) {
          toast.error("Failed to load article details");
          navigate("/admin/blogs");
        } finally {
          setIsLoadingBlog(false);
        }
      };
      loadBlogData();
    }
  }, [id, isEditMode, editor]);

  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  // Shared image upload+insert logic
  const handleImageFile = async (file: File) => {
    if (!editor) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const loadingToast = toast.loading("Uploading image...");
    try {
      const relativeUrl = await uploadInlineImage(file);
      const absoluteUrl = resolveImageUrl(relativeUrl);

      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: absoluteUrl,
            alt: "Article image",
            align: "center",
            width: "70%",
          },
        })
        .run();

      toast.dismiss(loadingToast);
      toast.success("Image uploaded and inserted");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to upload image");
    }
  };

  imageUploadHandlerRef.current = handleImageFile;

  // Toolbar: Insert image
  const handleInsertImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e: any) => {
      if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
      }
    };
    fileInput.click();
  };

  // Link handlers
  const openLinkInput = () => {
    if (!editor) return;
    const existingUrl = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(existingUrl || "");
    setShowLinkInput(true);
  };

  const closeLinkInput = () => {
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const applyLink = () => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const finalUrl = /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: finalUrl }).run();
    }
    closeLinkInput();
  };

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    closeLinkInput();
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
      formData.append("slug", slug.trim());
      formData.append("content", contentHtml);
      formData.append("summary", summary.trim());
      formData.append("status", saveStatus);
      formData.append("isCommentOn", String(isCommentOn));

      if (coverImageFile) {
        formData.append("coverImage", coverImageFile);
      } else if (coverImageUrl && !coverImageUrl.startsWith("blob:")) {
        const relativePath = coverImageUrl.startsWith(CONTENT_API_URL)
          ? coverImageUrl.replace(CONTENT_API_URL, "")
          : coverImageUrl;
        formData.append("coverImageUrl", relativePath);
      }

      if (relatedAnimeId) formData.append("animeId", relatedAnimeId.toString());
      if (relatedMangaId) formData.append("mangaId", relatedMangaId.toString());

      formData.append("genres", JSON.stringify(selectedGenres));

      if (isEditMode) {
        const updateId = blogId || Number(id);
        if (!Number.isFinite(updateId)) {
          toast.error("Invalid blog id");
          return;
        }
        await updateBlog(updateId, formData);
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
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
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

  // Main JSX
  return (
    <AdminRoute>
      <AdminLayout>
        {/* Fullscreen Writing Mode */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-background z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">{title || "Untitled Article"}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Exit Focus Mode
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-12 py-8 bg-background">
              <div className="max-w-3xl mx-auto">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground flex justify-between">
              <span>Words: {wordCount}</span>
              <span>Press ESC to exit focus mode</span>
            </div>
          </div>
        )}

        {!isFullscreen && (
          <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/blogs")}
                  className="hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold text-foreground">
                  {isEditMode ? "✏️ Edit Article" : "📝 New Article"}
                </h1>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => handleSave("DRAFT")}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none hover:bg-accent hover:text-accent-foreground"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave("PUBLISHED")}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-lg"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Publish
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Sidebar - Metadata */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border border-border shadow-md">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-bold text-lg border-b-2 border-border pb-3 text-foreground">
                      📋 Article Settings
                    </h3>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="blog-title" className="font-semibold text-foreground/80">
                        Title
                      </Label>
                      <Input
                        id="blog-title"
                        placeholder="e.g. Solo Leveling Season 2 Review"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-background border-border focus:ring-primary/50"
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <Label htmlFor="blog-slug" className="font-semibold text-foreground/80">
                        URL Slug
                      </Label>
                      <Input
                        id="blog-slug"
                        placeholder="auto-generated-slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="bg-background border-border font-mono text-xs focus:ring-primary/50"
                      />
                    </div>

                    {/* Summary */}
                    <div className="space-y-2">
                      <Label htmlFor="blog-summary" className="font-semibold text-foreground/80">
                        Summary
                      </Label>
                      <Textarea
                        id="blog-summary"
                        placeholder="Write a brief summary (max 200 chars)..."
                        value={summary}
                        onChange={(e) => setSummary(e.target.value.slice(0, 200))}
                        rows={3}
                        className="bg-background border-border resize-none text-sm focus:ring-primary/50"
                      />
                      <div className="text-xs text-right text-muted-foreground">{summary.length}/200</div>
                    </div>

                    {/* Comments Toggle */}
                    <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="blog-comments" className="font-semibold text-foreground/80">
                          Comments
                        </Label>
                        <p className="text-xs text-muted-foreground">Allow discussion</p>
                      </div>
                      <Switch checked={isCommentOn} onCheckedChange={setIsCommentOn} />
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground/80">Cover Image</Label>
                      {coverImageUrl ? (
                        <div className="relative group rounded-lg overflow-hidden border border-border aspect-video">
                          <img
                            src={coverImageUrl}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer bg-primary text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary/90 flex items-center gap-1.5 font-medium">
                              <Upload className="h-3 w-3" />
                              Change
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
                        <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors aspect-video">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-xs font-medium text-muted-foreground">Select Cover Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Genres */}
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground/80">Genres</Label>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-border rounded-md bg-muted/20">
                        {allGenres.map((genre) => {
                          const isSelected = selectedGenres.includes(genre.id);
                          return (
                            <Badge
                              key={genre.id}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer text-xs transition-all hover:shadow-sm"
                              onClick={() => toggleGenre(genre.id)}
                            >
                              {genre.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Anime Link */}
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground/80">Link Anime</Label>
                      <Input
                        placeholder="Search anime..."
                        value={animeSearchQuery}
                        onChange={(e) => setAnimeSearchQuery(e.target.value)}
                        className="bg-background border-border text-sm focus:ring-primary/50"
                      />
                      {animeList.length > 0 && (
                        <div className="border border-border rounded-md bg-popover shadow-md max-h-40 overflow-y-auto text-xs p-1 space-y-1">
                          {animeList.map((a: any) => (
                            <div
                              key={a.id}
                              onClick={() => {
                                setRelatedAnimeId(a.id);
                                setAnimeSearchQuery(a.title);
                                setAnimeList([]);
                              }}
                              className={`p-2 rounded cursor-pointer transition ${
                                relatedAnimeId === a.id
                                  ? "bg-primary/20 text-primary font-medium"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              {a.title}
                            </div>
                          ))}
                        </div>
                      )}
                      {relatedAnimeId && (
                        <div className="flex justify-between items-center text-xs bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                          <span className="text-emerald-400 font-medium">Anime ID: {relatedAnimeId}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRelatedAnimeId(null);
                              setAnimeSearchQuery("");
                            }}
                            className="h-6 px-2 text-muted-foreground hover:text-red-500 hover:bg-transparent"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Manga Link */}
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground/80">Link Manga</Label>
                      <Input
                        placeholder="Search manga..."
                        value={mangaSearchQuery}
                        onChange={(e) => setMangaSearchQuery(e.target.value)}
                        className="bg-background border-border text-sm focus:ring-primary/50"
                      />
                      {mangaList.length > 0 && (
                        <div className="border border-border rounded-md bg-popover shadow-md max-h-40 overflow-y-auto text-xs p-1 space-y-1">
                          {mangaList.map((m: any) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setRelatedMangaId(m.id);
                                setMangaSearchQuery(m.title);
                                setMangaList([]);
                              }}
                              className={`p-2 rounded cursor-pointer transition ${
                                relatedMangaId === m.id
                                  ? "bg-primary/20 text-primary font-medium"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              {m.title}
                            </div>
                          ))}
                        </div>
                      )}
                      {relatedMangaId && (
                        <div className="flex justify-between items-center text-xs bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                          <span className="text-emerald-400 font-medium">Manga ID: {relatedMangaId}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRelatedMangaId(null);
                              setMangaSearchQuery("");
                            }}
                            className="h-6 px-2 text-muted-foreground hover:text-red-500 hover:bg-transparent"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Main - Rich Text Editor */}
              <div className="lg:col-span-8 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold text-foreground">✍️ Article Content</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {wordCount} words
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(true)}
                      className="text-muted-foreground hover:bg-muted"
                    >
                      <Expand className="h-4 w-4 mr-1" />
                      Focus
                    </Button>
                  </div>
                </div>

                {editor && (
                  <>
                    {/* Formatting Toolbar */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1 p-3 bg-muted/60 rounded-t-lg border border-border border-b-0">
                        {/* Text Formatting Row */}
                        <div className="flex gap-0.5 border-r border-border pr-1">
                          <Button
                            size="sm"
                            variant={editor.isActive("bold") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            title="Bold (Ctrl+B)"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("italic") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            title="Italic (Ctrl+I)"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("underline") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            title="Underline (Ctrl+U)"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <UnderlineIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("strike") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            title="Strikethrough"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Strikethrough className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("highlight") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleHighlight().run()}
                            title="Highlight"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Highlighter className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Link Row */}
                        <div className="flex gap-0.5 border-r border-border pr-1 pl-1">
                          <Button
                            size="sm"
                            variant={editor.isActive("link") ? "default" : "ghost"}
                            onClick={openLinkInput}
                            title="Add Link"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
                            disabled={!editor.isActive("link")}
                            title="Remove Link"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Headings Row */}
                        <div className="flex gap-0.5 border-r border-border pr-1 pl-1">
                          <Button
                            size="sm"
                            variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            title="Heading 1"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Heading1 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            title="Heading 2"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Heading2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            title="Heading 3"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Heading3 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Block Elements */}
                        <div className="flex gap-0.5 border-r border-border pr-1 pl-1">
                          <Button
                            size="sm"
                            variant={editor.isActive("blockquote") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            title="Quote"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Quote className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("codeBlock") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            title="Code Block"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            title="Horizontal Line"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <SeparatorHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Lists */}
                        <div className="flex gap-0.5 border-r border-border pr-1 pl-1">
                          <Button
                            size="sm"
                            variant={editor.isActive("bulletList") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            title="Bullet List"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive("orderedList") ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            title="Numbered List"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Text Align */}
                        <div className="flex gap-0.5 border-r border-border pr-1 pl-1">
                          <Button
                            size="sm"
                            variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().setTextAlign("left").run()}
                            title="Align Left"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().setTextAlign("center").run()}
                            title="Align Center"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
                            onClick={() => editor.chain().focus().setTextAlign("right").run()}
                            title="Align Right"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Image & Undo/Redo */}
                        <div className="flex gap-0.5 border-r border-border pr-1 pl-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleInsertImage}
                            title="Insert Image (or drag-drop/paste)"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Image
                          </Button>
                        </div>

                        <div className="flex gap-0.5 pl-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            title="Undo"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            title="Redo"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Link Input Popover */}
                      {showLinkInput && (
                        <div className="absolute left-0 right-0 mx-auto max-w-sm bg-popover border border-border rounded-lg shadow-xl p-4 z-50 top-24 text-popover-foreground">
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Add or edit link</p>
                            <input
                              type="text"
                              autoFocus
                              placeholder="https://example.com"
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") applyLink();
                                if (e.key === "Escape") closeLinkInput();
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={applyLink} className="flex-1 bg-primary hover:bg-primary/90">
                                Apply
                              </Button>
                              <Button size="sm" variant="outline" onClick={removeLink}>
                                Remove
                              </Button>
                              <Button size="sm" variant="ghost" onClick={closeLinkInput}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Editor Content Area */}
                    <div className="tiptap-editor flex-1 overflow-y-auto bg-background border border-t-0 border-border rounded-b-lg p-6 shadow-sm focus-within:shadow-md focus-within:border-primary/50 transition-all">
                      <EditorContent editor={editor} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBlogEditor;
