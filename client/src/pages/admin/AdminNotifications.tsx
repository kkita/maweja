import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminSidebar from "../../components/AdminSidebar";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  Bell, Send, Users, TrendingUp, ShoppingBag, Clock, Megaphone,
  Target, CheckCircle, Loader2, Zap, UserCheck
} from "lucide-react";

type Segment = {
  label: string;
  count: number;
};

export default function AdminNotifications() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetSegment, setTargetSegment] = useState("all_clients");
  const [notifType, setNotifType] = useState("promo");
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const { data: segments = {} } = useQuery<Record<string, Segment>>({
    queryKey: ["/api/analytics/client-segments"],
    queryFn: () => apiRequest("/api/analytics/client-segments").then(r => r.json()),
  });

  const broadcastMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/notifications/broadcast", { method: "POST", body: JSON.stringify(data) }),
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

  const segmentIcons: Record<string, any> = {
    all_clients: Users,
    frequent_food: ShoppingBag,
    service_users: Zap,
    inactive: Clock,
    high_value: TrendingUp,
    new_clients: UserCheck,
  };

  const segmentColors: Record<string, string> = {
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 ml-64">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900" data-testid="text-admin-notif-title">Notifications Push</h1>
            <p className="text-sm text-gray-500 mt-0.5">Envoyez des notifications ciblees a vos clients</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
                <Megaphone size={16} className="text-red-500" />
                Composer une notification
              </h3>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Modeles rapides</p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t, i) => (
                    <button key={i} onClick={() => { setTitle(t.title); setMessage(t.message); setNotifType(t.type); }}
                      data-testid={`template-${i}`}
                      className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 transition-all">
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {[
                      { key: "promo", label: "Promo", icon: Target },
                      { key: "info", label: "Info", icon: Bell },
                      { key: "service", label: "Service", icon: Zap },
                    ].map(t => (
                      <button key={t.key} type="button" onClick={() => setNotifType(t.key)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${notifType === t.key ? "bg-red-600 text-white" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                        <t.icon size={14} /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Titre</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de la notification"
                    data-testid="input-notif-title"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Contenu de la notification..."
                    data-testid="input-notif-message"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-28 resize-none focus:ring-2 focus:ring-red-500 focus:outline-none" />
                </div>
              </div>

              {sent ? (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3" data-testid="notif-sent-success">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-bold text-sm text-green-800">Notification envoyee !</p>
                    <p className="text-xs text-green-600">{sentCount} client{sentCount !== 1 ? "s" : ""} notifie{sentCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ) : (
                <button onClick={handleSend} disabled={broadcastMutation.isPending}
                  data-testid="button-send-broadcast"
                  className="mt-4 w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                  {broadcastMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {broadcastMutation.isPending ? "Envoi en cours..." : "Envoyer la notification"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
                <Target size={16} className="text-red-500" />
                Segment cible
              </h3>
              <div className="space-y-2">
                {Object.entries(segments).map(([key, seg]) => {
                  const Icon = segmentIcons[key] || Users;
                  const gradient = segmentColors[key] || "from-gray-500 to-gray-600";
                  return (
                    <button key={key} onClick={() => setTargetSegment(key)}
                      data-testid={`segment-${key}`}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left ${targetSegment === key ? "bg-red-50 border-2 border-red-500" : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"}`}>
                      <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900">{seg.label}</p>
                        <p className="text-[10px] text-gray-500">{seg.count} client{seg.count !== 1 ? "s" : ""}</p>
                      </div>
                      {targetSegment === key && (
                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                          <CheckCircle size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5 text-white">
              <h3 className="font-bold text-sm mb-2">Conseils</h3>
              <ul className="space-y-2 text-xs text-red-100">
                <li>• Ciblez les clients inactifs pour les re-engager</li>
                <li>• Envoyez des promos aux clients haute valeur</li>
                <li>• Personnalisez selon les habitudes d'achat</li>
                <li>• Evitez d'envoyer trop de notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
