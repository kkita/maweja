import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Image, Plus, Trash2, Edit2, X, Eye, EyeOff, Film } from "lucide-react";
export default function AdminAds() {
    const { toast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaType, setMediaType] = useState("image");
    const [linkUrl, setLinkUrl] = useState("");
    const [file, setFile] = useState(null);
    const { data: ads = [] } = useQuery({
        queryKey: ["/api/advertisements"],
    });
    const createMutation = useMutation({
        mutationFn: async (formData) => {
            const role = sessionStorage.getItem("maweja_role") || "admin";
            const res = await fetch("/api/advertisements", { method: "POST", body: formData, credentials: "include", headers: { "X-User-Role": role } });
            if (!res.ok)
                throw new Error("Erreur creation");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
            closeModal();
            toast({ title: "Succes", description: "Publicite creee" });
        },
        onError: () => { toast({ title: "Erreur", description: "Impossible de creer la publicite", variant: "destructive" }); },
    });
    const updateMutation = useMutation({
        mutationFn: async ({ id, formData }) => {
            const role = sessionStorage.getItem("maweja_role") || "admin";
            const res = await fetch(`/api/advertisements/${id}`, { method: "PATCH", body: formData, credentials: "include", headers: { "X-User-Role": role } });
            if (!res.ok)
                throw new Error("Erreur mise a jour");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
            closeModal();
            toast({ title: "Succes", description: "Publicite mise a jour" });
        },
        onError: () => { toast({ title: "Erreur", description: "Impossible de modifier la publicite", variant: "destructive" }); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => apiRequest(`/api/advertisements/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
            toast({ title: "Succes", description: "Publicite supprimee" });
        },
    });
    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const role = sessionStorage.getItem("maweja_role") || "admin";
            const fd = new FormData();
            fd.append("isActive", String(isActive));
            const res = await fetch(`/api/advertisements/${id}`, { method: "PATCH", body: fd, credentials: "include", headers: { "X-User-Role": role } });
            if (!res.ok)
                throw new Error("Erreur");
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] }),
    });
    const closeModal = () => { setShowModal(false); setEditing(null); setTitle(""); setMediaUrl(""); setMediaType("image"); setLinkUrl(""); setFile(null); };
    const handleSave = () => {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("mediaType", mediaType);
        fd.append("linkUrl", linkUrl);
        if (file)
            fd.append("media", file);
        else if (mediaUrl)
            fd.append("mediaUrl", mediaUrl);
        if (editing) {
            updateMutation.mutate({ id: editing.id, formData: fd });
        }
        else {
            createMutation.mutate(fd);
        }
    };
    return (_jsxs(AdminLayout, { title: "Publicites", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("div", { children: _jsx("p", { className: "text-sm text-gray-500 mt-0.5", "data-testid": "text-admin-ads-title", children: "Gerez les bannieres publicitaires de l'application" }) }), _jsxs("button", { onClick: () => { setShowModal(true); setEditing(null); setTitle(""); setMediaUrl(""); setMediaType("image"); setLinkUrl(""); setFile(null); }, "data-testid": "button-new-ad", className: "px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700", children: [_jsx(Plus, { size: 16 }), " Nouvelle publicite"] })] }), _jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3", children: [_jsx(Image, { size: 20, className: "text-amber-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-amber-800", children: "Banniere publicitaire" }), _jsx("p", { className: "text-xs text-amber-600 mt-0.5", children: "Maximum 5 publicites actives. Format recommande : 16:7. Images (JPG, PNG) ou videos courtes (MP4, sans son)." })] })] }), ads.length === 0 ? (_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-12 text-center", children: [_jsx(Image, { size: 40, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500", children: "Aucune publicite" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Cliquez \"Nouvelle publicite\" pour commencer" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: ads.map(ad => (_jsxs("div", { className: `bg-white rounded-xl border overflow-hidden ${ad.isActive ? "border-green-200" : "border-gray-200 opacity-60"}`, "data-testid": `admin-ad-${ad.id}`, children: [_jsxs("div", { className: "aspect-[16/7] bg-gray-100 relative", children: [ad.mediaType === "video" ? (_jsx("video", { src: ad.mediaUrl, className: "w-full h-full object-cover", muted: true })) : (_jsx("img", { src: ad.mediaUrl, alt: ad.title, className: "w-full h-full object-cover" })), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1", children: [_jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold ${ad.mediaType === "video" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`, children: ad.mediaType === "video" ? "Video" : "Image" }), _jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold ${ad.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`, children: ad.isActive ? "Active" : "Inactive" })] })] }), _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "font-bold text-sm text-gray-900", children: ad.title || "Sans titre" }), _jsxs("p", { className: "text-[10px] text-gray-400 mt-0.5", children: ["Ordre: ", ad.sortOrder] }), _jsxs("div", { className: "flex items-center gap-1.5 mt-3", children: [_jsxs("button", { onClick: () => { setEditing(ad); setShowModal(true); setTitle(ad.title); setMediaUrl(ad.mediaUrl); setMediaType(ad.mediaType); setLinkUrl(ad.linkUrl || ""); }, className: "flex-1 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1", "data-testid": `button-edit-ad-${ad.id}`, children: [_jsx(Edit2, { size: 12 }), " Modifier"] }), _jsx("button", { onClick: () => toggleMutation.mutate({ id: ad.id, isActive: !ad.isActive }), className: "py-1.5 px-2.5 bg-gray-50 rounded-lg hover:bg-gray-100", "data-testid": `button-toggle-ad-${ad.id}`, children: ad.isActive ? _jsx(EyeOff, { size: 14, className: "text-gray-500" }) : _jsx(Eye, { size: 14, className: "text-green-600" }) }), _jsx("button", { onClick: () => { if (confirm("Supprimer ?"))
                                                deleteMutation.mutate(ad.id); }, className: "py-1.5 px-2.5 bg-gray-50 rounded-lg hover:bg-red-50", "data-testid": `button-delete-ad-${ad.id}`, children: _jsx(Trash2, { size: 14, className: "text-red-500" }) })] })] })] }, ad.id))) })), showModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md p-6", "data-testid": "modal-ad", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-bold text-lg", children: [editing ? "Modifier" : "Nouvelle", " publicite"] }), _jsx("button", { onClick: closeModal, className: "w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Titre" }), _jsx("input", { type: "text", value: title, onChange: e => setTitle(e.target.value), placeholder: "Titre de la publicite", "data-testid": "input-ad-title", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Type de media" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { type: "button", onClick: () => setMediaType("image"), className: `flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${mediaType === "image" ? "bg-red-600 text-white" : "bg-gray-50 text-gray-600 border border-gray-200"}`, children: [_jsx(Image, { size: 14 }), " Image"] }), _jsxs("button", { type: "button", onClick: () => setMediaType("video"), className: `flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${mediaType === "video" ? "bg-red-600 text-white" : "bg-gray-50 text-gray-600 border border-gray-200"}`, children: [_jsx(Film, { size: 14 }), " Video"] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Fichier media" }), _jsx("input", { type: "file", accept: mediaType === "video" ? "video/*" : "image/*", onChange: e => setFile(e.target.files?.[0] || null), "data-testid": "input-ad-file", className: "w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Ou URL du media" }), _jsx("input", { type: "url", value: mediaUrl, onChange: e => setMediaUrl(e.target.value), placeholder: "https://...", "data-testid": "input-ad-url", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Lien (optionnel)" }), _jsx("input", { type: "url", value: linkUrl, onChange: e => setLinkUrl(e.target.value), placeholder: "https://...", "data-testid": "input-ad-link", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsx("button", { onClick: handleSave, disabled: createMutation.isPending || updateMutation.isPending, "data-testid": "button-save-ad", className: "w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50", children: editing ? "Modifier" : "Creer" })] })] }) }))] }));
}
//# sourceMappingURL=AdminAds.js.map