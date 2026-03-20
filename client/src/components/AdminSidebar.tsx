import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetchJson } from "../lib/queryClient";
import { useI18n } from "../lib/i18n";
import { useQuery } from "@tanstack/react-query";
import type { Notification as Notif } from "@shared/schema";
import logoImg from "@assets/image_1772833363714.png";
import {
  LayoutDashboard, Package, Users, Truck, Store, MessageCircle, DollarSign, Settings, LogOut, Shield, BarChart3,
  Briefcase, Image, Megaphone, UserCog, GalleryHorizontal
} from "lucide-react";

function canAccess(user: any, badgeKey: string): boolean {
  const adminRole = user?.adminRole;
  const adminPermissions: string[] = user?.adminPermissions || [];
  // Explicit superadmin role → full access
  if (adminRole === "superadmin") return true;
  // No role AND no permissions → full access (primary accounts)
  if (!adminRole && adminPermissions.length === 0) return true;
  // Has specific permissions (limited account) → check permissions
  // Dashboard is always accessible
  if (badgeKey === "dashboard") return true;
  return adminPermissions.includes(badgeKey);
}

export default function AdminSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const adminRole = (user as any)?.adminRole as string | null;
  const adminPermissions: string[] = (user as any)?.adminPermissions || [];
  const isSuperAdmin = adminRole === "superadmin" || (!adminRole && adminPermissions.length === 0);

  const { data: notifications = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: unreadChatCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const unreadNotifCount = notifications.filter((n) => !n.isRead && n.type !== "chat").length;
  const unreadChatCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);

  const { data: pendingVerifications = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/verifications"],
    refetchInterval: 10000,
    enabled: isSuperAdmin,
  });

  const { data: pendingOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
    refetchInterval: 10000,
  });
  const pendingOrdersCount = pendingOrders.filter((o: any) => o.status === "pending").length;

  const allLinks = [
    { path: "/", icon: LayoutDashboard, label: t.admin.dashboard, badgeKey: "dashboard" },
    { path: "/admin/orders", icon: Package, label: t.admin.orders, badgeKey: "orders" },
    { path: "/admin/drivers", icon: Truck, label: t.admin.drivers, badgeKey: "drivers" },
    { path: "/admin/verifications", icon: Shield, label: t.admin.verifications, badgeKey: "verifications" },
    { path: "/admin/restaurants", icon: Store, label: t.admin.restaurants, badgeKey: "restaurants" },
    { path: "/admin/customers", icon: Users, label: t.admin.customers, badgeKey: "customers" },
    { path: "/admin/chat", icon: MessageCircle, label: t.admin.chat, badgeKey: "chat" },
    { path: "/admin/finance", icon: DollarSign, label: t.admin.finance, badgeKey: "finance" },
    { path: "/admin/marketing", icon: BarChart3, label: t.admin.marketing, badgeKey: "marketing" },
    { path: "/admin/services", icon: Briefcase, label: t.admin.services, badgeKey: "services" },
    { path: "/admin/ads", icon: Image, label: t.admin.ads, badgeKey: "ads" },
    { path: "/admin/notifications", icon: Megaphone, label: t.admin.notifications, badgeKey: "notifications" },
    { path: "/admin/accounts", icon: UserCog, label: "Comptes Admin", badgeKey: "accounts" },
    { path: "/admin/gallery", icon: GalleryHorizontal, label: "Galerie Médias", badgeKey: "gallery" },
    { path: "/admin/settings", icon: Settings, label: t.admin.settings, badgeKey: "settings" },
  ];

  const links = allLinks.filter(l => canAccess(user, l.badgeKey));

  const getBadge = (badgeKey: string) => {
    if (badgeKey === "chat" && unreadChatCount > 0) return { count: unreadChatCount, color: "bg-red-600" };
    if (badgeKey === "dashboard" && unreadNotifCount > 0) return { count: unreadNotifCount, color: "bg-red-600" };
    if (badgeKey === "verifications" && pendingVerifications.length > 0) return { count: pendingVerifications.length, color: "bg-orange-500" };
    if (badgeKey === "orders" && pendingOrdersCount > 0) return { count: pendingOrdersCount, color: "bg-amber-500" };
    return null;
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="MAWEJA" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">MAWEJA</h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">{t.admin.adminPanel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((l) => {
          const isActive = location === l.path;
          const badge = getBadge(l.badgeKey);
          return (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              data-testid={`admin-nav-${l.badgeKey}`}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <l.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              {l.label}
              {badge && (
                <span className={`ml-auto ${badge.color} text-white text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center`} data-testid={`badge-${l.badgeKey}`}>
                  {badge.count > 99 ? "99+" : badge.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 bg-red-100 dark:bg-red-950 rounded-xl flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 font-bold text-sm">{user?.name?.[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {isSuperAdmin ? "Super Admin" : `Accès limité (${adminPermissions.length} menus)`}
            </p>
          </div>
          <button
            onClick={async () => { await logout(); navigate("/admin/login"); }}
            className="text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors"
            data-testid="admin-logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
