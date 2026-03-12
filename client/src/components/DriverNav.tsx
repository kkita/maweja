import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetchJson } from "../lib/queryClient";
import { Home, Package, DollarSign, LogOut, Power, MessageCircle, Settings } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import { handleWSEvent } from "../lib/notify";
import type { Notification as Notif } from "@shared/schema";
import { useI18n } from "../lib/i18n";

export default function DriverNav() {
  const [location, navigate] = useLocation();
  const { user, logout, setUser } = useAuth();
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [toggling, setToggling] = useState(false);

  const { data: unreadChatCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: notifications = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const unreadChatCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);
  const unreadNotifCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "chat_message" || data.type === "notification" ||
          data.type === "order_assigned" || data.type === "new_order") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      handleWSEvent(data);
    });
  }, []);

  const toggleOnline = async () => {
    if (toggling) return;
    setToggling(true);
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await apiRequest(`/api/drivers/${user?.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isOnline: newStatus }),
      });
      if (user) setUser({ ...user, isOnline: newStatus });
    } catch {
      setIsOnline(!newStatus);
    } finally {
      setToggling(false);
    }
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
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-red-100 dark:ring-red-900/30 shadow-lg shadow-red-100/50 dark:shadow-red-900/20">
              <img src={logoImg} alt="MAWEJA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900 dark:text-white leading-tight tracking-tight">MAWEJA</h1>
              <p className="text-[9px] text-blue-500 font-bold -mt-0.5 uppercase tracking-widest">{t.driver.dashboard}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnline}
              disabled={toggling}
              data-testid="button-toggle-online"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                isOnline
                  ? "bg-green-500 text-white shadow-green-200 dark:shadow-green-900/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              } ${toggling ? "opacity-60" : ""}`}
            >
              <Power size={12} className={isOnline ? "animate-pulse" : ""} />
              {isOnline ? t.driver.online : t.driver.offline}
            </button>
            <button
              onClick={async () => { await logout(); navigate("/driver/login"); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all active:scale-95"
              data-testid="button-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-lg mx-auto flex items-center px-2 py-1">
          {links.map((l) => {
            const isActive = location === l.path || (l.path !== "/" && location.startsWith(l.path));
            return (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                data-testid={`driver-nav-${l.path.replace(/\//g, "") || "home"}`}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all duration-200 active:scale-90 ${
                  isActive
                    ? "text-red-600"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-2xl" />
                )}
                <div className="relative z-10">
                  <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}>
                    <l.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  {l.badge > 0 && (
                    <span
                      className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center animate-pulse"
                      data-testid={`driver-badge-${l.path.replace(/\//g, "") || "home"}`}
                    >
                      {l.badge > 99 ? "99+" : l.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold mt-0.5 relative z-10 transition-all ${isActive ? "text-red-600" : ""}`}>
                  {l.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
