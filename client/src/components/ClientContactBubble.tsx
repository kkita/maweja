import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest, queryClient, authFetch, authFetchJson, resolveImg } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import { useToast } from "../hooks/use-toast";
import { MessageCircle, X, Send, ArrowLeft, Shield, Circle, AlertTriangle, CheckCircle2, Download, FileText } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { ChatMessage, User as UserType } from "@shared/schema";

function FileAttachment({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const fileUrl = (msg as any).fileUrl;
  const fileType = (msg as any).fileType;
  if (!fileUrl) return null;
  const resolvedUrl = resolveImg(fileUrl);
  const fileName = fileUrl.split("/").pop() || "fichier";

  if (fileType === "image") {
    return (
      <div className="mt-1">
        <img
          src={resolvedUrl}
          alt="Image"
          className="rounded-lg max-w-[160px] max-h-[140px] object-cover cursor-pointer"
          onClick={() => window.open(resolvedUrl, "_blank")}
        />
        <a href={resolvedUrl} download target="_blank" rel="noreferrer"
          className={`flex items-center gap-1 mt-0.5 text-[9px] font-semibold underline ${isMe ? "text-red-200" : "text-blue-500"}`}>
          <Download size={9} /> Télécharger
        </a>
      </div>
    );
  }

  return (
    <div className={`mt-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${isMe ? "bg-red-600" : "bg-gray-100 dark:bg-gray-700"}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-red-700/80" : "bg-sky-50 dark:bg-sky-900/40"}`}>
        <FileText size={13} className={isMe ? "text-red-200" : "text-blue-600"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold truncate ${isMe ? "text-white" : "text-gray-800 dark:text-white"}`}>Document PDF</p>
        <p className={`text-[8px] truncate ${isMe ? "text-red-200" : "text-gray-400"}`}>{fileName}</p>
      </div>
      <a href={resolvedUrl} download target="_blank" rel="noreferrer"
        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-red-700/80 text-red-50" : "bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300"} transition-colors`}>
        <Download size={11} />
      </a>
    </div>
  );
}

type SafeUser = Omit<UserType, "password">;

export default function ClientContactBubble() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "chat" | "complaint">("menu");
  const [selectedAdmin, setSelectedAdmin] = useState<SafeUser | null>(null);
  const [message, setMessage] = useState("");
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintSent, setComplaintSent] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const { data: admins = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/chat/users-by-role", "admin"],
    queryFn: () => authFetchJson("/api/chat/users-by-role/admin"),
    enabled: !!user && isOpen,
  });

  const { data: appSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000,
  });

  const whatsappNumber = (appSettings?.whatsapp_number || "+243802540138").replace(/\s+/g, "").replace("+", "");

  const { data: unreadCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
    enabled: !!user,
    refetchInterval: 10000,
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
      // Sonnerie + vibration + notif système : centralisées dans App.tsx
    });
  }, []);

  useEffect(() => {
    if (selectedAdmin && user) {
      apiRequest(`/api/chat/read/${selectedAdmin.id}/${user.id}`, { method: "PATCH" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] }))
        .catch(() => {});
    }
  }, [selectedAdmin, user, messages.length]);

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

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

  const sendComplaint = async () => {
    if (!complaintSubject.trim() || !complaintMessage.trim() || !user) return;
    const admin = admins.find((a: any) => a.isOnline) || admins[0];
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

  const formatTime = (date: string | Date) => {
    return new Intl.DateTimeFormat("fr-CD", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) { setView("menu"); setSelectedAdmin(null); } }}
        data-testid="button-contact-bubble"
        className="fixed bottom-[88px] right-4 z-50 w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-300 hover:bg-red-700 transition-all hover:scale-110"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-white dark:bg-gray-900 text-red-600 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-red-600" data-testid="unread-bubble-count">
            {totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-40 right-4 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ maxHeight: "480px" }} data-testid="contact-panel">
          {view === "menu" && (
            <>
              <div className="bg-red-600 p-4">
                <h3 className="text-white font-bold text-sm">Contactez-nous</h3>
                <p className="text-red-200 text-xs mt-0.5">Comment pouvons-nous vous aider ?</p>
              </div>
              <div className="p-3 space-y-2">
                {user ? (
                <button onClick={() => {
                  const admin = admins.find((a: any) => a.isOnline) || admins[0];
                  if (admin) { setSelectedAdmin(admin); setView("chat"); }
                  else toast({ title: "Info", description: "Aucun administrateur disponible pour le moment" });
                }} data-testid="button-start-chat"
                  className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 dark:bg-gray-800 transition-all text-left border border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MessageCircle size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Chat en direct</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Discutez avec un administrateur</p>
                  </div>
                  {totalUnread > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {totalUnread}
                    </span>
                  )}
                </button>
              ) : null}
                <button onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=Bonjour MAWEJA, j'ai besoin d'aide.`, "_blank")} data-testid="button-whatsapp"
                  className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 dark:bg-gray-800 transition-all text-left border border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <SiWhatsapp size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">WhatsApp</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Ecrivez-nous sur WhatsApp</p>
                  </div>
                </button>
                {user && (
                  <button onClick={() => { setView("complaint"); setComplaintSent(false); }} data-testid="button-start-complaint"
                    className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 dark:bg-gray-800 transition-all text-left border border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">Reclamation</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Signalez un probleme structure</p>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}

          {view === "chat" && selectedAdmin && (
            <div className="flex flex-col" style={{ height: "480px" }}>
              <div className="bg-red-600 p-3 flex items-center gap-3">
                <button onClick={() => { setView("menu"); setSelectedAdmin(null); }} className="text-white/80 hover:text-white">
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <div className="w-8 h-8 bg-white dark:bg-gray-900/20 rounded-lg flex items-center justify-center">
                    <Shield size={14} className="text-white" />
                  </div>
                  {selectedAdmin.isOnline && (
                    <Circle size={8} className="absolute -bottom-0.5 -right-0.5 text-green-400 fill-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-bold text-xs">{selectedAdmin.name}</p>
                  <p className="text-red-200 text-[10px]">{selectedAdmin.isOnline ? "En ligne" : "Hors ligne"}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
                {messages.length === 0 && (
                  <div className="text-center pt-12 text-gray-400 dark:text-gray-500">
                    <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Envoyez votre premier message</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const hasText = !!(msg as any).message;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                        isMe
                          ? "bg-red-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-800"
                      }`}>
                        {hasText && <p>{msg.message}</p>}
                        <FileAttachment msg={msg} isMe={isMe} />
                        <p className={`text-[8px] mt-0.5 ${isMe ? "text-red-200" : "text-gray-400 dark:text-gray-500"}`}>
                          {formatTime(msg.createdAt ?? new Date())}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>

              <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Votre message..."
                    data-testid="client-chat-input"
                    className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button onClick={sendMessage} data-testid="client-chat-send"
                    className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "complaint" && (
            <>
              <div className="bg-red-600 p-3 flex items-center gap-3">
                <button onClick={() => setView("menu")} className="text-white/80 hover:text-white">
                  <ArrowLeft size={18} />
                </button>
                <div className="w-8 h-8 bg-white dark:bg-gray-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">Reclamation</p>
                  <p className="text-red-200 text-[10px]">Signalez un probleme</p>
                </div>
              </div>

              {complaintSent ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-green-600" />
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Reclamation envoyee</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Un administrateur vous repondra dans les plus brefs delais.</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Sujet</label>
                    <select value={complaintSubject} onChange={e => setComplaintSubject(e.target.value)}
                      data-testid="complaint-subject"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">Choisir un sujet...</option>
                      <option value="Commande non livree">Commande non livree</option>
                      <option value="Retard de livraison">Retard de livraison</option>
                      <option value="Commande incorrecte">Commande incorrecte</option>
                      <option value="Qualite de nourriture">Qualite de nourriture</option>
                      <option value="Probleme de paiement">Probleme de paiement</option>
                      <option value="Comportement de l'agent">Comportement de l'agent</option>
                      <option value="Probleme technique">Probleme technique</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Description detaillee</label>
                    <textarea value={complaintMessage} onChange={e => setComplaintMessage(e.target.value)}
                      placeholder="Decrivez votre probleme en detail..."
                      data-testid="complaint-message"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs resize-none h-28 focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <button onClick={sendComplaint} disabled={!complaintSubject || !complaintMessage.trim()}
                    data-testid="button-send-complaint"
                    className="w-full bg-red-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                    <Send size={14} />
                    Envoyer la reclamation
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
