
import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ThemeProvider } from "@/lib/ThemeProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Database, Film, ListChecks, LayoutDashboard, Users, Settings, Notebook, Settings2, BookOpen, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar variant="inset" className="border-r border-sidebar-border">
            <SidebarHeader className="pb-4">
              <div className="flex flex-col gap-1 p-2">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-anime-primary to-anime-secondary p-1.5 rounded-md">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-anime-primary to-anime-secondary bg-clip-text text-transparent">
                    OtakuTV
                  </span>
                </div>
                <span className="text-xs text-muted-foreground pl-2">Admin Panel</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link to="/admin">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin"}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${currentPath === "/admin" ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <LayoutDashboard className={`h-5 w-5 transition-colors ${currentPath === "/admin" ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${currentPath === "/admin" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Dashboard</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/anime">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/anime"}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${currentPath === "/admin/anime" ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <Film className={`h-5 w-5 transition-colors ${currentPath === "/admin/anime" ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${currentPath === "/admin/anime" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Anime Management</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/admin/episodes">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/episodes"}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${currentPath === "/admin/episodes" ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <ListChecks className={`h-5 w-5 transition-colors ${currentPath === "/admin/episodes" ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${currentPath === "/admin/episodes" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Episodes</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link to="/admin/genres">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/genres"}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${currentPath === "/admin/genres" ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <Notebook className={`h-5 w-5 transition-colors ${currentPath === "/admin/genres" ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${currentPath === "/admin/genres" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Genre Management
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link to="/admin/options">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/options"}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${currentPath === "/admin/options" ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <Settings2 className={`h-5 w-5 transition-colors ${currentPath === "/admin/options" ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${currentPath === "/admin/options" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Options</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link to="/admin/manga">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/manga" || currentPath.startsWith("/admin/manga/")}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${(currentPath === "/admin/manga" || currentPath.startsWith("/admin/manga/")) ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <BookOpen className={`h-5 w-5 transition-colors ${(currentPath === "/admin/manga" || currentPath.startsWith("/admin/manga/")) ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${(currentPath === "/admin/manga" || currentPath.startsWith("/admin/manga/")) ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Manga</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link to="/admin/blogs">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/blogs" || currentPath.startsWith("/admin/blogs/")}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${(currentPath === "/admin/blogs" || currentPath.startsWith("/admin/blogs/")) ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <FileText className={`h-5 w-5 transition-colors ${(currentPath === "/admin/blogs" || currentPath.startsWith("/admin/blogs/")) ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${(currentPath === "/admin/blogs" || currentPath.startsWith("/admin/blogs/")) ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Blog Management</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link to="/admin/logs">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/logs"}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${currentPath === "/admin/logs" ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <FileText className={`h-5 w-5 transition-colors ${currentPath === "/admin/logs" ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${currentPath === "/admin/logs" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Logs</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link to="/admin/users">
                    <SidebarMenuButton
                      isActive={currentPath === "/admin/users"}
                      className={`hover:bg-sidebar-accent/40 transition-all duration-200 ${currentPath === "/admin/users" ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-l-4 border-primary shadow-lg" : ""}`}
                    >
                      <Users className={`h-5 w-5 transition-colors ${currentPath === "/admin/users" ? "text-primary" : "text-sidebar-foreground"}`} />
                      <span className={`transition-colors ${currentPath === "/admin/users" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"}`}>Users</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/">
                    <SidebarMenuButton className="hover:bg-sidebar-accent/40">
                      <Database className="h-5 w-5" />
                      <span>Back to Site</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm border-b">
              <div className="flex h-14 items-center px-4 gap-2">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4">
                  <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                  <Link to="/admin/anime" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                    Anime List
                  </Link>
                  <Link to="/admin/episodes" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                    Episodes
                  </Link>
                  <Link to="/admin/manga" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                    Manga
                  </Link>
                  <Link to="/admin/blogs" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                    Blogs
                  </Link>
                  <Link to="/admin/contact" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <main className="p-3 sm:p-6 bg-background">
                {children}
              </main>
            </div>
            <Footer />
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
