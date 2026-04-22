import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetchJson, authFetch, resolveImg } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { playRingtone } from "../../lib/notify";
import { Send, User, Truck, MessageCircle, Search, Circle, MessageSquare, Phone, Info, Clock, Paperclip, Download, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import type { ChatMessage, User as UserType } from "@shared/schema";

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
          className="rounded-xl max-w-[220px] max-h-[200px] object-cover cursor-pointer"
          onClick={() => window.open(resolvedUrl, "_blank")}
        />
        <a
          href={resolvedUrl}
          download
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-1 mt-1 text-[10px] font-semibold underline ${isMe ? "text-red-200" : "text-blue-500"}`}
        >
          <Download size={10} /> Télécharger
        </a>
      </div>
    );
  }

  return (
    <div className={`mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl ${isMe ? "bg-red-700" : "bg-gray-100 dark:bg-gray-700"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-red-800" : "bg-blue-100 dark:bg-blue-900/40"}`}>
        <FileText size={16} className={isMe ? "text-red-200" : "text-blue-600"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold truncate ${isMe ? "text-white" : "text-gray-800 dark:text-white"}`}>Document PDF</p>
        <p className={`text-[9px] truncate ${isMe ? "text-red-200" : "text-gray-400"}`}>{fileName}</p>
      </div>
      <a
        href={resolvedUrl}
        download
        target="_blank"
        rel="noreferrer"
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-red-800 text-red-100 hover:bg-red-900" : "bg-blue-50 dark:bg-blue-900/40 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/60"} transition-colors`}
        title="Télécharger"
      >
        <Download size={13} />
      </a>
    </div>
  );
}

export default function AdminChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<SafeUser | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"drivers" | "clients">("drivers");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: drivers = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/chat/users-by-role", "driver"],
    queryFn: () => authFetchJson("/api/chat/users-by-role/driver"),
    refetchInterval: 15000,
  });

  const { data: chatContacts = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/chat/contacts", user?.id],
    queryFn: () => authFetchJson(`/api/chat/contacts/${user?.id}`),
    enabled: !!user,
    refetchInterval: 8000,
  });

  const clientContacts = chatContacts.filter((c: any) => c.role === "client");

  const { data: unreadCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
    enabled: !!user,
    refetchInterval: 4000,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
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
        if (data.type === "chat_message") {
          const senderId = data.message?.senderId;
          if (!selectedContact || senderId !== selectedContact.id) {
            playRingtone();
            try { navigator.vibrate?.([180, 80, 180]); } catch {}
          }
        }
      }
    });
  }, [selectedContact?.id]);

  useEffect(() => {
    if (selectedContact && user) {
      apiRequest(`/api/chat/read/${selectedContact.id}/${user.id}`, { method: "PATCH" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] }))
        .catch(() => {});
    }
  }, [selectedContact, user, messages.length]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedContact || !user) return;
    const msg = message.trim();
    setMessage("");
    try {
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: selectedContact.id, message: msg, isRead: false }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat", user?.id, selectedContact?.id] });
      inputRef.current?.focus();
    } catch (err: any) {
      setMessage(msg);
      toast({
        title: "Erreur d'envoi",
        description: err?.message || "Impossible d'envoyer le message. Vérifiez votre connexion.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact || !user) return;
    e.target.value = "";

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch("/api/chat/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l'envoi du fichier");
      }
      const { fileUrl, fileType } = await res.json();
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: selectedContact.id, message: "", fileUrl, fileType, isRead: false }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat", user?.id, selectedContact?.id] });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Échec de l'envoi", variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const activeList = tab === "drivers" ? drivers : clientContacts;
  const filteredList = activeList.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const driverUnread = Object.entries(unreadCounts).filter(([id]) => drivers.some((d: any) => d.id === Number(id))).reduce((s, [, n]) => s + n, 0);
  const clientUnread = Object.entries(unreadCounts).filter(([id]) => clientContacts.some((c: any) => c.id === Number(id))).reduce((s, [, n]) => s + n, 0);

  const formatTime = (date: string | Date) =>
    new Intl.DateTimeFormat("fr-CD", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));

  const formatDay = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getDate() - d.getDate();
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  return (
    <AdminLayout title="Messagerie">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex" style={{ height: "calc(100vh - 180px)", minHeight: 500 }}>

        {/* Sidebar */}
        <div className="w-72 xl:w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
              <button onClick={() => { setTab("drivers"); setSelectedContact(null); }} data-testid="chat-tab-drivers"
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === "drivers" ? "bg-red-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
                <Truck size={12} /> Agents
                {driverUnread > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === "drivers" ? "bg-white/30" : "bg-red-600 text-white"}`}>{driverUnread}</span>}
              </button>
              <button onClick={() => { setTab("clients"); setSelectedContact(null); }} data-testid="chat-tab-clients"
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === "clients" ? "bg-red-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
                <MessageSquare size={12} /> Clients
                {clientUnread > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === "clients" ? "bg-white/30" : "bg-red-600 text-white"}`}>{clientUnread}</span>}
              </button>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                data-testid="chat-search"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>

          {tab === "clients" && clientContacts.length === 0 && (
            <div className="p-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Seuls les clients ayant initie la conversation apparaissent ici.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredList.length === 0 && !(tab === "clients" && clientContacts.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                {tab === "drivers" ? <Truck size={24} className="mx-auto mb-2 opacity-20" /> : <User size={24} className="mx-auto mb-2 opacity-20" />}
                <p className="text-xs">{search ? "Aucun resultat" : tab === "clients" ? "Aucun client n'a encore ecrit" : "Aucun agent trouve"}</p>
              </div>
            )}
            {filteredList.map((c: any) => {
              const isSelected = selectedContact?.id === c.id;
              const unread = unreadCounts[c.id] || 0;
              return (
                <button key={c.id} onClick={() => setSelectedContact(c)} data-testid={`chat-contact-${c.id}`}
                  className={`w-full p-3 flex items-center gap-3 transition-all text-left border-b border-gray-50 dark:border-gray-800 ${isSelected ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-l-red-600" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? "bg-red-100 dark:bg-red-950/50" : "bg-gray-100 dark:bg-gray-800"}`}>
                      {c.role === "driver" ? <Truck size={15} className={isSelected ? "text-red-600" : "text-gray-600"} /> : <User size={15} className={isSelected ? "text-red-600" : "text-gray-600"} />}
                    </div>
                    {c.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold text-sm truncate ${isSelected ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{c.name}</p>
                      {unread > 0 && (
                        <span className="bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" data-testid={`unread-${c.id}`}>{unread}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{c.phone}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedContact ? (
            <>
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white font-black text-sm">{selectedContact.name?.[0]?.toUpperCase()}</span>
                  </div>
                  {selectedContact.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedContact.name}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    {selectedContact.role === "driver" ? <Truck size={9} /> : <User size={9} />}
                    {selectedContact.role === "driver" ? "Agent" : "Client"}
                    {selectedContact.isOnline ? <><Circle size={6} className="text-green-500 fill-green-500 ml-1" /> En ligne</> : <><Clock size={9} className="ml-1" /> Hors ligne</>}
                  </p>
                </div>
                {selectedContact.phone && (
                  <a href={`tel:${selectedContact.phone}`} className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors" title={`Appeler ${selectedContact.name}`}>
                    <Phone size={14} />
                  </a>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50 dark:bg-gray-950/50">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                      <MessageCircle size={28} className="opacity-40" />
                    </div>
                    <p className="font-semibold text-sm">Aucun message</p>
                    <p className="text-xs mt-1">Commencez la conversation</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const prevMsg = messages[idx - 1];
                  const showDay = !prevMsg || formatDay(prevMsg.createdAt ?? new Date()) !== formatDay(msg.createdAt ?? new Date());
                  const hasFile = !!(msg as any).fileUrl;
                  const hasText = !!(msg as any).message;
                  return (
                    <div key={msg.id} data-testid={`chat-msg-${msg.id}`}>
                      {showDay && (
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                          <span className="text-[10px] font-semibold text-gray-400 px-2">{formatDay(msg.createdAt ?? new Date())}</span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>
                      )}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMe ? "bg-red-600 text-white rounded-br-sm" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-700"
                        }`}>
                          {hasText && <p className="leading-relaxed">{msg.message}</p>}
                          <FileAttachment msg={msg} isMe={isMe} />
                          <p className={`text-[9px] mt-1.5 ${isMe ? "text-red-200" : "text-gray-400"}`}>{formatTime(msg.createdAt ?? new Date())}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-chat-file"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile || !selectedContact}
                    data-testid="button-chat-attach"
                    title="Joindre un fichier (PDF ou image)"
                    className="w-12 h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors disabled:opacity-40"
                  >
                    {isUploadingFile ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
                  </button>
                  <input ref={inputRef} type="text" value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={`Message a ${selectedContact.name}...`}
                    data-testid="input-chat-message"
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" />
                  <button onClick={sendMessage} disabled={!message.trim()} data-testid="button-send-message"
                    className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all shadow-sm shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-md hover:shadow-red-200">
                    <Send size={17} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5 text-center">PDF ou image · max 20 Mo · disponible 5 jours</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={36} className="text-red-300 dark:text-red-700" />
                </div>
                <p className="font-bold text-base text-gray-700 dark:text-gray-300">Selectionnez un contact</p>
                <p className="text-xs mt-2 text-gray-400">Choisissez un agent ou un client pour commencer</p>
                <div className="mt-5 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Truck size={12} className="text-red-400" />
                    <span>{drivers.length} agent{drivers.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-red-400" />
                    <span>{clientContacts.length} client{clientContacts.length !== 1 ? "s" : ""} actif{clientContacts.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
