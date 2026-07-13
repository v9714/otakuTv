import { contentApi } from "./backendApi";
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
  createdAt: string;
  author: {
    id: number;
    displayName: string;
    avatarUrl: string | null;
  };
  genres: Array<{ id: number; name: string }>;
  animeId?: number | null;
  mangaId?: number | null;
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
  if (!path) return "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=60";
  if (path.startsWith("http")) return path;
  return `${CONTENT_API_URL}${path}`;
};
