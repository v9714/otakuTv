import { contentApi, interactionApi } from "./backendApi";
import { CONTENT_API_URL } from "@/utils/constants";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  summary: string;
  coverImage: string | null;
  views: number;
  status: 'DRAFT' | 'PUBLISHED';
  isCommentOn?: boolean;
  createdAt: string;
  author: {
    id: number;
    displayName: string;
    avatarUrl: string | null;
  };
  genres: Array<{ id: number; name: string }>;
  animeId?: number | null;
  mangaId?: number | null;
  likesCount?: number;
  hasDraftEdits?: boolean;
}

export interface BlogListResponse {
  blogs: BlogPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Get public blog posts
export const getBlogs = async (params: { page?: number; limit?: number; search?: string; genre?: string }): Promise<BlogListResponse> => {
  const response = await contentApi.get("/api/blogs", { params });
  return response.data.data;
};

// Admin: Get all blogs including drafts
export const getAdminBlogs = async (params: { page?: number; limit?: number; search?: string; status?: string }): Promise<BlogListResponse> => {
  const response = await contentApi.get("/api/admin/blogs", { params });
  return response.data.data;
};

// Admin: Get all genres for blog editor selector
export const getBlogGenres = async (): Promise<Array<{ id: number; name: string }>> => {
  const response = await contentApi.get("/api/admin/blogs/genres");
  return response.data.data;
};

// Get single blog post by slug
export const getBlogBySlug = async (slug: string): Promise<BlogPost> => {
  const response = await contentApi.get(`/api/blogs/${slug}`);
  return response.data.data;
};

// Admin: Get single blog post by ID (including drafts)
export const getAdminBlogById = async (id: number): Promise<BlogPost> => {
  const response = await contentApi.get(`/api/admin/blogs/${id}`);
  return response.data.data;
};

// Admin: Create blog post
export const createBlog = async (formData: FormData): Promise<any> => {
  const response = await contentApi.post("/api/admin/blogs", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// Admin: Update blog post
export const updateBlog = async (id: number, formData: FormData): Promise<any> => {
  const response = await contentApi.put(`/api/admin/blogs/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// Admin: Delete blog post
export const deleteBlog = async (id: number, hard = false): Promise<any> => {
  const response = await contentApi.delete(`/api/admin/blogs/${id}`, {
    params: { hard: hard.toString() }
  });
  return response.data;
};

// Admin: Inline image upload helper
export const uploadInlineImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await contentApi.post("/api/admin/blogs/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data.url;
};

// Resolve Cover Image URL
export const resolveImageUrl = (path: string | null): string => {
  if (!path) return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'><rect width='100%' height='100%' fill='%230f0f13'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='%2327272a' dominant-baseline='middle' text-anchor='middle'>No Image</text></svg>";
  if (path && path.startsWith("http")) return path;
  return `${CONTENT_API_URL}${path}`;
};

// Get Fit type from cover image url/path
export const getFitFromUrl = (path: string | null): "cover" | "contain" | "fill" => {
  if (!path) return "cover";
  if (path.includes("fit=fill")) return "fill";
  if (path.includes("fit=contain")) return "contain";
  return "cover";
};

// Blog Interactions
export const toggleBlogLike = async (blogId: number): Promise<any> => {
  const response = await interactionApi.post("/api/interactions/blog/like", { blogId });
  return response.data;
};

export const getBlogLikeStatus = async (blogId: number): Promise<any> => {
  const response = await interactionApi.get(`/api/interactions/blog/${blogId}/like-status`);
  return response.data;
};

export const toggleBlogBookmark = async (blogId: number): Promise<any> => {
  const response = await interactionApi.post("/api/interactions/blog/bookmark", { blogId });
  return response.data;
};

export const getBlogBookmarkStatus = async (blogId: number): Promise<any> => {
  const response = await interactionApi.get(`/api/interactions/blog/${blogId}/bookmark-status`);
  return response.data;
};

export const incrementBlogViews = async (slug: string): Promise<any> => {
  const response = await contentApi.post(`/api/blogs/${slug}/view`);
  return response.data;
};

// Get suggested blog posts
export const getSuggestedBlogs = async (slug: string): Promise<BlogPost[]> => {
  const response = await contentApi.get(`/api/blogs/${slug}/suggested`);
  return response.data.data;
};

// Download Excel template for bulk upload
export const downloadBulkBlogTemplate = async (): Promise<void> => {
  const response = await contentApi.get("/api/admin/blogs/bulk/template", {
    responseType: "blob"
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "blog_bulk_template.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Upload Excel file for bulk blog import
export const uploadBulkBlogsFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await contentApi.post("/api/admin/blogs/bulk/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};
