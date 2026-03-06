import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import DriverNav from "../../components/DriverNav";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { Send, MessageCircle, Shield, Circle, ArrowLeft } from "lucide-react";
import type { ChatMessage, User as UserType } from "@shared/schema";

type SafeUser = Omit<UserType, "password">;

export default function DriverChat() {
  const { user } = useAuth();
  const [selectedAdmin, setSelectedAdmin] = useState<SafeUser | null>(null);
  const [message, setMessage] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  const { data: admins = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/chat/users-by-role", "admin"],
    queryFn: () => authFetch("/api/chat/users-by-role/admin").then(r => r.json()),
  });

  const { data: unreadCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
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
      }
    });
  }, []);

  useEffect(() => {
    if (selectedAdmin && user) {
      apiRequest(`/api/chat/read/${selectedAdmin.id}/${user.id}`, { method: "PATCH" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] }))
        .catch(() => {});
    }
  }, [selectedAdmin, user, messages.length]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedAdmin || !user) return;
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

  const formatTime = (date: string | Date) => {
    return new Intl.DateTimeFormat("fr-CD", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
  };

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  if (selectedAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <DriverNav />
        <div className="max-w-lg mx-auto flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
          <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <button onClick={() => setSelectedAdmin(null)} className="text-gray-400 hover:text-gray-600" data-testid="button-back-chat">
              <ArrowLeft size={20} />
            </button>
            <div className="relative">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Shield size={16} className="text-red-600" />
              </div>
              {selectedAdmin.isOnline && (
                <Circle size={10} className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{selectedAdmin.name}</p>
              <p className="text-[10px] text-gray-400">
                Administration{selectedAdmin.isOnline ? " - En ligne" : ""}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center pt-16 text-gray-400">
                <MessageCircle size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucun message</p>
                <p className="text-xs mt-1">Envoyez votre premier message a l'administration</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`} data-testid={`driver-msg-${msg.id}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.senderId === user?.id
                    ? "bg-red-600 text-white rounded-br-md"
                    : "bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100"
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

          <div className="bg-white p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Votre message..."
                data-testid="driver-input-chat"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button onClick={sendMessage} data-testid="driver-button-send"
                className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Messagerie</h2>
        <p className="text-xs text-gray-500 mb-6">Contactez l'administration</p>

        <div className="space-y-3">
          {admins.map((admin: any) => (
            <button
              key={admin.id}
              onClick={() => setSelectedAdmin(admin)}
              data-testid={`driver-admin-contact-${admin.id}`}
              className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all text-left"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <Shield size={20} className="text-red-600" />
                </div>
                {admin.isOnline && (
                  <Circle size={10} className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">{admin.name}</p>
                <p className="text-xs text-gray-400">
                  Administration{admin.isOnline ? " - En ligne" : " - Hors ligne"}
                </p>
              </div>
              {unreadCounts[admin.id] && (
                <span className="bg-red-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {unreadCounts[admin.id]}
                </span>
              )}
            </button>
          ))}

          {admins.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
              <Shield size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">Aucun administrateur disponible</p>
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-20 left-0 right-0 text-center">
        <p className="text-[10px] text-gray-400">Demo by Khevin Andrew Kita - Ed Corporation 0911742202</p>
      </div>
    </div>
  );
}
