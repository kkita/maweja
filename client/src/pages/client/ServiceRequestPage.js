import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { apiRequest, queryClient, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft, Calendar, User, Phone, MapPin, Tag, DollarSign, FileText, MessageCircle, Send, CheckCircle2, Loader2, AlertTriangle, Zap, } from "lucide-react";
function parseMinPrice(priceStr) {
    const match = priceStr.match(/\$(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}
/* ─── Shared style constants ───────────────────────────────────────────────── */
const input = "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 " +
    "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 " +
    "rounded-2xl text-[15px] font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all";
const inputIcon = "w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 " +
    "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 " +
    "rounded-2xl text-[15px] font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all";
const card = "bg-white dark:bg-gray-900/80 rounded-3xl border border-gray-100 dark:border-gray-800/60 shadow-sm";
const label = "text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block";
const sectionTitle = "font-black text-[15px] text-gray-900 dark:text-white mb-4 flex items-center gap-2";
const iconBox = "w-8 h-8 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center flex-shrink-0";
/* ─── Step number badge ─────────────────────────────────────────────────── */
function Step({ n }) {
    return (_jsx("span", { className: "w-6 h-6 bg-red-600 text-white rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0", children: n }));
}
export default function ServiceRequestPage() {
    const [currentPath, navigate] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useI18n();
    const pathParts = currentPath.split("/");
    const requestId = pathParts[pathParts.length - 1];
    const isViewMode = pathParts.includes("request") && requestId && !isNaN(Number(requestId));
    const stored = sessionStorage.getItem("maweja_service_request");
    const catalogData = stored ? JSON.parse(stored) : null;
    const categoryId = catalogData?.categoryId || null;
    const categoryName = catalogData?.categoryName || "";
    const catalogItemId = catalogData?.catalogItemId || null;
    const catalogItemName = catalogData?.catalogItemName || null;
    const catalogItemPrice = catalogData?.catalogItemPrice || null;
    const catalogItemImage = catalogData?.catalogItemImage || null;
    const hasCatalogModel = !!catalogItemName;
    const minPrice = catalogItemPrice ? parseMinPrice(catalogItemPrice) : null;
    const { data: existingRequest } = useQuery({
        queryKey: ["/api/service-requests", requestId],
        queryFn: () => authFetchJson(`/api/service-requests/${requestId}`),
        enabled: !!isViewMode && !!user,
    });
    const [scheduledType, setScheduledType] = useState("asap");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [serviceType, setServiceType] = useState("");
    const [budget, setBudget] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [contactMethod, setContactMethod] = useState("phone");
    const [submitted, setSubmitted] = useState(false);
    const [priceError, setPriceError] = useState("");
    useEffect(() => {
        if (user && !fullName) {
            setFullName(user.name || "");
            setPhone(user.phone || "");
            setAddress(user.address || "");
        }
    }, [user]);
    const { data: allCategories = [] } = useQuery({
        queryKey: ["/api/service-categories"],
    });
    const currentCategory = allCategories.find(c => c.id === Number(categoryId));
    const dynamicTypes = currentCategory?.serviceTypes?.length
        ? [...currentCategory.serviceTypes, "Autre"]
        : null;
    const createMutation = useMutation({
        mutationFn: (data) => apiRequest("/api/service-requests", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
            setSubmitted(true);
        },
        onError: (err) => {
            let msg = err?.message || t.common.error;
            try {
                msg = JSON.parse(msg)?.message || msg;
            }
            catch { }
            if (msg.includes("401") || msg.includes("Non authentifie")) {
                toast({ title: "Connexion requise", description: "Veuillez vous connecter pour envoyer une demande.", variant: "destructive" });
                navigate("/login");
            }
            else if (msg.includes("403") || msg.includes("interdit")) {
                toast({ title: "Accès refusé", description: "Seuls les clients peuvent envoyer des demandes de service.", variant: "destructive" });
            }
            else {
                toast({ title: "Erreur d'envoi", description: msg, variant: "destructive" });
            }
        },
    });
    const validatePrice = (value) => {
        if (!minPrice || !value.trim())
            return true;
        const numMatch = value.match(/(\d+)/);
        if (!numMatch)
            return true;
        const enteredPrice = parseInt(numMatch[1], 10);
        if (enteredPrice < minPrice) {
            setPriceError(`${t.services.priceTooLow} (${t.services.minPrice}: $${minPrice})`);
            return false;
        }
        setPriceError("");
        return true;
    };
    const handleBudgetChange = (value) => {
        setBudget(value);
        if (priceError)
            validatePrice(value);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Connexion requise", description: "Veuillez vous connecter pour envoyer une demande de service.", variant: "destructive" });
            navigate("/login");
            return;
        }
        if (user.role !== "client") {
            toast({ title: "Accès refusé", description: "Seuls les clients peuvent envoyer des demandes de service.", variant: "destructive" });
            return;
        }
        if (!categoryId && !categoryName) {
            toast({ title: "Catégorie manquante", description: "Veuillez sélectionner une catégorie de service.", variant: "destructive" });
            navigate("/services");
            return;
        }
        if (!phone.trim()) {
            toast({ title: "Numéro requis", description: "Veuillez entrer votre numéro de téléphone.", variant: "destructive" });
            return;
        }
        if (hasCatalogModel && budget.trim() && !validatePrice(budget)) {
            return;
        }
        if (!hasCatalogModel && (!fullName.trim() || !phone.trim())) {
            toast({ title: "Champs requis", description: "Veuillez remplir votre nom et téléphone.", variant: "destructive" });
            return;
        }
        createMutation.mutate({
            categoryId: Number(categoryId) || 1,
            categoryName: categoryName || "Service",
            scheduledType,
            scheduledDate: scheduledType === "scheduled" ? scheduledDate : null,
            scheduledTime: scheduledType === "scheduled" ? scheduledTime : null,
            fullName: fullName || user?.name || "Client",
            phone,
            address: address || user?.address || "Non précisé",
            serviceType: catalogItemName ? `${catalogItemName}${serviceType ? ` - ${serviceType}` : ""}` : serviceType || "Non précisé",
            budget: budget || catalogItemPrice || "",
            additionalInfo: hasCatalogModel
                ? `[${t.services.selectedModel}: ${catalogItemName}${catalogItemPrice ? ` (${catalogItemPrice})` : ""}]${catalogItemImage ? `\n[Image: ${catalogItemImage}]` : ""}${additionalInfo ? `\n${additionalInfo}` : ""}`
                : additionalInfo,
            contactMethod,
        });
    };
    /* ─── Success screen ──────────────────────────────────────────────────── */
    if (submitted) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(ClientNav, {}), _jsx("div", { className: "max-w-lg mx-auto px-4 py-10", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm", children: [_jsx("div", { className: "w-24 h-24 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle2, { size: 48, className: "text-green-500" }) }), _jsx("h2", { className: "text-2xl font-black text-gray-900 dark:text-white mb-2", style: { fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "-0.02em" }, "data-testid": "text-request-sent", children: t.services.requestSent }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-7", children: t.services.requestSentDesc }), hasCatalogModel && catalogItemImage && (_jsx("div", { className: "mb-6 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800", children: _jsx("img", { src: catalogItemImage, alt: catalogItemName || "", className: "w-full h-48 object-cover" }) })), _jsxs("div", { className: "bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-5 mb-7 text-left space-y-2", children: [_jsx("p", { className: "text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3", children: t.services.summary }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.services.service }), _jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: categoryName })] }), catalogItemName && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.services.selectedModel }), _jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: catalogItemName })] })), (budget || catalogItemPrice) && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.services.yourPrice }), _jsx("span", { className: "text-sm font-bold text-red-600", children: budget || catalogItemPrice })] })), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.services.contact }), _jsx("span", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: contactMethod === "whatsapp" ? "WhatsApp" : contactMethod === "phone" ? t.services.telephone : t.common.email })] })] }), _jsx("button", { onClick: () => navigate("/services"), "data-testid": "button-back-services", className: "w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[15px] hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-red-900/40", style: { fontFamily: "system-ui,-apple-system,sans-serif" }, children: t.services.backToServices })] }) })] }));
    }
    /* ─── View existing request ───────────────────────────────────────────── */
    if (isViewMode && existingRequest) {
        const statusLabels = {
            pending: t.services.statusPending,
            reviewing: t.services.statusReviewing,
            accepted: t.services.statusAccepted,
            rejected: t.services.statusRejected,
            completed: t.services.statusCompleted,
        };
        const statusStyles = {
            pending: { pill: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40", dot: "bg-amber-500" },
            reviewing: { pill: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40", dot: "bg-blue-500" },
            accepted: { pill: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/40", dot: "bg-green-500" },
            rejected: { pill: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/40", dot: "bg-red-500" },
            completed: { pill: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700", dot: "bg-gray-400" },
        };
        const st = statusStyles[existingRequest.status] || statusStyles.pending;
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("button", { onClick: () => navigate("/services"), className: "w-11 h-11 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm", "data-testid": "button-back", children: _jsx(ArrowLeft, { size: 18, className: "text-gray-600 dark:text-gray-300" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("h2", { className: "text-lg font-black text-gray-900 dark:text-white", style: { fontFamily: "system-ui,-apple-system,sans-serif" }, children: [t.services.request, " #", existingRequest.id] }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: existingRequest.categoryName })] }), _jsxs("span", { className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${st.pill}`, children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${st.dot}` }), statusLabels[existingRequest.status] || existingRequest.status] })] }), _jsxs("div", { className: `${card} p-5 space-y-4`, children: [[
                                    { label: t.services.fullName, value: existingRequest.fullName },
                                    { label: t.common.phone, value: existingRequest.phone },
                                    { label: t.common.address, value: existingRequest.address },
                                    existingRequest.serviceType ? { label: t.services.type, value: existingRequest.serviceType } : null,
                                    existingRequest.budget ? { label: t.admin.budget, value: existingRequest.budget } : null,
                                    {
                                        label: t.admin.schedule,
                                        value: existingRequest.scheduledType === "asap"
                                            ? t.services.asap
                                            : `${existingRequest.scheduledDate} ${existingRequest.scheduledTime}`,
                                    },
                                    existingRequest.additionalInfo ? { label: t.services.additionalInfo, value: existingRequest.additionalInfo } : null,
                                ].filter(Boolean).map((row, i) => (_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx("p", { className: "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider", children: row.label }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: row.value })] }, i))), existingRequest.adminNotes && (_jsxs("div", { className: "bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/40 mt-2", children: [_jsx("p", { className: "text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5", children: t.services.teamResponse }), _jsx("p", { className: "text-sm text-blue-800 dark:text-blue-300 leading-relaxed", children: existingRequest.adminNotes })] }))] })] })] }));
    }
    /* ─── Catalog model form ─────────────────────────────────────────────── */
    if (hasCatalogModel) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto", children: [_jsxs("div", { className: "relative", children: [catalogItemImage ? (_jsxs("div", { className: "w-full", style: { height: 240 }, children: [_jsx("img", { src: catalogItemImage, alt: catalogItemName || "", className: "w-full h-full object-cover", "data-testid": "img-selected-model" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" })] })) : (_jsx("div", { className: "w-full h-40 bg-gradient-to-br from-red-600 to-red-800" })), _jsx("button", { onClick: () => navigate("/services"), className: "absolute top-4 left-4 w-11 h-11 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20", "data-testid": "button-back", children: _jsx(ArrowLeft, { size: 18, className: "text-white" }) }), _jsxs("div", { className: "absolute bottom-0 left-0 right-0 px-5 pb-5", children: [_jsx("p", { className: "text-white/60 text-[11px] font-semibold uppercase tracking-wider", children: categoryName }), _jsx("h1", { className: "text-white text-xl font-black leading-tight", style: { fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "-0.02em" }, "data-testid": "text-form-title", children: catalogItemName }), catalogItemPrice && (_jsx("span", { className: "inline-block mt-1 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full", children: catalogItemPrice }))] })] }), _jsxs("div", { className: "px-4 py-5 space-y-4", children: [_jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500 text-center", children: t.services.quickRequestDesc }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: `${card} p-5`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 1 }), t.services.dateTime] }), _jsx("div", { className: "flex gap-2 mb-3", children: [
                                                        { key: "asap", label: t.services.asap, icon: Zap, testId: "button-asap" },
                                                        { key: "scheduled", label: t.services.schedule, icon: Calendar, testId: "button-schedule" },
                                                    ].map(opt => (_jsxs("button", { type: "button", onClick: () => setScheduledType(opt.key), "data-testid": opt.testId, className: `flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${scheduledType === opt.key
                                                            ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40"
                                                            : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60"}`, children: [_jsx(opt.icon, { size: 15 }), opt.label] }, opt.key))) }), scheduledType === "scheduled" && (_jsxs("div", { className: "grid grid-cols-2 gap-3 pt-1", children: [_jsxs("div", { children: [_jsx("label", { className: label, children: t.common.date }), _jsx("input", { type: "date", value: scheduledDate, onChange: e => setScheduledDate(e.target.value), "data-testid": "input-date", className: input })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: "Heure" }), _jsx("input", { type: "time", value: scheduledTime, onChange: e => setScheduledTime(e.target.value), "data-testid": "input-time", className: input })] })] }))] }), _jsxs("div", { className: `${card} p-5 space-y-4`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 2 }), t.services.personalInfo] }), _jsxs("div", { children: [_jsxs("label", { className: label, children: [t.common.phone, " *"] }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "tel", value: phone, onChange: e => setPhone(e.target.value), required: true, "data-testid": "input-phone", placeholder: t.services.phonePlaceholder, className: inputIcon })] })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: t.common.address }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { size: 16, className: "absolute left-4 top-4 text-gray-400" }), _jsx("input", { type: "text", value: address, onChange: e => setAddress(e.target.value), "data-testid": "input-address", placeholder: t.services.addressPlaceholder, className: inputIcon })] })] }), _jsxs("div", { children: [_jsxs("label", { className: label, children: [t.services.yourPrice, minPrice && _jsxs("span", { className: "ml-1 normal-case font-normal text-gray-400", children: ["(", t.services.minPrice, ": $", minPrice, ")"] })] }), _jsxs("div", { className: "relative", children: [_jsx(DollarSign, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: budget, onChange: e => handleBudgetChange(e.target.value), onBlur: () => validatePrice(budget), "data-testid": "input-budget", placeholder: catalogItemPrice ? `${t.services.minPrice}: ${catalogItemPrice}` : t.services.budgetPlaceholder, className: `${inputIcon} ${priceError ? "border-red-400 bg-red-50 dark:bg-red-950/30 focus:ring-red-400" : ""}` })] }), priceError && (_jsxs("div", { className: "flex items-center gap-1.5 mt-2 text-red-600 dark:text-red-400", "data-testid": "text-price-error", children: [_jsx(AlertTriangle, { size: 13 }), _jsx("p", { className: "text-[12px] font-semibold", children: priceError })] }))] })] }), _jsxs("div", { className: `${card} p-5`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 3 }), t.services.optionalNotes] }), _jsx("textarea", { value: additionalInfo, onChange: e => setAdditionalInfo(e.target.value), "data-testid": "input-additional-info", placeholder: t.services.optionalNotesPlaceholder, className: "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-[15px] font-medium resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all" })] }), _jsxs("div", { className: `${card} p-5`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 4 }), t.services.preferredContact] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                                                        { key: "phone", label: t.services.telephone, icon: Phone },
                                                        { key: "whatsapp", label: t.services.whatsapp, icon: MessageCircle },
                                                        { key: "email", label: t.common.email, icon: FileText },
                                                    ].map(opt => (_jsxs("button", { type: "button", onClick: () => setContactMethod(opt.key), "data-testid": `button-contact-${opt.key}`, className: `py-4 rounded-2xl text-[12px] font-bold flex flex-col items-center gap-2 transition-all ${contactMethod === opt.key
                                                            ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40 scale-[1.02]"
                                                            : "bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60 hover:border-red-200 hover:text-red-600"}`, children: [_jsx(opt.icon, { size: 18 }), opt.label] }, opt.key))) })] }), _jsxs("button", { type: "submit", disabled: createMutation.isPending, "data-testid": "button-submit-request", className: "w-full bg-red-600 text-white py-4.5 rounded-2xl font-black text-[16px] hover:bg-red-700 disabled:opacity-50 shadow-2xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]", style: { fontFamily: "system-ui,-apple-system,sans-serif", paddingTop: "1.125rem", paddingBottom: "1.125rem" }, children: [createMutation.isPending ? _jsx(Loader2, { size: 20, className: "animate-spin" }) : _jsx(Send, { size: 18 }), createMutation.isPending ? t.services.sending : t.services.sendRequest] })] })] })] })] }));
    }
    /* ─── Standard form (no catalog model) ──────────────────────────────── */
    const typeOptions = dynamicTypes || ["A preciser"];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto", children: [_jsxs("div", { className: "bg-gradient-to-br from-red-600 via-red-700 to-rose-800 px-5 pt-5 pb-8 relative overflow-hidden", children: [_jsx("div", { className: "absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" }), _jsx("div", { className: "absolute top-6 -right-4 w-20 h-20 bg-white/5 rounded-full" }), _jsx("button", { onClick: () => navigate("/services"), className: "w-11 h-11 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 mb-5", "data-testid": "button-back", children: _jsx(ArrowLeft, { size: 18, className: "text-white" }) }), _jsx("p", { className: "text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1", children: t.services.newRequest }), _jsx("h1", { className: "text-white text-2xl font-black leading-tight", style: { fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "-0.02em" }, "data-testid": "text-form-title", children: categoryName })] }), _jsx("div", { className: "px-4 -mt-4 space-y-4 pb-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: `${card} p-5`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 1 }), t.services.dateTime] }), _jsx("div", { className: "flex gap-2", children: [
                                                { key: "asap", label: t.services.asap, icon: Zap, testId: "button-asap" },
                                                { key: "scheduled", label: t.services.schedule, icon: Calendar, testId: "button-schedule" },
                                            ].map(opt => (_jsxs("button", { type: "button", onClick: () => setScheduledType(opt.key), "data-testid": opt.testId, className: `flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${scheduledType === opt.key
                                                    ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40"
                                                    : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60"}`, children: [_jsx(opt.icon, { size: 15 }), opt.label] }, opt.key))) }), scheduledType === "scheduled" && (_jsxs("div", { className: "grid grid-cols-2 gap-3 mt-3", children: [_jsxs("div", { children: [_jsx("label", { className: label, children: t.common.date }), _jsx("input", { type: "date", value: scheduledDate, onChange: e => setScheduledDate(e.target.value), "data-testid": "input-date", className: input })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: "Heure" }), _jsx("input", { type: "time", value: scheduledTime, onChange: e => setScheduledTime(e.target.value), "data-testid": "input-time", className: input })] })] }))] }), _jsxs("div", { className: `${card} p-5 space-y-4`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 2 }), t.services.personalInfo] }), _jsxs("div", { children: [_jsxs("label", { className: label, children: [t.services.fullName, " *"] }), _jsxs("div", { className: "relative", children: [_jsx(User, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: fullName, onChange: e => setFullName(e.target.value), required: true, "data-testid": "input-fullname", placeholder: t.services.fullNamePlaceholder, className: inputIcon })] })] }), _jsxs("div", { children: [_jsxs("label", { className: label, children: [t.common.phone, " *"] }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "tel", value: phone, onChange: e => setPhone(e.target.value), required: true, "data-testid": "input-phone", placeholder: t.services.phonePlaceholder, className: inputIcon })] })] }), _jsxs("div", { children: [_jsxs("label", { className: label, children: [t.common.address, " *"] }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { size: 16, className: "absolute left-4 top-4 text-gray-400" }), _jsx("input", { type: "text", value: address, onChange: e => setAddress(e.target.value), required: true, "data-testid": "input-address", placeholder: t.services.addressPlaceholder, className: inputIcon })] })] })] }), _jsxs("div", { className: `${card} p-5 space-y-4`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 3 }), t.services.serviceDetails] }), _jsxs("div", { children: [_jsxs("label", { className: label, children: [t.services.serviceType, " \u2014 ", categoryName] }), _jsxs("div", { className: "relative", children: [_jsx(Tag, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" }), _jsxs("select", { value: serviceType, onChange: e => setServiceType(e.target.value), "data-testid": "select-service-type", className: inputIcon + " appearance-none", children: [_jsx("option", { value: "", children: t.services.select }), typeOptions.map(opt => _jsx("option", { value: opt, children: opt }, opt))] })] })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: t.services.estimatedBudget }), _jsxs("div", { className: "relative", children: [_jsx(DollarSign, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: budget, onChange: e => setBudget(e.target.value), "data-testid": "input-budget", placeholder: t.services.budgetPlaceholder, className: inputIcon })] })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: t.services.additionalInfo }), _jsx("textarea", { value: additionalInfo, onChange: e => setAdditionalInfo(e.target.value), "data-testid": "input-additional-info", placeholder: t.services.additionalInfoPlaceholder, className: "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-[15px] font-medium resize-none h-28 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all" })] })] }), _jsxs("div", { className: `${card} p-5`, children: [_jsxs("h3", { className: sectionTitle, children: [_jsx(Step, { n: 4 }), t.services.preferredContact] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                                                { key: "phone", label: t.services.telephone, icon: Phone },
                                                { key: "whatsapp", label: t.services.whatsapp, icon: MessageCircle },
                                                { key: "email", label: t.common.email, icon: FileText },
                                            ].map(opt => (_jsxs("button", { type: "button", onClick: () => setContactMethod(opt.key), "data-testid": `button-contact-${opt.key}`, className: `py-4 rounded-2xl text-[12px] font-bold flex flex-col items-center gap-2 transition-all ${contactMethod === opt.key
                                                    ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40 scale-[1.02]"
                                                    : "bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60 hover:border-red-200 hover:text-red-600"}`, children: [_jsx(opt.icon, { size: 18 }), opt.label] }, opt.key))) })] }), _jsxs("button", { type: "submit", disabled: createMutation.isPending, "data-testid": "button-submit-request", className: "w-full bg-red-600 text-white rounded-2xl font-black text-[16px] hover:bg-red-700 disabled:opacity-50 shadow-2xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]", style: { fontFamily: "system-ui,-apple-system,sans-serif", paddingTop: "1.125rem", paddingBottom: "1.125rem" }, children: [createMutation.isPending ? _jsx(Loader2, { size: 20, className: "animate-spin" }) : _jsx(Send, { size: 18 }), createMutation.isPending ? t.services.sending : t.services.sendRequest] })] }) })] })] }));
}
//# sourceMappingURL=ServiceRequestPage.js.map