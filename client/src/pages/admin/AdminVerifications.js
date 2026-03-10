import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Shield, CheckCircle2, XCircle, User, ChevronRight, AlertCircle, Clock, Eye, Loader2 } from "lucide-react";
const FIELD_LABELS = {
    name: "Nom complet",
    sex: "Sexe",
    dateOfBirth: "Date de naissance",
    fullAddress: "Adresse complete",
    email: "Adresse email",
    phone: "Numero de telephone",
    idPhotoUrl: "Photo piece d'identite",
    profilePhotoUrl: "Photo de profil",
};
const FIELDS = ["name", "sex", "dateOfBirth", "fullAddress", "email", "phone", "idPhotoUrl", "profilePhotoUrl"];
export default function AdminVerifications() {
    const { toast } = useToast();
    const [selected, setSelected] = useState(null);
    const [rejectedFields, setRejectedFields] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const { data: pendingDrivers = [] } = useQuery({
        queryKey: ["/api/admin/verifications"],
        refetchInterval: 5000,
    });
    const handleApprove = async (driverId) => {
        setSubmitting(true);
        try {
            await apiRequest(`/api/admin/verify/${driverId}`, {
                method: "POST",
                body: JSON.stringify({ action: "approve" }),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
            toast({ title: "Livreur approuve!", description: "Le livreur peut maintenant utiliser l'application" });
            setSelected(null);
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
        setSubmitting(false);
    };
    const handleReject = async (driverId) => {
        if (rejectedFields.length === 0) {
            toast({ title: "Selectionnez les champs", description: "Cochez les champs a corriger avant de rejeter", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            await apiRequest(`/api/admin/verify/${driverId}`, {
                method: "POST",
                body: JSON.stringify({ action: "reject", rejectedFields }),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
            toast({ title: "Corrections demandees", description: "Le livreur a ete notifie" });
            setSelected(null);
            setRejectedFields([]);
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
        setSubmitting(false);
    };
    const toggleRejected = (field) => {
        setRejectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
    };
    const getFieldValue = (driver, field) => {
        return driver[field] || "";
    };
    return (_jsxs(AdminLayout, { title: "Verifications livreurs", children: [previewImage && (_jsx("div", { className: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4", onClick: () => setPreviewImage(null), children: _jsx("img", { src: previewImage, alt: "Preview", className: "max-w-full max-h-full rounded-2xl object-contain" }) })), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6", children: [_jsx("div", { className: "bg-white rounded-xl p-4 border border-gray-100 shadow-sm", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center", children: _jsx(Clock, { size: 18, className: "text-orange-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-black text-gray-900", children: pendingDrivers.filter(d => d.verificationStatus === "pending").length }), _jsx("p", { className: "text-[10px] text-gray-500", children: "En attente" })] })] }) }), _jsx("div", { className: "bg-white rounded-xl p-4 border border-gray-100 shadow-sm", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center", children: _jsx(AlertCircle, { size: 18, className: "text-red-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-black text-gray-900", children: pendingDrivers.filter(d => d.verificationStatus === "rejected").length }), _jsx("p", { className: "text-[10px] text-gray-500", children: "Rejetes" })] })] }) })] }), _jsxs("div", { className: "flex gap-4", style: { height: "calc(100vh - 240px)", minHeight: 400 }, children: [_jsxs("div", { className: "w-[320px] shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col", children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-100", children: _jsxs("h3", { className: "font-bold text-sm text-gray-900 flex items-center gap-2", children: [_jsx(Shield, { size: 14, className: "text-red-600" }), " Demandes (", pendingDrivers.length, ")"] }) }), _jsx("div", { className: "flex-1 overflow-y-auto", children: pendingDrivers.length === 0 ? (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(CheckCircle2, { size: 36, className: "mx-auto mb-2 opacity-20" }), _jsx("p", { className: "text-xs font-medium", children: "Aucune demande en attente" })] })) : (pendingDrivers.map((d) => (_jsx("div", { onClick: () => { setSelected(d); setRejectedFields([]); }, "data-testid": `verification-card-${d.id}`, className: `p-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${selected?.id === d.id ? "bg-red-50 border-l-[3px] border-l-red-600" : ""}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [d.profilePhotoUrl ? (_jsx("img", { src: d.profilePhotoUrl, alt: "", className: "w-10 h-10 rounded-xl object-cover" })) : (_jsx("div", { className: "w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center", children: _jsx(User, { size: 16, className: "text-gray-400" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-xs text-gray-900 truncate", children: d.name }), _jsx("p", { className: "text-[10px] text-gray-500", children: d.email }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${d.verificationStatus === "pending" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`, children: d.verificationStatus === "pending" ? "EN ATTENTE" : "REJETE" })] }), _jsx(ChevronRight, { size: 14, className: "text-gray-300" })] }) }, d.id)))) })] }), _jsx("div", { className: "flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col", children: selected ? (_jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsx("div", { className: "p-5 border-b border-gray-100", children: _jsxs("div", { className: "flex items-center gap-4", children: [selected.profilePhotoUrl ? (_jsx("img", { src: selected.profilePhotoUrl, alt: "", className: "w-16 h-16 rounded-2xl object-cover cursor-pointer hover:opacity-80", onClick: () => setPreviewImage(selected.profilePhotoUrl) })) : (_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center", children: _jsx(User, { size: 24, className: "text-gray-400" }) })), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-black text-gray-900", "data-testid": "verification-driver-name", children: selected.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [selected.email, " - ", selected.phone] }), _jsx("span", { className: `text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${selected.verificationStatus === "pending" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`, children: selected.verificationStatus === "pending" ? "EN ATTENTE DE VERIFICATION" : "CORRECTIONS DEMANDEES" })] })] }) }), _jsxs("div", { className: "p-5", children: [_jsx("p", { className: "text-[10px] text-gray-500 font-semibold mb-3", children: "INFORMATIONS SOUMISES \u2014 Cochez les champs incorrects pour demander une correction" }), _jsx("div", { className: "space-y-3", children: FIELDS.map(field => {
                                                const value = getFieldValue(selected, field);
                                                const isPhoto = field === "idPhotoUrl" || field === "profilePhotoUrl";
                                                const isChecked = rejectedFields.includes(field);
                                                const wasRejected = (selected.rejectedFields || []).includes(field);
                                                return (_jsx("div", { className: `rounded-xl border-2 p-3 transition-all cursor-pointer ${isChecked ? "border-red-300 bg-red-50" : wasRejected ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`, onClick: () => toggleRejected(field), "data-testid": `field-${field}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${isChecked ? "border-red-500 bg-red-500" : "border-gray-300"}`, children: isChecked && _jsx(XCircle, { size: 12, className: "text-white" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5", children: [FIELD_LABELS[field], wasRejected && _jsx("span", { className: "text-[8px] bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full", children: "DEJA REJETE" })] }), isPhoto ? (value ? (_jsx("img", { src: value, alt: FIELD_LABELS[field], className: "w-full max-w-xs h-32 object-cover rounded-lg cursor-pointer hover:opacity-80", onClick: e => { e.stopPropagation(); setPreviewImage(value); } })) : (_jsx("p", { className: "text-xs text-red-500 italic", children: "Non fourni" }))) : (_jsx("p", { className: "text-sm text-gray-900", children: value || _jsx("span", { className: "text-red-500 italic", children: "Non renseigne" }) }))] })] }) }, field));
                                            }) }), _jsxs("div", { className: "flex gap-3 mt-6 pt-4 border-t border-gray-100", children: [_jsxs("button", { onClick: () => handleApprove(selected.id), disabled: submitting, "data-testid": "button-approve-driver", className: "flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50", children: [submitting ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(CheckCircle2, { size: 16 }), "Approuver le livreur"] }), _jsxs("button", { onClick: () => handleReject(selected.id), disabled: submitting || rejectedFields.length === 0, "data-testid": "button-reject-driver", className: "flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50", children: [submitting ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(XCircle, { size: 16 }), "Rejeter (", rejectedFields.length, " champ", rejectedFields.length !== 1 ? "s" : "", ")"] })] })] })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center text-gray-400", children: [_jsx(Eye, { size: 48, className: "mx-auto mb-3 opacity-20" }), _jsx("p", { className: "font-bold text-gray-500", children: "Selectionnez une demande" }), _jsx("p", { className: "text-xs mt-1", children: "pour examiner les informations du livreur" })] }) })) })] })] }));
}
//# sourceMappingURL=AdminVerifications.js.map