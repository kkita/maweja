import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetchJson } from "../lib/queryClient";
import { useI18n } from "../lib/i18n";
import { useQuery } from "@tanstack/react-query";
import type { Notification as Notif } from "@shared/schema";

const logoImg = "/maweja-icon.png";

import {
  LayoutDashboard, Package, Users, Truck, Store, MessageCircle, DollarSign,
  Settings, LogOut, Shield, BarChart3, Briefcase, Image, Megaphone, UserCog,
  GalleryHorizontal, Tag, UtensilsCrossed, ShoppingBag, MapPin, KeyRound,
} from "lucide-react";

function canAccess(user: any, badgeKey: string): boolean {
  const adminRole = user?.adminRole;
  const adminPermissions: string[] = user?.adminPermissions || [];
  if (adminRole === "superadmin") return true;
  if (!adminRole && adminPermissions.length === 0) return true;
  if (badgeKey === "dashboard") return true;
  return adminPermissions.includes(badgeKey);
}

interface NavItem { path: string; icon: any; label: string; badgeKey: string }
interface SidebarSection { title: string; items: NavItem[] }

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

  const unreadNotifCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;
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
        { path: "/admin/menu-categories", icon: UtensilsCrossed, label: "Catégories de plats", badgeKey: "menu_categories" },
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
        { path: "/admin/password-resets", icon: KeyRound, label: "Réinit. Mots de Passe", badgeKey: "password_resets" },
        { path: "/admin/accounts", icon: UserCog, label: "Comptes Admin", badgeKey: "accounts" },
        { path: "/admin/gallery", icon: GalleryHorizontal, label: "Galerie Médias", badgeKey: "gallery" },
        { path: "/admin/settings", icon: Settings, label: t.admin.settings, badgeKey: "settings" },
      ],
    },
  ];

  function getBadge(badgeKey: string) {
    if (badgeKey === "chat" && unreadChatCount > 0) return { count: unreadChatCount, urgent: true };
    if (badgeKey === "dashboard" && unreadNotifCount > 0) return { count: unreadNotifCount, urgent: false };
    if (badgeKey === "verifications" && pendingVerifications.length > 0) return { count: pendingVerifications.length, urgent: false };
    if (badgeKey === "orders" && pendingOrdersCount > 0) return { count: pendingOrdersCount, urgent: false };
    return null;
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? "A";

  return (
    <aside className="w-60 bg-white dark:bg-[#0E0E10] border-r border-zinc-200/80 dark:border-zinc-800/60 h-screen flex flex-col fixed left-0 top-0 z-40">

      {/* ── Brand ── */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-rose-600 to-rose-700 p-[2px] shadow-sm shadow-rose-200 dark:shadow-none">
          <img src={logoImg} alt="MAWEJA" className="w-full h-full rounded-[10px] object-cover" />
        </div>
        <div>
          <p className="text-[15px] font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">MAWEJA</p>
          <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.18em] mt-0.5">Console Admin</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {sections.map(section => {
          const filtered = section.items.filter(l => canAccess(user, l.badgeKey));
          if (filtered.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="text-[9.5px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.16em] px-2.5 mb-1.5 select-none">
                {section.title}
              </p>
              <div className="space-y-px">
                {filtered.map(item => {
                  const isActive = location === item.path;
                  const badge = getBadge(item.badgeKey);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      data-testid={`admin-nav-${item.badgeKey}`}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150 relative group ${
                        isActive
                          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-rose-500 rounded-r-full" />
                      )}
                      <item.icon
                        size={15}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className="flex-shrink-0"
                      />
                      <span className="truncate flex-1">{item.label}</span>
                      {badge && (
                        <span
                          className={`flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-sm ${badge.urgent ? "bg-rose-500" : "bg-amber-500"}`}
                          data-testid={`badge-${item.badgeKey}`}
                        >
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

      {/* ── User footer ── */}
      <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-rose-200 dark:shadow-none">
            <span className="text-white font-black text-[11px]">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium leading-tight">
              {isSuperAdmin ? "Super Admin" : "Accès limité"}
            </p>
          </div>
          <button
            onClick={async () => { await logout(); navigate("/admin/login"); }}
            className="p-1.5 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex-shrink-0"
            data-testid="admin-logout"
            title="Se déconnecter"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
