import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetchJson } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { Send, User, Truck, MessageCircle, Search, Circle, MessageSquare, Phone, Info, Clock } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
export default function AdminChat() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedContact, setSelectedContact] = useState(null);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("drivers");
    const messagesEnd = useRef(null);
    const inputRef = useRef(null);
    const { data: drivers = [] } = useQuery({
        queryKey: ["/api/chat/users-by-role", "driver"],
        queryFn: () => authFetchJson("/api/chat/users-by-role/driver"),
        refetchInterval: 15000,
    });
    const { data: chatContacts = [] } = useQuery({
        queryKey: ["/api/chat/contacts", user?.id],
        queryFn: () => authFetchJson(`/api/chat/contacts/${user?.id}`),
        enabled: !!user,
        refetchInterval: 8000,
    });
    const clientContacts = chatContacts.filter((c) => c.role === "client");
    const { data: unreadCounts = {} } = useQuery({
        queryKey: ["/api/chat/unread", user?.id],
        queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
        enabled: !!user,
        refetchInterval: 4000,
    });
    const { data: messages = [] } = useQuery({
        queryKey: ["/api/chat", user?.id, selectedContact?.id],
        queryFn: () => authFetchJson(`/api/chat/${user?.id}/${selectedContact?.id}`),
        enabled: !!selectedContact && !!user,
        refetchInterval: 2500,
    });
    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "chat_message" || data.type === "notification") {
                queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
                queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
                queryClient.invalidateQueries({ queryKey: ["/api/chat/contacts"] });
            }
        });
    }, []);
    useEffect(() => {
        if (selectedContact && user) {
            apiRequest(`/api/chat/read/${selectedContact.id}/${user.id}`, { method: "PATCH" })
                .then(() => queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] }))
                .catch(() => { });
        }
    }, [selectedContact, user, messages.length]);
    const sendMessage = async () => {
        if (!message.trim() || !selectedContact || !user)
            return;
        const msg = message.trim();
        setMessage("");
        try {
            await apiRequest("/api/chat", {
                method: "POST",
                body: JSON.stringify({ senderId: user.id, receiverId: selectedContact.id, message: msg, isRead: false }),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/chat", user?.id, selectedContact?.id] });
            inputRef.current?.focus();
        }
        catch (err) {
            setMessage(msg);
            toast({
                title: "Erreur d'envoi",
                description: err?.message || "Impossible d'envoyer le message. Vérifiez votre connexion.",
                variant: "destructive",
            });
        }
    };
    const activeList = tab === "drivers" ? drivers : clientContacts;
    const filteredList = activeList.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));
    const driverUnread = Object.entries(unreadCounts).filter(([id]) => drivers.some((d) => d.id === Number(id))).reduce((s, [, n]) => s + n, 0);
    const clientUnread = Object.entries(unreadCounts).filter(([id]) => clientContacts.some((c) => c.id === Number(id))).reduce((s, [, n]) => s + n, 0);
    const formatTime = (date) => new Intl.DateTimeFormat("fr-CD", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
    const formatDay = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getDate() - d.getDate();
        if (diff === 0)
            return "Aujourd'hui";
        if (diff === 1)
            return "Hier";
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    };
    return (_jsx(AdminLayout, { title: "Messagerie", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex", style: { height: "calc(100vh - 180px)", minHeight: 500 }, children: [_jsxs("div", { className: "w-72 xl:w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col flex-shrink-0", children: [_jsxs("div", { className: "p-3 border-b border-gray-100 dark:border-gray-800 space-y-2", children: [_jsxs("div", { className: "flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5", children: [_jsxs("button", { onClick: () => { setTab("drivers"); setSelectedContact(null); }, "data-testid": "chat-tab-drivers", className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === "drivers" ? "bg-red-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`, children: [_jsx(Truck, { size: 12 }), " Livreurs", driverUnread > 0 && _jsx("span", { className: `text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === "drivers" ? "bg-white/30" : "bg-red-600 text-white"}`, children: driverUnread })] }), _jsxs("button", { onClick: () => { setTab("clients"); setSelectedContact(null); }, "data-testid": "chat-tab-clients", className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === "clients" ? "bg-red-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`, children: [_jsx(MessageSquare, { size: 12 }), " Clients", clientUnread > 0 && _jsx("span", { className: `text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === "clients" ? "bg-white/30" : "bg-red-600 text-white"}`, children: clientUnread })] })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher...", value: search, onChange: e => setSearch(e.target.value), "data-testid": "chat-search", className: "w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] })] }), tab === "clients" && clientContacts.length === 0 && (_jsx("div", { className: "p-4", children: _jsx("div", { className: "bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Info, { size: 14, className: "text-blue-600 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-xs text-blue-700 dark:text-blue-300 leading-relaxed", children: "Seuls les clients ayant initie la conversation apparaissent ici." })] }) }) })), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [filteredList.length === 0 && !(tab === "clients" && clientContacts.length === 0) && (_jsxs("div", { className: "text-center py-12 text-gray-400", children: [tab === "drivers" ? _jsx(Truck, { size: 24, className: "mx-auto mb-2 opacity-20" }) : _jsx(User, { size: 24, className: "mx-auto mb-2 opacity-20" }), _jsx("p", { className: "text-xs", children: search ? "Aucun resultat" : tab === "clients" ? "Aucun client n'a encore ecrit" : "Aucun livreur trouve" })] })), filteredList.map((c) => {
                                    const isSelected = selectedContact?.id === c.id;
                                    const unread = unreadCounts[c.id] || 0;
                                    return (_jsxs("button", { onClick: () => setSelectedContact(c), "data-testid": `chat-contact-${c.id}`, className: `w-full p-3 flex items-center gap-3 transition-all text-left border-b border-gray-50 dark:border-gray-800 ${isSelected ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-l-red-600" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`, children: [_jsxs("div", { className: "relative flex-shrink-0", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? "bg-red-100 dark:bg-red-950/50" : "bg-gray-100 dark:bg-gray-800"}`, children: c.role === "driver" ? _jsx(Truck, { size: 15, className: isSelected ? "text-red-600" : "text-gray-600" }) : _jsx(User, { size: 15, className: isSelected ? "text-red-600" : "text-gray-600" }) }), c.isOnline && _jsx("div", { className: "absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: `font-semibold text-sm truncate ${isSelected ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`, children: c.name }), unread > 0 && (_jsx("span", { className: "bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", "data-testid": `unread-${c.id}`, children: unread }))] }), _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500", children: c.phone })] })] }, c.id));
                                })] })] }), _jsx("div", { className: "flex-1 flex flex-col overflow-hidden", children: selectedContact ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-sm", children: _jsx("span", { className: "text-white font-black text-sm", children: selectedContact.name?.[0]?.toUpperCase() }) }), selectedContact.isOnline && _jsx("div", { className: "absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-bold text-sm text-gray-900 dark:text-white", children: selectedContact.name }), _jsxs("p", { className: "text-[10px] text-gray-400 flex items-center gap-1", children: [selectedContact.role === "driver" ? _jsx(Truck, { size: 9 }) : _jsx(User, { size: 9 }), selectedContact.role === "driver" ? "Livreur" : "Client", selectedContact.isOnline ? _jsxs(_Fragment, { children: [_jsx(Circle, { size: 6, className: "text-green-500 fill-green-500 ml-1" }), " En ligne"] }) : _jsxs(_Fragment, { children: [_jsx(Clock, { size: 9, className: "ml-1" }), " Hors ligne"] })] })] }), selectedContact.phone && (_jsx("a", { href: `tel:${selectedContact.phone}`, className: "w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors", title: `Appeler ${selectedContact.name}`, children: _jsx(Phone, { size: 14 }) }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50 dark:bg-gray-950/50", children: [messages.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-gray-400", children: [_jsx("div", { className: "w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3", children: _jsx(MessageCircle, { size: 28, className: "opacity-40" }) }), _jsx("p", { className: "font-semibold text-sm", children: "Aucun message" }), _jsx("p", { className: "text-xs mt-1", children: "Commencez la conversation" })] })), messages.map((msg, idx) => {
                                        const isMe = msg.senderId === user?.id;
                                        const prevMsg = messages[idx - 1];
                                        const showDay = !prevMsg || formatDay(prevMsg.createdAt) !== formatDay(msg.createdAt);
                                        return (_jsxs("div", { "data-testid": `chat-msg-${msg.id}`, children: [showDay && (_jsxs("div", { className: "flex items-center gap-2 my-3", children: [_jsx("div", { className: "flex-1 h-px bg-gray-200 dark:bg-gray-700" }), _jsx("span", { className: "text-[10px] font-semibold text-gray-400 px-2", children: formatDay(msg.createdAt) }), _jsx("div", { className: "flex-1 h-px bg-gray-200 dark:bg-gray-700" })] })), _jsx("div", { className: `flex ${isMe ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-[72%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "bg-red-600 text-white rounded-br-sm" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-700"}`, children: [_jsx("p", { className: "leading-relaxed", children: msg.message }), _jsx("p", { className: `text-[9px] mt-1.5 ${isMe ? "text-red-200" : "text-gray-400"}`, children: formatTime(msg.createdAt) })] }) })] }, msg.id));
                                    }), _jsx("div", { ref: messagesEnd })] }), _jsx("div", { className: "p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { ref: inputRef, type: "text", value: message, onChange: e => setMessage(e.target.value), onKeyDown: e => e.key === "Enter" && !e.shiftKey && sendMessage(), placeholder: `Message a ${selectedContact.name}...`, "data-testid": "input-chat-message", className: "flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" }), _jsx("button", { onClick: sendMessage, disabled: !message.trim(), "data-testid": "button-send-message", className: "w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all shadow-sm shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-md hover:shadow-red-200", children: _jsx(Send, { size: 17 }) })] }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-gray-400", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4", children: _jsx(MessageCircle, { size: 36, className: "text-red-300 dark:text-red-700" }) }), _jsx("p", { className: "font-bold text-base text-gray-700 dark:text-gray-300", children: "Selectionnez un contact" }), _jsx("p", { className: "text-xs mt-2 text-gray-400", children: "Choisissez un livreur ou un client pour commencer" }), _jsxs("div", { className: "mt-5 flex items-center justify-center gap-4 text-xs text-gray-400", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Truck, { size: 12, className: "text-red-400" }), _jsxs("span", { children: [drivers.length, " livreur", drivers.length !== 1 ? "s" : ""] })] }), _jsx("div", { className: "w-1 h-1 rounded-full bg-gray-300" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(MessageSquare, { size: 12, className: "text-red-400" }), _jsxs("span", { children: [clientContacts.length, " client", clientContacts.length !== 1 ? "s" : "", " actif", clientContacts.length !== 1 ? "s" : ""] })] })] })] }) })) })] }) }));
}
//# sourceMappingURL=AdminChat.js.map