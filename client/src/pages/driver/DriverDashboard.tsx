import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { DSkeletonCard, DBtn } from "../../components/driver/DriverUI";
import {
  Power, MapPin, Navigation, AlertCircle, ChevronRight,
  Package, CheckCircle2, DollarSign, Clock, Zap, Wifi, WifiOff, TrendingUp,
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Order } from "@shared/schema";
import AlarmOverlay from "../../components/driver/dashboard/AlarmOverlay";
import ActiveMissionCard from "../../components/driver/dashboard/ActiveMissionCard";
import PendingOrderCard from "../../components/driver/dashboard/PendingOrderCard";
import DriverLiveMap from "../../components/driver/dashboard/DriverLiveMap";
import { useDriverStatus } from "../../hooks/use-driver-status";

const stats = [
  { icon: Package,      label: "En cours",  key: "en-cours",  iconBg: "bg-driver-blue/10",  tc: "text-driver-blue"  },
  { icon: CheckCircle2, label: "Livrées",   key: "livrees",   iconBg: "bg-driver-green/10", tc: "text-driver-green" },
  { icon: DollarSign,   label: "Gains",     key: "gains",     iconBg: "bg-driver-amber/10", tc: "text-driver-amber" },
];

export default function DriverDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const {
    isOnline, gpsActive, showMap, setShowMap,
    driverPos, alarm, setAlarm,
    toggleOnline, updateStatus,
  } = useDriverStatus();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const { data: pendingOrders = [], isLoading: loadingPending } = useQuery<Order[]>({
    queryKey: ["/api/orders", "ready"],
    queryFn: () => authFetchJson("/api/orders?status=ready"),
    refetchInterval: 5000,
  });

  const { data: myOrders = [], isLoading: loadingMine } = useQuery<Order[]>({
    queryKey: ["/api/orders", "driver", user?.id],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const activeOrders      = myOrders.filter(o => !["delivered", "cancelled"].includes(o.status));
  const deliveredToday    = myOrders.filter(o => o.status === "delivered");
  const todayEarnings     = deliveredToday.reduce((s, o) => s + o.deliveryFee, 0);
  const lateOrders        = activeOrders.filter(o => o.estimatedDelivery && new Date(o.estimatedDelivery).getTime() < Date.now());
  const availablePending  = pendingOrders.filter(o => !o.driverId);
  const primaryActive     = activeOrders[0] ?? null;
  const isLoading         = loadingPending || loadingMine;

  const statValues = [activeOrders.length, deliveredToday.length, formatPrice(todayEarnings)];

  return (
    <div className="min-h-screen pb-28 bg-driver-bg">
      {alarm && <AlarmOverlay reason={alarm} onDismiss={() => setAlarm(null)} />}
      <DriverNav />

      <div className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-4">

        {/* ── Hero / Greeting ─────────────────────────────────────── */}
        <div className="rounded-3xl p-5 relative overflow-hidden bg-[linear-gradient(135deg,#fff0f0_0%,#ffe4e4_60%,#f8f8f8_100%)] dark:bg-[linear-gradient(135deg,#1a0000_0%,#220000_60%,#1a1a1a_100%)] border border-driver-accent/20 shadow-[0_8px_32px_rgba(225,0,0,0.1)]">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-10 bg-driver-accent" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold mb-0.5 text-driver-subtle">{greeting},</p>
              <h2 className="text-2xl font-black text-driver-text">{user?.name?.split(" ")[0]} 👋</h2>
              <p className="text-xs mt-1.5 text-driver-muted">
                {isOnline
                  ? activeOrders.length > 0
                    ? `${activeOrders.length} mission${activeOrders.length > 1 ? "s" : ""} en cours`
                    : availablePending.length > 0
                    ? `${availablePending.length} commande${availablePending.length > 1 ? "s" : ""} disponible${availablePending.length > 1 ? "s" : ""}`
                    : "En attente de commandes..."
                  : "Activez votre service pour commencer"}
              </p>
            </div>
            <button
              onClick={toggleOnline}
              data-testid="toggle-online"
              className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 ${
                isOnline ? "bg-driver-green text-black shadow-glow-green" : "bg-driver-s2 text-driver-muted"
              }`}
            >
              <Power size={20} className={isOnline ? "animate-pulse" : ""} />
              {isOnline ? "En ligne" : "Hors ligne"}
            </button>
          </div>

          {isOnline && (
            <div className="relative mt-4 flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2 h-2 rounded-full absolute bg-driver-green animate-ping" />
                <div className="w-2 h-2 rounded-full bg-driver-green" />
              </div>
              <span className="text-xs font-semibold text-driver-green">Service actif</span>
              {gpsActive && (
                <span className="flex items-center gap-1 text-[10px] text-driver-subtle">
                  <Navigation size={11} /> GPS actif
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Late alert ──────────────────────────────────────────── */}
        {lateOrders.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl p-4 bg-driver-red/10 border border-driver-red/25 animate-pulse">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-driver-red/15">
              <AlertCircle size={18} className="text-driver-red" />
            </div>
            <div>
              <p className="font-black text-sm text-driver-red">Retard détecté !</p>
              <p className="text-xs mt-0.5 text-driver-muted">
                {lateOrders.length} livraison{lateOrders.length > 1 ? "s" : ""} en retard. Accélérez svp.
              </p>
            </div>
          </div>
        )}

        {/* ── Today Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div
              key={s.key}
              className="rounded-2xl p-4 flex flex-col items-center text-center bg-driver-surface border border-driver-border"
              data-testid={`driver-stat-${s.label.toLowerCase()}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.iconBg}`}>
                <s.icon size={16} className={s.tc} />
              </div>
              <p className="text-base font-black text-driver-text">{statValues[i]}</p>
              <p className="text-[10px] font-semibold mt-0.5 text-driver-subtle">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── GPS / Map ───────────────────────────────────────────── */}
        {isOnline && (
          <div>
            <button
              onClick={() => setShowMap(m => !m)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:opacity-80 border ${
                gpsActive
                  ? "bg-driver-green/8 border-driver-green/20"
                  : "bg-driver-amber/8 border-driver-amber/20"
              }`}
              data-testid="toggle-map"
            >
              {gpsActive
                ? <Wifi size={16} className="text-driver-green" />
                : <WifiOff size={16} className="text-driver-amber" />}
              <span className={`text-xs font-semibold flex-1 text-left ${gpsActive ? "text-driver-green" : "text-driver-amber"}`}>
                {gpsActive ? "GPS actif — Position partagée toutes les 15s" : "GPS inactif — Activez la localisation"}
              </span>
              <Navigation size={13} className="text-driver-subtle" />
            </button>
            {showMap && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-driver-border">
                <DriverLiveMap lat={driverPos?.lat ?? null} lng={driverPos?.lng ?? null} orders={activeOrders} />
                <div className="px-4 py-2.5 flex items-center gap-4 text-[10px] bg-driver-surface text-driver-subtle">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-driver-accent" /> Vous</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-driver-blue" /> Livraisons</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── OFFLINE state ───────────────────────────────────────── */}
        {!isOnline && (
          <div className="rounded-3xl p-10 flex flex-col items-center text-center bg-driver-surface border border-driver-border">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-driver-s2">
              <Power size={32} className="text-driver-subtle" />
            </div>
            <p className="font-black text-xl text-driver-text mb-2">Vous êtes hors ligne</p>
            <p className="text-sm mb-8 max-w-xs leading-relaxed text-driver-muted">
              Passez en ligne pour recevoir des commandes et commencer à livrer
            </p>
            <DBtn label="Passer en ligne" icon={Zap} variant="accept" size="lg" onClick={toggleOnline} testId="go-online" />
          </div>
        )}

        {/* ── Active Mission ──────────────────────────────────────── */}
        {isOnline && isLoading && <DSkeletonCard />}

        {isOnline && !isLoading && primaryActive && (
          <div>
            <ActiveMissionCard
              order={primaryActive}
              onAction={(status) => updateStatus(primaryActive.id, status)}
            />
            {activeOrders.length > 1 && (
              <button
                onClick={() => navigate("/driver/orders")}
                className="w-full flex items-center justify-center gap-1.5 py-3 mt-2 rounded-xl text-xs font-semibold transition-all active:opacity-70 text-driver-muted"
              >
                +{activeOrders.length - 1} autre{activeOrders.length - 1 > 1 ? "s" : ""} livraison{activeOrders.length - 1 > 1 ? "s" : ""} en cours
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Available Orders Queue ──────────────────────────────── */}
        {isOnline && availablePending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full absolute bg-driver-amber animate-ping" />
                <div className="w-2.5 h-2.5 rounded-full bg-driver-amber" />
              </div>
              <p className="font-black text-sm text-driver-text ml-1">Commandes disponibles</p>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full ml-auto bg-driver-amber/20 text-driver-amber">
                {availablePending.length}
              </span>
            </div>
            <div className="space-y-3">
              {availablePending.slice(0, 5).map(order => (
                <PendingOrderCard key={order.id} order={order} />
              ))}
              {availablePending.length > 5 && (
                <button
                  onClick={() => navigate("/driver/orders")}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all active:opacity-70 bg-driver-surface text-driver-muted border border-driver-border"
                >
                  Voir {availablePending.length - 5} de plus
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Waiting state ─────────────────────────────────────────────── */}
        {isOnline && !isLoading && activeOrders.length === 0 && availablePending.length === 0 && (
          <div className="rounded-3xl p-8 flex flex-col items-center text-center bg-driver-surface border border-driver-border">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-driver-green/12">
              <Clock size={28} className="text-driver-green" />
            </div>
            <p className="font-black text-lg text-driver-text mb-2">En attente de commandes</p>
            <p className="text-sm text-driver-muted">Vous serez notifié dès qu'une commande est disponible</p>
          </div>
        )}

        {/* ── Quick link to earnings ─────────────────────────────── */}
        {deliveredToday.length > 0 && (
          <button
            onClick={() => navigate("/driver/earnings")}
            className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all active:opacity-80 bg-driver-green/[0.06] border border-driver-green/15"
            data-testid="button-view-earnings"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-driver-green/15">
              <TrendingUp size={18} className="text-driver-green" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-driver-text">Gains du jour</p>
              <p className="text-xs text-driver-muted">{deliveredToday.length} livraisons effectuées</p>
            </div>
            <span className="text-lg font-black text-driver-green">{formatPrice(todayEarnings)}</span>
            <ChevronRight size={16} className="text-driver-subtle" />
          </button>
        )}
      </div>
    </div>
  );
}
