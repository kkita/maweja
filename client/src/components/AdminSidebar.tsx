import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetchJson } from "../lib/queryClient";
import { useI18n } from "../lib/i18n";
import { useQuery } from "@tanstack/react-query";
import type { Notification as Notif } from "@shared/schema";
const logoImg = "/maweja-icon.png";
import {
  LayoutDashboard, Package, Users, Truck, Store, MessageCircle, DollarSign, Settings, LogOut, Shield, BarChart3,
  Briefcase, Image, Megaphone, UserCog, GalleryHorizontal, Tag, UtensilsCrossed, ShoppingBag, MapPin
} from "lucide-react";

function canAccess(user: any, badgeKey: string): boolean {
  const adminRole = user?.adminRole;
  const adminPermissions: string[] = user?.adminPermissions || [];
  if (adminRole === "superadmin") return true;
  if (!adminRole && adminPermissions.length === 0) return true;
  if (badgeKey === "dashboard") return true;
  return adminPermissions.includes(badgeKey);
}

interface SidebarSection {
  title: string;
  items: { path: string; icon: any; label: string; badgeKey: string }[];
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

  const sections: SidebarSection[] = [
    {
      title: "Principal",
      items: [
        { path: "/", icon: LayoutDashboard, label: t.admin.dashboard, badgeKey: "dashboard" },
        { path: "/admin/orders", icon: Package, label: t.admin.orders, badgeKey: "orders" },
      ],
    },
    {
      title: "Opérations",
      items: [
        { path: "/admin/drivers", icon: Truck, label: t.admin.drivers, badgeKey: "drivers" },
        { path: "/admin/verifications", icon: Shield, label: t.admin.verifications, badgeKey: "verifications" },
        { path: "/admin/restaurants", icon: Store, label: t.admin.restaurants, badgeKey: "restaurants" },
        { path: "/admin/restaurant-categories", icon: UtensilsCrossed, label: "Catégories Resto", badgeKey: "restaurant_categories" },
        { path: "/admin/boutiques", icon: ShoppingBag, label: "Boutiques", badgeKey: "boutiques" },
        { path: "/admin/boutique-categories", icon: Tag, label: "Catégories Boutiques", badgeKey: "boutique_categories" },
        { path: "/admin/delivery-zones", icon: MapPin, label: "Zones de livraison", badgeKey: "delivery_zones" },
        { path: "/admin/services", icon: Briefcase, label: t.admin.services, badgeKey: "services" },
      ],
    },
    {
      title: "Clients & Com.",
      items: [
        { path: "/admin/customers", icon: Users, label: t.admin.customers, badgeKey: "customers" },
        { path: "/admin/chat", icon: MessageCircle, label: t.admin.chat, badgeKey: "chat" },
        { path: "/admin/notifications", icon: Megaphone, label: t.admin.notifications, badgeKey: "notifications" },
      ],
    },
    {
      title: "Business",
      items: [
        { path: "/admin/finance", icon: DollarSign, label: t.admin.finance, badgeKey: "finance" },
        { path: "/admin/marketing", icon: BarChart3, label: t.admin.marketing, badgeKey: "marketing" },
        { path: "/admin/promotions", icon: Tag, label: "Promotions", badgeKey: "promotions" },
        { path: "/admin/ads", icon: Image, label: t.admin.ads, badgeKey: "ads" },
      ],
    },
    {
      title: "Système",
      items: [
        { path: "/admin/accounts", icon: UserCog, label: "Comptes Admin", badgeKey: "accounts" },
        { path: "/admin/gallery", icon: GalleryHorizontal, label: "Galerie Médias", badgeKey: "gallery" },
        { path: "/admin/settings", icon: Settings, label: t.admin.settings, badgeKey: "settings" },
      ],
    },
  ];

  const getBadge = (badgeKey: string) => {
    if (badgeKey === "chat" && unreadChatCount > 0) return { count: unreadChatCount, color: "bg-red-500" };
    if (badgeKey === "dashboard" && unreadNotifCount > 0) return { count: unreadNotifCount, color: "bg-red-500" };
    if (badgeKey === "verifications" && pendingVerifications.length > 0) return { count: pendingVerifications.length, color: "bg-amber-500" };
    if (badgeKey === "orders" && pendingOrdersCount > 0) return { count: pendingOrdersCount, color: "bg-amber-500" };
    return null;
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#0f0f12] border-r border-gray-100 dark:border-gray-800/50 h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-red-600 to-red-700 p-0.5">
            <img src={logoImg} alt="MAWEJA" className="w-full h-full rounded-[10px] object-cover bg-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight">MAWEJA</h1>
            <p className="text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.15em]">{t.admin.adminPanel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
        {sections.map((section) => {
          const filteredItems = section.items.filter(l => canAccess(user, l.badgeKey));
          if (filteredItems.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.12em] px-3 mb-1.5">{section.title}</p>
              <div className="space-y-0.5">
                {filteredItems.map((l) => {
                  const isActive = location === l.path;
                  const badge = getBadge(l.badgeKey);
                  return (
                    <button
                      key={l.path}
                      onClick={() => navigate(l.path)}
                      data-testid={`admin-nav-${l.badgeKey}`}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative ${
                        isActive
                          ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                    >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-red-600 rounded-r-full" />}
                      <l.icon size={18} strokeWidth={isActive ? 2.2 : 1.7} className="flex-shrink-0" />
                      <span className="truncate">{l.label}</span>
                      {badge && (
                        <span className={`ml-auto ${badge.color} text-white text-[9px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm`} data-testid={`badge-${l.badgeKey}`}>
                          {badge.count > 99 ? "99+" : badge.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 dark:border-gray-800/50 p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-200 dark:shadow-none">
            <span className="text-white font-bold text-xs">{user?.name?.[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium">
              {isSuperAdmin ? "Super Admin" : `Accès limité`}
            </p>
          </div>
          <button
            onClick={async () => { await logout(); navigate("/admin/login"); }}
            className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
            data-testid="admin-logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
