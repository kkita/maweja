import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft, Calendar, Clock, User, Phone, MapPin, Tag, DollarSign, FileText, MessageCircle, Send, CheckCircle2, Loader2 } from "lucide-react";
export default function ServiceRequestPage() {
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get("categoryId");
    const categoryName = params.get("categoryName") || "";
    const pathParts = window.location.pathname.split("/");
    const requestId = pathParts[pathParts.length - 1];
    const isViewMode = pathParts.includes("request") && requestId && !isNaN(Number(requestId));
    const { data: existingRequest } = useQuery({
        queryKey: ["/api/service-requests", requestId],
        queryFn: () => authFetch(`/api/service-requests/${requestId}`).then(r => r.json()),
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
    useEffect(() => {
        if (user && !fullName) {
            setFullName(user.name || "");
            setPhone(user.phone || "");
            setAddress(user.address || "");
        }
    }, [user]);
    const serviceTypeOptions = {
        Hotellerie: ["Reservation chambre", "Suite VIP", "Salle de conference", "Reception", "Autre"],
        Transport: ["Vehicule prive", "Minibus", "Camion", "Moto", "Quad", "Autre"],
        Nettoyage: ["Maison", "Bureau", "Apres evenement", "Vitres", "Tapis", "Autre"],
        Demenagement: ["Local", "Interurbain", "Bureau", "Entrepot", "Autre"],
        Evenementiel: ["Mariage", "Anniversaire", "Conference", "Soiree", "Team building", "Autre"],
        Reparation: ["Plomberie", "Electricite", "Peinture", "Menuiserie", "Electronique", "Autre"],
        Coursier: ["Document", "Colis petit", "Colis moyen", "Colis lourd", "Achats", "Autre"],
        Autre: ["A preciser"],
    };
    const createMutation = useMutation({
        mutationFn: (data) => apiRequest("/api/service-requests", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
            setSubmitted(true);
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible d'envoyer la demande", variant: "destructive" });
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!fullName.trim() || !phone.trim() || !address.trim()) {
            toast({ title: "Champs requis", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
            return;
        }
        createMutation.mutate({
            categoryId: Number(categoryId),
            categoryName,
            scheduledType,
            scheduledDate: scheduledType === "scheduled" ? scheduledDate : null,
            scheduledTime: scheduledType === "scheduled" ? scheduledTime : null,
            fullName,
            phone,
            address,
            serviceType,
            budget,
            additionalInfo,
            contactMethod,
        });
    };
    if (submitted) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsx("div", { className: "max-w-lg mx-auto px-4 py-12", children: _jsxs("div", { className: "bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm", children: [_jsx("div", { className: "w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5", children: _jsx(CheckCircle2, { size: 40, className: "text-green-600" }) }), _jsx("h2", { className: "text-xl font-black text-gray-900 mb-2", children: "Demande envoyee !" }), _jsx("p", { className: "text-sm text-gray-500 mb-6", children: "Notre equipe va examiner votre demande et vous contacter rapidement." }), _jsxs("div", { className: "bg-gray-50 rounded-2xl p-4 mb-6 text-left", children: [_jsx("p", { className: "text-xs font-semibold text-gray-500 mb-2", children: "Resume" }), _jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-sm text-gray-700", children: [_jsx("strong", { children: "Service:" }), " ", categoryName] }), serviceType && _jsxs("p", { className: "text-sm text-gray-700", children: [_jsx("strong", { children: "Type:" }), " ", serviceType] }), _jsxs("p", { className: "text-sm text-gray-700", children: [_jsx("strong", { children: "Contact:" }), " ", contactMethod === "whatsapp" ? "WhatsApp" : contactMethod === "phone" ? "Telephone" : "Email"] })] })] }), _jsx("button", { onClick: () => navigate("/services"), "data-testid": "button-back-services", className: "w-full bg-red-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200", children: "Retour aux services" })] }) })] }));
    }
    if (isViewMode && existingRequest) {
        const statusColors = {
            pending: "bg-amber-50 text-amber-700 border-amber-200",
            reviewing: "bg-blue-50 text-blue-700 border-blue-200",
            accepted: "bg-green-50 text-green-700 border-green-200",
            rejected: "bg-red-50 text-red-700 border-red-200",
            completed: "bg-gray-50 text-gray-700 border-gray-200",
        };
        const statusLabels = {
            pending: "En attente", reviewing: "En examen", accepted: "Acceptee", rejected: "Refusee", completed: "Terminee",
        };
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("button", { onClick: () => navigate("/services"), className: "w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200", "data-testid": "button-back", children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900", children: ["Demande #", existingRequest.id] }), _jsx("p", { className: "text-xs text-gray-500", children: existingRequest.categoryName })] })] }), _jsx("div", { className: `rounded-2xl border p-4 mb-4 ${statusColors[existingRequest.status] || statusColors.pending}`, children: _jsxs("p", { className: "font-bold text-sm", children: ["Statut: ", statusLabels[existingRequest.status] || existingRequest.status] }) }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-400 uppercase", children: "Nom complet" }), _jsx("p", { className: "text-sm text-gray-900 font-medium", children: existingRequest.fullName })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-400 uppercase", children: "Telephone" }), _jsx("p", { className: "text-sm text-gray-900 font-medium", children: existingRequest.phone })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-400 uppercase", children: "Adresse" }), _jsx("p", { className: "text-sm text-gray-900 font-medium", children: existingRequest.address })] }), existingRequest.serviceType && _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-400 uppercase", children: "Type de service" }), _jsx("p", { className: "text-sm text-gray-900 font-medium", children: existingRequest.serviceType })] }), existingRequest.budget && _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-400 uppercase", children: "Budget" }), _jsx("p", { className: "text-sm text-gray-900 font-medium", children: existingRequest.budget })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-400 uppercase", children: "Horaire" }), _jsx("p", { className: "text-sm text-gray-900 font-medium", children: existingRequest.scheduledType === "asap" ? "Des que possible" : `${existingRequest.scheduledDate} a ${existingRequest.scheduledTime}` })] }), existingRequest.additionalInfo && _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-400 uppercase", children: "Informations" }), _jsx("p", { className: "text-sm text-gray-700", children: existingRequest.additionalInfo })] }), existingRequest.adminNotes && (_jsxs("div", { className: "bg-blue-50 rounded-xl p-4 border border-blue-100", children: [_jsx("p", { className: "text-[10px] font-bold text-blue-700 uppercase mb-1", children: "Reponse de l'equipe" }), _jsx("p", { className: "text-sm text-blue-800", children: existingRequest.adminNotes })] }))] })] })] }));
    }
    const typeOptions = serviceTypeOptions[categoryName] || serviceTypeOptions["Autre"];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("button", { onClick: () => navigate("/services"), className: "w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200", "data-testid": "button-back", children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "text-form-title", children: "Nouvelle demande" }), _jsx("p", { className: "text-xs text-gray-500", children: categoryName })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 mb-4 flex items-center gap-2", children: [_jsx(Calendar, { size: 16, className: "text-red-500" }), "Date & Heure souhaitee"] }), _jsxs("div", { className: "flex gap-2 mb-3", children: [_jsxs("button", { type: "button", onClick: () => setScheduledType("asap"), "data-testid": "button-asap", className: `flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${scheduledType === "asap" ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`, children: [_jsx(Clock, { size: 14, className: "inline mr-1.5" }), "Des que possible"] }), _jsxs("button", { type: "button", onClick: () => setScheduledType("scheduled"), "data-testid": "button-schedule", className: `flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${scheduledType === "scheduled" ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`, children: [_jsx(Calendar, { size: 14, className: "inline mr-1.5" }), "Planifier"] })] }), scheduledType === "scheduled" && (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Date" }), _jsx("input", { type: "date", value: scheduledDate, onChange: e => setScheduledDate(e.target.value), "data-testid": "input-date", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Heure" }), _jsx("input", { type: "time", value: scheduledTime, onChange: e => setScheduledTime(e.target.value), "data-testid": "input-time", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] })] }))] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 mb-1 flex items-center gap-2", children: [_jsx(User, { size: 16, className: "text-red-500" }), "Informations personnelles"] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Nom Complet *" }), _jsx("input", { type: "text", value: fullName, onChange: e => setFullName(e.target.value), required: true, "data-testid": "input-fullname", placeholder: "Votre nom complet", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Telephone *" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "tel", value: phone, onChange: e => setPhone(e.target.value), required: true, "data-testid": "input-phone", placeholder: "+243 ...", className: "w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Adresse *" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { size: 14, className: "absolute left-3 top-3 text-gray-400" }), _jsx("input", { type: "text", value: address, onChange: e => setAddress(e.target.value), required: true, "data-testid": "input-address", placeholder: "Votre adresse a Kinshasa", className: "w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 mb-1 flex items-center gap-2", children: [_jsx(Tag, { size: 16, className: "text-red-500" }), "Details du service"] }), _jsxs("div", { children: [_jsxs("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: ["Type de ", categoryName] }), _jsxs("select", { value: serviceType, onChange: e => setServiceType(e.target.value), "data-testid": "select-service-type", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none", children: [_jsx("option", { value: "", children: "Selectionnez..." }), typeOptions.map(opt => _jsx("option", { value: opt, children: opt }, opt))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Budget estimatif" }), _jsxs("div", { className: "relative", children: [_jsx(DollarSign, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: budget, onChange: e => setBudget(e.target.value), "data-testid": "input-budget", placeholder: "Ex: $50", className: "w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Informations supplementaires" }), _jsx("textarea", { value: additionalInfo, onChange: e => setAdditionalInfo(e.target.value), "data-testid": "input-additional-info", placeholder: "Decrivez vos besoins en detail...", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none h-24 focus:ring-2 focus:ring-red-500 focus:outline-none" })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 mb-3 flex items-center gap-2", children: [_jsx(MessageCircle, { size: 16, className: "text-red-500" }), "Moyen de contact prefere"] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                                            { key: "phone", label: "Telephone", icon: Phone },
                                            { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                                            { key: "email", label: "Email", icon: FileText },
                                        ].map(opt => (_jsxs("button", { type: "button", onClick: () => setContactMethod(opt.key), "data-testid": `button-contact-${opt.key}`, className: `py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${contactMethod === opt.key ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`, children: [_jsx(opt.icon, { size: 16 }), opt.label] }, opt.key))) })] }), _jsxs("button", { type: "submit", disabled: createMutation.isPending, "data-testid": "button-submit-request", className: "w-full bg-red-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 shadow-xl shadow-red-200 flex items-center justify-center gap-2", children: [createMutation.isPending ? _jsx(Loader2, { size: 18, className: "animate-spin" }) : _jsx(Send, { size: 16 }), createMutation.isPending ? "Envoi en cours..." : "Envoyer la demande"] })] })] })] }));
}
//# sourceMappingURL=ServiceRequestPage.js.map