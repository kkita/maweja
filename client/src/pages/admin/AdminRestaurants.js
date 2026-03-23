import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Store, Star, Clock, Upload, Image, Video, X, Loader2, Pencil, Plus, Trash2, Check, UtensilsCrossed, AlertTriangle, ChevronDown, ChevronUp, Package, Tag, GalleryHorizontal, GripVertical, ArrowUp, ArrowDown, Save } from "lucide-react";
import GalleryPicker from "../../components/GalleryPicker";
import ImportUrlToGallery from "../../components/ImportUrlToGallery";
import { formatPrice } from "../../lib/utils";
import { authFetch, apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useState, useRef, useCallback } from "react";
import ImageCropper, { validateImageFile } from "../../components/ImageCropper";
/* ── Allowed image types & restrictions ─────────────────────────── */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 10;
function MediaUploadButton({ label, accept, onUploaded, current, icon: Icon, testId, onError, aspectRatio = 1, }) {
    const [uploading, setUploading] = useState(false);
    const [cropFile, setCropFile] = useState(null);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const inputRef = useRef(null);
    const isVideo = accept.includes("video");
    const uploadFile = async (file) => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const endpoint = isVideo ? "/api/upload-media" : "/api/upload";
            const res = await authFetch(endpoint, { method: "POST", body: fd });
            const data = await res.json();
            if (data.url)
                onUploaded(data.url);
            else
                onError?.("Erreur lors de l'upload");
        }
        catch {
            onError?.("Erreur lors de l'upload");
        }
        setUploading(false);
    };
    const handleRawFile = (file) => {
        if (isVideo) {
            if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
                onError?.(`Vidéo trop volumineuse (max ${MAX_VIDEO_SIZE_MB}MB)`);
                return;
            }
            uploadFile(file);
            return;
        }
        /* Image validation */
        const validationError = validateImageFile(file);
        if (validationError) {
            onError?.(validationError);
            return;
        }
        /* Show cropper */
        setCropFile(file);
    };
    const handleCropped = (croppedFile) => {
        setCropFile(null);
        uploadFile(croppedFile);
    };
    return (_jsxs(_Fragment, { children: [cropFile && (_jsx(ImageCropper, { file: cropFile, aspectRatio: aspectRatio, onCrop: handleCropped, onCancel: () => setCropFile(null) })), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5", children: label }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [current && !isVideo && (_jsx("img", { src: current, alt: "", className: "w-12 h-12 rounded-xl object-cover border border-gray-200", onError: (e) => { e.target.src = "/maweja-logo-red.png"; } })), current && isVideo && _jsx("video", { src: current, className: "w-16 h-12 rounded-xl object-cover border border-gray-200", muted: true }), _jsxs("button", { type: "button", onClick: () => inputRef.current?.click(), disabled: uploading, "data-testid": testId, className: "flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50", children: [uploading ? _jsx(Loader2, { size: 14, className: "animate-spin" }) : _jsx(Icon, { size: 14 }), uploading ? "Upload..." : current ? "Changer" : "Choisir"] }), _jsxs("button", { type: "button", onClick: () => setGalleryOpen(true), "data-testid": `${testId}-gallery`, className: "flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors", children: [_jsx(GalleryHorizontal, { size: 14 }), " Galerie"] }), current && (_jsx(ImportUrlToGallery, { url: current, onImported: onUploaded })), current && (_jsx("button", { type: "button", onClick: () => onUploaded(""), className: "text-gray-400 hover:text-red-500", "data-testid": `${testId}-remove`, children: _jsx(X, { size: 14 }) }))] }), _jsx("input", { ref: inputRef, type: "file", accept: isVideo ? accept : ALLOWED_IMAGE_TYPES.join(","), className: "hidden", onChange: (e) => e.target.files?.[0] && handleRawFile(e.target.files[0]) })] }), _jsx(GalleryPicker, { open: galleryOpen, onClose: () => setGalleryOpen(false), onSelect: url => { onUploaded(url); }, filter: isVideo ? "video" : "image" })] }));
}
function AddRestaurantModal({ onClose }) {
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: "", description: "", cuisine: "", address: "",
        deliveryFee: 2500, deliveryTime: "30-45 min", minOrder: 5000,
        rating: 4.5, phone: "", openingHours: "08:00 - 22:00",
        email: "", managerName: "", brandName: "", prepTime: "20-30 min",
        restaurantCommissionRate: 20,
    });
    const [coverImage, setCoverImage] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [coverVideoUrl, setCoverVideoUrl] = useState("");
    const showError = (msg) => toast({ title: "Erreur", description: msg, variant: "destructive" });
    const mutation = useMutation({
        mutationFn: async () => {
            if (!form.name || !form.cuisine || !form.address)
                throw new Error("Champs requis manquants");
            await apiRequest("/api/restaurants", {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    image: coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
                    logoUrl: logoUrl || null,
                    coverVideoUrl: coverVideoUrl || null,
                }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
            toast({ title: "Restaurant ajoute", description: `${form.name} a ete cree avec succes` });
            onClose();
        },
        onError: (e) => toast({ title: "Erreur", description: e.message || "Impossible de creer le restaurant", variant: "destructive" }),
    });
    const field = (key, label, type = "text", placeholder = "") => (_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: label }), _jsx("input", { type: type, value: String(form[key]), onChange: e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value })), placeholder: placeholder, className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" })] }));
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Plus, { size: 18, className: "text-red-600" }), " Ajouter un restaurant"] }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Remplissez les informations du nouveau restaurant" })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center", "data-testid": "close-add-restaurant", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [field("name", "Nom du restaurant *", "text", "ex: La Belle Cuisine"), field("cuisine", "Type de cuisine *", "text", "ex: Congolaise, Fast-food")] }), field("description", "Description", "text", "Courte description du restaurant"), field("address", "Adresse *", "text", "ex: Avenue du Commerce, Kinshasa"), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [field("deliveryFee", "Frais de livraison ($)", "number", "2"), field("minOrder", "Commande minimum ($)", "number", "5")] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [field("deliveryTime", "Temps de livraison", "text", "30-45 min"), field("prepTime", "Temps de preparation", "text", "20-30 min")] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [field("phone", "Telephone", "text", "+243 8XX XXX XXX"), field("openingHours", "Horaires", "text", "08:00 - 22:00")] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [field("email", "Email", "email", "contact@restaurant.com"), field("managerName", "Nom du manager", "text", "Jean Dupont")] }), _jsxs("div", { className: "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3", children: [_jsxs("label", { className: "text-xs font-semibold text-red-700 dark:text-red-400 mb-2 block flex items-center gap-1", children: [_jsx("span", { children: "\uD83D\uDCB0" }), " Commission MAWEJA (% d\u00E9duit du chiffre d'affaires)"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "number", min: "0", max: "100", value: form.restaurantCommissionRate, onChange: e => setForm(f => ({ ...f, restaurantCommissionRate: Number(e.target.value) })), "data-testid": "input-restaurant-commission", className: "w-24 px-3 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("span", { className: "text-sm font-bold text-red-600 dark:text-red-400", children: "%" }), _jsx("p", { className: "text-[11px] text-red-600/70 dark:text-red-400/70 flex-1", children: "Par ex: 20% \u2192 MAWEJA garde 20% du CA, le restaurant re\u00E7oit 80%" })] })] }), _jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4", children: [_jsxs("p", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5", children: [_jsx(Image, { size: 12 }), " M\u00E9dias du restaurant"] }), _jsx(MediaUploadButton, { label: "Logo du restaurant", accept: "image/jpeg,image/png,image/webp", current: logoUrl, onUploaded: setLogoUrl, onError: showError, icon: Image, testId: "create-upload-logo", aspectRatio: 1 }), _jsx(MediaUploadButton, { label: "Image de couverture", accept: "image/jpeg,image/png,image/webp", current: coverImage, onUploaded: setCoverImage, onError: showError, icon: Image, testId: "create-upload-cover", aspectRatio: 16 / 9 }), _jsx(MediaUploadButton, { label: "Vid\u00E9o de couverture (max 10MB, sans audio)", accept: "video/mp4,video/webm,video/quicktime", current: coverVideoUrl, onUploaded: setCoverVideoUrl, onError: showError, icon: Video, testId: "create-upload-video" }), coverVideoUrl && (_jsx("p", { className: "text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2", children: "La vid\u00E9o sera lue en mode muet sur la page restaurant c\u00F4t\u00E9 client." })), !coverImage && (_jsx("p", { className: "text-[11px] text-gray-400", children: "Sans image de couverture, une image par d\u00E9faut sera utilis\u00E9e." }))] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { onClick: onClose, className: "flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors", children: "Annuler" }), _jsxs("button", { onClick: () => mutation.mutate(), disabled: mutation.isPending || !form.name || !form.cuisine || !form.address, "data-testid": "confirm-add-restaurant", className: "flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2", children: [mutation.isPending ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Check, { size: 16 }), "Ajouter le restaurant"] })] })] }) }));
}
function DeleteRestaurantModal({ restaurant, onClose }) {
    const { toast } = useToast();
    const mutation = useMutation({
        mutationFn: () => apiRequest(`/api/restaurants/${restaurant.id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
            toast({ title: "Restaurant supprime", description: `${restaurant.name} a ete supprime` });
            onClose();
        },
        onError: () => toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" }),
    });
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center", onClick: e => e.stopPropagation(), children: [_jsx("div", { className: "w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(AlertTriangle, { size: 24, className: "text-red-600" }) }), _jsx("h3", { className: "font-bold text-lg text-gray-900 dark:text-white mb-2", children: "Supprimer ce restaurant ?" }), _jsxs("p", { className: "text-sm text-gray-500 mb-1", children: [_jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: restaurant.name }), " sera definitivement supprime."] }), _jsx("p", { className: "text-xs text-gray-400 mb-6", children: "Tous les plats du menu seront egalement supprimes. Cette action est irreversible." }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onClose, className: "flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50", "data-testid": "cancel-delete-restaurant", children: "Annuler" }), _jsxs("button", { onClick: () => mutation.mutate(), disabled: mutation.isPending, "data-testid": "confirm-delete-restaurant", className: "flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [mutation.isPending ? _jsx(Loader2, { size: 14, className: "animate-spin" }) : _jsx(Trash2, { size: 14 }), "Supprimer"] })] })] }) }));
}
function EditRestaurantModal({ restaurant, onClose }) {
    const { toast } = useToast();
    const [email, setEmail] = useState(restaurant.email || "");
    const [managerName, setManagerName] = useState(restaurant.managerName || "");
    const [brandName, setBrandName] = useState(restaurant.brandName || "");
    const [hqAddress, setHqAddress] = useState(restaurant.hqAddress || "");
    const [prepTime, setPrepTime] = useState(restaurant.prepTime || "20-30 min");
    const [name, setName] = useState(restaurant.name);
    const [cuisine, setCuisine] = useState(restaurant.cuisine);
    const [address, setAddress] = useState(restaurant.address);
    const [deliveryFee, setDeliveryFee] = useState(restaurant.deliveryFee);
    const [deliveryTime, setDeliveryTime] = useState(restaurant.deliveryTime);
    const [phone, setPhone] = useState(restaurant.phone || "");
    const [commissionRate, setCommissionRate] = useState(restaurant.restaurantCommissionRate ?? 20);
    const [discountPercent, setDiscountPercent] = useState(restaurant.discountPercent ?? 0);
    const [discountLabel, setDiscountLabel] = useState(restaurant.discountLabel ?? "");
    const [isFeatured, setIsFeatured] = useState(restaurant.isFeatured ?? false);
    const mutation = useMutation({
        mutationFn: async () => {
            await apiRequest(`/api/restaurants/${restaurant.id}`, {
                method: "PATCH",
                body: JSON.stringify({ name, cuisine, address, deliveryFee, deliveryTime, phone, email: email || null, managerName: managerName || null, brandName: brandName || null, hqAddress: hqAddress || null, prepTime, restaurantCommissionRate: commissionRate, discountPercent, discountLabel: discountLabel || null, isFeatured }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
            toast({ title: "Mis a jour", description: `${name} a ete modifie` });
            onClose();
        },
        onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" }),
    });
    const inp = (val, set, label, type = "text", ph = "") => (_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: label }), _jsx("input", { type: type, value: val, onChange: e => set(e.target.value), placeholder: ph, className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" })] }));
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-bold text-gray-900 dark:text-white", children: ["Modifier - ", restaurant.name] }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Informations du restaurant" })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center", "data-testid": "close-edit-modal", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [inp(name, setName, "Nom *", "text", "Nom du restaurant"), inp(cuisine, setCuisine, "Cuisine *", "text", "Congolaise...")] }), inp(address, setAddress, "Adresse *", "text", "Avenue..."), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Frais de livraison ($)" }), _jsx("input", { type: "number", value: deliveryFee, onChange: e => setDeliveryFee(Number(e.target.value)), className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), inp(deliveryTime, setDeliveryTime, "Temps de livraison", "text", "30-45 min")] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [inp(phone, setPhone, "Telephone", "text", "+243..."), inp(prepTime, setPrepTime, "Temps de prep", "text", "20-30 min")] }), inp(email, setEmail, "Email", "email", "contact@restaurant.com"), inp(managerName, setManagerName, "Nom du manager", "text", "Jean Dupont"), inp(brandName, setBrandName, "Marque", "text", "Nom de la marque"), inp(hqAddress, setHqAddress, "Adresse du siege", "text", "Adresse complete"), _jsxs("div", { className: "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3", children: [_jsx("label", { className: "text-xs font-semibold text-red-700 dark:text-red-400 mb-2 block", children: "Commission MAWEJA (%)" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "number", min: "0", max: "100", value: commissionRate, onChange: e => setCommissionRate(Number(e.target.value)), "data-testid": "input-edit-restaurant-commission", className: "w-24 px-3 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("span", { className: "text-sm font-bold text-red-600 dark:text-red-400", children: "%" }), _jsx("p", { className: "text-[11px] text-red-600/70 dark:text-red-400/70 flex-1", children: "Part MAWEJA sur le CA livr\u00E9" })] })] }), _jsxs("div", { className: "bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-3 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Tag, { size: 14, className: "text-green-600" }), _jsx("label", { className: "text-xs font-semibold text-green-700 dark:text-green-400", children: "Remise / Discount affich\u00E9 sur la carte" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl px-3 py-2", children: [_jsx("input", { type: "number", min: "0", max: "90", value: discountPercent, onChange: e => setDiscountPercent(Math.min(90, Math.max(0, Number(e.target.value)))), "data-testid": "input-edit-restaurant-discount", className: "w-16 text-sm font-bold text-green-600 dark:text-green-400 text-center focus:outline-none bg-transparent" }), _jsx("span", { className: "text-sm font-bold text-green-600 dark:text-green-400", children: "%" })] }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-[11px] text-green-700 dark:text-green-400", children: discountPercent > 0
                                                    ? `Badge "${discountPercent}% OFF" affiché sur la carte du restaurant`
                                                    : "Mettre 0 pour désactiver la remise" }) })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-green-700 dark:text-green-400 mb-1 block", children: ["Libell\u00E9 personnalis\u00E9 ", _jsx("span", { className: "font-normal text-green-600/60", children: "(optionnel)" })] }), _jsx("input", { type: "text", value: discountLabel, onChange: e => setDiscountLabel(e.target.value), placeholder: discountPercent > 0 ? `ex: ${discountPercent}% sur les menus` : "ex: Promo weekend", "data-testid": "input-edit-restaurant-discount-label", maxLength: 40, className: "w-full px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400" }), _jsxs("p", { className: "text-[10px] text-green-600/60 mt-1", children: ["Texte affich\u00E9 sur la banni\u00E8re de remise. Laissez vide pour afficher \"", discountPercent > 0 ? discountPercent + "% OFF" : "X% OFF", "\"."] })] }), discountPercent > 0 && (_jsxs("div", { className: "flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-green-100", children: [_jsx("span", { className: "text-[10px] font-semibold text-green-700 dark:text-green-400", children: "Aper\u00E7u badge :" }), _jsxs("span", { className: "bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full", children: ["-", discountPercent, "% ", discountLabel ? `· ${discountLabel}` : "OFF"] })] }))] })] }), _jsx("div", { className: "bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { size: 16, className: "text-amber-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-amber-800 dark:text-amber-300", children: "Store Partenaire" }), _jsx("p", { className: "text-[10px] text-amber-600/70", children: "Epingler ce restaurant en haut de la liste client" })] })] }), _jsx("div", { className: `relative w-11 h-6 rounded-full cursor-pointer transition-colors ${isFeatured ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"}`, onClick: () => setIsFeatured(!isFeatured), "data-testid": "toggle-featured", children: _jsx("div", { className: `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFeatured ? "translate-x-5" : "translate-x-0"}` }) })] }) }), _jsxs("button", { onClick: () => mutation.mutate(), disabled: mutation.isPending, "data-testid": "save-restaurant-info", className: "w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2", children: [mutation.isPending ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Check, { size: 16 }), "Sauvegarder"] })] }) }));
}
function EditMediaModal({ restaurant, onClose }) {
    const { toast } = useToast();
    const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl || "");
    const [coverVideoUrl, setCoverVideoUrl] = useState(restaurant.coverVideoUrl || "");
    const [image, setImage] = useState(restaurant.image);
    const showError = (msg) => toast({ title: "Erreur", description: msg, variant: "destructive" });
    const mutation = useMutation({
        mutationFn: async () => {
            await apiRequest(`/api/restaurants/${restaurant.id}`, { method: "PATCH", body: JSON.stringify({ logoUrl: logoUrl || null, coverVideoUrl: coverVideoUrl || null, image }) });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
            toast({ title: "Medias mis a jour", description: `Medias de ${restaurant.name} modifies` });
            onClose();
        },
        onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" }),
    });
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-bold text-gray-900 dark:text-white", children: ["Medias - ", restaurant.name] }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Logo, image de couverture et video" })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center", "data-testid": "close-media-modal", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "space-y-5", children: [_jsx(MediaUploadButton, { label: "Logo du restaurant", accept: "image/jpeg,image/png,image/webp", current: logoUrl, onUploaded: setLogoUrl, onError: showError, icon: Image, testId: "upload-restaurant-logo", aspectRatio: 1 }), _jsx(MediaUploadButton, { label: "Image de couverture", accept: "image/jpeg,image/png,image/webp", current: image, onUploaded: setImage, onError: showError, icon: Image, testId: "upload-restaurant-cover", aspectRatio: 16 / 9 }), _jsx(MediaUploadButton, { label: "Vid\u00E9o de couverture (max 10MB, sans audio)", accept: "video/mp4,video/webm,video/quicktime", current: coverVideoUrl, onUploaded: setCoverVideoUrl, onError: showError, icon: Video, testId: "upload-restaurant-video" }), coverVideoUrl && (_jsx("div", { className: "bg-amber-50 border border-amber-200 rounded-xl px-3 py-2", children: _jsx("p", { className: "text-xs text-amber-700", children: "La video sera lue en mode muet. Elle apparaitra sur la page du restaurant cote client." }) }))] }), _jsxs("button", { onClick: () => mutation.mutate(), disabled: mutation.isPending, "data-testid": "save-restaurant-media", className: "w-full mt-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2", children: [mutation.isPending ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Check, { size: 16 }), "Sauvegarder les medias"] })] }) }));
}
function MenuItemForm({ restaurantId, item, onClose }) {
    const { toast } = useToast();
    const isEdit = !!item;
    const [form, setForm] = useState({
        name: item?.name || "",
        description: item?.description || "",
        price: item?.price || 0,
        category: item?.category || "Principal",
        image: item?.image || "",
        isAvailable: item?.isAvailable ?? true,
        popular: item?.popular ?? false,
    });
    const [imageUploading, setImageUploading] = useState(false);
    const [menuGalleryOpen, setMenuGalleryOpen] = useState(false);
    const imageRef = useRef(null);
    const handleImageFile = async (file) => {
        setImageUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await authFetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url)
                setForm(f => ({ ...f, image: data.url }));
        }
        catch {
            toast({ title: "Erreur upload", variant: "destructive" });
        }
        setImageUploading(false);
    };
    const mutation = useMutation({
        mutationFn: async () => {
            if (!form.name || form.price <= 0)
                throw new Error("Nom et prix requis");
            if (isEdit) {
                await apiRequest(`/api/menu-items/${item.id}`, { method: "PATCH", body: JSON.stringify(form) });
            }
            else {
                await apiRequest("/api/menu-items", { method: "POST", body: JSON.stringify({ ...form, restaurantId, image: form.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" }) });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "menu"] });
            toast({ title: isEdit ? "Plat modifie" : "Plat ajoute", description: form.name });
            onClose();
        },
        onError: (e) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
    });
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl max-h-[90vh] overflow-y-auto", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-bold text-gray-900 dark:text-white", children: isEdit ? "Modifier le plat" : "Ajouter un plat" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Nom du plat *" }), _jsx("input", { value: form.name, onChange: e => setForm(f => ({ ...f, name: e.target.value })), placeholder: "ex: Poulet braise", "data-testid": "input-menu-item-name", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Description" }), _jsx("input", { value: form.description, onChange: e => setForm(f => ({ ...f, description: e.target.value })), placeholder: "Courte description", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Prix ($) *" }), _jsx("input", { type: "number", value: form.price, onChange: e => setForm(f => ({ ...f, price: Number(e.target.value) })), "data-testid": "input-menu-item-price", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Categorie" }), _jsx("select", { value: form.category, onChange: e => setForm(f => ({ ...f, category: e.target.value })), className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500", children: ["Principal", "Entree", "Dessert", "Boisson", "Snack", "Accompagnement"].map(c => _jsx("option", { value: c, children: c }, c)) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Image du plat" }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [form.image && _jsx("img", { src: form.image, alt: "", className: "w-12 h-12 rounded-lg object-cover border" }), _jsxs("button", { type: "button", onClick: () => imageRef.current?.click(), disabled: imageUploading, className: "flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors", children: [imageUploading ? _jsx(Loader2, { size: 12, className: "animate-spin" }) : _jsx(Image, { size: 12 }), form.image ? "Changer" : "Choisir"] }), _jsxs("button", { type: "button", onClick: () => setMenuGalleryOpen(true), className: "flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors", "data-testid": "button-menu-image-gallery", children: [_jsx(GalleryHorizontal, { size: 12 }), " Galerie"] })] }), _jsx("input", { ref: imageRef, type: "file", accept: "image/*", className: "hidden", onChange: e => e.target.files?.[0] && handleImageFile(e.target.files[0]) }), _jsx(GalleryPicker, { open: menuGalleryOpen, onClose: () => setMenuGalleryOpen(false), onSelect: url => setForm(f => ({ ...f, image: url })), filter: "image" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: form.isAvailable, onChange: e => setForm(f => ({ ...f, isAvailable: e.target.checked })), className: "w-4 h-4 rounded accent-red-600" }), "Disponible"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: form.popular, onChange: e => setForm(f => ({ ...f, popular: e.target.checked })), className: "w-4 h-4 rounded accent-red-600" }), "Populaire \u2B50"] })] })] }), _jsxs("div", { className: "flex gap-3 mt-5", children: [_jsx("button", { onClick: onClose, className: "flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50", children: "Annuler" }), _jsxs("button", { onClick: () => mutation.mutate(), disabled: mutation.isPending || !form.name || form.price <= 0, "data-testid": "save-menu-item", className: "flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [mutation.isPending ? _jsx(Loader2, { size: 14, className: "animate-spin" }) : _jsx(Check, { size: 14 }), isEdit ? "Modifier" : "Ajouter"] })] })] }) }));
}
function MenuSection({ restaurant }) {
    const { toast } = useToast();
    const [addingItem, setAddingItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["/api/restaurants", restaurant.id, "menu"],
        queryFn: () => fetch(`/api/restaurants/${restaurant.id}/menu`).then(r => r.json()),
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => apiRequest(`/api/menu-items/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurant.id, "menu"] });
            toast({ title: "Plat supprime" });
            setDeletingItem(null);
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
    if (isLoading)
        return _jsx("div", { className: "py-4 text-center", children: _jsx(Loader2, { size: 16, className: "animate-spin mx-auto text-gray-400" }) });
    return (_jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("p", { className: "text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5", children: [_jsx(UtensilsCrossed, { size: 13 }), " Menu (", items.length, " plats)"] }), _jsxs("button", { onClick: () => setAddingItem(true), "data-testid": `add-menu-item-${restaurant.id}`, className: "flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors", children: [_jsx(Plus, { size: 12 }), " Ajouter un plat"] })] }), items.length === 0 ? (_jsxs("div", { className: "text-center py-6 border border-dashed border-gray-200 rounded-xl", children: [_jsx(Package, { size: 24, className: "mx-auto mb-2 text-gray-300" }), _jsx("p", { className: "text-xs text-gray-400", children: "Aucun plat dans le menu" }), _jsx("button", { onClick: () => setAddingItem(true), className: "text-xs text-red-600 font-semibold mt-1 hover:underline", children: "Ajouter le premier plat" })] })) : (_jsx("div", { className: "space-y-1.5 max-h-72 overflow-y-auto", children: items.map(item => (_jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800", "data-testid": `menu-item-${item.id}`, children: [_jsx("img", { src: item.image, alt: item.name, className: "w-10 h-10 rounded-lg object-cover flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: item.name }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-red-600 font-bold", children: formatPrice(item.price) }), _jsx("span", { className: "text-[10px] text-gray-400", children: item.category }), item.popular && _jsx("span", { className: "text-[10px] bg-yellow-50 text-yellow-700 px-1 rounded font-medium", children: "\u2B50 Populaire" }), !item.isAvailable && _jsx("span", { className: "text-[10px] bg-gray-100 text-gray-500 px-1 rounded font-medium", children: "Indispo" })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => setEditingItem(item), "data-testid": `edit-menu-item-${item.id}`, className: "w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors", children: _jsx(Pencil, { size: 11 }) }), _jsx("button", { onClick: () => setDeletingItem(item), "data-testid": `delete-menu-item-${item.id}`, className: "w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors", children: _jsx(Trash2, { size: 11 }) })] })] }, item.id))) })), addingItem && _jsx(MenuItemForm, { restaurantId: restaurant.id, onClose: () => setAddingItem(false) }), editingItem && _jsx(MenuItemForm, { restaurantId: restaurant.id, item: editingItem, onClose: () => setEditingItem(null) }), deletingItem && (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4", onClick: () => setDeletingItem(null), children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xs p-6 shadow-2xl text-center", onClick: e => e.stopPropagation(), children: [_jsx("div", { className: "w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx(Trash2, { size: 20, className: "text-red-600" }) }), _jsxs("h3", { className: "font-bold text-gray-900 dark:text-white mb-1", children: ["Supprimer \"", deletingItem.name, "\" ?"] }), _jsx("p", { className: "text-xs text-gray-500 mb-4", children: "Cette action est irreversible." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setDeletingItem(null), className: "flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50", children: "Annuler" }), _jsxs("button", { onClick: () => deleteMutation.mutate(deletingItem.id), disabled: deleteMutation.isPending, className: "flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1", children: [deleteMutation.isPending ? _jsx(Loader2, { size: 12, className: "animate-spin" }) : _jsx(Trash2, { size: 12 }), " Supprimer"] })] })] }) }))] }));
}
export default function AdminRestaurants() {
    const { data: restaurants = [], isLoading } = useQuery({ queryKey: ["/api/restaurants"] });
    const { toast } = useToast();
    const [editingMedia, setEditingMedia] = useState(null);
    const [editingInfo, setEditingInfo] = useState(null);
    const [deletingRestaurant, setDeletingRestaurant] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [addingRestaurant, setAddingRestaurant] = useState(false);
    const [search, setSearch] = useState("");
    const [orderedList, setOrderedList] = useState([]);
    const [hasOrderChanges, setHasOrderChanges] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [overIdx, setOverIdx] = useState(null);
    const touchStartY = useRef(0);
    const touchIdx = useRef(null);
    const sorted = [...restaurants].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const baseList = hasOrderChanges ? orderedList : sorted;
    const filtered = baseList.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
        r.address.toLowerCase().includes(search.toLowerCase()));
    const canDrag = !search;
    const moveRestaurant = useCallback((from, to) => {
        const list = [...(hasOrderChanges ? orderedList : sorted)];
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        setOrderedList(list);
        setHasOrderChanges(true);
    }, [orderedList, sorted, hasOrderChanges]);
    const saveOrder = async () => {
        setSavingOrder(true);
        try {
            const order = orderedList.map((r, idx) => ({ id: r.id, sortOrder: idx }));
            await apiRequest("/api/restaurants/reorder", {
                method: "PATCH",
                body: JSON.stringify({ order }),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
            setHasOrderChanges(false);
            toast({ title: "Ordre des restaurants sauvegardé !" });
        }
        catch {
            toast({ title: "Erreur", description: "Impossible de sauvegarder l'ordre", variant: "destructive" });
        }
        finally {
            setSavingOrder(false);
        }
    };
    const handleDragStart = (idx) => (e) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(idx));
    };
    const handleDragOver = (idx) => (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOverIdx(idx);
    };
    const handleDrop = (idx) => (e) => {
        e.preventDefault();
        const from = dragIdx ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (from !== idx)
            moveRestaurant(from, idx);
        setDragIdx(null);
        setOverIdx(null);
    };
    const handleTouchStart = (idx) => (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchIdx.current = idx;
    };
    const handleTouchEnd = (e) => {
        if (touchIdx.current === null)
            return;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        const threshold = 40;
        const from = touchIdx.current;
        if (deltaY > threshold && from < filtered.length - 1)
            moveRestaurant(from, from + 1);
        else if (deltaY < -threshold && from > 0)
            moveRestaurant(from, from - 1);
        touchIdx.current = null;
    };
    const toggleActive = useMutation({
        mutationFn: (r) => apiRequest(`/api/restaurants/${r.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !r.isActive }) }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] }),
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
    return (_jsxs(AdminLayout, { title: "Gestion des restaurants", children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6", children: [
                    { icon: Store, color: "bg-red-50 text-red-600", value: restaurants.length, label: "Total restaurants" },
                    { icon: Star, color: "bg-yellow-50 text-yellow-600", value: restaurants.length > 0 ? (restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length).toFixed(1) : "—", label: "Note moyenne" },
                    { icon: Clock, color: "bg-green-50 text-green-600", value: restaurants.filter(r => r.isActive).length, label: "Actifs" },
                ].map(({ icon: Icon, color, value, label }) => (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow", children: [_jsx("div", { className: `w-11 h-11 ${color.split(" ")[0]} rounded-xl flex items-center justify-center mb-3`, children: _jsx(Icon, { size: 20, className: color.split(" ")[1] }) }), _jsx("p", { className: "text-3xl font-black text-gray-900 dark:text-white", children: value }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: label })] }, label))) }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-100 dark:border-gray-800 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [_jsx("h3", { className: "font-bold text-gray-900 dark:text-white whitespace-nowrap", children: "Tous les restaurants" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Rechercher...", "data-testid": "search-restaurants", className: "flex-1 max-w-xs px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("button", { onClick: () => setAddingRestaurant(true), "data-testid": "button-add-restaurant", className: "flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-red-200 hover:shadow-md whitespace-nowrap", children: [_jsx(Plus, { size: 16 }), " Ajouter un restaurant"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1", children: [_jsx(GripVertical, { size: 12 }), " Glissez-d\u00E9posez pour r\u00E9ordonner. L'ordre sera refl\u00E9t\u00E9 sur l'app client."] }), hasOrderChanges && (_jsxs("button", { onClick: saveOrder, disabled: savingOrder, "data-testid": "button-save-restaurant-order", className: "px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 animate-pulse", children: [savingOrder ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Save, { size: 16 }), "Sauvegarder l'ordre"] }))] })] }), isLoading ? (_jsx("div", { className: "divide-y divide-gray-50 dark:divide-gray-800", children: [...Array(3)].map((_, i) => (_jsxs("div", { className: "p-4 flex items-center gap-4 animate-pulse", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" }), _jsx("div", { className: "w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" }), _jsx("div", { className: "h-3 bg-gray-100 dark:bg-gray-800 rounded w-28" })] })] }, i))) })) : filtered.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx(Store, { size: 40, className: "mx-auto mb-3 text-gray-200" }), _jsx("p", { className: "text-gray-400", children: search ? "Aucun restaurant correspondant" : "Aucun restaurant" }), !search && _jsx("button", { onClick: () => setAddingRestaurant(true), className: "mt-3 text-red-600 font-semibold text-sm hover:underline", children: "Ajouter le premier restaurant" })] })) : (_jsx("div", { className: "divide-y divide-gray-50 dark:divide-gray-800", children: filtered.map((r, idx) => (_jsxs("div", { "data-testid": `restaurant-row-${r.id}`, draggable: canDrag, onDragStart: canDrag ? handleDragStart(idx) : undefined, onDragOver: canDrag ? handleDragOver(idx) : undefined, onDragEnd: () => { setDragIdx(null); setOverIdx(null); }, onDrop: canDrag ? handleDrop(idx) : undefined, onTouchStart: canDrag ? handleTouchStart(idx) : undefined, onTouchEnd: canDrag ? handleTouchEnd : undefined, className: `transition-all ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${dragIdx === idx ? "opacity-40 scale-[0.98]" : ""} ${overIdx === idx && dragIdx !== idx ? "bg-red-50/50 dark:bg-red-950/30" : ""}`, children: [_jsxs("div", { className: "p-4 flex items-center gap-3", children: [canDrag && (_jsxs("div", { className: "flex flex-col items-center gap-0.5 text-gray-300 dark:text-gray-600 flex-shrink-0 select-none", children: [_jsx(GripVertical, { size: 16 }), _jsx("span", { className: "text-[9px] font-black text-gray-400 dark:text-gray-500 tabular-nums", children: idx + 1 })] })), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0 cursor-pointer", onClick: () => setExpandedId(expandedId === r.id ? null : r.id), children: [r.logoUrl ? (_jsx("img", { src: r.logoUrl, alt: "", className: "w-10 h-10 rounded-lg object-cover border border-gray-200" })) : (_jsx("div", { className: "w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-100", children: _jsx("span", { className: "text-red-600 font-black text-sm", children: r.name.charAt(0) }) })), _jsx("img", { src: r.image, alt: r.name, className: "w-14 h-14 rounded-xl object-cover" })] }), _jsxs("div", { className: "flex-1 min-w-0 cursor-pointer", onClick: () => setExpandedId(expandedId === r.id ? null : r.id), children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white truncate", children: r.name }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: [r.cuisine, " \u00B7 ", r.address] }), _jsxs("div", { className: "flex items-center gap-1.5 mt-1 flex-wrap", children: [_jsx("span", { className: "text-xs text-red-600 font-bold", children: formatPrice(r.deliveryFee) }), _jsx("span", { className: "text-gray-300", children: "\u00B7" }), _jsxs("span", { className: "text-xs text-gray-500 flex items-center gap-0.5", children: [_jsx(Star, { size: 10, className: "text-yellow-500 fill-yellow-500" }), " ", r.rating] }), _jsx("span", { className: "text-gray-300", children: "\u00B7" }), _jsxs("span", { className: "text-xs text-gray-500 flex items-center gap-0.5", children: [_jsx(Clock, { size: 10 }), " ", r.deliveryTime] }), r.prepTime && _jsx("span", { className: "text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-medium", children: r.prepTime })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [canDrag && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: e => { e.stopPropagation(); if (idx > 0)
                                                                moveRestaurant(idx, idx - 1); }, disabled: idx === 0, className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors", "data-testid": `button-moveup-${r.id}`, children: _jsx(ArrowUp, { size: 13, className: "text-gray-500" }) }), _jsx("button", { onClick: e => { e.stopPropagation(); if (idx < filtered.length - 1)
                                                                moveRestaurant(idx, idx + 1); }, disabled: idx === filtered.length - 1, className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors", "data-testid": `button-movedown-${r.id}`, children: _jsx(ArrowDown, { size: 13, className: "text-gray-500" }) })] })), _jsx("button", { onClick: e => { e.stopPropagation(); toggleActive.mutate(r); }, "data-testid": `toggle-active-${r.id}`, className: `px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${r.isActive ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"}`, children: r.isActive ? "Actif" : "Inactif" }), _jsxs("button", { onClick: e => { e.stopPropagation(); setEditingInfo(r); }, "data-testid": `edit-info-${r.id}`, className: "flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors text-xs font-medium", title: "Modifier les infos", children: [_jsx(Pencil, { size: 12 }), " ", _jsx("span", { className: "hidden sm:inline", children: "Infos" })] }), _jsxs("button", { onClick: e => { e.stopPropagation(); setEditingMedia(r); }, "data-testid": `edit-media-${r.id}`, className: "flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors text-xs font-semibold", title: "Modifier logo, image et vid\u00E9o", children: [_jsx(Image, { size: 12 }), " ", _jsx("span", { className: "hidden sm:inline", children: "M\u00E9dias" }), (r.logoUrl || r.coverVideoUrl) && _jsx("span", { className: "w-1.5 h-1.5 bg-green-500 rounded-full" })] }), _jsx("button", { onClick: e => { e.stopPropagation(); setDeletingRestaurant(r); }, "data-testid": `delete-restaurant-${r.id}`, className: "w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors", title: "Supprimer", children: _jsx(Trash2, { size: 13 }) }), _jsx("button", { onClick: () => setExpandedId(expandedId === r.id ? null : r.id), "data-testid": `expand-${r.id}`, className: "w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors", children: expandedId === r.id ? _jsx(ChevronUp, { size: 13 }) : _jsx(ChevronDown, { size: 13 }) })] })] }), expandedId === r.id && (_jsxs("div", { className: "px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800", "data-testid": `restaurant-details-${r.id}`, children: [_jsxs("div", { className: "flex items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-3", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1", children: "Logo" }), r.logoUrl ? (_jsx("img", { src: r.logoUrl, alt: "logo", className: "w-14 h-14 rounded-xl object-cover border-2 border-white shadow", "data-testid": `preview-logo-${r.id}` })) : (_jsx("div", { className: "w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center", "data-testid": `no-logo-${r.id}`, children: _jsxs("span", { className: "text-[10px] text-gray-400 text-center leading-tight", children: ["Pas de", _jsx("br", {}), "logo"] }) }))] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1", children: "Couverture" }), _jsx("img", { src: r.image, alt: "cover", className: "w-24 h-14 rounded-xl object-cover border-2 border-white shadow", "data-testid": `preview-cover-${r.id}` })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1", children: "Vid\u00E9o" }), r.coverVideoUrl ? (_jsxs("div", { className: "w-24 h-14 rounded-xl overflow-hidden border-2 border-white shadow relative", "data-testid": `preview-video-${r.id}`, children: [_jsx("video", { src: r.coverVideoUrl, className: "w-full h-full object-cover", muted: true, playsInline: true }), _jsx("div", { className: "absolute inset-0 bg-black/30 flex items-center justify-center", children: _jsx(Video, { size: 16, className: "text-white" }) })] })) : (_jsxs("div", { className: "w-24 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1", "data-testid": `no-video-${r.id}`, children: [_jsx(Video, { size: 14, className: "text-gray-400" }), _jsx("span", { className: "text-[9px] text-gray-400", children: "Pas de vid\u00E9o" })] }))] })] }), _jsxs("button", { onClick: () => setEditingMedia(r), "data-testid": `quick-edit-media-${r.id}`, className: "ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm", children: [_jsx(Upload, { size: 12 }), " Modifier les m\u00E9dias"] })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider", children: "Email" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 mt-0.5", children: r.email || "—" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider", children: "Manager" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 mt-0.5", children: r.managerName || "—" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider", children: "Telephone" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 mt-0.5", children: r.phone || "—" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider", children: "Horaires" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 mt-0.5", children: r.openingHours || "—" })] })] }), _jsx(MenuSection, { restaurant: r })] }))] }, r.id))) }))] }), addingRestaurant && _jsx(AddRestaurantModal, { onClose: () => setAddingRestaurant(false) }), editingMedia && _jsx(EditMediaModal, { restaurant: editingMedia, onClose: () => setEditingMedia(null) }), editingInfo && _jsx(EditRestaurantModal, { restaurant: editingInfo, onClose: () => setEditingInfo(null) }), deletingRestaurant && _jsx(DeleteRestaurantModal, { restaurant: deletingRestaurant, onClose: () => setDeletingRestaurant(null) })] }));
}
//# sourceMappingURL=AdminRestaurants.js.map