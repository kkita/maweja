import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { Send, User, Truck, MessageCircle, Search, Circle, MessageSquare } from "lucide-react";
export default function AdminChat() {
    const { user } = useAuth();
    const [selectedContact, setSelectedContact] = useState(null);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("drivers");
    const messagesEnd = useRef(null);
    const { data: drivers = [] } = useQuery({
        queryKey: ["/api/chat/users-by-role", "driver"],
        queryFn: () => authFetch("/api/chat/users-by-role/driver").then(r => r.json()),
    });
    const { data: chatContacts = [] } = useQuery({
        queryKey: ["/api/chat/contacts", user?.id],
        queryFn: () => authFetch(`/api/chat/contacts/${user?.id}`).then(r => r.json()),
        enabled: !!user,
        refetchInterval: 10000,
    });
    const clientContacts = chatContacts.filter((c) => c.role === "client");
    const { data: unreadCounts = {} } = useQuery({
        queryKey: ["/api/chat/unread", user?.id],
        queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
        enabled: !!user,
        refetchInterval: 5000,
    });
    const { data: messages = [] } = useQuery({
        queryKey: ["/api/chat", user?.id, selectedContact?.id],
        queryFn: () => authFetch(`/api/chat/${user?.id}/${selectedContact?.id}`).then(r => r.json()),
        enabled: !!selectedContact && !!user,
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
                queryClient.invalidateQueries({ queryKey: ["/api/chat/contacts"] });
                queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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
        await apiRequest("/api/chat", {
            method: "POST",
            body: JSON.stringify({
                senderId: user.id,
                receiverId: selectedContact.id,
                message: message.trim(),
                isRead: false,
            }),
        });
        setMessage("");
        queryClient.invalidateQueries({ queryKey: ["/api/chat", user?.id, selectedContact?.id] });
    };
    const activeList = tab === "drivers" ? drivers : clientContacts;
    const filteredList = activeList.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));
    const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);
    const formatTime = (date) => {
        return new Intl.DateTimeFormat("fr-CD", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
    };
    return (_jsx(AdminLayout, { title: "Messagerie", children: _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex", style: { height: "calc(100vh - 200px)" }, children: [_jsxs("div", { className: "w-80 border-r border-gray-100 flex flex-col", children: [_jsxs("div", { className: "p-3 border-b border-gray-100", children: [_jsxs("div", { className: "flex gap-1 mb-3 bg-gray-100 rounded-xl p-0.5", children: [_jsxs("button", { onClick: () => setTab("drivers"), "data-testid": "chat-tab-drivers", className: `flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "drivers" ? "bg-red-600 text-white shadow" : "text-gray-500"}`, children: [_jsx(Truck, { size: 12 }), "Livreurs", Object.entries(unreadCounts).filter(([id]) => drivers.some((d) => d.id === Number(id))).reduce((s, [, n]) => s + n, 0) > 0 && (_jsx("span", { className: "bg-white/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold", children: Object.entries(unreadCounts).filter(([id]) => drivers.some((d) => d.id === Number(id))).reduce((s, [, n]) => s + n, 0) }))] }), _jsxs("button", { onClick: () => setTab("clients"), "data-testid": "chat-tab-clients", className: `flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "clients" ? "bg-red-600 text-white shadow" : "text-gray-500"}`, children: [_jsx(MessageSquare, { size: 12 }), "Clients", Object.entries(unreadCounts).filter(([id]) => clientContacts.some((c) => c.id === Number(id))).reduce((s, [, n]) => s + n, 0) > 0 && (_jsx("span", { className: "bg-white/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold", children: Object.entries(unreadCounts).filter(([id]) => clientContacts.some((c) => c.id === Number(id))).reduce((s, [, n]) => s + n, 0) }))] })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher...", value: search, onChange: e => setSearch(e.target.value), "data-testid": "chat-search", className: "w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500" })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [filteredList.length === 0 && (_jsxs("div", { className: "text-center py-12 text-gray-400", children: [_jsx(User, { size: 24, className: "mx-auto mb-2 opacity-30" }), _jsx("p", { className: "text-xs", children: tab === "clients" ? "Aucun client n'a encore ecrit" : "Aucun livreur trouve" })] })), filteredList.map((c) => (_jsxs("button", { onClick: () => setSelectedContact(c), "data-testid": `chat-contact-${c.id}`, className: `w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${selectedContact?.id === c.id ? "bg-red-50" : ""}`, children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center", children: c.role === "driver" ? _jsx(Truck, { size: 16, className: "text-gray-600" }) : _jsx(User, { size: 16, className: "text-gray-600" }) }), c.isOnline && (_jsx(Circle, { size: 10, className: "absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500" }))] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold text-sm text-gray-900 truncate", children: c.name }), _jsxs("p", { className: "text-[10px] text-gray-400", children: [c.role === "driver" ? "Livreur" : "Client", " - ", c.phone] })] }), unreadCounts[c.id] && (_jsx("span", { className: "bg-red-600 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center", "data-testid": `unread-${c.id}`, children: unreadCounts[c.id] }))] }, c.id)))] })] }), _jsx("div", { className: "flex-1 flex flex-col", children: selectedContact ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 border-b border-gray-100 flex items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center", children: _jsx("span", { className: "text-red-600 font-bold text-sm", children: selectedContact.name?.[0] }) }), selectedContact.isOnline && (_jsx(Circle, { size: 10, className: "absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500" }))] }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm", children: selectedContact.name }), _jsxs("p", { className: "text-[10px] text-gray-400", children: [selectedContact.role === "driver" ? "Livreur" : "Client", selectedContact.isOnline ? " - En ligne" : ""] })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-3", children: [messages.length === 0 && (_jsxs("div", { className: "text-center pt-20 text-gray-400", children: [_jsx(MessageCircle, { size: 40, className: "mx-auto mb-3 opacity-30" }), _jsx("p", { className: "text-sm", children: "Aucun message. Commencez la conversation!" })] })), messages.map((msg) => (_jsx("div", { className: `flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`, "data-testid": `chat-msg-${msg.id}`, children: _jsxs("div", { className: `max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.senderId === user?.id
                                                ? "bg-red-600 text-white rounded-br-md"
                                                : "bg-gray-100 text-gray-900 rounded-bl-md"}`, children: [_jsx("p", { children: msg.message }), _jsx("p", { className: `text-[9px] mt-1 ${msg.senderId === user?.id ? "text-red-200" : "text-gray-400"}`, children: formatTime(msg.createdAt) })] }) }, msg.id))), _jsx("div", { ref: messagesEnd })] }), _jsx("div", { className: "p-4 border-t border-gray-100", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: message, onChange: (e) => setMessage(e.target.value), onKeyDown: (e) => e.key === "Enter" && sendMessage(), placeholder: "Tapez votre message...", "data-testid": "input-chat-message", className: "flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("button", { onClick: sendMessage, "data-testid": "button-send-message", className: "w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors", children: _jsx(Send, { size: 18 }) })] }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-gray-400", children: _jsxs("div", { className: "text-center", children: [_jsx(MessageCircle, { size: 48, className: "mx-auto mb-3 opacity-30" }), _jsx("p", { className: "font-medium", children: "Selectionnez un contact" }), _jsx("p", { className: "text-xs mt-1", children: "pour commencer une conversation" })] }) })) })] }) }));
}
//# sourceMappingURL=AdminChat.js.map