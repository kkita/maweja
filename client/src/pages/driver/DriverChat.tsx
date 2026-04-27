import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import DriverNav from "../../components/DriverNav";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetch, authFetchJson, resolveImg } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { handleWSEvent } from "../../lib/notify";
import { Send, MessageCircle, Shield, Circle, ArrowLeft, Download, FileText } from "lucide-react";
import type { ChatMessage, User as UserType } from "@shared/schema";
import { DEmptyState } from "../../components/driver/DriverUI";

type SafeUser = Omit<UserType, "password">;

function FileAttachment({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const fileUrl = (msg as any).fileUrl;
  const fileType = (msg as any).fileType;
  if (!fileUrl) return null;

  const resolvedUrl = resolveImg(fileUrl);
  const fileName = fileUrl.split("/").pop() || "fichier";

  if (fileType === "image") {
    return (
      <div className="mt-1.5">
        <img
          src={resolvedUrl}
          alt="Image partagée"
          className="rounded-xl max-w-[200px] max-h-[180px] object-cover cursor-pointer"
          onClick={() => window.open(resolvedUrl, "_blank")}
        />
        <a
          href={resolvedUrl}
          download
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-1 mt-1 text-[10px] font-semibold underline ${isMe ? "text-red-100" : "text-sky-600 dark:text-sky-300"}`}
        >
          <Download size={10} /> Télécharger
        </a>
      </div>
    );
  }

  return (
    <div className={`mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl ${isMe ? "bg-red-600" : "bg-gray-100 dark:bg-gray-700"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-red-700/80" : "bg-sky-50 dark:bg-sky-900/40"}`}>
        <FileText size={16} className={isMe ? "text-red-50" : "text-sky-600 dark:text-sky-300"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold truncate ${isMe ? "text-white" : "text-gray-800 dark:text-white"}`}>Document PDF</p>
        <p className={`text-[9px] truncate ${isMe ? "text-red-100" : "text-gray-400"}`}>{fileName}</p>
      </div>
      <a
        href={resolvedUrl}
        download
        target="_blank"
        rel="noreferrer"
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-red-700/80 text-red-50 hover:bg-red-700" : "bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100"} transition-colors`}
        title="Télécharger"
      >
        <Download size={13} />
      </a>
    </div>
  );
}

export default function DriverChat() {
  const { user } = useAuth();
  const [selectedAdmin, setSelectedAdmin] = useState<SafeUser | null>(null);
  const [message, setMessage] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  const { data: admins = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/chat/users-by-role", "admin"],
    queryFn: () => authFetchJson("/api/chat/users-by-role/admin"),
  });

  const { data: unreadCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", user?.id, selectedAdmin?.id],
    queryFn: () => authFetchJson(`/api/chat/${user?.id}/${selectedAdmin?.id}`),
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
      handleWSEvent(data);
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
      <div className="min-h-screen bg-gray-50 dark:bg-display-page pb-20">
        <DriverNav />
        <div className="max-w-lg mx-auto flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
          <div className="bg-white px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <button onClick={() => setSelectedAdmin(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300" data-testid="button-back-chat">
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
              <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedAdmin.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Administration{selectedAdmin.isOnline ? " - En ligne" : ""}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800/60">
            {messages.length === 0 && (
              <DEmptyState
                icon={MessageCircle}
                title="Aucun message"
                description="Envoyez votre premier message a l'administration"
              />
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const hasText = !!(msg as any).message;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`driver-msg-${msg.id}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-red-600 text-white rounded-br-md"
                      : "bg-white text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-800"
                  }`}>
                    {hasText && <p>{msg.message}</p>}
                    <FileAttachment msg={msg} isMe={isMe} />
                    <p className={`text-[9px] mt-1 ${isMe ? "text-red-200" : "text-gray-400 dark:text-gray-500"}`}>
                      {formatTime(msg.createdAt ?? new Date())}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEnd} />
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Votre message..."
                data-testid="driver-input-chat"
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
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
    <div className="min-h-screen bg-gray-50 dark:bg-display-page pb-24">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Messagerie</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Contactez l'administration</p>

        <div className="space-y-3">
          {admins.map((admin: any) => (
            <button
              key={admin.id}
              onClick={() => setSelectedAdmin(admin)}
              data-testid={`driver-admin-contact-${admin.id}`}
              className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3 hover:shadow-md transition-all text-left"
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
                <p className="font-bold text-sm text-gray-900 dark:text-white">{admin.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
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
            <DEmptyState
              icon={Shield}
              title="Aucun administrateur disponible"
            />
          )}
        </div>
      </div>
      <div className="fixed bottom-20 left-0 right-0 text-center">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">Made By Khevin Andrew Kita - Ed Corporation</p>
      </div>
    </div>
  );
}
