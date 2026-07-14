import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AudioProvider } from "@/contexts/AudioContext";

import { DevelopmentNotice } from "@/components/DevelopmentNotice";
import { QUERY_CONFIG } from "@/utils/constants";

// Lazy-load all pages for performance
const Home = React.lazy(() => import("./pages/Home"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AnimeDetails = React.lazy(() => import("./pages/AnimeDetails"));
const AnimeWatch = React.lazy(() => import("./pages/AnimeWatch"));
const AnimeList = React.lazy(() => import("./pages/AnimeList"));
const Episodes = React.lazy(() => import("./pages/Episodes"));
const Search = React.lazy(() => import("./pages/Search"));
const Contact = React.lazy(() => import("./pages/Contact"));
const UserProfile = React.lazy(() => import("./pages/UserProfile"));
const AudioSettings = React.lazy(() => import("./pages/AudioSettings"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = React.lazy(() => import("./pages/VerifyEmail"));

// Admin lazy loads (grouped together)
const AdminDashboard = React.lazy(() => import("./pages/Admin"));
const AdminAnime = React.lazy(() => import("./pages/AdminAnime"));
const AdminEpisodes = React.lazy(() => import("./pages/AdminEpisodes"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));
const AdminGenres = React.lazy(() => import("./pages/AdminGenres"));
const AdminOptions = React.lazy(() => import("./pages/AdminOptions"));
const AdminLogs = React.lazy(() => import("./pages/AdminLogs"));

// Manga lazy loads
const MangaHome = React.lazy(() => import("./pages/MangaHome"));
const MangaList = React.lazy(() => import("./pages/MangaList"));
const MangaDetails = React.lazy(() => import("./pages/MangaDetails"));
const MangaReader = React.lazy(() => import("./pages/MangaReader"));
const AdminManga = React.lazy(() => import("./pages/AdminManga"));
const AdminChapters = React.lazy(() => import("./pages/AdminChapters"));

// Blog lazy loads
const BlogList = React.lazy(() => import("./pages/BlogList"));
const BlogDetails = React.lazy(() => import("./pages/BlogDetails"));
const AdminBlogs = React.lazy(() => import("./pages/AdminBlogs"));
const AdminBlogEditor = React.lazy(() => import("./pages/AdminBlogEditor"));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground font-medium">Loading OtakuTV...</p>
    </div>
  </div>
);

// Simple Error Boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">The application encountered a critical error. Please refresh the page.</p>
          <pre className="p-4 bg-muted rounded-md text-xs max-w-full overflow-auto mb-4">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create Query Client for API requests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
      retry: QUERY_CONFIG.RETRY_COUNT,
      staleTime: QUERY_CONFIG.STALE_TIME,
    },
  },
});

const isAnimeEnabled = import.meta.env.VITE_ANIME_ENABLED !== 'false';

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark">
            <AuthProvider>
              <AudioProvider>
                <TooltipProvider>
                  {/* Toaster components */}
                  <Toaster />
                  <Sonner />
                  <DevelopmentNotice />

                  <React.Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Main Routes */}
                      <Route path="/" element={isAnimeEnabled ? <Home /> : <Navigate to="/manga" replace />} />
                      {isAnimeEnabled && <Route path="/anime" element={<AnimeList />} />}
                      {isAnimeEnabled && <Route path="/anime/:id" element={<AnimeDetails />} />}
                      {isAnimeEnabled && <Route path="/watch/:encoded" element={<AnimeWatch />} />}
                      {isAnimeEnabled && <Route path="/episodes" element={<Episodes />} />}
                      <Route path="/search" element={<Search />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route path="/audio-settings" element={<AudioSettings />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />

                      {/* Manga Routes */}
                      <Route path="/manga" element={<MangaHome />} />
                      <Route path="/manga/browse" element={<MangaList />} />
                      <Route path="/browse" element={<Navigate to="/manga/browse" replace />} />
                      <Route path="/manga/:id" element={<MangaDetails />} />
                      <Route path="/read/:mangaId/chapter/:chapterId" element={<MangaReader />} />

                      {/* Blog Routes */}
                      <Route path="/blogs" element={<BlogList />} />
                      <Route path="/blogs/:slug" element={<BlogDetails />} />

                      {/* Admin Routes */}
                      <Route path="/admin" element={<AdminDashboard />} />
                      {isAnimeEnabled && <Route path="/admin/anime" element={<AdminAnime />} />}
                      {isAnimeEnabled && <Route path="/admin/episodes" element={<AdminEpisodes />} />}
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/genres" element={<AdminGenres />} />
                      <Route path="/admin/options" element={<AdminOptions />} />
                      <Route path="/admin/logs" element={<AdminLogs />} />
                      <Route path="/admin/manga" element={<AdminManga />} />
                      <Route path="/admin/manga/:mangaId/chapters" element={<AdminChapters />} />
                      <Route path="/admin/blogs" element={<AdminBlogs />} />
                      <Route path="/admin/blogs/new" element={<AdminBlogEditor />} />
                      <Route path="/admin/blogs/edit/:id" element={<AdminBlogEditor />} />

                      {/* Catch-all Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </React.Suspense>
                </TooltipProvider>
              </AudioProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
