import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Bell, Send, Users, TrendingUp, ShoppingBag, Clock, Megaphone, Target, CheckCircle, Loader2, Zap, UserCheck } from "lucide-react";
export default function AdminNotifications() {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [targetSegment, setTargetSegment] = useState("all_clients");
    const [notifType, setNotifType] = useState("promo");
    const [sent, setSent] = useState(false);
    const [sentCount, setSentCount] = useState(0);
    const { data: segments = {} } = useQuery({
        queryKey: ["/api/analytics/client-segments"],
        queryFn: () => apiRequest("/api/analytics/client-segments").then(r => r.json()),
    });
    const broadcastMutation = useMutation({
        mutationFn: (data) => apiRequest("/api/notifications/broadcast", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: async (res) => {
            const data = await res.json();
            setSent(true);
            setSentCount(data.sent || 0);
            setTimeout(() => setSent(false), 5000);
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible d'envoyer les notifications", variant: "destructive" });
        },
    });
    const handleSend = () => {
        if (!title.trim() || !message.trim()) {
            toast({ title: "Champs requis", description: "Titre et message sont obligatoires", variant: "destructive" });
            return;
        }
        broadcastMutation.mutate({ title, message, type: notifType, targetSegment });
    };
    const segmentIcons = {
        all_clients: Users,
        frequent_food: ShoppingBag,
        service_users: Zap,
        inactive: Clock,
        high_value: TrendingUp,
        new_clients: UserCheck,
    };
    const segmentColors = {
        all_clients: "from-blue-500 to-blue-600",
        frequent_food: "from-orange-500 to-red-500",
        service_users: "from-purple-500 to-violet-600",
        inactive: "from-gray-500 to-gray-600",
        high_value: "from-green-500 to-emerald-600",
        new_clients: "from-cyan-500 to-blue-500",
    };
    const templates = [
        { title: "Offre Speciale!", message: "Profitez de -20% sur votre prochaine commande avec le code MAWEJA20 !", type: "promo" },
        { title: "Nouveaux restaurants", message: "Decouvrez les nouveaux restaurants disponibles sur MAWEJA !", type: "info" },
        { title: "Livraison gratuite", message: "Livraison offerte sur toutes vos commandes ce weekend ! Code: LIVRAISON", type: "promo" },
        { title: "Vos services preferes", message: "Nos services professionnels sont maintenant disponibles ! Demandez un devis.", type: "service" },
    ];
    return (_jsxs(AdminLayout, { title: "Notifications Push", children: [_jsx("div", { className: "mb-6", children: _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", "data-testid": "text-admin-notif-title", children: "Envoyez des notifications ciblees a vos clients" }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2 space-y-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Megaphone, { size: 16, className: "text-red-500" }), "Composer une notification"] }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-xs font-semibold text-gray-500 uppercase mb-2", children: "Modeles rapides" }), _jsx("div", { className: "flex flex-wrap gap-2", children: templates.map((t, i) => (_jsx("button", { onClick: () => { setTitle(t.title); setMessage(t.message); setNotifType(t.type); }, "data-testid": `template-${i}`, className: "px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 border border-gray-200 dark:border-gray-700 transition-all", children: t.title }, i))) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Type" }), _jsx("div", { className: "flex gap-2", children: [
                                                        { key: "promo", label: "Promo", icon: Target },
                                                        { key: "info", label: "Info", icon: Bell },
                                                        { key: "service", label: "Service", icon: Zap },
                                                    ].map(t => (_jsxs("button", { type: "button", onClick: () => setNotifType(t.key), className: `flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${notifType === t.key ? "bg-red-600 text-white" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`, children: [_jsx(t.icon, { size: 14 }), " ", t.label] }, t.key))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Titre" }), _jsx("input", { type: "text", value: title, onChange: e => setTitle(e.target.value), placeholder: "Titre de la notification", "data-testid": "input-notif-title", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Message" }), _jsx("textarea", { value: message, onChange: e => setMessage(e.target.value), placeholder: "Contenu de la notification...", "data-testid": "input-notif-message", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white h-28 resize-none focus:ring-2 focus:ring-red-500 focus:outline-none" })] })] }), sent ? (_jsxs("div", { className: "mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3", "data-testid": "notif-sent-success", children: [_jsx(CheckCircle, { size: 24, className: "text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-sm text-green-800", children: "Notification envoyee !" }), _jsxs("p", { className: "text-xs text-green-600", children: [sentCount, " client", sentCount !== 1 ? "s" : "", " notifie", sentCount !== 1 ? "s" : ""] })] })] })) : (_jsxs("button", { onClick: handleSend, disabled: broadcastMutation.isPending, "data-testid": "button-send-broadcast", className: "mt-4 w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2", children: [broadcastMutation.isPending ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Send, { size: 16 }), broadcastMutation.isPending ? "Envoi en cours..." : "Envoyer la notification"] }))] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Target, { size: 16, className: "text-red-500" }), "Segment cible"] }), _jsx("div", { className: "space-y-2", children: Object.entries(segments).map(([key, seg]) => {
                                            const Icon = segmentIcons[key] || Users;
                                            const gradient = segmentColors[key] || "from-gray-500 to-gray-600";
                                            return (_jsxs("button", { onClick: () => setTargetSegment(key), "data-testid": `segment-${key}`, className: `w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left ${targetSegment === key ? "bg-red-50 border-2 border-red-500" : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"}`, children: [_jsx("div", { className: `w-9 h-9 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`, children: _jsx(Icon, { size: 16, className: "text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs font-bold text-gray-900 dark:text-white", children: seg.label }), _jsxs("p", { className: "text-[10px] text-gray-500 dark:text-gray-400", children: [seg.count, " client", seg.count !== 1 ? "s" : ""] })] }), targetSegment === key && (_jsx("div", { className: "w-4 h-4 bg-red-600 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { size: 10, className: "text-white" }) }))] }, key));
                                        }) })] }), _jsxs("div", { className: "bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5 text-white", children: [_jsx("h3", { className: "font-bold text-sm mb-2", children: "Conseils" }), _jsxs("ul", { className: "space-y-2 text-xs text-red-100", children: [_jsx("li", { children: "\u2022 Ciblez les clients inactifs pour les re-engager" }), _jsx("li", { children: "\u2022 Envoyez des promos aux clients haute valeur" }), _jsx("li", { children: "\u2022 Personnalisez selon les habitudes d'achat" }), _jsx("li", { children: "\u2022 Evitez d'envoyer trop de notifications" })] })] })] })] })] }));
}
//# sourceMappingURL=AdminNotifications.js.map