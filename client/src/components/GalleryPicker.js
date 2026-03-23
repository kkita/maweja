import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetchJson, apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Images, Video, Trash2, Copy, Check, Search, ImagePlus, X } from "lucide-react";
export default function GalleryPicker({ open, onClose, onSelect, filter = "all" }) {
    const qc = useQueryClient();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [copiedUrl, setCopiedUrl] = useState(null);
    const [activeTab, setActiveTab] = useState(filter === "all" ? "all" : filter);
    const { data: files = [], isLoading } = useQuery({
        queryKey: ["/api/admin/gallery"],
        queryFn: () => authFetchJson("/api/admin/gallery"),
        enabled: open,
    });
    const deleteMutation = useMutation({
        mutationFn: (filename) => apiRequest(`/api/admin/gallery/${encodeURIComponent(filename)}`, { method: "DELETE" }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
            toast({ title: "Fichier supprimé" });
        },
        onError: () => toast({ title: "Erreur suppression", variant: "destructive" }),
    });
    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };
    const displayed = files.filter(f => {
        const matchTab = activeTab === "all" || f.type === activeTab;
        const matchSearch = !search || f.filename.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Images, { size: 20, className: "text-red-600" }), _jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", children: "Galerie M\u00E9dias" }), _jsxs("span", { className: "text-xs font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full", children: [displayed.length, " fichier", displayed.length !== 1 ? "s" : ""] })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors", "data-testid": "gallery-close", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "px-6 py-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800", children: [_jsx("div", { className: "flex gap-1", children: ["all", "image", "video"].map(tab => (_jsx("button", { onClick: () => setActiveTab(tab), "data-testid": `gallery-tab-${tab}`, className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === tab
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`, children: tab === "all" ? "Tous" : tab === "image" ? "Images" : "Vidéos" }, tab))) }), _jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher...", value: search, onChange: e => setSearch(e.target.value), className: "w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white", "data-testid": "gallery-search" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: isLoading ? (_jsx("div", { className: "grid grid-cols-4 sm:grid-cols-5 gap-3", children: Array.from({ length: 10 }).map((_, i) => (_jsx("div", { className: "aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" }, i))) })) : displayed.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-gray-400 gap-3", children: [_jsx(ImagePlus, { size: 36, strokeWidth: 1 }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm font-medium", children: "Aucun fichier trouv\u00E9" }), _jsx("p", { className: "text-xs mt-0.5", children: "Uploadez des images/vid\u00E9os via les sections Publicit\u00E9s ou Restaurants" })] })] })) : (_jsx("div", { className: "grid grid-cols-4 sm:grid-cols-5 gap-3", children: displayed.map(file => (_jsxs("div", { className: "group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-red-400 cursor-pointer transition-all bg-gray-100 dark:bg-gray-800", onClick: () => { onSelect(file.url); onClose(); }, "data-testid": `gallery-file-${file.filename}`, children: [file.type === "image" ? (_jsx("img", { src: file.url, alt: file.filename, className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-900", children: [_jsx(Video, { size: 22, className: "text-white" }), _jsx("span", { className: "text-white text-[9px] font-medium px-1 text-center truncate w-full leading-tight", children: file.filename.slice(0, 20) })] })), _jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors", onClick: e => e.stopPropagation(), children: _jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-1.5 flex items-center gap-1 translate-y-full group-hover:translate-y-0 transition-transform", children: [_jsxs("button", { onClick: e => { e.stopPropagation(); handleCopy(file.url); }, className: "flex-1 flex items-center justify-center gap-0.5 py-1 rounded-lg bg-white/25 hover:bg-white/35 text-white text-[9px] font-bold backdrop-blur-sm", "data-testid": `gallery-copy-${file.filename}`, title: "Copier le lien", children: [copiedUrl === file.url ? _jsx(Check, { size: 9 }) : _jsx(Copy, { size: 9 }), copiedUrl === file.url ? "OK!" : "Copier"] }), _jsx("button", { onClick: e => { e.stopPropagation(); if (confirm("Supprimer ce fichier?"))
                                                    deleteMutation.mutate(file.filename); }, className: "py-1 px-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-sm", "data-testid": `gallery-delete-${file.filename}`, title: "Supprimer", children: _jsx(Trash2, { size: 9 }) })] }) }), _jsx("div", { className: "absolute top-1 left-1", children: _jsx("span", { className: `text-[8px] font-bold px-1 py-0.5 rounded-full ${file.type === "video" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`, children: file.type === "video" ? "VID" : "IMG" }) })] }, file.filename))) })) }), _jsxs("div", { className: "px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-b-2xl", children: [_jsx("p", { className: "text-xs text-gray-400", children: "Cliquez sur une image pour la s\u00E9lectionner" }), _jsx("button", { onClick: onClose, className: "px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors", "data-testid": "gallery-close-btn", children: "Fermer" })] })] }) }));
}
//# sourceMappingURL=GalleryPicker.js.map