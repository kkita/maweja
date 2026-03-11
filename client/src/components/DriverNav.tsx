import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetch } from "../lib/queryClient";
import { Home, Package, DollarSign, LogOut, Power, MessageCircle, Settings } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import type { Notification as Notif } from "@shared/schema";
import { useI18n } from "../lib/i18n";

export default function DriverNav() {
  const [location, navigate] = useLocation();
  const { user, logout, setUser } = useAuth();
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);

  const { data: unreadChatCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: notifications = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => authFetch(`/api/notifications/${user?.id}`).then(r => r.json()),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const unreadChatCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);
  const unreadNotifCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "chat_message" || data.type === "notification") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    });
  }, []);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await apiRequest(`/api/drivers/${user?.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isOnline: newStatus }),
    });
    if (user) setUser({ ...user, isOnline: newStatus });
  };

  const links = [
    { path: "/", icon: Home, label: t.driver.home, badge: unreadNotifCount },
    { path: "/driver/orders", icon: Package, label: t.driver.orders, badge: 0 },
    { path: "/driver/chat", icon: MessageCircle, label: t.driver.messages, badge: unreadChatCount },
    { path: "/driver/earnings", icon: DollarSign, label: t.driver.revenue, badge: 0 },
    { path: "/driver/settings", icon: Settings, label: t.driver.settings, badge: 0 },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="MAWEJA" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">MAWEJA</h1>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">{t.driver.dashboard}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnline}
              data-testid="button-toggle-online"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              <Power size={12} />
              {isOnline ? t.driver.online : t.driver.offline}
            </button>
            <button onClick={logout} className="text-gray-400 hover:text-red-600" data-testid="button-logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
        <div className="max-w-lg mx-auto flex">
          {links.map((l) => {
            const isActive = location === l.path;
            return (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                data-testid={`driver-nav-${l.path.replace(/\//g, "") || "home"}`}
                className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${isActive ? "text-red-600" : "text-gray-400"}`}
              >
                <div className="relative">
                  <l.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  {l.badge > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[9px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center" data-testid={`driver-badge-${l.path.replace(/\//g, "") || "home"}`}>
                      {l.badge > 99 ? "99+" : l.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-1">{l.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
