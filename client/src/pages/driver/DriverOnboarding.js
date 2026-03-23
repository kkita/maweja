import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { apiRequest, resolveUrl, resolveImg, getUserRole, getAuthToken } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { onWSMessage } from "../../lib/websocket";
import { Camera, User, Mail, Phone, MapPin, Calendar, Users, Shield, CheckCircle2, Clock, AlertCircle, Loader2, X, ChevronRight } from "lucide-react";
const isNativeMobile = () => typeof window.Capacitor !== "undefined" &&
    !!window.Capacitor?.isNativePlatform?.();
const FIELD_LABELS = {
    name: "Nom complet",
    sex: "Sexe",
    dateOfBirth: "Date de naissance",
    fullAddress: "Adresse complete",
    email: "Adresse email",
    phone: "Numero de telephone",
    idPhotoUrl: "Photo de la piece d'identite",
    profilePhotoUrl: "Photo de profil",
};
async function uploadFileToServer(file) {
    const formData = new FormData();
    formData.append("file", file);
    const headers = { "X-User-Role": getUserRole() };
    const token = getAuthToken();
    if (token)
        headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(resolveUrl("/api/upload"), {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
    });
    if (!res.ok) {
        let message = "Échec de l'envoi de la photo";
        try {
            const body = await res.json();
            message = body.message || message;
        }
        catch { }
        throw new Error(message);
    }
    const data = await res.json();
    return resolveUrl(data.url);
}
function FileUploadField({ label, icon: Icon, value, onChange, rejected, disabled }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const { toast } = useToast();
    const doUpload = async (file) => {
        setUploading(true);
        setErrorMsg(null);
        try {
            const url = await uploadFileToServer(file);
            onChange(url);
        }
        catch (e) {
            const msg = e?.message || "Impossible d'envoyer la photo";
            setErrorMsg(msg);
            toast({ title: "Erreur photo", description: msg, variant: "destructive" });
            onChange("");
        }
        finally {
            setUploading(false);
        }
    };
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        await doUpload(file);
        if (inputRef.current)
            inputRef.current.value = "";
    };
    const pickNative = async () => {
        setUploading(true);
        setErrorMsg(null);
        try {
            const { Camera } = window.Capacitor.Plugins;
            const photo = await Camera.getPhoto({
                quality: 85,
                allowEditing: false,
                resultType: "base64",
                source: "PHOTOS",
            });
            const blob = await fetch(`data:image/jpeg;base64,${photo.base64String}`).then(r => r.blob());
            const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
            await doUpload(file);
        }
        catch (e) {
            if (e?.message !== "cancelled") {
                toast({ title: "Erreur photo", description: "Impossible d'accéder à la galerie", variant: "destructive" });
            }
            setUploading(false);
        }
    };
    const handleClick = () => {
        if (isNativeMobile()) {
            pickNative();
        }
        else {
            inputRef.current?.click();
        }
    };
    const imgSrc = value ? (value.startsWith("http") ? value : resolveUrl(value)) : "";
    return (_jsxs("div", { className: `rounded-2xl border-2 transition-all ${rejected ? "border-red-300 bg-red-50" : value ? "border-green-300 bg-green-50" : "border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"} ${disabled ? "opacity-50 pointer-events-none" : ""}`, children: [rejected && (_jsxs("div", { className: "px-4 pt-3 flex items-center gap-1.5", children: [_jsx(AlertCircle, { size: 12, className: "text-red-500" }), _jsx("span", { className: "text-[10px] font-bold text-red-600", children: "A CORRIGER" })] })), _jsxs("div", { className: "p-4", children: [_jsxs("p", { className: "text-xs font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2", children: [_jsx(Icon, { size: 14, className: rejected ? "text-red-500" : value ? "text-green-600" : "text-gray-400 dark:text-gray-500" }), label, " ", _jsx("span", { className: "text-red-500", children: "*" })] }), value ? (_jsxs("div", { className: "relative", children: [_jsx("img", { src: imgSrc, alt: label, className: "w-full h-40 object-cover rounded-xl" }), !disabled && (_jsx("button", { onClick: () => { onChange(""); setErrorMsg(null); }, className: "absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white:bg-gray-800", "data-testid": `change-${label.toLowerCase().replace(/\s/g, "-")}`, children: _jsx(X, { size: 12, className: "text-gray-600 dark:text-gray-300" }) })), !rejected && _jsx(CheckCircle2, { size: 20, className: "absolute bottom-2 right-2 text-green-600 bg-white rounded-full" })] })) : (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: handleClick, disabled: uploading, "data-testid": `upload-${label.toLowerCase().replace(/\s/g, "-")}`, className: "w-full py-8 border border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:bg-white:bg-gray-700 transition-colors", children: [uploading ? (_jsx(Loader2, { size: 24, className: "text-red-500 animate-spin" })) : (_jsx(Camera, { size: 24, className: errorMsg ? "text-red-400" : "text-gray-400 dark:text-gray-500" })), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500", children: uploading ? "Envoi en cours..." : isNativeMobile() ? "Appuyez pour choisir depuis la galerie" : "Cliquez pour choisir une photo" })] }), errorMsg && (_jsxs("div", { className: "mt-2 flex items-center gap-1.5 text-red-600 text-[11px] font-medium", children: [_jsx(AlertCircle, { size: 12 }), errorMsg] }))] }))] }), _jsx("input", { ref: inputRef, type: "file", accept: "image/*", style: { position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }, onChange: handleFileChange })] }));
}
export default function DriverOnboarding() {
    const { user, setUser, refreshUser } = useAuth();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || "",
        sex: user?.sex || "",
        dateOfBirth: user?.dateOfBirth || "",
        fullAddress: user?.fullAddress || "",
        email: user?.email || "",
        phone: user?.phone || "",
        idPhotoUrl: user?.idPhotoUrl || "",
        profilePhotoUrl: user?.profilePhotoUrl || "",
    });
    const rejectedFields = user?.rejectedFields || [];
    const isPending = user?.verificationStatus === "pending";
    const isRejected = user?.verificationStatus === "rejected";
    const isFirstTime = !user?.verificationStatus || user.verificationStatus === "not_started";
    const isFieldDisabled = (field) => {
        if (isFirstTime)
            return false;
        if (isRejected)
            return !rejectedFields.includes(field);
        return true;
    };
    const isFieldRejected = (field) => isRejected && rejectedFields.includes(field);
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "verification_approved") {
                toast({ title: "Compte approuve!", description: "Vous pouvez maintenant utiliser l'application" });
                refreshUser();
            }
            if (data.type === "verification_rejected") {
                toast({ title: "Corrections requises", description: "Veuillez corriger les champs indiques", variant: "destructive" });
                refreshUser();
            }
        });
    }, [toast, refreshUser]);
    const handleSubmit = async () => {
        const missing = Object.entries(form).filter(([_, v]) => !v);
        if (missing.length > 0 && isFirstTime) {
            toast({ title: "Champs manquants", description: "Tous les champs sont obligatoires", variant: "destructive" });
            return;
        }
        if (isRejected) {
            const missingRejected = rejectedFields.filter(f => !form[f]);
            if (missingRejected.length > 0) {
                toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs a corriger", variant: "destructive" });
                return;
            }
        }
        setSubmitting(true);
        try {
            const res = await apiRequest("/api/driver/onboarding", {
                method: "POST",
                body: JSON.stringify(form),
            });
            const data = await res.json();
            setUser(data);
            toast({ title: "Informations envoyees!", description: "En attente de verification par l'administration" });
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
        setSubmitting(false);
    };
    if (isPending) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-6", children: _jsxs("div", { className: "max-w-sm w-full text-center", children: [_jsx("div", { className: "w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(Clock, { size: 36, className: "text-orange-500" }) }), _jsx("h1", { className: "text-2xl font-black text-gray-900 dark:text-white mb-2", children: "En attente de verification" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6 leading-relaxed", children: "Vos informations ont ete envoyees avec succes. L'administration est en train de les examiner. Vous serez notifie des que votre compte sera valide." }), _jsx("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [form.profilePhotoUrl && (_jsx("img", { src: resolveImg(form.profilePhotoUrl), alt: "Profile", className: "w-12 h-12 rounded-xl object-cover" })), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "font-bold text-sm text-gray-900 dark:text-white", children: form.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500", children: form.email })] })] }) }), _jsx("div", { className: "bg-orange-50 rounded-xl p-3 border border-orange-200 mb-4", children: _jsxs("p", { className: "text-xs text-orange-700 flex items-center gap-2 justify-center", children: [_jsx(Loader2, { size: 14, className: "animate-spin" }), " Verification en cours..."] }) }), _jsxs("button", { onClick: () => refreshUser(), "data-testid": "button-refresh-status", className: "w-full py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50:bg-red-950/30 transition-colors", children: [_jsx(CheckCircle2, { size: 16 }), "Actualiser le statut"] }), _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 mt-8", children: "Made By Khevin Andrew Kita - Ed Corporation" })] }) }));
    }
    const inputClass = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-red-50 to-white", children: _jsxs("div", { className: "max-w-lg mx-auto px-4 py-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200", children: _jsx(Shield, { size: 28, className: "text-white" }) }), _jsx("h1", { className: "text-2xl font-black text-gray-900 dark:text-white mb-1", children: isRejected ? "Corrections requises" : "Completez votre profil" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500", children: isRejected
                                ? "Certaines informations doivent etre corrigees avant la validation"
                                : "Remplissez vos informations pour activer votre compte livreur" })] }), isRejected && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-2xl p-4 mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(AlertCircle, { size: 16, className: "text-red-600" }), _jsx("span", { className: "font-bold text-sm text-red-700", children: "Champs a corriger" })] }), _jsx("ul", { className: "space-y-1", children: rejectedFields.map(f => (_jsxs("li", { className: "text-xs text-red-600 flex items-center gap-1.5", children: [_jsx(ChevronRight, { size: 10 }), " ", FIELD_LABELS[f] || f] }, f))) })] })), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("name") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`, children: [isFieldRejected("name") && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(AlertCircle, { size: 12, className: "text-red-500" }), _jsx("span", { className: "text-[10px] font-bold text-red-600", children: "A CORRIGER" })] })), _jsxs("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2", children: [_jsx(User, { size: 12 }), " Nom complet ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: form.name, onChange: e => setForm({ ...form, name: e.target.value }), disabled: isFieldDisabled("name"), "data-testid": "input-onboard-name", placeholder: "Ex: Jean-Baptiste Mukoko", className: inputClass })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("sex") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`, children: [isFieldRejected("sex") && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(AlertCircle, { size: 12, className: "text-red-500" }), _jsx("span", { className: "text-[10px] font-bold text-red-600", children: "A CORRIGER" })] })), _jsxs("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2", children: [_jsx(Users, { size: 12 }), " Sexe ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: form.sex, onChange: e => setForm({ ...form, sex: e.target.value }), disabled: isFieldDisabled("sex"), "data-testid": "select-onboard-sex", className: inputClass, children: [_jsx("option", { value: "", children: "Choisir..." }), _jsx("option", { value: "homme", children: "Homme" }), _jsx("option", { value: "femme", children: "Femme" })] })] }), _jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("dateOfBirth") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`, children: [isFieldRejected("dateOfBirth") && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(AlertCircle, { size: 12, className: "text-red-500" }), _jsx("span", { className: "text-[10px] font-bold text-red-600", children: "A CORRIGER" })] })), _jsxs("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2", children: [_jsx(Calendar, { size: 12 }), " Date de naissance ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "date", value: form.dateOfBirth, onChange: e => setForm({ ...form, dateOfBirth: e.target.value }), disabled: isFieldDisabled("dateOfBirth"), "data-testid": "input-onboard-dob", className: inputClass })] })] }), _jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("fullAddress") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`, children: [isFieldRejected("fullAddress") && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(AlertCircle, { size: 12, className: "text-red-500" }), _jsx("span", { className: "text-[10px] font-bold text-red-600", children: "A CORRIGER" })] })), _jsxs("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2", children: [_jsx(MapPin, { size: 12 }), " Adresse complete ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: form.fullAddress, onChange: e => setForm({ ...form, fullAddress: e.target.value }), disabled: isFieldDisabled("fullAddress"), "data-testid": "input-onboard-address", placeholder: "Ex: 12 Avenue Kasa-Vubu, Commune de Lingwala, Kinshasa", className: inputClass })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("email") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`, children: [isFieldRejected("email") && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(AlertCircle, { size: 12, className: "text-red-500" }), _jsx("span", { className: "text-[10px] font-bold text-red-600", children: "A CORRIGER" })] })), _jsxs("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2", children: [_jsx(Mail, { size: 12 }), " Email ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "email", value: form.email, onChange: e => setForm({ ...form, email: e.target.value }), disabled: isFieldDisabled("email"), "data-testid": "input-onboard-email", className: inputClass })] }), _jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("phone") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`, children: [isFieldRejected("phone") && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(AlertCircle, { size: 12, className: "text-red-500" }), _jsx("span", { className: "text-[10px] font-bold text-red-600", children: "A CORRIGER" })] })), _jsxs("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2", children: [_jsx(Phone, { size: 12 }), " Telephone ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "tel", value: form.phone, onChange: e => setForm({ ...form, phone: e.target.value }), disabled: isFieldDisabled("phone"), "data-testid": "input-onboard-phone", className: inputClass })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(FileUploadField, { label: "Photo de profil", icon: Camera, value: form.profilePhotoUrl, onChange: url => setForm({ ...form, profilePhotoUrl: url }), rejected: isFieldRejected("profilePhotoUrl"), disabled: isFieldDisabled("profilePhotoUrl") }), _jsx(FileUploadField, { label: "Piece d'identite", icon: Shield, value: form.idPhotoUrl, onChange: url => setForm({ ...form, idPhotoUrl: url }), rejected: isFieldRejected("idPhotoUrl"), disabled: isFieldDisabled("idPhotoUrl") })] })] }), _jsxs("button", { onClick: handleSubmit, disabled: submitting, "data-testid": "button-submit-onboarding", className: "w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm mt-8 shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2", children: [submitting ? _jsx(Loader2, { size: 18, className: "animate-spin" }) : _jsx(CheckCircle2, { size: 18 }), submitting ? "Envoi en cours..." : isRejected ? "Renvoyer les corrections" : "Envoyer pour verification"] }), _jsx("p", { className: "text-center text-[10px] text-gray-400 dark:text-gray-500 mt-6", children: "Made By Khevin Andrew Kita - Ed Corporation" })] }) }));
}
//# sourceMappingURL=DriverOnboarding.js.map