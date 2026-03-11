import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetch } from "../lib/queryClient";
import { Home, ShoppingBag, ClipboardList, Wallet, Settings, LogOut, LogIn, MessageCircle, Briefcase } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import { useI18n } from "../lib/i18n";

export default function ClientNav() {
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const { data: unreadChatCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
    enabled: !!user,
    refetchInterval: 10000,
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "chat_message" || data.type === "notification") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    });
  }, []);

  const unreadMsgCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);

  const links = user
    ? [
        { path: "/", icon: Home, label: t.client.home, badge: 0 },
        { path: "/cart", icon: ShoppingBag, label: t.client.cart, badge: itemCount },
        { path: "/orders", icon: ClipboardList, label: t.client.myOrders, badge: 0 },
        { path: "/services", icon: Briefcase, label: t.client.services, badge: 0 },
        { path: "/settings", icon: Settings, label: t.common.settings, badge: 0 },
      ]
    : [
        { path: "/", icon: Home, label: t.client.home, badge: 0 },
        { path: "/cart", icon: ShoppingBag, label: t.client.cart, badge: itemCount },
      ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="MAWEJA" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">MAWEJA</h1>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">Kinshasa, RDC</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {unreadMsgCount > 0 && (
                  <div className="relative">
                    <MessageCircle size={18} className="text-gray-400" />
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-bold min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center" data-testid="badge-unread-messages">
                      {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-500 font-medium" data-testid="text-username">{user.name?.split(" ")[0]}</span>
                <button
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  data-testid="button-logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-700 transition-all" data-testid="button-login">
                <LogIn size={14} />
                {t.common.login}
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
        <div className="max-w-lg mx-auto flex">
          {links.map((l) => {
            const isActive = location === l.path;
            return (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                data-testid={`nav-${l.path.replace(/\//g, "") || "home"}`}
                className={`flex-1 flex flex-col items-center py-2.5 relative transition-colors ${isActive ? "text-red-600" : "text-gray-400"}`}
              >
                <div className="relative">
                  <l.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  {l.badge > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[9px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center" data-testid={`badge-${l.path.replace(/\//g, "") || "home"}`}>
                      {l.badge > 99 ? "99+" : l.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-1">{l.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
