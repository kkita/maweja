import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetchJson, apiRequest } from "../../lib/queryClient";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../hooks/use-toast";
import { Images, Video, Trash2, Copy, Check, Search, ImagePlus, AlertTriangle, Wrench, ExternalLink, RefreshCw } from "lucide-react";
function formatBytes(bytes) {
    if (bytes < 1024)
        return bytes + " B";
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function formatDate(ts) {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
export default function AdminGallery() {
    const qc = useQueryClient();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [viewMode, setViewMode] = useState("grid");
    const [copiedUrl, setCopiedUrl] = useState(null);
    const [fixing, setFixing] = useState(false);
    const { data: files = [], isLoading, refetch } = useQuery({
        queryKey: ["/api/admin/gallery"],
        queryFn: () => authFetchJson("/api/admin/gallery"),
    });
    const deleteMutation = useMutation({
        mutationFn: (filename) => apiRequest(`/api/admin/gallery/${encodeURIComponent(filename)}`, { method: "DELETE" }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
            toast({ title: "Fichier supprimé avec succès" });
        },
        onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
    });
    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast({ title: "Lien copié !" });
        setTimeout(() => setCopiedUrl(null), 3000);
    };
    const handleFixUrls = async () => {
        setFixing(true);
        try {
            await apiRequest("/api/admin/gallery/fix-urls", { method: "POST" });
            toast({ title: "URLs restaurées avec succès", description: "Tous les chemins relatifs ont été convertis en URLs absolues." });
        }
        catch {
            toast({ title: "Erreur lors de la restauration", variant: "destructive" });
        }
        finally {
            setFixing(false);
        }
    };
    const displayed = files.filter(f => {
        const matchTab = activeTab === "all" || f.type === activeTab;
        const matchSearch = !search || f.filename.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    const imageCount = files.filter(f => f.type === "image").length;
    const videoCount = files.filter(f => f.type === "video").length;
    return (_jsx(AdminLayout, { children: _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between flex-wrap gap-3", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Images, { size: 24, className: "text-red-600" }), "Galerie M\u00E9dias"] }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "Tous les fichiers upload\u00E9s sur le serveur MAWEJA" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => refetch(), "data-testid": "gallery-refresh", className: "flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors", children: [_jsx(RefreshCw, { size: 14 }), "Actualiser"] }), _jsxs("button", { onClick: handleFixUrls, disabled: fixing, "data-testid": "gallery-fix-urls", className: "flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors", children: [_jsx(Wrench, { size: 14 }), fixing ? "Restauration..." : "Restaurer les URLs cassées"] })] })] }), _jsxs("div", { className: "flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl", children: [_jsx(AlertTriangle, { size: 16, className: "text-amber-600 mt-0.5 shrink-0" }), _jsxs("div", { className: "flex-1 text-sm", children: [_jsx("p", { className: "font-semibold text-amber-800 dark:text-amber-200", children: "Images cass\u00E9es en production ?" }), _jsxs("p", { className: "text-amber-700 dark:text-amber-300 mt-0.5", children: ["Cliquez sur ", _jsx("strong", { children: "Restaurer les URLs cass\u00E9es" }), " pour convertir tous les chemins relatifs", " ", "(", _jsx("code", { className: "bg-amber-100 dark:bg-amber-900 px-1 rounded", children: "/uploads/\u2026" }), ") en URLs absolues", " ", "(", _jsx("code", { className: "bg-amber-100 dark:bg-amber-900 px-1 rounded", children: "https://maweja.net/uploads/\u2026" }), ") dans la base de donn\u00E9es."] })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-4", children: [
                        { label: "Total fichiers", value: files.length, sub: formatBytes(totalSize), color: "text-blue-600" },
                        { label: "Images", value: imageCount, sub: "photos & logos", color: "text-green-600" },
                        { label: "Vidéos", value: videoCount, sub: "fichiers mp4/webm", color: "text-purple-600" },
                    ].map(stat => (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4", children: [_jsx("p", { className: `text-2xl font-black ${stat.color}`, children: stat.value }), _jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-200", children: stat.label }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: stat.sub })] }, stat.label))) }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("div", { className: "flex gap-1", children: ["all", "image", "video"].map(tab => (_jsx("button", { onClick: () => setActiveTab(tab), "data-testid": `gallery-tab-${tab}`, className: `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`, children: tab === "all" ? "Tous" : tab === "image" ? "Images" : "Vidéos" }, tab))) }), _jsxs("div", { className: "relative flex-1 max-w-xs", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher un fichier...", value: search, onChange: e => setSearch(e.target.value), className: "w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white", "data-testid": "gallery-search" })] }), _jsxs("span", { className: "text-xs font-semibold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full", children: [displayed.length, " r\u00E9sultat", displayed.length !== 1 ? "s" : ""] }), _jsxs("div", { className: "flex gap-1 ml-auto", children: [_jsx("button", { onClick: () => setViewMode("grid"), className: `p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-red-100 dark:bg-red-950 text-red-600" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`, "data-testid": "gallery-view-grid", title: "Vue grille", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [_jsx("rect", { x: "1", y: "1", width: "6", height: "6", rx: "1" }), _jsx("rect", { x: "9", y: "1", width: "6", height: "6", rx: "1" }), _jsx("rect", { x: "1", y: "9", width: "6", height: "6", rx: "1" }), _jsx("rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" })] }) }), _jsx("button", { onClick: () => setViewMode("list"), className: `p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-red-100 dark:bg-red-950 text-red-600" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`, "data-testid": "gallery-view-list", title: "Vue liste", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [_jsx("rect", { x: "1", y: "2", width: "14", height: "2", rx: "1" }), _jsx("rect", { x: "1", y: "7", width: "14", height: "2", rx: "1" }), _jsx("rect", { x: "1", y: "12", width: "14", height: "2", rx: "1" })] }) })] })] }), isLoading ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: Array.from({ length: 10 }).map((_, i) => (_jsx("div", { className: "aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" }, i))) })) : displayed.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-gray-400 gap-4", children: [_jsx(ImagePlus, { size: 48, strokeWidth: 1 }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-base font-medium", children: "Aucun fichier trouv\u00E9" }), _jsx("p", { className: "text-sm mt-1", children: "Uploadez des images ou vid\u00E9os via les sections Publicit\u00E9s, Restaurants ou Services" })] })] })) : viewMode === "grid" ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: displayed.map(file => (_jsxs("div", { className: "group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800", "data-testid": `gallery-item-${file.filename}`, children: [file.type === "image" ? (_jsx("img", { src: file.url, alt: file.filename, className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-900", children: [_jsx(Video, { size: 28, className: "text-purple-400" }), _jsx("span", { className: "text-white text-[10px] font-medium px-2 text-center leading-tight", children: file.filename.slice(0, 30) }), _jsx("span", { className: "text-gray-400 text-[9px]", children: formatBytes(file.size) })] })), _jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all", children: _jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-1", children: [_jsxs("p", { className: "text-white text-[9px] font-medium text-center", children: [formatBytes(file.size), " \u00B7 ", formatDate(file.createdAt)] }), _jsxs("div", { className: "flex gap-1", children: [_jsxs("button", { onClick: () => handleCopy(file.url), className: "flex-1 flex items-center justify-center gap-1 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[9px] font-bold rounded-lg", "data-testid": `gallery-copy-${file.filename}`, title: "Copier l'URL", children: [copiedUrl === file.url ? _jsx(Check, { size: 9 }) : _jsx(Copy, { size: 9 }), copiedUrl === file.url ? "Copié!" : "Copier URL"] }), _jsx("a", { href: file.url, target: "_blank", rel: "noreferrer", className: "flex items-center justify-center p-1 bg-blue-500/70 hover:bg-blue-600 backdrop-blur-sm text-white rounded-lg", title: "Ouvrir", onClick: e => e.stopPropagation(), children: _jsx(ExternalLink, { size: 9 }) }), _jsx("button", { onClick: () => { if (confirm("Supprimer ce fichier définitivement?"))
                                                        deleteMutation.mutate(file.filename); }, className: "flex items-center justify-center p-1 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm text-white rounded-lg", "data-testid": `gallery-delete-${file.filename}`, title: "Supprimer", children: _jsx(Trash2, { size: 9 }) })] })] }) }), _jsx("div", { className: "absolute top-1.5 left-1.5", children: _jsx("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow ${file.type === "video" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`, children: file.type === "video" ? "VID" : "IMG" }) })] }, file.filename))) })) : (
                /* List view */
                _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700", children: displayed.map(file => (_jsxs("div", { className: "flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors", "data-testid": `gallery-list-${file.filename}`, children: [_jsx("div", { className: "w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0", children: file.type === "image" ? (_jsx("img", { src: file.url, alt: file.filename, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-gray-900", children: _jsx(Video, { size: 16, className: "text-purple-400" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: file.filename }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5 truncate", children: file.url })] }), _jsxs("div", { className: "text-right shrink-0 hidden sm:block", children: [_jsx("p", { className: "text-xs font-medium text-gray-700 dark:text-gray-300", children: formatBytes(file.size) }), _jsx("p", { className: "text-xs text-gray-400", children: formatDate(file.createdAt) })] }), _jsxs("div", { className: "flex gap-1 shrink-0", children: [_jsxs("button", { onClick: () => handleCopy(file.url), "data-testid": `gallery-list-copy-${file.filename}`, className: "flex items-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors", children: [copiedUrl === file.url ? _jsx(Check, { size: 12 }) : _jsx(Copy, { size: 12 }), copiedUrl === file.url ? "Copié" : "Copier"] }), _jsx("a", { href: file.url, target: "_blank", rel: "noreferrer", className: "flex items-center justify-center p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors", children: _jsx(ExternalLink, { size: 12 }) }), _jsx("button", { onClick: () => { if (confirm("Supprimer ce fichier définitivement?"))
                                            deleteMutation.mutate(file.filename); }, "data-testid": `gallery-list-delete-${file.filename}`, className: "flex items-center justify-center p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 rounded-lg transition-colors", children: _jsx(Trash2, { size: 12 }) })] })] }, file.filename))) }))] }) }));
}
//# sourceMappingURL=AdminGallery.js.map