import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest, queryClient, authFetch } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import { useToast } from "../hooks/use-toast";
import { MessageCircle, X, Send, ArrowLeft, Shield, Circle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
export default function ClientContactBubble() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState("menu");
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [message, setMessage] = useState("");
    const [complaintSubject, setComplaintSubject] = useState("");
    const [complaintMessage, setComplaintMessage] = useState("");
    const [complaintSent, setComplaintSent] = useState(false);
    const messagesEnd = useRef(null);
    const { data: admins = [] } = useQuery({
        queryKey: ["/api/chat/users-by-role", "admin"],
        queryFn: () => authFetch("/api/chat/users-by-role/admin").then(r => r.json()),
        enabled: !!user && isOpen,
    });
    const { data: unreadCounts = {} } = useQuery({
        queryKey: ["/api/chat/unread", user?.id],
        queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
        enabled: !!user,
        refetchInterval: 10000,
    });
    const { data: messages = [] } = useQuery({
        queryKey: ["/api/chat", user?.id, selectedAdmin?.id],
        queryFn: () => authFetch(`/api/chat/${user?.id}/${selectedAdmin?.id}`).then(r => r.json()),
        enabled: !!selectedAdmin && !!user,
        refetchInterval: 3000,
    });
    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "chat_message" || data.type === "notification") {
                queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
                queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
                queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            }
        });
    }, []);
    useEffect(() => {
        if (selectedAdmin && user) {
            apiRequest(`/api/chat/read/${selectedAdmin.id}/${user.id}`, { method: "PATCH" })
                .then(() => queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] }))
                .catch(() => { });
        }
    }, [selectedAdmin, user, messages.length]);
    const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);
    const sendMessage = async () => {
        if (!message.trim() || !selectedAdmin || !user)
            return;
        await apiRequest("/api/chat", {
            method: "POST",
            body: JSON.stringify({
                senderId: user.id,
                receiverId: selectedAdmin.id,
                message: message.trim(),
                isRead: false,
            }),
        });
        setMessage("");
        queryClient.invalidateQueries({ queryKey: ["/api/chat", user?.id, selectedAdmin?.id] });
    };
    const sendComplaint = async () => {
        if (!complaintSubject.trim() || !complaintMessage.trim() || !user)
            return;
        const admin = admins.find((a) => a.isOnline) || admins[0];
        if (!admin) {
            toast({ title: "Erreur", description: "Aucun administrateur disponible", variant: "destructive" });
            return;
        }
        const fullMessage = `[RECLAMATION] ${complaintSubject}\n\n${complaintMessage}`;
        await apiRequest("/api/chat", {
            method: "POST",
            body: JSON.stringify({
                senderId: user.id,
                receiverId: admin.id,
                message: fullMessage,
                isRead: false,
            }),
        });
        setComplaintSent(true);
        setComplaintSubject("");
        setComplaintMessage("");
        setTimeout(() => {
            setComplaintSent(false);
            setView("menu");
        }, 3000);
    };
    const formatTime = (date) => {
        return new Intl.DateTimeFormat("fr-CD", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
    };
    if (!user)
        return null;
    return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => { setIsOpen(!isOpen); if (!isOpen) {
                    setView("menu");
                    setSelectedAdmin(null);
                } }, "data-testid": "button-contact-bubble", className: "fixed bottom-24 right-4 z-50 w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-300 hover:bg-red-700 transition-all hover:scale-110", children: [isOpen ? _jsx(X, { size: 22 }) : _jsx(MessageCircle, { size: 22 }), !isOpen && totalUnread > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 bg-white text-red-600 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-red-600", "data-testid": "unread-bubble-count", children: totalUnread }))] }), isOpen && (_jsxs("div", { className: "fixed bottom-40 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden", style: { maxHeight: "480px" }, "data-testid": "contact-panel", children: [view === "menu" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-red-600 p-4", children: [_jsx("h3", { className: "text-white font-bold text-sm", children: "Contactez-nous" }), _jsx("p", { className: "text-red-200 text-xs mt-0.5", children: "Comment pouvons-nous vous aider ?" })] }), _jsxs("div", { className: "p-3 space-y-2", children: [_jsxs("button", { onClick: () => {
                                            const admin = admins.find((a) => a.isOnline) || admins[0];
                                            if (admin) {
                                                setSelectedAdmin(admin);
                                                setView("chat");
                                            }
                                            else
                                                toast({ title: "Info", description: "Aucun administrateur disponible pour le moment" });
                                        }, "data-testid": "button-start-chat", className: "w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 transition-all text-left border border-gray-100", children: [_jsx("div", { className: "w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center", children: _jsx(MessageCircle, { size: 18, className: "text-blue-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-sm text-gray-900", children: "Chat en direct" }), _jsx("p", { className: "text-[10px] text-gray-400", children: "Discutez avec un administrateur" })] }), totalUnread > 0 && (_jsx("span", { className: "bg-red-600 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center", children: totalUnread }))] }), _jsxs("button", { onClick: () => window.open("https://wa.me/243812345678?text=Bonjour MAWEJA, j'ai besoin d'aide.", "_blank"), "data-testid": "button-whatsapp", className: "w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 transition-all text-left border border-gray-100", children: [_jsx("div", { className: "w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center", children: _jsx(SiWhatsapp, { size: 18, className: "text-green-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm text-gray-900", children: "WhatsApp" }), _jsx("p", { className: "text-[10px] text-gray-400", children: "Ecrivez-nous sur WhatsApp" })] })] }), _jsxs("button", { onClick: () => { setView("complaint"); setComplaintSent(false); }, "data-testid": "button-start-complaint", className: "w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 transition-all text-left border border-gray-100", children: [_jsx("div", { className: "w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center", children: _jsx(AlertTriangle, { size: 18, className: "text-orange-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm text-gray-900", children: "Reclamation" }), _jsx("p", { className: "text-[10px] text-gray-400", children: "Signalez un probleme structure" })] })] })] })] })), view === "chat" && selectedAdmin && (_jsxs("div", { className: "flex flex-col", style: { height: "480px" }, children: [_jsxs("div", { className: "bg-red-600 p-3 flex items-center gap-3", children: [_jsx("button", { onClick: () => { setView("menu"); setSelectedAdmin(null); }, className: "text-white/80 hover:text-white", children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center", children: _jsx(Shield, { size: 14, className: "text-white" }) }), selectedAdmin.isOnline && (_jsx(Circle, { size: 8, className: "absolute -bottom-0.5 -right-0.5 text-green-400 fill-green-400" }))] }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-bold text-xs", children: selectedAdmin.name }), _jsx("p", { className: "text-red-200 text-[10px]", children: selectedAdmin.isOnline ? "En ligne" : "Hors ligne" })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50", children: [messages.length === 0 && (_jsxs("div", { className: "text-center pt-12 text-gray-400", children: [_jsx(MessageCircle, { size: 28, className: "mx-auto mb-2 opacity-30" }), _jsx("p", { className: "text-xs", children: "Envoyez votre premier message" })] })), messages.map((msg) => (_jsx("div", { className: `flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.senderId === user?.id
                                                ? "bg-red-600 text-white rounded-br-sm"
                                                : "bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100"}`, children: [_jsx("p", { children: msg.message }), _jsx("p", { className: `text-[8px] mt-0.5 ${msg.senderId === user?.id ? "text-red-200" : "text-gray-400"}`, children: formatTime(msg.createdAt) })] }) }, msg.id))), _jsx("div", { ref: messagesEnd })] }), _jsx("div", { className: "p-2 border-t border-gray-100 bg-white", children: _jsxs("div", { className: "flex gap-1.5", children: [_jsx("input", { type: "text", value: message, onChange: (e) => setMessage(e.target.value), onKeyDown: (e) => e.key === "Enter" && sendMessage(), placeholder: "Votre message...", "data-testid": "client-chat-input", className: "flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("button", { onClick: sendMessage, "data-testid": "client-chat-send", className: "w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700", children: _jsx(Send, { size: 14 }) })] }) })] })), view === "complaint" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-red-600 p-3 flex items-center gap-3", children: [_jsx("button", { onClick: () => setView("menu"), className: "text-white/80 hover:text-white", children: _jsx(ArrowLeft, { size: 18 }) }), _jsx("div", { className: "w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center", children: _jsx(AlertTriangle, { size: 14, className: "text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-bold text-xs", children: "Reclamation" }), _jsx("p", { className: "text-red-200 text-[10px]", children: "Signalez un probleme" })] })] }), complaintSent ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle2, { size: 28, className: "text-green-600" }) }), _jsx("h4", { className: "font-bold text-sm text-gray-900 mb-1", children: "Reclamation envoyee" }), _jsx("p", { className: "text-xs text-gray-500", children: "Un administrateur vous repondra dans les plus brefs delais." })] })) : (_jsxs("div", { className: "p-3 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Sujet" }), _jsxs("select", { value: complaintSubject, onChange: e => setComplaintSubject(e.target.value), "data-testid": "complaint-subject", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500", children: [_jsx("option", { value: "", children: "Choisir un sujet..." }), _jsx("option", { value: "Commande non livree", children: "Commande non livree" }), _jsx("option", { value: "Retard de livraison", children: "Retard de livraison" }), _jsx("option", { value: "Commande incorrecte", children: "Commande incorrecte" }), _jsx("option", { value: "Qualite de nourriture", children: "Qualite de nourriture" }), _jsx("option", { value: "Probleme de paiement", children: "Probleme de paiement" }), _jsx("option", { value: "Comportement du livreur", children: "Comportement du livreur" }), _jsx("option", { value: "Probleme technique", children: "Probleme technique" }), _jsx("option", { value: "Autre", children: "Autre" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 uppercase mb-1 block", children: "Description detaillee" }), _jsx("textarea", { value: complaintMessage, onChange: e => setComplaintMessage(e.target.value), placeholder: "Decrivez votre probleme en detail...", "data-testid": "complaint-message", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs resize-none h-28 focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("button", { onClick: sendComplaint, disabled: !complaintSubject || !complaintMessage.trim(), "data-testid": "button-send-complaint", className: "w-full bg-red-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2", children: [_jsx(Send, { size: 14 }), "Envoyer la reclamation"] })] }))] }))] }))] }));
}
//# sourceMappingURL=ClientContactBubble.js.map