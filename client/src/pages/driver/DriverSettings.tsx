import { useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import DriverNav from "../../components/DriverNav";
import { Bell, Shield, HelpCircle, Info, ChevronRight, Globe, Check, Phone, Truck, LogOut, User, MonitorSmartphone } from "lucide-react";
import { ThemePicker } from "../../components/driver/settings/SettingsUI";
import {
  NotificationsModal,
  PrivacyPolicyModal,
  ContactSupportModal,
  AboutModal,
} from "../../components/driver/settings/SettingsModals";

type ModalType = "notifications" | "privacy" | "support" | "about";

const MENU_ITEMS: { icon: any; label: string; desc: string; action: ModalType; iconBg: string; iconText: string }[] = [
  { icon: Bell,       label: "Notifications",                desc: "Commandes et alertes",     action: "notifications", iconBg: "bg-driver-amber/10",  iconText: "text-driver-amber"  },
  { icon: Shield,     label: "Politique de confidentialité", desc: "Données et vie privée",    action: "privacy",       iconBg: "bg-driver-blue/10",   iconText: "text-driver-blue"   },
  { icon: HelpCircle, label: "Contacter le support",         desc: "Aide & assistance 24h/24", action: "support",       iconBg: "bg-driver-green/10",  iconText: "text-driver-green"  },
  { icon: Info,       label: "À propos",                    desc: "Version et informations",  action: "about",         iconBg: "bg-driver-s3",        iconText: "text-driver-subtle" },
];

export default function DriverSettings() {
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useAuth();
  const [modal, setModal] = useState<ModalType | null>(null);

  return (
    <div className="min-h-screen pb-28 bg-driver-bg">
      {modal === "notifications" && <NotificationsModal onClose={() => setModal(null)} />}
      {modal === "privacy"       && <PrivacyPolicyModal onClose={() => setModal(null)} />}
      {modal === "support"       && <ContactSupportModal onClose={() => setModal(null)} userId={user?.id} />}
      {modal === "about"         && <AboutModal onClose={() => setModal(null)} />}

      <DriverNav />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div>
          <h2 className="text-xl font-black text-white" data-testid="text-driver-settings-title">Profil</h2>
          <p className="text-xs mt-0.5 text-driver-subtle">Paramètres de votre compte agent</p>
        </div>

        {user && (
          <div className="rounded-3xl p-5 relative overflow-hidden bg-[linear-gradient(135deg,#1a0000_0%,#220000_100%)] border border-driver-accent/20">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 bg-driver-accent" />
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 bg-white/[0.08] border border-white/10">
                <User size={28} className="text-driver-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg text-white truncate">{user.name}</p>
                <p className="text-xs truncate text-driver-subtle">{user.email}</p>
                {user.phone && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Phone size={11} className="text-driver-subtle" />
                    <p className="text-xs text-driver-subtle">{user.phone}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-black uppercase bg-driver-blue">Agent</span>
                <div className="flex items-center gap-1.5">
                  <Truck size={11} className="text-driver-green" />
                  <span className="text-[10px] font-semibold text-driver-green">Actif</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-driver-border">
            <MonitorSmartphone size={15} className="text-driver-accent" />
            <p className="font-bold text-sm text-white">Thème de l'application</p>
          </div>
          <div className="p-4"><ThemePicker /></div>
        </div>

        <div className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-driver-border">
            <Globe size={15} className="text-driver-accent" />
            <p className="font-bold text-sm text-white">{t.settings.language}</p>
          </div>
          <div className="p-4 flex gap-2">
            {[
              { code: "fr", flag: "🇫🇷", label: t.common.french  },
              { code: "en", flag: "🇬🇧", label: t.common.english },
            ].map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => setLang(code as any)}
                data-testid={`button-lang-${code}`}
                className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all border-2 ${
                  lang === code
                    ? "bg-driver-accent border-driver-accent shadow-glow-accent"
                    : "bg-driver-s2 border-transparent"
                }`}
              >
                <span className="text-xl">{flag}</span>
                <span className={`text-sm font-bold ${lang === code ? "text-white" : "text-driver-muted"}`}>{label}</span>
                {lang === code && <Check size={13} className="ml-auto text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
          {MENU_ITEMS.map(({ icon: Icon, label, desc, action, iconBg, iconText }, i) => (
            <button
              key={action}
              data-testid={`button-settings-${action}`}
              onClick={() => setModal(action)}
              className={`w-full flex items-center gap-3.5 px-4 py-4 transition-all active:opacity-70 ${
                i < MENU_ITEMS.length - 1 ? "border-b border-driver-border" : ""
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={16} className={iconText} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-[11px] mt-0.5 text-driver-subtle">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-driver-subtle" />
            </button>
          ))}
        </div>

        <button
          onClick={async () => { await logout(); window.location.href = "/driver/login"; }}
          data-testid="button-logout-settings"
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] bg-driver-red/8 border border-driver-red/20 text-driver-red"
        >
          <LogOut size={17} />
          Se déconnecter
        </button>

        <p className="text-center text-[10px] text-driver-subtle">
          MAWEJA v1.0 — Ed Corporation — Khevin Andrew Kita
        </p>
      </div>
    </div>
  );
}
