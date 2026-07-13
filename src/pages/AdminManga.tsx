import React, { useEffect, useState, useCallback } from "react";
import { adminMangaService } from "@/services/adminMangaService";
import { Manga } from "@/services/mangaService";
import { genreService, Genre } from "@/services/genreService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, LayoutGrid, List, Upload, X, Loader2, BookOpen, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MANGA_API_URL } from "@/utils/constants";
import { MangaPagination } from "@/components/admin/MangaPagination";

const AdminManga = () => {
    const [manga, setManga] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentManga, setCurrentManga] = useState<Manga | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const itemsPerPage = 15;

    // Form states
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "Ongoing",
        author: "",
        artist: "",
        releaseYear: ""
    });
    const [files, setFiles] = useState<{ cover?: File; banner?: File }>({});
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);

    const fetchManga = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminMangaService.getMangaForAdmin(
                currentPage,
                itemsPerPage,
                {
                    search: searchQuery || undefined,
                    status: statusFilter
                }
            );
            if (res.success) {
                setManga(res.data.manga);
                setTotalPages(res.data.totalPages);
                setTotalCount(res.data.total);
            }
        } catch (error) {
            toast.error("Failed to fetch manga list");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, statusFilter]);

    useEffect(() => {
        fetchManga();
        fetchGenres();
    }, [fetchManga]);

    const fetchGenres = async () => {
        try {
            const res = await genreService.getAllGenres();
            if (res.success) setAvailableGenres(res.data);
        } catch (error) {
            console.error("Error fetching genres:", error);
        }
    };

    const handleEdit = (m: Manga) => {
        setCurrentManga(m);
        setFormData({
            title: m.title,
            description: m.description || "",
            status: m.status || "Ongoing",
            author: m.author || "",
            artist: m.artist || "",
            releaseYear: m.releaseYear?.toString() || ""
        });
        // Extract genre IDs from manga if genres exist
        const genreIds = m.genres?.map(g => g.genre?.id || g.genreId) || [];
        setSelectedGenres(genreIds.filter(id => id !== undefined));
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to soft-delete this manga?")) return;
        try {
            const res = await adminMangaService.deleteManga(id);
            if (res.success) {
                toast.success("Manga soft-deleted");
                fetchManga();
            }
        } catch (error) {
            toast.error("Failed to delete manga");
        }
    };

    const handleHardDelete = async (id: number) => {
        if (!confirm("⚠️ PERMANENT DELETE: This will remove all database records and physical files relative to this manga and its chapters. This action CANNOT be undone. Proceed?")) return;
        try {
            const res = await adminMangaService.hardDeleteManga(id);
            if (res.success) {
                toast.success("Manga PERMANENTLY deleted");
                fetchManga();
            }
        } catch (error) {
            toast.error("Permanent deletion failed");
        }
    };

    const handleRestore = async (m: Manga) => {
        try {
            const data = new FormData();
            data.append("isDeleted", "false");
            const res = await adminMangaService.updateManga(m.id, data);
            if (res.success) {
                toast.success("Manga restored");
                fetchManga();
            }
        } catch (error) {
            toast.error("Failed to restore manga");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value) data.append(key, value);
        });

        // Add genres as JSON array
        if (selectedGenres.length > 0) {
            data.append('genres', JSON.stringify(selectedGenres));
        }

        if (files.cover) data.append("coverImage", files.cover);
        if (files.banner) data.append("bannerImage", files.banner);

        try {
            let res;
            if (currentManga) {
                res = await adminMangaService.updateManga(currentManga.id, data);
            } else {
                res = await adminMangaService.createManga(data);
            }

            if (res.success) {
                toast.success(currentManga ? "Manga updated" : "Manga created");
                setIsDialogOpen(false);
                fetchManga();
                resetForm();
            }
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setCurrentManga(null);
        setFormData({ title: "", description: "", status: "Ongoing", author: "", artist: "", releaseYear: "" });
        setFiles({});
        setSelectedGenres([]);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#0f0f12] text-white p-6">
                <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            Manga Management
                        </h1>
                        <p className="text-muted-foreground text-sm">Create and manage your manga library</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20">
                                <Plus className="w-4 h-4 mr-2" /> Add Manga
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1a1a20] border-white/10 text-white w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{currentManga ? "Edit Manga" : "Add New Manga"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="bg-black/20 border-white/10"
                                            placeholder="Manga Title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm"
                                        >
                                            <option value="Ongoing">Ongoing</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Hiatus">Hiatus</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Release Year</Label>
                                        <Input
                                            type="number"
                                            placeholder="2024"
                                            value={formData.releaseYear}
                                            onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                                            className="bg-black/20 border-white/10"
                                            min="1900"
                                            max="2100"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Author</Label>
                                        <Input
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Artist</Label>
                                        <Input
                                            value={formData.artist}
                                            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-black/20 border-white/10 min-h-[100px]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cover Image</Label>
                                        <Input
                                            type="file"
                                            onChange={(e) => setFiles({ ...files, cover: e.target.files?.[0] })}
                                            className="bg-black/20 border-white/10"
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Banner Image</Label>
                                        <Input
                                            type="file"
                                            onChange={(e) => setFiles({ ...files, banner: e.target.files?.[0] })}
                                            className="bg-black/20 border-white/10"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                {/* Genres Selection */}
                                <div className="space-y-2">
                                    <Label>Genres (Select multiple)</Label>
                                    <div className="bg-black/20 border border-white/10 rounded-md p-3 max-h-48 overflow-y-auto genre-checkbox-list">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {availableGenres.map((genre) => (
                                                <label
                                                    key={genre.id}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGenres.includes(genre.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedGenres([...selectedGenres, genre.id]);
                                                            } else {
                                                                setSelectedGenres(selectedGenres.filter(id => id !== genre.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="text-sm text-foreground">{genre.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {availableGenres.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">No genres available</p>
                                        )}
                                    </div>
                                    {selectedGenres.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {selectedGenres.length} genre(s) selected
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {currentManga ? "Update Manga" : "Create Manga"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search and Filters */}
                <Card className="bg-[#1a1a20] border-white/10 mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search manga by title..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10 bg-black/20 border-white/10"
                                />
                            </div>
                            <select
                                value={statusFilter || ""}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value || undefined);
                                    setCurrentPage(1);
                                }}
                                className="bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm min-w-[150px]"
                            >
                                <option value="">All Status</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Hiatus">Hiatus</option>
                            </select>
                        </div>
                        {totalCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-3">
                                Showing {manga.length} of {totalCount} manga
                            </p>
                        )}
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Loading manga database...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {manga.map((m) => (
                            <Card key={m.id} className="bg-[#1a1a20] border-none overflow-hidden group hover:ring-2 hover:ring-purple-500/50 transition-all duration-300">
                                <div className="aspect-[3/4] relative">
                                    <img
                                        src={`${MANGA_API_URL}${m.coverImage?.startsWith('/') ? '' : '/'}${m.coverImage?.replace(/\\/g, '/')}`}
                                        alt={m.title}
                                        className={`w-full h-full object-cover transition-all ${m.isDeleted ? 'grayscale blur-[2px] opacity-50' : 'grayscale-[0.3] group-hover:grayscale-0'}`}
                                    />
                                    {m.isDeleted && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-lg z-10">
                                            Soft Deleted
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4">
                                        <h3 className={`font-bold text-lg line-clamp-1 ${m.isDeleted ? 'text-red-300' : ''}`}>{m.title}</h3>
                                        <p className="text-xs text-muted-foreground mb-3">{m.author}</p>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 h-8 text-xs" onClick={() => handleEdit(m)}>
                                                <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                                            </Button>
                                            <Link to={`/admin/manga/${m.id}/chapters`}>
                                                <Button size="sm" className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/20 h-8 text-xs">
                                                    <BookOpen className="w-3.5 h-3.5 mr-1" /> Chapters
                                                </Button>
                                            </Link>
                                            <div className="flex flex-col gap-1 ml-auto">
                                                {!m.isDeleted ? (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 h-7 w-7 p-0"
                                                        onClick={() => handleDelete(m.id)}
                                                        title="Soft Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 h-7 w-7 p-0"
                                                        onClick={() => handleRestore(m)}
                                                        title="Restore"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 rotate-45" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="bg-red-600 text-white hover:bg-red-700 h-7 w-7 p-0 shadow-lg"
                                                    onClick={() => handleHardDelete(m.id)}
                                                    title="Permanent Delete"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && manga.length > 0 && (
                    <MangaPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminManga;
