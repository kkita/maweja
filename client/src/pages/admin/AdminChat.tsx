import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { Send, User, Truck, MessageCircle } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface Contact {
  id: number;
  name: string;
  role: string;
  phone: string;
}

export default function AdminChat() {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  const contacts: Contact[] = [
    { id: 2, name: "Patrick Kabongo", role: "client", phone: "0812345678" },
    { id: 3, name: "Marie Lukusa", role: "client", phone: "0898765432" },
    { id: 4, name: "Jean-Pierre Mutombo", role: "driver", phone: "0823456789" },
    { id: 5, name: "David Tshimanga", role: "driver", phone: "0834567890" },
    { id: 6, name: "Samuel Ilunga", role: "driver", phone: "0845678901" },
    { id: 7, name: "Joseph Kalala", role: "driver", phone: "0856789012" },
  ];

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", user?.id, selectedContact?.id],
    queryFn: () => fetch(`/api/chat/${user?.id}/${selectedContact?.id}`).then((r) => r.json()),
    enabled: !!selectedContact && !!user,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "chat_message") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      }
    });
  }, []);

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

  return (
    <AdminLayout title="Messagerie">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-sm">Contacts</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedContact(c)}
                data-testid={`chat-contact-${c.id}`}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                  selectedContact?.id === c.id ? "bg-red-50" : ""
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  {c.role === "driver" ? <Truck size={16} className="text-gray-600" /> : <User size={16} className="text-gray-600" />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{c.role === "driver" ? "Livreur" : "Client"} - {c.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">{selectedContact.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedContact.name}</p>
                  <p className="text-[10px] text-gray-400">{selectedContact.role === "driver" ? "Livreur" : "Client"}</p>
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
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Tapez votre message..."
                    data-testid="input-chat-message"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
