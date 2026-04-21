/**
 * ClientNav — Navigation principale de l'app client MAWEJA
 *
 * Composants internes :
 *  - NavBadge           : pastille de compteur
 *  - NavIconBtn         : bouton icône + badge
 *  - AddressPill        : sélecteur d'adresse
 *  - CompactSearchTrigger : barre de recherche compacte (mode scroll)
 *  - AddressChangeSheet : bottom-sheet de confirmation d'adresse
 *  - NavIcon            : icône SVG du tab de navigation
 *  - BottomNavItem      : item de la barre de navigation basse
 */

import { type ReactNode, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetchJson, queryClient } from "../lib/queryClient";
import { Bell, ShoppingBag, MapPin, Search, ChevronRight, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { onWSMessage } from "../lib/websocket";
import { handleWSEvent, playNotifSound } from "../lib/notify";
import SearchOverlay from "./SearchOverlay";
import type { Notification as Notif } from "@shared/schema";

// Lazy-load the address picker so Leaflet (a heavy library) is not bundled
// into the initial client chunk — it only loads when the modal is first opened.
const AddressPickerModal = lazy(() => import("./AddressPickerModal"));

const LOGO     = "/maweja-logo-red.png";
const KEY_ADDR = "maweja_delivery_address";
const BRAND    = "#E10000";
const MUTED    = "#A8A8A8";

/* ── Utilities ─────────────────────────────────────────────────────────── */
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ══════════════════════════════════════════════════════════════════════════
 * NavBadge — pastille rouge avec compteur
 * ══════════════════════════════════════════════════════════════════════════ */
function NavBadge({ count, testId }: { count: number; testId?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#E10000] text-white font-black pointer-events-none select-none"
      style={{ fontSize: 7.5, letterSpacing: 0, boxShadow: "0 1px 5px rgba(225,0,0,0.45)" }}
      data-testid={testId}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * NavIconBtn — bouton icône circulaire avec badge optionnel
 * ══════════════════════════════════════════════════════════════════════════ */
interface NavIconBtnProps {
  icon: ReactNode;
  badge?: number;
  onClick: () => void;
  testId?: string;
  badgeTestId?: string;
  /** Adapte le hover pour fond sombre (header rouge scrollé) */
  onDark?: boolean;
}

function NavIconBtn({ icon, badge = 0, onClick, testId, badgeTestId, onDark }: NavIconBtnProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "relative w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full",
        "active:scale-[0.85] transition-transform duration-150",
        onDark ? "hover:bg-white/15 active:bg-white/20" : "hover:bg-black/5 dark:hover:bg-white/8 active:bg-black/8",
      )}
    >
      {icon}
      <NavBadge count={badge} testId={badgeTestId} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * AddressPill — sélecteur d'adresse de livraison
 * ══════════════════════════════════════════════════════════════════════════ */
function AddressPill({
  address,
  onClick,
  onDark = false,
}: {
  address: string;
  onClick: () => void;
  onDark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      data-testid="button-address-pill"
      className={cn(
        "flex-1 flex items-center gap-1.5 rounded-[13px] px-2.5 py-2 text-left min-w-0",
        "active:scale-[0.97] transition-transform duration-150",
        onDark
          ? "bg-white/[0.13] border border-white/[0.18]"
          : "bg-black/[0.04] dark:bg-white/[0.07] border border-transparent dark:border-white/[0.06]",
      )}
    >
      <MapPin
        size={12}
        className="flex-shrink-0"
        color={onDark ? "rgba(255,255,255,0.80)" : BRAND}
      />

      <div className="flex-1 min-w-0">
        {address ? (
          <span className={cn(
            "block truncate font-semibold leading-none",
            onDark ? "text-white/88" : "text-gray-800 dark:text-white/85",
          )} style={{ fontSize: 12 }}>
            {address}
          </span>
        ) : (
          <span className={cn(
            "block truncate leading-none",
            onDark ? "text-white/38" : "text-gray-400 dark:text-white/30",
          )} style={{ fontSize: 12 }}>
            Entrez votre adresse…
          </span>
        )}
      </div>

      <ChevronDown
        size={11}
        className={cn(
          "flex-shrink-0 transition-transform",
          onDark ? "text-white/45" : "text-gray-400 dark:text-gray-600",
        )}
      />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * CompactSearchTrigger — barre de recherche compacte (visible quand scrollé)
 * ══════════════════════════════════════════════════════════════════════════ */
function CompactSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid="button-open-search"
      className="flex-1 flex items-center gap-2.5 h-9 px-3.5 rounded-[13px] active:scale-[0.97] transition-transform duration-150"
      style={{
        background: "rgba(255,255,255,0.13)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <Search size={13} color="rgba(255,255,255,0.72)" className="flex-shrink-0" />
      <span
        className="text-left text-white/55 flex-1 font-medium truncate"
        style={{ fontSize: 13 }}
      >
        Plat, restaurant, service…
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * AddressChangeSheet — confirmation de changement d'adresse
 * ══════════════════════════════════════════════════════════════════════════ */
function AddressChangeSheet({
  address,
  onKeep,
  onChange,
}: {
  address: string;
  onKeep: () => void;
  onChange: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(10px)" }}
      onClick={onKeep}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-t-[28px] sm:rounded-[24px] px-5 pt-3 pb-6"
        style={{ boxShadow: "0 -16px 56px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-5">
          <div className="w-9 h-[3px] bg-gray-200 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Adresse actuelle */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
            <MapPin size={17} color={BRAND} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-black text-gray-900 dark:text-white text-sm mb-1"
              style={{ letterSpacing: "-0.2px" }}
            >
              Adresse de livraison
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
              {address}
            </p>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-5" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
          Voulez-vous modifier votre adresse de livraison ?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onKeep}
            data-testid="button-keep-address"
            className="flex-1 py-3.5 rounded-[15px] font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 active:scale-[0.97] transition-transform duration-150"
          >
            Garder
          </button>
          <button
            onClick={onChange}
            data-testid="button-change-address"
            className="flex-1 py-3.5 rounded-[15px] font-bold text-sm text-white flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform duration-150"
            style={{ background: BRAND, boxShadow: "0 4px 18px rgba(225,0,0,0.30)" }}
          >
            Modifier <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * NavIcon — icône SVG du tab (home / orders / profile)
 * ══════════════════════════════════════════════════════════════════════════ */
function NavIcon({ navKey, isActive }: { navKey: string; isActive: boolean }) {
  const stroke = isActive ? BRAND : MUTED;
  const fill   = isActive ? BRAND : "none";

  switch (navKey) {
    case "home":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" fill="none" stroke={isActive ? "white" : stroke} strokeWidth="1.8" />
        </svg>
      );
    case "orders":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="2" width="18" height="20" rx="3" />
          <path d="M7 7h10M7 11h7M7 15h5" fill="none" stroke={isActive ? "white" : stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill={fill} stroke={isActive ? "transparent" : stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke={isActive ? "white" : stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * BottomNavItem — item de la barre de navigation basse
 * ══════════════════════════════════════════════════════════════════════════ */
function BottomNavItem({
  path,
  navKey,
  label,
  badge = 0,
  isActive,
  onClick,
}: {
  path: string;
  navKey: string;
  label: string;
  badge?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const testBase = path.replace(/\//g, "") || "home";
  return (
    <button
      onClick={onClick}
      data-testid={`nav-${testBase}`}
      className="relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-1.5 active:scale-90 transition-transform duration-150 min-h-[52px]"
    >
      {/* Pill indicateur autour de l'icône */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-200",
          isActive
            ? "bg-red-50 dark:bg-red-950/40 w-12 h-7"
            : "w-7 h-7",
        )}
      >
        <NavIcon navKey={navKey} isActive={isActive} />
        {badge > 0 && (
          <span
            className="absolute -top-1 -right-0.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#E10000] text-white font-black"
            style={{ fontSize: 7.5, boxShadow: "0 1px 4px rgba(225,0,0,0.4)" }}
            data-testid={`badge-${testBase}`}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>

      <span
        className={cn(
          "transition-colors duration-200 leading-none",
          isActive ? "font-bold text-[#E10000]" : "font-medium text-[#A8A8A8]",
        )}
        style={{ fontSize: 10, letterSpacing: "0.01em" }}
      >
        {label}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * ClientNav — composant principal exporté
 * ══════════════════════════════════════════════════════════════════════════ */
export default function ClientNav() {
  const [location, navigate]       = useLocation();
  const { itemCount }              = useCart();
  const { user }                   = useAuth();

  const [scrolled, setScrolled]                   = useState(false);
  const [searchOpen, setSearchOpen]               = useState(false);
  const [sessionAddress, setSessionAddress]       = useState<string>(
    () => sessionStorage.getItem(KEY_ADDR) || "",
  );
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Sync address depuis le profil */
  useEffect(() => {
    if (!sessionAddress && user?.address) {
      setSessionAddress(user.address);
      sessionStorage.setItem(KEY_ADDR, user.address);
    }
  }, [user]);

  /* Notifications */
  const { data: notifications = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
    enabled: !!user,
    refetchInterval: 20_000,
  });

  /* WebSocket */
  useEffect(() => {
    return onWSMessage(data => {
      const orderEvents = ["chat_message", "notification", "order_status", "order_updated", "order_assigned", "order_cancelled"];
      if (orderEvents.includes(data.type)) {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      if (data.type === "service_update") {
        queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        playNotifSound();
      }
      handleWSEvent(data);
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;

  /* Navigation protégée */
  const handleProtectedNav = (path: string) => {
    const protected_ = ["/orders", "/settings", "/notifications", "/addresses", "/wallet"];
    if (!user && protected_.includes(path)) navigate("/login");
    else navigate(path);
  };

  /* Gestion adresse */
  const handleAddressClick = () =>
    sessionAddress ? setShowChangeConfirm(true) : setShowAddressPicker(true);

  const handleAddressConfirmed = (addr: string) => {
    setSessionAddress(addr);
    sessionStorage.setItem(KEY_ADDR, addr);
    setShowAddressPicker(false);
  };

  const navItems = [
    { path: "/",         key: "home",    label: "Accueil" },
    { path: "/orders",   key: "orders",  label: "Commandes", badge: unreadCount },
    { path: "/settings", key: "profile", label: "Profil" },
  ];

  /* ── Styles du header dépendant du scroll ── */
  const headerBg  = scrolled ? BRAND : undefined;
  const headerShadow = scrolled
    ? "0 4px 28px rgba(225,0,0,0.22)"
    : "0 1px 0 rgba(0,0,0,0.05)";

  const layerStyle = (visible: boolean) => ({
    opacity:        visible ? 1 : 0,
    transform:      visible ? "translateY(0) scale(1)" : `translateY(${visible ? 0 : -6}px) scale(0.97)`,
    pointerEvents:  (visible ? "auto" : "none") as "auto" | "none",
    transition:     "opacity 0.20s ease, transform 0.20s ease",
  });

  return (
    <>
      {/* Overlays */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      {showAddressPicker && (
        <Suspense fallback={null}>
          <AddressPickerModal
            initialAddress={sessionAddress}
            onConfirm={handleAddressConfirmed}
            onClose={() => setShowAddressPicker(false)}
          />
        </Suspense>
      )}

      {showChangeConfirm && (
        <AddressChangeSheet
          address={sessionAddress}
          onKeep={() => setShowChangeConfirm(false)}
          onChange={() => { setShowChangeConfirm(false); setShowAddressPicker(true); }}
        />
      )}

      {/* ─── Header sticky ──────────────────────────────────────────── */}
      <header
        className={cn(
          "sticky top-0 z-50",
          scrolled ? "" : "bg-white dark:bg-[#0a0a0a]",
        )}
        style={{
          background:  headerBg,
          boxShadow:   headerShadow,
          transition:  "background 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s cubic-bezier(0.4,0,0.2,1)",
          height:      56,
        }}
      >
        <div className="max-w-lg mx-auto px-4 relative h-full">

          {/* ── État normal (non scrollé) ── */}
          <div
            className="absolute inset-x-0 top-0 bottom-0 px-4 flex items-center gap-2"
            style={layerStyle(!scrolled)}
          >
            <div className="flex-shrink-0 w-8 h-8">
              <img src={LOGO} alt="MAWEJA" className="w-full h-full object-contain" />
            </div>

            <AddressPill address={sessionAddress} onClick={handleAddressClick} />

            <NavIconBtn
              icon={<Bell size={20} color={BRAND} strokeWidth={1.8} />}
              badge={unreadCount}
              badgeTestId="badge-notif"
              onClick={() => handleProtectedNav("/notifications")}
              testId="button-notifications-header"
            />
            <NavIconBtn
              icon={<ShoppingBag size={20} color={BRAND} strokeWidth={1.8} />}
              badge={itemCount}
              badgeTestId="badge-cart-header"
              onClick={() => navigate("/cart")}
              testId="button-cart-header"
            />
          </div>

          {/* ── État scrollé (fond rouge + recherche compacte) ── */}
          <div
            className="absolute inset-x-0 top-0 bottom-0 px-4 flex items-center gap-2"
            style={layerStyle(scrolled)}
          >
            <CompactSearchTrigger onClick={() => setSearchOpen(true)} />
            <NavIconBtn
              icon={<Bell size={19} color="rgba(255,255,255,0.88)" strokeWidth={1.8} />}
              badge={unreadCount}
              badgeTestId="badge-notif-scrolled"
              onClick={() => handleProtectedNav("/notifications")}
              testId="button-notifications-scrolled"
              onDark
            />
            <NavIconBtn
              icon={<ShoppingBag size={19} color="rgba(255,255,255,0.88)" strokeWidth={1.8} />}
              badge={itemCount}
              badgeTestId="badge-cart-scrolled"
              onClick={() => navigate("/cart")}
              testId="button-cart-scrolled"
              onDark
            />
          </div>
        </div>
      </header>

      {/* ─── Bottom navigation ──────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0f0f0f] border-t border-black/[0.05] dark:border-white/[0.06]"
        style={{
          boxShadow:   "0 -4px 20px rgba(0,0,0,0.055)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-lg mx-auto flex items-stretch">
          {navItems.map(item => {
            const isActive =
              location === item.path ||
              (item.path !== "/" && location.startsWith(item.path));

            return (
              <BottomNavItem
                key={item.path}
                path={item.path}
                navKey={item.key}
                label={item.label}
                badge={item.badge ?? 0}
                isActive={isActive}
                onClick={() => handleProtectedNav(item.path)}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}
