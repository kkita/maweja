import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson, apiRequest, queryClient, resolveImg } from "../../lib/queryClient";
import { ArrowLeft, Bell, Check, Package, Tag, Info, X, MessageCircle, ShoppingBag, Megaphone } from "lucide-react";
import ClientNav from "../../components/ClientNav";
import type { Notification as Notif } from "@shared/schema";

function notifIcon(type: string) {
  if (type === "order") return <Package size={18} className="text-blue-500" />;
  if (type === "promo") return <Tag size={18} className="text-amber-500" />;
  return <Info size={18} className="text-gray-400 dark:text-gray-500" />;
}

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

function NotifDetailModal({ notif, onClose, navigate }: { notif: Notif; onClose: () => void; navigate: (to: string) => void }) {
  const typeIcon: Record<string, JSX.Element> = {
    order: <ShoppingBag size={22} className="text-blue-500" />,
    promo: <Tag size={22} className="text-amber-500" />,
    chat: <MessageCircle size={22} className="text-green-500" />,
    info: <Megaphone size={22} className="text-red-500" />,
  };
  const icon = typeIcon[notif.type] || <Info size={22} className="text-gray-400" />;
  const imageUrl = (notif as any).imageUrl;

  const handleActionClick = () => {
    onClose();
    if (notif.type === "order") navigate("/orders");
    else if (notif.type === "chat") navigate("/");
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-4 mb-8 sm:mb-0 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        {imageUrl && (
          <div className="w-full" style={{ height: 200 }}>
            <img src={resolveImg(imageUrl)} alt={notif.title || ""} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              notif.type === "order" ? "bg-blue-50 dark:bg-blue-950/40"
              : notif.type === "promo" ? "bg-amber-50 dark:bg-amber-950/40"
              : notif.type === "chat" ? "bg-green-50 dark:bg-green-950/40"
              : "bg-red-50 dark:bg-red-950/40"
            }`}>{icon}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-gray-900 dark:text-white text-lg leading-tight">{notif.title || "Notification"}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                {new Intl.DateTimeFormat("fr-CD", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notif.createdAt || new Date()))}
              </p>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
              <X size={16} />
            </button>
          </div>
          {notif.message && (
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-4 py-3">{notif.message}</p>
          )}
          {(notif.type === "order" || notif.type === "chat") && (
            <button
              onClick={handleActionClick}
              className="mt-4 w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors active:scale-[0.98]"
            >
              {notif.type === "order" ? "Voir mes commandes" : "Ouvrir le chat"}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<Notif | null>(null);

  const notifQueryKey = ["/api/notifications", user?.id] as const;

  const { data: notifications = [], isLoading } = useQuery<Notif[]>({
    queryKey: notifQueryKey,
    queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
    enabled: !!user,
    refetchInterval: 15000,
  });

  /**
   * Mark UNE notification comme lue.
   * — UI optimiste : la notif passe immédiatement en "lu" dans la liste.
   * — Rollback automatique si l'API échoue.
   * — Invalidation ciblée : on n'invalide QUE la liste de cet utilisateur,
   *   jamais l'ensemble des caches notifications (évite les re-fetch parasites).
   */
  const markRead = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: notifQueryKey });
      const previous = queryClient.getQueryData<Notif[]>(notifQueryKey);
      if (previous) {
        queryClient.setQueryData<Notif[]>(
          notifQueryKey,
          previous.map(n => (n.id === id ? { ...n, isRead: true } : n)),
        );
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifQueryKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notifQueryKey });
    },
  });

  /**
   * Mark TOUT comme lu — UNIQUEMENT déclenché par le clic explicite sur le
   * bouton "Tout lire". L'auto-mark-all-read au chargement de page (qui
   * marquait silencieusement toutes les notifs en lu dès l'ouverture) a été
   * retiré : c'était un comportement "anti-utilisateur" qui empêchait de
   * relire tranquillement ses notifications.
   */
  const markAllRead = useMutation({
    mutationFn: () =>
      apiRequest(`/api/notifications/read-all/${user?.id}`, { method: "PATCH" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notifQueryKey });
      const previous = queryClient.getQueryData<Notif[]>(notifQueryKey);
      if (previous) {
        queryClient.setQueryData<Notif[]>(
          notifQueryKey,
          previous.map(n => (n.type !== "chat" ? { ...n, isRead: true } : n)),
        );
      }
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifQueryKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notifQueryKey });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;
  const visibleNotifs = notifications.filter(n => n.type !== "chat");

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-display-page flex flex-col">
        <ClientNav />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Bell size={48} className="text-gray-300 mb-4" />
          <p className="font-bold text-gray-700 dark:text-gray-200">Connexion requise</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Connectez-vous pour voir vos notifications</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
            data-testid="button-login-notif"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-display-page pb-28" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
              data-testid="button-back-notif"
            >
              <ArrowLeft size={18} className="text-gray-700 dark:text-gray-200" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 18 }}>Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-red-600 font-medium" style={{ fontSize: 12 }}>
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 px-3 py-1.5 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50"
              style={{ fontSize: 12 }}
              data-testid="button-mark-all-read"
            >
              <Check size={13} />
              {markAllRead.isPending ? "…" : "Tout lire"}
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex gap-3">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full w-3/4" />
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Aucune notification</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Vous serez notifié ici de vos commandes et offres</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleNotifs.map(n => (
              <div
                key={n.id}
                data-testid={`notification-${n.id}`}
                className="w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
                style={{
                  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                  borderLeft: !n.isRead ? "3px solid #dc2626" : "3px solid transparent",
                }}
              >
                {(n as any).imageUrl && (
                  <button
                    onClick={() => setExpandedImage(resolveImg((n as any).imageUrl))}
                    className="w-full"
                    data-testid={`notif-image-${n.id}`}
                  >
                    <img
                      src={resolveImg((n as any).imageUrl)}
                      alt={n.title}
                      className="w-full h-40 object-cover"
                    />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                    setSelectedNotif(n);
                  }}
                  className="w-full p-4 flex gap-3 text-left"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? "bg-red-50 dark:bg-red-900/30" : "bg-gray-50 dark:bg-gray-800/60"}`}>
                    {notifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.isRead ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-200"}`}>
                        {n.title || "Notification"}
                      </p>
                      {!n.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-1" />
                      )}
                    </div>
                    {n.message && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-gray-300 dark:text-gray-600 text-[10px] mt-1 font-medium">
                      {timeAgo(n.createdAt || new Date())}
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
          data-testid="modal-expanded-image"
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            data-testid="button-close-image"
          >
            <X size={20} />
          </button>
          <img
            src={expandedImage}
            alt="Notification"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {selectedNotif && (
        <NotifDetailModal
          notif={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
}
