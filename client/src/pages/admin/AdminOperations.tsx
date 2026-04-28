import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "../../components/AdminLayout";
import {
  SectionCard, EmptyState, LiveDot, AdminBadge, SkeletonRows,
} from "../../components/admin/AdminUI";
import { STALE } from "../../lib/queryClient";
import { formatPrice } from "../../lib/utils";
import {
  Activity, AlertTriangle, Truck, LifeBuoy, RefreshCw, MapPin, Clock,
  PackageX, UserX, Hourglass, ShieldAlert, ChevronRight, Filter,
  Star, Store, Users, Timer, Ban, ShoppingBag, CheckCircle2,
} from "lucide-react";

type LiveBlock = {
  activeOrders: number;
  lateOrders: number;
  driversOnline: number;
  driversBusy: number;
  driversOffline: number;
  openSupportTickets: number;
  pendingRefunds: number;
  activeZones: number;
  criticalAlerts: number;
};

type KPIBlock = {
  todayOrders: number;
  inProgressOrders: number;
  avgDeliveryMinutes: number | null;
  cancelRate: number;
  avgDriverRating: number | null;
  avgRestaurantRating: number | null;
  openTickets: number;
};

type UrgentBlock = {
  noDriver: Array<{
    id: number; orderNumber: string; status: string; createdAt: string | null;
    minutesWaiting: number; restaurantId: number; restaurantName: string;
    deliveryZone: string | null; total: number;
  }>;
  blocked: Array<{
    id: number; orderNumber: string; createdAt: string | null;
    minutesBlocked: number; restaurantId: number; restaurantName: string;
  }>;
  waitingClients: Array<{
    id: number; orderNumber: string; status: string; minutesWaiting: number;
    driverId: number | null; driverName: string | null;
  }>;
  urgentSupport: Array<{
    id: number; orderId: number; subject: string | null; message: string | null;
    createdAt: string | null; minutesOpen: number; userId: number; userName: string;
  }>;
  refundsToValidate: Array<{
    id: number; orderNumber: string; total: number; paymentMethod: string;
    paymentStatus: string; cancelReason: string | null; clientId: number;
    clientName: string;
  }>;
};

type FiltersMeta = {
  zones: string[];
  statuses: string[];
  drivers: Array<{ id: number; name: string; isOnline: boolean }>;
  restaurants: Array<{ id: number; name: string; isActive: boolean }>;
};

type OperationsResponse = {
  period: "today" | "7d";
  appliedFilters: {
    zone: string | null; status: string | null;
    driverId: number | null; restaurantId: number | null;
  };
  live: LiveBlock;
  kpis: KPIBlock;
  urgent: UrgentBlock;
  filters: FiltersMeta;
  thresholds: {
    noDriverMinutes: number; blockedPendingMinutes: number;
    waitingClientMinutes: number; urgentTicketMinutes: number;
  };
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée", preparing: "Préparation",
  ready: "Prête", picked_up: "Récupérée", delivered: "Livrée",
  cancelled: "Annulée", returned: "Retournée",
};

/* ─── Tone helpers ─────────────────────────────────────────────────────────── */
const toneStyles: Record<string, { bg: string; ring: string; iconBg: string; icon: string; value: string; label: string }> = {
  rose:    { bg: "bg-rose-50 dark:bg-rose-950/25",       ring: "border-rose-100 dark:border-rose-900/40",       iconBg: "bg-rose-100 dark:bg-rose-900/40",       icon: "text-rose-600 dark:text-rose-300",       value: "text-rose-900 dark:text-rose-50",       label: "text-rose-700 dark:text-rose-300" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/25", ring: "border-emerald-100 dark:border-emerald-900/40", iconBg: "bg-emerald-100 dark:bg-emerald-900/40", icon: "text-emerald-600 dark:text-emerald-300", value: "text-emerald-900 dark:text-emerald-50", label: "text-emerald-700 dark:text-emerald-300" },
  sky:     { bg: "bg-sky-50 dark:bg-sky-950/25",         ring: "border-sky-100 dark:border-sky-900/40",         iconBg: "bg-sky-100 dark:bg-sky-900/40",         icon: "text-sky-600 dark:text-sky-300",         value: "text-sky-900 dark:text-sky-50",         label: "text-sky-700 dark:text-sky-300" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/25",   ring: "border-violet-100 dark:border-violet-900/40",   iconBg: "bg-violet-100 dark:bg-violet-900/40",   icon: "text-violet-600 dark:text-violet-300",   value: "text-violet-900 dark:text-violet-50",   label: "text-violet-700 dark:text-violet-300" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/25",     ring: "border-amber-100 dark:border-amber-900/40",     iconBg: "bg-amber-100 dark:bg-amber-900/40",     icon: "text-amber-600 dark:text-amber-300",     value: "text-amber-900 dark:text-amber-50",     label: "text-amber-700 dark:text-amber-300" },
  zinc:    { bg: "bg-zinc-50 dark:bg-zinc-900/40",       ring: "border-zinc-200 dark:border-zinc-800",          iconBg: "bg-zinc-100 dark:bg-zinc-800",          icon: "text-zinc-600 dark:text-zinc-300",       value: "text-zinc-900 dark:text-zinc-50",       label: "text-zinc-600 dark:text-zinc-300" },
};

function StatTile({
  tone, label, value, sub, icon: Icon, testId, onClick,
}: {
  tone: keyof typeof toneStyles; label: string; value: string | number;
  sub?: string; icon: any; testId?: string; onClick?: () => void;
}) {
  const t = toneStyles[tone];
  const Cmp: any = onClick ? "button" : "div";
  return (
    <Cmp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      data-testid={testId}
      className={`text-left w-full rounded-2xl border ${t.bg} ${t.ring} p-4 transition-all ${onClick ? "hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99]" : ""}`}
    >
      <div className="flex items-start justify-between mb-2.5">
        <span className={`text-[11px] font-semibold uppercase tracking-wide leading-tight ${t.label}`}>{label}</span>
        <div className={`w-8 h-8 rounded-xl ${t.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className={t.icon} />
        </div>
      </div>
      <p className={`font-black tracking-tight ${t.value}`} style={{ fontSize: 22 }}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">{sub}</p>}
    </Cmp>
  );
}

function FilterChip({
  label, icon: Icon, value, onChange, options, testId,
}: {
  label: string; icon: any; value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  testId: string;
}) {
  return (
    <label className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-[12px] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <Icon size={13} className="text-zinc-400" />
      <span className="font-semibold text-zinc-500 dark:text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="bg-transparent text-zinc-900 dark:text-zinc-100 font-medium outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function AdminOperations() {
  const [, navigate] = useLocation();

  const [period, setPeriod] = useState<"today" | "7d">("today");
  const [zone, setZone] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string>("");

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("period", period);
    if (zone) p.set("zone", zone);
    if (status) p.set("status", status);
    if (driverId) p.set("driverId", driverId);
    if (restaurantId) p.set("restaurantId", restaurantId);
    return p.toString();
  }, [period, zone, status, driverId, restaurantId]);

  const url = `/api/admin/operations?${queryParams}`;
  const { data, isLoading, isFetching, refetch } = useQuery<OperationsResponse>({
    queryKey: [url],
    staleTime: STALE.dynamic,
    refetchInterval: 30_000,
  });

  const live = data?.live;
  const kpis = data?.kpis;
  const urgent = data?.urgent;
  const filters = data?.filters;

  const dateStr = new Date().toLocaleDateString("fr-CD", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const periodLabel = period === "today" ? "Aujourd'hui" : "7 derniers jours";
  const totalUrgent =
    (urgent?.noDriver.length ?? 0) +
    (urgent?.blocked.length ?? 0) +
    (urgent?.waitingClients.length ?? 0) +
    (urgent?.urgentSupport.length ?? 0) +
    (urgent?.refundsToValidate.length ?? 0);

  return (
    <AdminLayout title="Centre d'opérations">
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LiveDot />
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">En direct</span>
              <span className="text-zinc-300 dark:text-zinc-700 text-xs">·</span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{dateCapitalized}</span>
            </div>
            <h2 className="text-[22px] font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Centre d'opérations
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Tableau de pilotage temps réel · MAWEJA Kinshasa
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            data-testid="button-refresh-operations"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[12px] font-semibold text-zinc-700 dark:text-zinc-200 transition-all shadow-sm"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-0.5">
            {(["today", "7d"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                data-testid={`period-${p}`}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${period === p ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                {p === "today" ? "Aujourd'hui" : "7 jours"}
              </button>
            ))}
          </div>

          <FilterChip
            label="Zone"
            icon={MapPin}
            value={zone}
            onChange={setZone}
            testId="filter-zone"
            options={[
              { value: "", label: "Toutes" },
              ...(filters?.zones ?? []).map((z) => ({ value: z, label: z })),
            ]}
          />
          <FilterChip
            label="Statut"
            icon={Filter}
            value={status}
            onChange={setStatus}
            testId="filter-status"
            options={[
              { value: "", label: "Tous" },
              ...(filters?.statuses ?? []).map((s) => ({
                value: s, label: STATUS_LABELS[s] ?? s,
              })),
            ]}
          />
          <FilterChip
            label="Livreur"
            icon={Truck}
            value={driverId}
            onChange={setDriverId}
            testId="filter-driver"
            options={[
              { value: "", label: "Tous" },
              ...(filters?.drivers ?? []).map((d) => ({
                value: String(d.id),
                label: `${d.name}${d.isOnline ? " · en ligne" : ""}`,
              })),
            ]}
          />
          <FilterChip
            label="Restaurant"
            icon={Store}
            value={restaurantId}
            onChange={setRestaurantId}
            testId="filter-restaurant"
            options={[
              { value: "", label: "Tous" },
              ...(filters?.restaurants ?? []).map((r) => ({
                value: String(r.id), label: r.name,
              })),
            ]}
          />

          {(zone || status || driverId || restaurantId) && (
            <button
              type="button"
              onClick={() => { setZone(""); setStatus(""); setDriverId(""); setRestaurantId(""); }}
              data-testid="button-clear-filters"
              className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {/* ── Critical alerts banner ─────────────────────────────────────── */}
        {(live?.criticalAlerts ?? 0) > 0 && (
          <div
            data-testid="banner-critical-alerts"
            className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={15} className="text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[13px] text-rose-800 dark:text-rose-300">
                {live?.criticalAlerts} alerte{(live?.criticalAlerts ?? 0) > 1 ? "s" : ""} critique{(live?.criticalAlerts ?? 0) > 1 ? "s" : ""} en cours
              </p>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                Commandes en retard, sans livreur, bloquées, tickets urgents et remboursements à valider.
              </p>
            </div>
          </div>
        )}

        {/* ── LIVE OPERATIONS GRID ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-zinc-500" />
            <h3 className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
              Opérations en direct
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatTile tone="sky"     label="Commandes actives"   value={live?.activeOrders ?? "—"}     icon={ShoppingBag} testId="ops-active-orders"   onClick={() => navigate("/admin/orders")} />
            <StatTile tone="rose"    label="Commandes en retard" value={live?.lateOrders ?? "—"}        icon={Clock}        testId="ops-late-orders"     onClick={() => navigate("/admin/orders")} />
            <StatTile tone="emerald" label="Livreurs en ligne"   value={live?.driversOnline ?? "—"}    icon={Truck}        testId="ops-drivers-online"  onClick={() => navigate("/admin/drivers")} />
            <StatTile tone="amber"   label="Livreurs occupés"    value={live?.driversBusy ?? "—"}      icon={Activity}     testId="ops-drivers-busy"    onClick={() => navigate("/admin/drivers")} />
            <StatTile tone="zinc"    label="Livreurs hors ligne" value={live?.driversOffline ?? "—"}   icon={UserX}        testId="ops-drivers-offline" onClick={() => navigate("/admin/drivers")} />
            <StatTile tone="violet"  label="Tickets support"     value={live?.openSupportTickets ?? "—"} icon={LifeBuoy}    testId="ops-support-tickets" />
            <StatTile tone="amber"   label="Remboursements"      value={live?.pendingRefunds ?? "—"}    icon={RefreshCw}    testId="ops-pending-refunds" onClick={() => navigate("/admin/finance")} />
            <StatTile tone="emerald" label="Zones actives"       value={live?.activeZones ?? "—"}       icon={MapPin}       testId="ops-active-zones"    onClick={() => navigate("/admin/delivery-zones")} />
            <StatTile tone="rose"    label="Alertes critiques"   value={live?.criticalAlerts ?? "—"}    icon={AlertTriangle} testId="ops-critical-alerts" />
          </div>
        </div>

        {/* ── KPI GRID ───────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-zinc-500" />
            <h3 className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
              Indicateurs clés <span className="text-zinc-400 font-medium normal-case">· {periodLabel}</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <StatTile tone="rose"    label="Commandes aujourd'hui" value={kpis?.todayOrders ?? "—"}                                                              icon={ShoppingBag} testId="kpi-today-orders" />
            <StatTile tone="sky"     label="En cours"              value={kpis?.inProgressOrders ?? "—"}                                                          icon={Activity}    testId="kpi-in-progress" />
            <StatTile tone="emerald" label="Temps moyen livraison" value={kpis?.avgDeliveryMinutes != null ? `${kpis.avgDeliveryMinutes} min` : "—"}              icon={Timer}       testId="kpi-avg-delivery" />
            <StatTile tone="amber"   label="Taux d'annulation"     value={`${kpis?.cancelRate ?? 0}%`}                                                            icon={Ban}         testId="kpi-cancel-rate" />
            <StatTile tone="violet"  label="Note livreurs"         value={kpis?.avgDriverRating != null ? `${kpis.avgDriverRating} ★` : "—"}                     icon={Star}        testId="kpi-driver-rating" />
            <StatTile tone="violet"  label="Note restaurants"      value={kpis?.avgRestaurantRating != null ? `${kpis.avgRestaurantRating} ★` : "—"}             icon={Store}       testId="kpi-restaurant-rating" />
            <StatTile tone="rose"    label="Tickets ouverts"       value={kpis?.openTickets ?? "—"}                                                               icon={LifeBuoy}    testId="kpi-open-tickets" />
          </div>
        </div>

        {/* ── URGENT ACTIONS ─────────────────────────────────────────────── */}
        <SectionCard
          title="Actions urgentes"
          icon={AlertTriangle}
          count={totalUrgent}
          noPad
        >
          {isLoading ? (
            <div className="p-5"><SkeletonRows count={5} cols={3} /></div>
          ) : totalUrgent === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={CheckCircle2}
                title="Tout est sous contrôle"
                description="Aucune action urgente n'est requise pour le moment."
              />
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">

              {urgent?.noDriver.map((o) => (
                <UrgentRow
                  key={`nodriver-${o.id}`}
                  testId={`urgent-no-driver-${o.id}`}
                  icon={UserX} tone="rose"
                  title={`Commande sans livreur · ${o.orderNumber}`}
                  subtitle={`${o.restaurantName}${o.deliveryZone ? ` · ${o.deliveryZone}` : ""} · en attente depuis ${o.minutesWaiting} min`}
                  badge={`${formatPrice(o.total)}`}
                  onClick={() => navigate("/admin/orders")}
                />
              ))}

              {urgent?.blocked.map((o) => (
                <UrgentRow
                  key={`blocked-${o.id}`}
                  testId={`urgent-blocked-${o.id}`}
                  icon={Ban} tone="amber"
                  title={`Commande bloquée · ${o.orderNumber}`}
                  subtitle={`${o.restaurantName} · pending depuis ${o.minutesBlocked} min`}
                  onClick={() => navigate("/admin/orders")}
                />
              ))}

              {urgent?.waitingClients.map((o) => (
                <UrgentRow
                  key={`waiting-${o.id}`}
                  testId={`urgent-waiting-${o.id}`}
                  icon={Hourglass} tone="sky"
                  title={`Client en attente · ${o.orderNumber}`}
                  subtitle={`Statut ${STATUS_LABELS[o.status] ?? o.status}${o.driverName ? ` · ${o.driverName}` : ""} · ${o.minutesWaiting} min`}
                  onClick={() => navigate("/admin/orders")}
                />
              ))}

              {urgent?.urgentSupport.map((t) => (
                <UrgentRow
                  key={`support-${t.id}`}
                  testId={`urgent-support-${t.id}`}
                  icon={LifeBuoy} tone="violet"
                  title={`Ticket support urgent #${t.id}`}
                  subtitle={`${t.userName} · ouvert depuis ${t.minutesOpen} min${t.subject ? ` · ${t.subject}` : ""}`}
                  onClick={() => navigate("/admin/chat")}
                />
              ))}

              {urgent?.refundsToValidate.map((o) => (
                <UrgentRow
                  key={`refund-${o.id}`}
                  testId={`urgent-refund-${o.id}`}
                  icon={PackageX} tone="amber"
                  title={`Remboursement à valider · ${o.orderNumber}`}
                  subtitle={`${o.clientName} · ${o.paymentMethod}${o.cancelReason ? ` · ${o.cancelReason}` : ""}`}
                  badge={formatPrice(o.total)}
                  onClick={() => navigate("/admin/finance")}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Footer hint */}
        {data && (
          <p className="text-[11px] text-zinc-400 text-center">
            Mis à jour automatiquement toutes les 30 secondes ·
            seuils : sans livreur ≥ {data.thresholds.noDriverMinutes} min ·
            bloquée ≥ {data.thresholds.blockedPendingMinutes} min ·
            client ≥ {data.thresholds.waitingClientMinutes} min ·
            ticket ≥ {data.thresholds.urgentTicketMinutes} min
          </p>
        )}
      </div>
    </AdminLayout>
  );
}

/* ─── Urgent Row ───────────────────────────────────────────────────────────── */
function UrgentRow({
  icon: Icon, tone, title, subtitle, badge, onClick, testId,
}: {
  icon: any;
  tone: "rose" | "amber" | "sky" | "violet";
  title: string;
  subtitle: string;
  badge?: string;
  onClick?: () => void;
  testId?: string;
}) {
  const t = toneStyles[tone];
  const variantMap: Record<string, "red" | "amber" | "blue" | "purple"> = {
    rose: "red", amber: "amber", sky: "blue", violet: "purple",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="w-full px-5 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-left group"
    >
      <div className={`w-8 h-8 ${t.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className={t.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-600 transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{subtitle}</p>
      </div>
      {badge && (
        <AdminBadge variant={variantMap[tone]}>{badge}</AdminBadge>
      )}
      <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
    </button>
  );
}
