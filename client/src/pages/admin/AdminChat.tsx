import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetch , authFetchJson} from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { Send, User, Truck, MessageCircle, Search, Circle, MessageSquare } from "lucide-react";
import type { ChatMessage, User as UserType } from "@shared/schema";

type SafeUser = Omit<UserType, "password">;

export default function AdminChat() {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<SafeUser | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"drivers" | "clients">("drivers");
  const messagesEnd = useRef<HTMLDivElement>(null);

  const { data: drivers = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/chat/users-by-role", "driver"],
    queryFn: () => authFetchJson("/api/chat/users-by-role/driver"),
  });

  const { data: chatContacts = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/chat/contacts", user?.id],
    queryFn: () => authFetchJson(`/api/chat/contacts/${user?.id}`),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const clientContacts = chatContacts.filter((c: any) => c.role === "client");

  const { data: unreadCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", user?.id, selectedContact?.id],
    queryFn: () => authFetchJson(`/api/chat/${user?.id}/${selectedContact?.id}`),
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
        .catch(() => {});
    }
  }, [selectedContact, user, messages.length]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedContact || !user) return;
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
  const filteredList = activeList.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  const formatTime = (date: string | Date) => {
    return new Intl.DateTimeFormat("fr-CD", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
  };

  return (
    <AdminLayout title="Messagerie">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
        <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
              <button onClick={() => setTab("drivers")} data-testid="chat-tab-drivers"
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "drivers" ? "bg-red-600 text-white shadow" : "text-gray-500 dark:text-gray-400"}`}>
                <Truck size={12} />
                Livreurs
                {Object.entries(unreadCounts).filter(([id]) => drivers.some((d: any) => d.id === Number(id))).reduce((s, [, n]) => s + n, 0) > 0 && (
                  <span className="bg-white/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {Object.entries(unreadCounts).filter(([id]) => drivers.some((d: any) => d.id === Number(id))).reduce((s, [, n]) => s + n, 0)}
                  </span>
                )}
              </button>
              <button onClick={() => setTab("clients")} data-testid="chat-tab-clients"
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "clients" ? "bg-red-600 text-white shadow" : "text-gray-500 dark:text-gray-400"}`}>
                <MessageSquare size={12} />
                Clients
                {Object.entries(unreadCounts).filter(([id]) => clientContacts.some((c: any) => c.id === Number(id))).reduce((s, [, n]) => s + n, 0) > 0 && (
                  <span className="bg-white/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {Object.entries(unreadCounts).filter(([id]) => clientContacts.some((c: any) => c.id === Number(id))).reduce((s, [, n]) => s + n, 0)}
                  </span>
                )}
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                data-testid="chat-search" className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredList.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <User size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">{tab === "clients" ? "Aucun client n'a encore ecrit" : "Aucun livreur trouve"}</p>
              </div>
            )}
            {filteredList.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedContact(c)}
                data-testid={`chat-contact-${c.id}`}
                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-50 ${
                  selectedContact?.id === c.id ? "bg-red-50" : ""
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    {c.role === "driver" ? <Truck size={16} className="text-gray-600" /> : <User size={16} className="text-gray-600" />}
                  </div>
                  {c.isOnline && (
                    <Circle size={10} className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.role === "driver" ? "Livreur" : "Client"} - {c.phone}</p>
                </div>
                {unreadCounts[c.id] && (
                  <span className="bg-red-600 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center" data-testid={`unread-${c.id}`}>
                    {unreadCounts[c.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">{selectedContact.name?.[0]}</span>
                  </div>
                  {selectedContact.isOnline && (
                    <Circle size={10} className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedContact.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {selectedContact.role === "driver" ? "Livreur" : "Client"}
                    {selectedContact.isOnline ? " - En ligne" : ""}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center pt-20 text-gray-400">
                    <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun message. Commencez la conversation!</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`} data-testid={`chat-msg-${msg.id}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      msg.senderId === user?.id
                        ? "bg-red-600 text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
                    }`}>
                      <p>{msg.message}</p>
                      <p className={`text-[9px] mt-1 ${msg.senderId === user?.id ? "text-red-200" : "text-gray-400"}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Tapez votre message..."
                    data-testid="input-chat-message"
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={sendMessage}
                    data-testid="button-send-message"
                    className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Selectionnez un contact</p>
                <p className="text-xs mt-1">pour commencer une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
