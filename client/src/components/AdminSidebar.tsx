import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetch } from "../lib/queryClient";
import {
  LayoutDashboard, Package, Users, Truck, Store, MessageCircle, DollarSign, Settings, LogOut, Bell, Shield, BarChart3,
  Briefcase, Image, Megaphone
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Notification as Notif } from "@shared/schema";
import logoImg from "@assets/image_1772833363714.png";

export default function AdminSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const { data: notifications = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => authFetch(`/api/notifications/${user?.id}`).then((r) => r.json()),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: unreadChatCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const unreadNotifCount = notifications.filter((n) => !n.isRead && n.type !== "chat").length;
  const unreadChatCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);

  const { data: pendingVerifications = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/verifications"],
    refetchInterval: 10000,
  });

  const links = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/orders", icon: Package, label: "Commandes" },
    { path: "/admin/drivers", icon: Truck, label: "Livreurs" },
    { path: "/admin/verifications", icon: Shield, label: "Verifications" },
    { path: "/admin/restaurants", icon: Store, label: "Restaurants" },
    { path: "/admin/customers", icon: Users, label: "Clients" },
    { path: "/admin/chat", icon: MessageCircle, label: "Messages" },
    { path: "/admin/finance", icon: DollarSign, label: "Finance" },
    { path: "/admin/marketing", icon: BarChart3, label: "Marketing" },
    { path: "/admin/services", icon: Briefcase, label: "Services" },
    { path: "/admin/ads", icon: Image, label: "Publicites" },
    { path: "/admin/notifications", icon: Megaphone, label: "Notifications" },
    { path: "/admin/settings", icon: Settings, label: "Parametres" },
  ];

  const getBadge = (label: string) => {
    if (label === "Messages" && unreadChatCount > 0) {
      return { count: unreadChatCount, color: "bg-red-600" };
    }
    if (label === "Dashboard" && unreadNotifCount > 0) {
      return { count: unreadNotifCount, color: "bg-red-600" };
    }
    if (label === "Verifications" && pendingVerifications.length > 0) {
      return { count: pendingVerifications.length, color: "bg-orange-500" };
    }
    return null;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="MAWEJA" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h1 className="text-lg font-black text-gray-900">MAWEJA</h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((l) => {
          const isActive = location === l.path;
          const badge = getBadge(l.label);
          return (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              data-testid={`admin-nav-${l.label.toLowerCase()}`}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-red-50 text-red-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <l.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              {l.label}
              {badge && (
                <span className={`ml-auto ${badge.color} text-white text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center`} data-testid={`badge-${l.label.toLowerCase()}`}>
                  {badge.count > 99 ? "99+" : badge.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
            <span className="text-red-600 font-bold text-sm">{user?.name?.[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400">Administrateur</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-600 transition-colors" data-testid="admin-logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
