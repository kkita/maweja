import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { Home, ShoppingBag, ClipboardList, Wallet, User, LogOut } from "lucide-react";

export default function ClientNav() {
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();

  const links = [
    { path: "/", icon: Home, label: "Accueil" },
    { path: "/cart", icon: ShoppingBag, label: "Panier", badge: itemCount },
    { path: "/orders", icon: ClipboardList, label: "Commandes" },
    { path: "/wallet", icon: Wallet, label: "Wallet" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">MAWEJA</h1>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">Kinshasa, RDC</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium" data-testid="text-username">{user?.name?.split(" ")[0]}</span>
            <button onClick={logout} className="text-gray-400 hover:text-red-600 transition-colors" data-testid="button-logout">
              <LogOut size={18} />
            </button>
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
                data-testid={`nav-${l.label.toLowerCase()}`}
                className={`flex-1 flex flex-col items-center py-2.5 relative transition-colors ${isActive ? "text-red-600" : "text-gray-400"}`}
              >
                <div className="relative">
                  <l.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  {l.badge ? (
                    <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center" data-testid={`badge-${l.label.toLowerCase()}`}>
                      {l.badge}
                    </span>
                  ) : null}
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
