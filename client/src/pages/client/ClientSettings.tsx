import { useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import ClientNav from "../../components/ClientNav";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Globe, ChevronRight, Bell, Shield, HelpCircle, Info,
  MonitorSmartphone, Check, LogOut, User, Mail, Phone,
  Wallet, TrendingUp, ArrowRight, Star
} from "lucide-react";
import { ThemePicker } from "../../components/client/settings/SettingsUI";
import {
  NotificationsModal,
  PrivacyPolicyModal,
  ContactSupportModal,
  AboutModal,
} from "../../components/client/settings/SettingsModals";

type ModalType = "notifications" | "privacy" | "support" | "about";

export default function ClientSettings() {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useAuth();
  const [modal, setModal] = useState<ModalType | null>(null);

  const { data: walletData } = useQuery<{ balance: number; loyaltyPoints: number; transactions: any[] }>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0] || "").filter(Boolean).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-display-light dark:bg-display-page-alt pb-28">
      <ClientNav />

      {modal === "notifications" && <NotificationsModal onClose={() => setModal(null)} />}
      {modal === "privacy"       && <PrivacyPolicyModal onClose={() => setModal(null)} />}
      {modal === "support"       && <ContactSupportModal onClose={() => setModal(null)} userId={user?.id} />}
      {modal === "about"         && <AboutModal onClose={() => setModal(null)} />}

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700"
            data-testid="button-back"
          >
            <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-black text-gray-900 dark:text-white" data-testid="text-settings-title">{t.settings.title}</h2>
        </div>

        {user ? (
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-4 relative overflow-hidden"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
            data-testid="profile-card"
          >
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl" />
            <div className="relative pt-2 pb-1">
              <div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center border-4 border-white dark:border-gray-900 mb-3"
                style={{ boxShadow: "0 4px 16px rgba(220,38,38,0.35)" }}
                data-testid="profile-avatar"
              >
                <span className="text-white font-black text-2xl">{initials}</span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-lg leading-tight" data-testid="text-profile-name">
                    {user.name || "Utilisateur"}
                  </p>
                  {user.email && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail size={12} className="text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 text-xs" data-testid="text-profile-email">{user.email}</p>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone size={12} className="text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 text-xs" data-testid="text-profile-phone">{user.phone}</p>
                    </div>
                  )}
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950 px-3 py-1 rounded-full">
                    <User size={11} className="text-red-600" />
                    <span className="text-red-600 font-bold text-xs capitalize">
                      {user.role === "client" ? "Client" : user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs active:scale-95 transition-transform shadow-sm"
                  data-testid="button-logout-settings"
                >
                  <LogOut size={13} />
                  Déconnecter
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-4 flex items-center justify-between"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <User size={24} className="text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Non connecté</p>
                <p className="text-gray-400 text-xs mt-0.5">Connectez-vous pour accéder à votre profil</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs active:scale-95 transition-transform"
              data-testid="button-login-settings"
            >
              Connexion
            </button>
          </div>
        )}

        {user && (
          <button
            onClick={() => navigate("/wallet")}
            data-testid="button-wallet-profile"
            className="w-full text-left mb-4 rounded-2xl overflow-hidden relative"
            style={{ boxShadow: "0 4px 20px rgba(225,0,0,0.22)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#E10000] via-[#c40000] to-[#8B0000]" />
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -right-2 top-6 w-24 h-24 rounded-full bg-white/5" />
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center">
                    <Wallet size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Mon Wallet</p>
                    <p className="text-white font-black text-2xl leading-tight">
                      ${(walletData?.balance ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white/15 px-3 py-1.5 rounded-full">
                  <span className="text-white text-xs font-bold">Voir tout</span>
                  <ArrowRight size={13} className="text-white" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Star size={13} className="text-yellow-300" />
                  <span className="text-white/80 text-xs">Fidélité</span>
                  <span className="text-white font-black text-xs ml-auto">{walletData?.loyaltyPoints ?? 0} pts</span>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                  <TrendingUp size={13} className="text-green-300" />
                  <span className="text-white/80 text-xs">Transactions</span>
                  <span className="text-white font-black text-xs ml-auto">{walletData?.transactions?.length ?? 0}</span>
                </div>
              </div>
            </div>
          </button>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <MonitorSmartphone size={16} className="text-red-500" />
              Thème de l'application
            </h3>
          </div>
          <div className="p-4"><ThemePicker /></div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Globe size={16} className="text-red-500" />
              {t.settings.language}
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {[
              { code: "fr", flag: "🇫🇷", label: t.common.french  },
              { code: "en", flag: "🇬🇧", label: t.common.english },
            ].map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => setLang(code as any)}
                data-testid={`button-lang-${code}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  lang === code
                    ? "bg-red-50 dark:bg-red-950 border-2 border-red-500"
                    : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-xl">{flag}</span>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">{label}</span>
                {lang === code && <span className="ml-auto text-red-600 font-bold text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              { icon: Bell,       label: t.settings.notifications, testId: "button-notif",    action: "notifications" as ModalType },
              { icon: Shield,     label: t.settings.privacyPolicy,  testId: "button-privacy",  action: "privacy"       as ModalType },
              { icon: HelpCircle, label: t.settings.contactSupport, testId: "button-support",  action: "support"       as ModalType },
              { icon: Info,       label: t.settings.about,          testId: "button-about",    action: "about"         as ModalType },
            ].map(item => (
              <button
                key={item.label}
                data-testid={item.testId}
                onClick={() => setModal(item.action)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <item.icon size={18} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">{item.label}</span>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-6 font-medium">
          MAWEJA v1.0 - Made By Khevin Andrew Kita - Ed Corporation
        </p>
      </div>
    </div>
  );
}
