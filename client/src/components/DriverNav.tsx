import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetchJson, apiRequest, queryClient } from "../lib/queryClient";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { onWSMessage } from "../lib/websocket";
import type { Notification as Notif } from "@shared/schema";
import { dt } from "./driver/DriverUI";
import {
  Home, Package, MessageSquare, DollarSign, User, LogOut, MapPin
} from "lucide-react";

export default function DriverNav() {
  const [location, navigate] = useLocation();
  const { user, logout, setUser } = useAuth();
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

  const unreadChat = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);
  const unreadNotif = notifications.filter(n => !n.isRead && n.type !== "chat").length;

  useEffect(() => {
    return onWSMessage((data) => {
      if (["chat_message", "notification", "order_assigned", "new_order", "order_cancelled", "order_status"].includes(data.type)) {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      // Sonnerie + vibration + notif système : centralisées dans App.tsx
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

  const tabs = [
    {
      path: "/",
      label: "Accueil",
      badge: unreadNotif,
      icon: Home,
    },
    {
      path: "/driver/orders",
      label: "Livraisons",
      badge: 0,
      icon: Package,
    },
    {
      path: "/driver/chat",
      label: "Chat",
      badge: unreadChat,
      icon: MessageSquare,
    },
    {
      path: "/driver/earnings",
      label: "Gains",
      badge: 0,
      icon: DollarSign,
    },
    {
      path: "/driver/settings",
      label: "Profil",
      badge: 0,
      icon: User,
    },
  ];

  return (
    <>
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-4 py-3"
        style={{
          background: "var(--driver-nav-bg)",
          borderBottom: `1px solid ${dt.border}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="text-driver-text font-black text-xl tracking-tight">MAWEJA</span>
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide text-black"
                style={{ background: dt.blue }}
              >
                Agent
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide mt-0.5" style={{ color: dt.text3 }}>
              <MapPin size={9} strokeWidth={2.5} />
              Kinshasa, RDC
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Status toggle */}
            <button
              onClick={toggleOnline}
              disabled={toggling}
              data-testid="button-toggle-online"
              className={`flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 ${toggling ? "opacity-60" : ""}`}
              style={{
                background: isOnline ? dt.green : dt.surface2,
                color: isOnline ? "black" : dt.text2,
                boxShadow: isOnline ? "0 0 12px rgba(34,197,94,0.35)" : "none",
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: isOnline ? "black" : dt.text3,
                  animation: isOnline ? "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" : "none",
                }}
              />
              {isOnline ? "En ligne" : "Hors ligne"}
            </button>

            {/* Logout */}
            <button
              onClick={async () => { await logout(); navigate("/driver/login"); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ background: dt.surface2, color: dt.text3 }}
              data-testid="button-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Bottom Nav ───────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--driver-nav-bg)",
          borderTop: `1px solid ${dt.border}`,
          backdropFilter: "blur(24px)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="max-w-lg mx-auto flex items-center">
          {tabs.map((tab) => {
            const isActive = location === tab.path || (tab.path !== "/" && location.startsWith(tab.path));
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                data-testid={`driver-nav-${tab.path.replace(/\//g, "") || "home"}`}
                className="flex-1 flex flex-col items-center justify-center pt-3 pb-1 gap-1 relative transition-all active:scale-90"
              >
                {/* Active indicator top bar */}
                {isActive && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: 24, height: 3, background: dt.accent }}
                  />
                )}

                <Icon
                  size={22}
                  style={{ color: isActive ? dt.accent : dt.text3 }}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: isActive ? dt.accent : dt.text3 }}
                >
                  {tab.label}
                </span>

                {tab.badge > 0 && (
                  <span
                    className="absolute top-2 right-[calc(50%-18px)] text-white text-[8px] font-black min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center"
                    style={{ background: dt.accent }}
                    data-testid={`driver-badge-${tab.path.replace(/\//g, "") || "home"}`}
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
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
