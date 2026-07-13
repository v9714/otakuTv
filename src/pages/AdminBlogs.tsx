import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Edit, Trash2, Eye, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAdminBlogs, deleteBlog, BlogPost, resolveImageUrl } from "@/services/blogService";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteBlogId, setDeleteBlogId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      // Fetch both drafts and published blogs (admin API on the backend filters this, but public getBlogs takes search query)
      // Note: backend getBlogPosts only returns status: 'PUBLISHED'.
      // Wait, is there an admin endpoint to get all blogs including drafts?
      // Let's check blog.controller.js for getBlogPosts.
      // Ah! In blog.controller.js, getBlogPosts has:
      // const where = { isDeleted: false, status: 'PUBLISHED' };
      // Wait, does the backend controller filter by PUBLISHED always?
      // Yes: `where.status = 'PUBLISHED'`.
      // Wait! Is there an admin blog list route? Let's check admin.blog.routes.js:
      // router.post('/', ...); router.put('/:id', ...); router.delete('/:id', ...);
      // Ah, there is NO GET list route for admin in admin.blog.routes.js!
      // Wait! In blog.controller.js:
      // getBlogPosts handles GET /api/blogs.
      // If we are admin, how do we see drafts?
      // In getBlogPosts, we can make it so that if a request is authenticated as admin, it can optionally view all (including drafts) or we can just fetch from /api/blogs.
      // Wait, let's look at getBlogPosts in blog.controller.js:
      // Lines 51-54:
      // const where = { isDeleted: false, status: 'PUBLISHED', };
      // It is hardcoded to status: 'PUBLISHED'!
      // Wait, this means if we save as draft, the public list route won't return it.
      // Can we edit getBlogPosts in backend to allow admins to see drafts, or does it not matter for now?
      // Let's check if we can update the backend controller `getBlogPosts` to check if the user is admin (e.g. from token) and allow fetching drafts if `isAdmin=true` or query parameter `adminView=true`.
      // Yes! In `getBlogPosts` in `/home/kartiksinh/projects/otakutv/otakutv_backend/packages/content-service/src/controllers/blog.controller.js`, there's no auth middleware registered on `router.get('/', getBlogPosts)`.
      // But we can check if a JWT is present or we can register an admin get endpoint, or we can just support `admin=true` if we pass verifyJWT middleware or optional JWT verification.
      // Wait, let's see how they do it in other controllers, or if we can make a simple edit to `getBlogPosts` to support optional status query parameter if user is authenticated.
      // Actually, wait! Let's check if there is an admin endpoint or if we should add one.
      // Let's check `/home/kartiksinh/projects/otakutv/otakutv_backend/packages/content-service/src/controllers/blog.controller.js`.
      // It has `getBlogPosts` (lines 43-130).
      // Let's inspect `getBlogPosts` parameters. It accepts `status` if we update it.
      // Wait, we can modify `getBlogPosts` in `blog.controller.js` to allow query filter `status` if the request is an admin request. But wait, `router.get('/', getBlogPosts)` doesn't have `verifyJWT` or `requireAdmin` in `blog.routes.js`.
      // What if we register `router.get('/', getBlogPosts)` in `admin.blog.routes.js` as well?
      // Or we can just modify `getBlogPosts` in `blog.controller.js` to:
      // ```javascript
      // const status = req.query.status || 'PUBLISHED';
      // // but only admins should be able to see DRAFT status. Let's do that!
      // ```
      // Let's look at `verifyJWT` and user roles.
      // Wait, is there a simple way? If the user is logged in as admin, they can pass token in authorization header, and if we decode it, we can allow viewing drafts.
      // Let's check if we can modify `getBlogPosts` in `blog.controller.js` to allow admins to view all blogs by checking `req.user?.isAdmin` (or checking token).
      // Let's see: `verifyJWT` is imported from `shared` and attaches `req.user`. If `verifyJWT` is not on the route, `req.user` will be undefined.
      // If we register `router.get('/admin-list', getBlogPosts)` in `admin.blog.routes.js`, then that route will have `verifyJWT` and `requireAdmin` active, and `req.user` will be defined!
      // In `getBlogPosts` we can write:
      // ```javascript
      // const where = { isDeleted: false };
      // if (!req.user || !req.user.isAdmin) {
      //   where.status = 'PUBLISHED';
      // } else if (req.query.status) {
      //   where.status = req.query.status;
      // }
      // ```
      // This is a extremely clean, simple, and elegant solution!
      // Let's check if `admin.blog.routes.js` can have:
      // `router.get('/', getBlogPosts);`
      // Wait, in `admin.blog.routes.js`, `router.use(verifyJWT)` and `router.use(requireAdmin)` are applied.
      // So if we define `router.get('/', getBlogPosts)` in `admin.blog.routes.js`, the URL path for admin blogs will be:
      // `GET /api/admin/blogs` -> which is protected and maps to `getBlogPosts`!
      // And inside `getBlogPosts` we check:
      // ```javascript
      //   const where = {
      //     isDeleted: false,
      //   };
      //   
      //   // If called via admin route (req.user is defined), allow status filter, otherwise default to PUBLISHED
      //   if (req.user && req.user.isAdmin) {
      //     if (req.query.status) {
      //       where.status = req.query.status;
      //     }
      //   } else {
      //     where.status = 'PUBLISHED';
      //   }
      // ```
      // This is absolutely perfect! Let's do this change first, or let's write `AdminBlogs.tsx` assuming we get all blogs.
      // Let's implement `AdminBlogs.tsx` first.
    } catch (e) {
      // ignore
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        setLoading(true);
        const response = await getAdminBlogs({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          status: statusFilter
        });
        
        setBlogs(response.blogs);
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.total);
      } catch (error: any) {
        console.error("Error fetching blogs:", error);
        toast.error("Failed to fetch blog list");
      } finally {
        setLoading(false);
      }
    };
    fetchApiData();
  }, [currentPage, searchQuery, statusFilter]);

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      await deleteBlog(id, false); // Soft delete
      toast.success("Blog deleted successfully");
      setBlogs(blogs.filter(b => b.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete blog");
    } finally {
      setIsDeleting(false);
      setDeleteBlogId(null);
    }
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-anime-primary to-anime-secondary bg-clip-text text-transparent">
              Blog Management
            </h1>

            <Button onClick={() => navigate("/admin/blogs/new")} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="h-4 w-4 mr-2" />
              Write New Blog
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-background"
              />
            </div>
            
            <div className="flex gap-2">
              {["ALL", "PUBLISHED", "DRAFT"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className="text-xs"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                All Articles ({totalCount} total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Date Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-16 bg-muted rounded-md animate-pulse" />
                              <div className="space-y-2">
                                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-6 w-16 bg-muted rounded-full animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                          <TableCell className="text-right"><div className="h-8 w-20 ml-auto bg-muted rounded animate-pulse" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">No blog posts found</p>
                  <p className="text-sm">Click "Write New Blog" to get started.</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Date Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogs
                        .filter(blog => statusFilter === "ALL" || blog.status === statusFilter)
                        .map((blog) => (
                          <TableRow key={blog.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={resolveImageUrl(blog.coverImage)}
                                  alt={blog.title}
                                  className="h-12 w-20 rounded-md object-cover shadow-sm border"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-foreground truncate max-w-[280px]">{blog.title}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[280px]">{blog.summary}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {blog.author?.displayName || "Admin"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  blog.status === "PUBLISHED"
                                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
                                    : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20"
                                }
                                variant="outline"
                              >
                                {blog.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Eye className="h-4 w-4" />
                                {blog.views}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(blog.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-primary/10 hover:text-primary"
                                  onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setDeleteBlogId(blog.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Dialog */}
          <AlertDialog open={!!deleteBlogId} onOpenChange={() => setDeleteBlogId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this blog post? It will be soft-deleted and will not be visible to users.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteBlogId && handleDelete(deleteBlogId)}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBlogs;
