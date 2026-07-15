import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, Search, Edit, Trash2, Eye, FileText, CheckCircle2, Filter,
  UploadCloud, FileSpreadsheet, AlertTriangle, Loader2, RefreshCw
} from "lucide-react";
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  getAdminBlogs, 
  deleteBlog, 
  BlogPost, 
  resolveImageUrl, 
  getFitFromUrl,
  downloadBulkBlogTemplate,
  uploadBulkBlogsFile
} from "@/services/blogService";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BlogPagination } from "@/components/admin/BlogPagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Bulk Upload State
  const [bulkOpen, setBulkOpen] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkErrorsCount, setBulkErrorsCount] = useState<number | null>(null);
  const [errorFileBase64, setErrorFileBase64] = useState<string | null>(null);
  const [bulkErrorSummary, setBulkErrorSummary] = useState<string | null>(null);

  const itemsPerPage = 5;

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
  }, [currentPage, searchQuery, statusFilter, refreshTrigger]);

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

  const handleDownloadTemplate = async () => {
    try {
      setTemplateLoading(true);
      await downloadBulkBlogTemplate();
      toast.success("Sample template downloaded successfully!");
    } catch (err) {
      console.error("Failed to download template", err);
      toast.error("Failed to download bulk upload template");
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".xlsx")) {
        toast.error("Please upload a valid Excel file (.xlsx)");
        return;
      }
      setSelectedFile(file);
      // Reset error log states
      setBulkErrorsCount(null);
      setErrorFileBase64(null);
      setBulkErrorSummary(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an Excel file first");
      return;
    }

    try {
      setUploadingBulk(true);
      const res = await uploadBulkBlogsFile(selectedFile);
      toast.success(res.message || "Successfully imported blogs!");
      setBulkOpen(false);
      setSelectedFile(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      if (err.response && err.response.status === 422) {
        const errorData = err.response.data?.data;
        if (errorData) {
          setBulkErrorsCount(errorData.errorsCount || 0);
          setErrorFileBase64(errorData.errorFileBase64 || null);
          setBulkErrorSummary(errorData.summary || "Validation failed.");
          toast.error("Validation failed. Check the error log for details.");
        } else {
          toast.error(err.response.data?.message || "Failed to process bulk upload file");
        }
      } else {
        console.error("Bulk upload error", err);
        toast.error(err.response?.data?.message || "An unexpected error occurred during bulk upload");
      }
    } finally {
      setUploadingBulk(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!errorFileBase64) {
      toast.error("Error file data is not available");
      return;
    }
    try {
      const base64Clean = errorFileBase64.replace(/\s/g, ''); // strip any whitespace
      const byteCharacters = window.atob(base64Clean);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bulk_upload_errors.xlsx");
      document.body.appendChild(link);
      link.click();
      
      // Allow browser download pipeline to capture click event before cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success("Error log spreadsheet downloaded successfully! Please correct the failures indicated inside and re-upload.");
    } catch (e: any) {
      console.error("Failed to download error log file", e);
      toast.error("Failed to generate error log file download: " + e.message);
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

            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setBulkOpen(true)} 
                variant="outline" 
                className="border-anime-primary/20 hover:border-anime-primary/50 text-foreground transition-all"
              >
                <UploadCloud className="h-4 w-4 mr-2 text-anime-primary" />
                Bulk Import
              </Button>
              
              <Button onClick={() => navigate("/admin/blogs/new")} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10">
                <PlusCircle className="h-4 w-4 mr-2" />
                Write New Blog
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
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
                
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-background">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

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
                          <TableRow 
                            key={blog.id}
                            className={
                              blog.status === "DRAFT"
                                ? "cursor-default hover:bg-muted/20"
                                : "cursor-pointer hover:bg-muted/50 transition-colors"
                            }
                            onClick={(e) => {
                              // Prevent navigation if clicking action buttons/icons
                              const target = e.target as HTMLElement;
                              if (target.closest('button') || target.closest('a')) {
                                return;
                              }
                              // Prevent public details navigation for draft posts
                              if (blog.status === "DRAFT") {
                                return;
                              }
                              window.open(`/blogs/${blog.slug}`, "_blank");
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={resolveImageUrl(blog.coverImage)}
                                  alt={blog.title}
                                  className={`h-12 w-20 rounded-md object-${getFitFromUrl(blog.coverImage)} shadow-sm border`}
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
                              <div className="flex flex-col gap-1 items-start">
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
                                {blog.hasDraftEdits && (
                                  <Badge
                                    className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0 px-1.5"
                                    variant="outline"
                                  >
                                    STAGED DRAFT
                                  </Badge>
                                )}
                              </div>
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
              {!loading && blogs.length > 0 && (
                <BlogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
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

          {/* Bulk Upload Dialog */}
          <Dialog open={bulkOpen} onOpenChange={(open) => {
            if (!uploadingBulk) {
              setBulkOpen(open);
              if (!open) {
                // Clear state on close
                setSelectedFile(null);
                setBulkErrorsCount(null);
                setErrorFileBase64(null);
                setBulkErrorSummary(null);
              }
            }
          }}>
            <DialogContent className="sm:max-w-[550px] border border-border/50 bg-background/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-anime-primary animate-bounce-subtle" />
                  Bulk Import Blogs
                </DialogTitle>
                <DialogDescription>
                  Upload multiple blog posts simultaneously using a structured Excel template.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                {bulkErrorsCount === null ? (
                  <>
                    {/* Step 1: Download Template */}
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-anime-primary/10 text-anime-primary font-semibold text-sm">
                          1
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold">Download Excel Template</p>
                          <p className="text-xs text-muted-foreground">
                            Get the latest spreadsheet format with dynamic Status validations and database Genres dropdowns.
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        variant="secondary" 
                        onClick={handleDownloadTemplate} 
                        disabled={templateLoading}
                        className="w-full text-xs font-semibold"
                      >
                        {templateLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Generating Template...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                            Download Template File
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Step 2: Upload Excel File */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-anime-primary/10 text-anime-primary font-semibold text-sm">
                          2
                        </div>
                        <p className="text-sm font-semibold">Upload Filled Spreadsheet</p>
                      </div>

                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/80 hover:border-anime-primary/50 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-xs font-medium text-foreground">
                            {selectedFile ? selectedFile.name : "Click to browse or drag & drop Excel file"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Only .xlsx spreadsheet formats are supported
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".xlsx" 
                          onChange={handleFileChange}
                          disabled={uploadingBulk}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Error State View: Only show "Download Error Excel" and "Upload Corrected Excel" */}
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-red-500">Import Failed ({bulkErrorsCount} errors)</p>
                          <p className="text-xs text-muted-foreground leading-normal">
                            {bulkErrorSummary} Database changes were completely rolled back. Download the error log to see row-specific fixes.
                          </p>
                        </div>
                      </div>

                      {errorFileBase64 && (
                        <Button 
                          type="button"
                          onClick={handleDownloadErrors}
                          className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-lg shadow-red-500/10"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Download Error Log (Excel)
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <UploadCloud className="h-4 w-4 text-anime-primary" />
                        Upload Corrected Excel File
                      </p>
                      
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/80 hover:border-anime-primary/50 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-xs font-medium text-foreground">
                            {selectedFile ? selectedFile.name : "Click to browse or drag & drop corrected Excel file"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Upload the corrected .xlsx file here to retry import
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".xlsx" 
                          onChange={handleFileChange}
                          disabled={uploadingBulk}
                        />
                      </label>
                    </div>

                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => {
                        // Reset all errors to start over and show template download option
                        setBulkErrorsCount(null);
                        setErrorFileBase64(null);
                        setBulkErrorSummary(null);
                        setSelectedFile(null);
                      }}
                      className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      Reset / Download Clean Template
                    </Button>
                  </>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-2">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => {
                    setBulkOpen(false);
                    setSelectedFile(null);
                    setBulkErrorsCount(null);
                    setErrorFileBase64(null);
                    setBulkErrorSummary(null);
                  }}
                  disabled={uploadingBulk}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleBulkUpload} 
                  disabled={!selectedFile || uploadingBulk}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
                >
                  {uploadingBulk ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import Blogs"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBlogs;
