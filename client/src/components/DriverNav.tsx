import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { Home, Package, DollarSign, LogOut, Power, MessageCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "../lib/queryClient";

export default function DriverNav() {
  const [location, navigate] = useLocation();
  const { user, logout, setUser } = useAuth();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await apiRequest(`/api/drivers/${user?.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isOnline: newStatus }),
    });
    if (user) setUser({ ...user, isOnline: newStatus });
  };

  const links = [
    { path: "/", icon: Home, label: "Accueil" },
    { path: "/driver/orders", icon: Package, label: "Livraisons" },
    { path: "/driver/chat", icon: MessageCircle, label: "Messages" },
    { path: "/driver/earnings", icon: DollarSign, label: "Revenus" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">MAWEJA</h1>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">Espace Livreur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnline}
              data-testid="button-toggle-online"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              <Power size={12} />
              {isOnline ? "En ligne" : "Hors ligne"}
            </button>
            <button onClick={logout} className="text-gray-400 hover:text-red-600" data-testid="button-logout">
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
                data-testid={`driver-nav-${l.label.toLowerCase()}`}
                className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${isActive ? "text-red-600" : "text-gray-400"}`}
              >
                <l.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold mt-1">{l.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
