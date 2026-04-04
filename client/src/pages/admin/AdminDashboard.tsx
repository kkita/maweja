import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "../../components/AdminLayout";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { useI18n } from "../../lib/i18n";
import {
  Package, Truck, Users, DollarSign, Store, TrendingUp, UtensilsCrossed,
  Activity, ChevronRight, ShoppingBag, Layers, AlertCircle, ArrowRight,
  CircleDot, Wallet, Tag, Bell, BellRing, X, CheckCheck, ShoppingCart, Wrench,
} from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate } from "../../lib/utils";
import type { Order } from "@shared/schema";

interface Notif {
  id: string;
  title: string;
  description: string;
  type: "order" | "service";
  time: Date;
  read: boolean;
  href: string;
}

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [880, 1100, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch (_) {}
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "À l'instant";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  return `il y a ${Math.floor(sec / 86400)} j`;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 900;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

function ProgressBar({ value, max, color = "bg-red-500", delay = 0 }: { value: number; max: number; color?: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 200);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-1.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${width}%` }} />
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Commandes", icon: ShoppingBag, gradient: "from-red-500 to-red-600", href: "/admin/orders" },
  { label: "Restaurants", icon: Store, gradient: "from-orange-500 to-red-500", href: "/admin/restaurants" },
  { label: "Agents", icon: Truck, gradient: "from-red-600 to-red-800", href: "/admin/drivers" },
  { label: "Services", icon: Layers, gradient: "from-red-400 to-red-600", href: "/admin/services" },
  { label: "Finance", icon: Wallet, gradient: "from-red-700 to-red-900", href: "/admin/finance" },
  { label: "Promotions", icon: Tag, gradient: "from-orange-400 to-red-500", href: "/admin/promotions" },
];

export default function AdminDashboard() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifRinging, setNotifRinging] = useState(false);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => !n.read).length;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-CD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: () => authFetchJson("/api/orders"),
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "new_order") {
        playNotifSound();
        setNotifRinging(true);
        if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
        ringTimerRef.current = setTimeout(() => setNotifRinging(false), 3000);
        const num = data.order?.orderNumber ? `#${data.order.orderNumber}` : "";
        setNotifs(prev => [{
          id: crypto.randomUUID(),
          title: "Nouvelle commande",
          description: `Commande ${num} reçue`,
          type: "order",
          time: new Date(),
          read: false,
          href: "/admin/orders",
        }, ...prev].slice(0, 50));
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
      if (data.type === "new_service_request") {
        playNotifSound();
        setNotifRinging(true);
        if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
        ringTimerRef.current = setTimeout(() => setNotifRinging(false), 3000);
        setNotifs(prev => [{
          id: crypto.randomUUID(),
          title: "Nouvelle demande de service",
          description: data.request?.serviceType || "Un client a fait une demande",
          type: "service",
          time: new Date(),
          read: false,
          href: "/admin/services",
        }, ...prev].slice(0, 50));
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
      if (data.type === "order_updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    });
  }, []);

  function dismissOne(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }
  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }
  function clearAll() {
    setNotifs([]);
    setPanelOpen(false);
  }

  const todayOrders = Number(stats?.orders?.todayOrders) || 0;
  const todayRevenue = Number(stats?.orders?.todayRevenue) || 0;
  const pendingCount = Number(stats?.orders?.pending) || 0;
  const cancelledCount = Number(stats?.orders?.cancelled) || 0;
  const totalOrders = Number(stats?.orders?.total) || 0;
  const deliveredOrders = Number(stats?.orders?.delivered) || 0;
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
  const driversOnline = Number(stats?.drivers?.online) || 0;
  const driversTotal = Number(stats?.drivers?.total) || 0;
  const restaurantsActive = Number(stats?.restaurants?.active) || 0;
  const restaurantsTotal = Number(stats?.restaurants?.total) || 0;

  return (
    <AdminLayout title={t.admin.dashboard}>
      <div className={`transition-all duration-500 space-y-6 ${loaded ? "opacity-100" : "opacity-0"}`}>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <LiveDot />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">En direct</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{dateCapitalized}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Vue d'ensemble</h2>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Plateforme MAWEJA • Kinshasa, RDC</p>
          </div>
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => {
                setPanelOpen(o => !o);
                if (!panelOpen) setNotifs(prev => prev.map(n => ({ ...n, read: true })));
              }}
              data-testid="button-notifications-bell"
              className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white dark:bg-[#141417] border border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm"
              title="Notifications"
            >
              {notifRinging
                ? <BellRing size={20} className="text-red-600 animate-bounce" />
                : <Bell size={20} className={unreadCount > 0 ? "text-red-600" : "text-gray-400"} />
              }
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center" data-testid="notif-badge-count">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {panelOpen && (
              <div
                className="absolute right-0 top-13 mt-2 w-80 bg-white dark:bg-[#1a1a1f] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
                data-testid="notif-panel"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-red-600" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Notifications</span>
                    {notifs.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{notifs.length}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {notifs.length > 0 && (
                      <>
                        <button
                          onClick={markAllRead}
                          title="Tout marquer comme lu"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                          data-testid="notif-mark-all-read"
                        >
                          <CheckCheck size={14} />
                        </button>
                        <button
                          onClick={clearAll}
                          title="Tout effacer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          data-testid="notif-clear-all"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Bell size={28} className="text-gray-200 dark:text-gray-700" />
                      <p className="text-xs text-gray-400 font-medium">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {notifs.map(n => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer ${!n.read ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}
                          onClick={() => { navigate(n.href); setPanelOpen(false); }}
                          data-testid={`notif-item-${n.id}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${n.type === "order" ? "bg-red-50 dark:bg-red-950/30" : "bg-orange-50 dark:bg-orange-950/30"}`}>
                            {n.type === "order"
                              ? <ShoppingCart size={14} className="text-red-600" />
                              : <Wrench size={14} className="text-orange-600" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${!n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>{n.title}</p>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{n.description}</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">{timeAgo(n.time)}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); dismissOne(n.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex-shrink-0"
                            data-testid={`notif-dismiss-${n.id}`}
                            title="Supprimer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {notifs.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => { navigate("/admin/orders"); setPanelOpen(false); }}
                      className="w-full text-xs font-semibold text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      data-testid="notif-see-orders"
                    >
                      Voir toutes les commandes <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {pendingCount > 0 && (
          <div
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-950/30 transition-all group"
            onClick={() => navigate("/admin/orders")}
            data-testid="alert-pending-orders"
          >
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle size={15} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-xs text-amber-800 dark:text-amber-400">
                {pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente
              </p>
            </div>
            <ChevronRight size={14} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Commandes du jour", value: todayOrders, icon: ShoppingBag, accent: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", sub: `${totalOrders} au total` },
            { label: "Revenu du jour", value: formatPrice(todayRevenue), icon: DollarSign, accent: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", isStr: true, sub: formatPrice(Number(stats?.orders?.revenue) || 0) + " total" },
            { label: "Agents en ligne", value: `${driversOnline}/${driversTotal}`, icon: Truck, accent: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", isStr: true, sub: `${driversTotal} inscrits` },
            { label: "Clients actifs", value: Number(stats?.clients?.total) || 0, icon: Users, accent: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", sub: `${restaurantsActive} restaurants` },
          ].map((card, i) => (
            <div
              key={card.label}
              data-testid={`stat-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="bg-white dark:bg-[#141417] rounded-2xl p-5 border border-gray-100/80 dark:border-gray-800/30 hover:border-gray-200 dark:hover:border-gray-700/50 transition-all duration-300 group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                  <card.icon size={16} className={card.accent} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                {card.isStr ? card.value : <AnimatedNumber value={Number(card.value)} />}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-1.5">{card.label}</p>
              {card.sub && <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{card.sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {QUICK_ACTIONS.map(({ label, icon: Icon, gradient, href }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              data-testid={`quick-action-${label.toLowerCase()}`}
              className="bg-white dark:bg-[#141417] border border-gray-100/80 dark:border-gray-800/30 rounded-xl p-3 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.97] group"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          <div className="lg:col-span-3 bg-white dark:bg-[#141417] rounded-2xl border border-gray-100/80 dark:border-gray-800/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-center">
                  <Package size={13} className="text-red-600" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t.admin.recentOrders}</h3>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">{recentOrders.length}</span>
              </div>
              <button
                onClick={() => navigate("/admin/orders")}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 transition-colors"
                data-testid="link-all-orders"
              >
                Voir tout <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/30 max-h-[420px] overflow-y-auto">
              {ordersLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-24" />
                      <div className="h-2.5 bg-gray-50 dark:bg-gray-800/50 rounded w-16" />
                    </div>
                    <div className="h-5 bg-gray-50 dark:bg-gray-800 rounded-md w-16" />
                  </div>
                ))
              ) : recentOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => navigate("/admin/orders")}
                  data-testid={`recent-order-${order.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
                      <Package size={13} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-[13px] text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{order.orderNumber}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(order.createdAt!)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[13px] text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>
                </div>
              ))}
              {!ordersLoading && recentOrders.length === 0 && (
                <div className="text-center py-16 text-gray-300 dark:text-gray-700">
                  <Package size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Aucune commande</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">

            <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-red-300/20 dark:shadow-none">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-red-300" />
                  <span className="text-xs font-semibold text-red-200">Revenu Total</span>
                </div>
                <p className="text-3xl font-extrabold tracking-tight">{formatPrice(Number(stats?.orders?.revenue) || 0)}</p>
                <p className="text-red-200/70 text-[11px] mt-1">Commandes livrées</p>
                <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
                  {[
                    { label: "Total", val: totalOrders },
                    { label: "Livrées", val: deliveredOrders },
                    { label: "Annulées", val: cancelledCount },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-red-200/50 text-[9px] font-bold uppercase tracking-wider">{label}</p>
                      <p className="text-lg font-extrabold">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#141417] rounded-2xl border border-gray-100/80 dark:border-gray-800/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-center">
                  <Activity size={13} className="text-red-600" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t.admin.performance}</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: t.admin.deliveryRate, value: deliveryRate, max: 100, color: "bg-emerald-500", delay: 200 },
                  {
                    label: t.admin.activeDrivers,
                    value: driversOnline,
                    max: Math.max(driversTotal, 1),
                    display: driversTotal > 0 ? Math.round((driversOnline / driversTotal) * 100) : 0,
                    color: "bg-red-500",
                    delay: 400,
                  },
                  {
                    label: "Restaurants actifs",
                    value: restaurantsActive,
                    max: Math.max(restaurantsTotal, 1),
                    display: restaurantsTotal > 0 ? Math.round((restaurantsActive / restaurantsTotal) * 100) : 0,
                    color: "bg-orange-500",
                    delay: 600,
                  },
                ].map(({ label, value, color, max, display, delay }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{display ?? value}%</span>
                    </div>
                    <ProgressBar value={value} max={max} color={color} delay={delay} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white dark:bg-[#141417] rounded-2xl border border-gray-100/80 dark:border-gray-800/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/30 flex items-center gap-2">
              <div className="w-7 h-7 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-center">
                <UtensilsCrossed size={13} className="text-red-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t.admin.cuisineCategories}</h3>
            </div>
            <div className="p-5 space-y-3.5">
              {(() => {
                const breakdown = stats?.cuisineBreakdown || [];
                const total = breakdown.reduce((s: number, x: any) => s + Number(x.count), 0);
                if (breakdown.length === 0) return (
                  <div className="text-center py-10 text-gray-300 dark:text-gray-700">
                    <Store size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs">{t.admin.noDataAvailable}</p>
                  </div>
                );
                const colors = ["bg-red-500", "bg-orange-500", "bg-red-600", "bg-emerald-500", "bg-red-700", "bg-red-400"];
                return breakdown.map((c: any, i: number) => {
                  const pct = total > 0 ? Math.round((Number(c.count) / total) * 100) : 0;
                  return (
                    <div key={c.cuisine} data-testid={`cuisine-breakdown-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{c.cuisine}</span>
                        <span className="text-gray-400 text-[11px] font-medium">{c.count} · {pct}%</span>
                      </div>
                      <ProgressBar value={Number(c.count)} max={total} color={colors[i % colors.length]} delay={i * 80} />
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="bg-white dark:bg-[#141417] rounded-2xl border border-gray-100/80 dark:border-gray-800/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/30 flex items-center gap-2">
              <div className="w-7 h-7 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-center">
                <Store size={13} className="text-red-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t.admin.ordersByCategory}</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/30">
              {(stats?.cuisineOrders || []).length === 0 ? (
                <div className="text-center py-14 text-gray-300 dark:text-gray-700">
                  <Package size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{t.admin.noOrdersByCategory}</p>
                </div>
              ) : (stats?.cuisineOrders || []).map((c: any) => (
                <div key={c.cuisine}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                  data-testid={`cuisine-orders-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
                      <CircleDot size={11} className="text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[13px] text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{c.cuisine}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.orderCount} commande{Number(c.orderCount) > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-[13px] text-red-600">{formatPrice(Number(c.revenue))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
