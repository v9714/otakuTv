
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, Home, Film, Video, BookOpen, Mail, User, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SITE_NAME, ROUTES } from "@/utils/constants";
import { UserAuthButton } from "@/components/auth/UserAuthButton";
import { cn } from "@/lib/utils";
import { useAudio } from "@/contexts/AudioContext";
import { SearchDropdown } from "./SearchDropdown";

const isAnimeEnabled = import.meta.env.VITE_ANIME_ENABLED !== 'false';

export function Header() {
  const { playButtonClick } = useAudio();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      window.location.href = `/search?title=${encodeURIComponent(searchQuery)}`;
    }
  };

  const toggleSearch = () => {
    const newState = !isSearchOpen;
    setIsSearchOpen(newState);
    if (newState) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.trim().length > 0);
  };

  const menuItems = [
    { name: "Home", path: ROUTES.home, icon: Home },
    ...(isAnimeEnabled ? [
      { name: "Anime List", path: ROUTES.anime, icon: Film },
      { name: "Latest Episodes", path: ROUTES.episodes, icon: Video },
    ] : []),
    { name: "Manga", path: "/manga", icon: BookOpen },
    { name: "Blogs", path: "/blogs", icon: FileText },
    { name: "Contact", path: ROUTES.contact, icon: Mail },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setShowDropdown(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  // Transparent/absolute on top, solid bg with smooth fade on scroll
  return (
    <header
      className={cn(
        "fixed top-0 left-0 z-40 w-full transition-all duration-300 ease-in-out",
        isScrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-md"
          : "bg-transparent"
      )}
      style={{
        pointerEvents: "auto",
        transition: "background-color 0.3s ease"
      }}
    >
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to={ROUTES.home} className="flex items-center space-x-2" onClick={playButtonClick}>
            <span className="inline-block font-heading font-bold text-xl md:text-2xl bg-gradient-to-r from-primary via-anime-secondary to-anime-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              {SITE_NAME}
            </span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={playButtonClick}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div ref={searchContainerRef} className={`relative hidden md:flex items-center ${isSearchOpen ? 'w-80' : 'w-10'} transition-all duration-300`}>
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search anime & manga..."
                    className="w-full pl-8 pr-3"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                    autoComplete="off"
                  />
                  {showDropdown && (
                    <SearchDropdown
                      searchQuery={searchQuery}
                      onClose={() => setShowDropdown(false)}
                      inputRef={searchInputRef}
                    />
                  )}
                </div>
              </form>
            ) : (
              <Button variant="ghost" size="icon" onClick={toggleSearch} className="rounded-full">
                <Search className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Search</span>
              </Button>
            )}
          </div>

          <ThemeToggle />

          <UserAuthButton />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[270px] sm:w-[300px]">
              <div className="px-2">
                <Link to={ROUTES.home} className="flex items-center pb-6 pt-4" onClick={playButtonClick}>
                  <span className="font-heading font-bold text-xl bg-gradient-to-r from-primary to-anime-secondary bg-clip-text text-transparent">
                    {SITE_NAME}
                  </span>
                </Link>
              </div>
              <div className="flex flex-col space-y-3 py-4">
                <div className="px-4 py-2">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search anime & manga..."
                        className="w-full pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </form>
                </div>
                <nav className="grid gap-2 px-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={playButtonClick}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent hover:bg-opacity-10"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  <Link
                    to="/profile"
                    onClick={playButtonClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent hover:bg-opacity-10"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
