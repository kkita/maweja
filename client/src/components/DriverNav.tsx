import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetchJson } from "../lib/queryClient";
import { MapPin, LogOut, Power } from "lucide-react";
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
    {
      path: "/",
      label: t.driver.home,
      badge: unreadNotifCount,
      icon: (active: boolean) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" strokeWidth="1.8" fill="none" stroke="currentColor" />
        </svg>
      ),
    },
    {
      path: "/driver/orders",
      label: t.driver.orders,
      badge: 0,
      icon: (active: boolean) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16v-2" />
          <polyline points="3.29 7 12 12 20.71 7" fill="none" stroke={active ? "white" : "currentColor"} strokeWidth="1.8" />
          <line x1="12" y1="22" x2="12" y2="12" stroke={active ? "white" : "currentColor"} strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      path: "/driver/chat",
      label: t.driver.messages,
      badge: unreadChatCount,
      icon: (active: boolean) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          {active && <path d="M8 10h8M8 13h5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />}
        </svg>
      ),
    },
    {
      path: "/driver/earnings",
      label: t.driver.revenue,
      badge: 0,
      icon: (active: boolean) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v2m0 8v2m-3-7h4.5a1.5 1.5 0 010 3H9.5a1.5 1.5 0 000 3H14" fill="none" stroke={active ? "white" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      path: "/driver/settings",
      label: t.driver.settings,
      badge: 0,
      icon: (active: boolean) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" fill={active ? "white" : "none"} stroke={active ? "transparent" : "currentColor"} strokeWidth="1.8" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke={active ? "white" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">

          {/* Brand */}
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span
                className="text-[22px] text-gray-900 tracking-tight"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.02em", fontWeight: 800 }}
              >
                MAWEJA
              </span>
              <span className="bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                Livreur
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium tracking-wide mt-0.5">
              <MapPin size={9} className="flex-shrink-0" strokeWidth={2.5} />
              Kinshasa, RDC
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Online/Offline toggle */}
            <button
              onClick={toggleOnline}
              disabled={toggling}
              data-testid="button-toggle-online"
              className={`relative flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                isOnline
                  ? "bg-green-500 text-white shadow-lg shadow-green-200"
                  : "bg-gray-100 text-gray-500"
              } ${toggling ? "opacity-60" : ""}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-white animate-pulse" : "bg-gray-400"}`} />
              {isOnline ? t.driver.online : t.driver.offline}
            </button>

            {/* Logout */}
            <button
              onClick={async () => { await logout(); navigate("/driver/login"); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600:bg-red-900/20:text-red-400 transition-all active:scale-95"
              data-testid="button-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Bottom navigation ────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 pt-2 pointer-events-none">
        <div
          className="pointer-events-auto flex items-center gap-0.5 bg-white/95 backdrop-blur-2xl rounded-[28px] px-1.5 py-2"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)" }}
        >
          {links.map((l) => {
            const isActive = location === l.path || (l.path !== "/" && location.startsWith(l.path));
            return (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                data-testid={`driver-nav-${l.path.replace(/\//g, "") || "home"}`}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-[20px] transition-all duration-250 active:scale-90 ${
                  isActive
                    ? "bg-red-600 text-white px-4 py-2.5 min-w-[64px]"
                    : "text-gray-400 px-3 py-2.5 min-w-[52px] hover:text-gray-600:text-gray-300"
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? "scale-105" : "scale-100"}`}>
                  {l.icon(isActive)}
                </div>
                <span className={`text-[9px] font-bold transition-all leading-none ${isActive ? "opacity-100" : "opacity-0 absolute"}`}>
                  {l.label}
                </span>
                {l.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-white text-[8px] font-black min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center ${isActive ? "bg-white text-red-600" : "bg-red-600"}`}
                    data-testid={`driver-badge-${l.path.replace(/\//g, "") || "home"}`}
                  >
                    {l.badge > 99 ? "99+" : l.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
