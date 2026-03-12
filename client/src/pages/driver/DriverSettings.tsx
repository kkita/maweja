import { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useTheme, type ThemeMode } from "../../lib/theme";
import DriverNav from "../../components/DriverNav";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  Globe, ChevronRight, Bell, Shield, HelpCircle, Info, User,
  Sun, Moon, MonitorSmartphone, X, Send, Check
} from "lucide-react";
import { requestNotifPermission, getNotifPermission, showNotif } from "../../lib/notify";

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const options: { value: ThemeMode; icon: any; label: string }[] = [
    { value: "auto", icon: MonitorSmartphone, label: "Auto" },
    { value: "light", icon: Sun, label: "Clair" },
    { value: "dark", icon: Moon, label: "Sombre" },
  ];
  return (
    <div className="flex gap-2">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          data-testid={`button-theme-${value}`}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-semibold ${
            theme === value
              ? "bg-red-50 dark:bg-red-950 border-red-500 text-red-600"
              : "bg-gray-50 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600"
          }`}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </div>
  );
}

function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [permission, setPermission] = useState<"granted" | "denied" | "default">("default");
  const [deliveryNotifs, setDeliveryNotifs] = useState(() => localStorage.getItem("maweja_driver_notif_delivery") !== "false");
  const [earningsNotifs, setEarningsNotifs] = useState(() => localStorage.getItem("maweja_driver_notif_earnings") !== "false");

  useEffect(() => {
    getNotifPermission().then(setPermission);
  }, []);

  const requestPermission = async () => {
    const granted = await requestNotifPermission();
    setPermission(granted ? "granted" : "denied");
    if (granted) showNotif("MAWEJA Driver", "Notifications activées ! 🎉");
  };

  const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-top" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
              <Bell size={18} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Notifications</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {permission !== "granted" && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-2xl p-4 mb-5">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Notifications désactivées</p>
            <p className="text-xs text-red-600 dark:text-red-500 mb-3">Activez pour recevoir les nouvelles commandes et alertes.</p>
            <button
              onClick={requestPermission}
              data-testid="button-enable-browser-notif"
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Activer les notifications
            </button>
          </div>
        )}

        {permission === "granted" && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <Check size={16} className="text-green-600" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Notifications activées</p>
          </div>
        )}

        <div className="space-y-3">
          {[
            { label: "Nouvelles commandes", desc: "Alertes pour les livraisons disponibles", key: "maweja_driver_notif_delivery", val: deliveryNotifs, set: setDeliveryNotifs },
            { label: "Revenus et gains", desc: "Confirmation de livraisons payées", key: "maweja_driver_notif_earnings", val: earningsNotifs, set: setEarningsNotifs },
          ].map(({ label, desc, key, val, set }) => (
            <div key={key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key, !val, set)}
                data-testid={`toggle-${key}`}
                className={`w-12 h-6 rounded-full transition-all relative ${val ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? "left-7" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10 max-h-[85vh] flex flex-col animate-in slide-in-from-top" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Politique de Confidentialité</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {[
            { title: "1. Données collectées", body: "MAWEJA collecte vos informations de compte (nom, email, téléphone), votre statut de localisation GPS (activé/désactivé), et l'historique de vos livraisons." },
            { title: "2. Utilisation des données", body: "Vos données servent à : assigner et suivre les livraisons, calculer vos revenus, améliorer la plateforme, vous contacter en cas de problème." },
            { title: "3. Localisation GPS", body: "Votre position GPS n'est partagée avec les clients que pendant une livraison active. Elle est désactivée dès que vous passez hors ligne." },
            { title: "4. Revenus et paiements", body: "Vos données de revenus sont confidentielles et ne sont partagées qu'avec l'administration MAWEJA pour le calcul des commissions." },
            { title: "5. Vos droits", body: "Vous pouvez demander la modification ou suppression de votre compte à tout moment en contactant le support au +243 819 994 041." },
            { title: "6. Contact", body: "Ed Corporation — Kinshasa, RDC — Tél : +243 819 994 041 — Email : support@maweja.cd" },
          ].map(({ title, body }) => (
            <div key={title}>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{body}</p>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-4">Dernière mise à jour : Mars 2026 — MAWEJA / Ed Corporation</p>
        </div>
      </div>
    </div>
  );
}

function ContactSupportModal({ onClose, userId }: { onClose: () => void; userId?: number }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const send = async () => {
    if (!message.trim() || !userId) return;
    setSending(true);
    try {
      const admins = await fetch("/api/chat/users-by-role/admin").then(r => r.json());
      const admin = admins[0];
      if (!admin) throw new Error("No admin");
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: userId, receiverId: admin.id, message: `[DRIVER SUPPORT] ${message.trim()}`, isRead: false }),
      });
      setSent(true);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-top" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
              <HelpCircle size={18} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Contacter le Support</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">Message envoyé !</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">L'administration vous répondra dans les meilleurs délais.</p>
            <button onClick={onClose} className="mt-6 bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm">Fermer</button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-4 mb-5">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Support Livreur — Disponible 24h/24</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Tél : <a href="tel:+243819994041" className="font-bold">+243 819 994 041</a></p>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Votre message :</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Problème technique, question sur les revenus..."
              data-testid="input-support-message"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 mb-4"
            />
            <button
              onClick={send}
              disabled={!message.trim() || sending}
              data-testid="button-send-support"
              className="w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {sending ? "Envoi..." : "Envoyer le message"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-top" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
              <Info size={18} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">À propos</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 dark:shadow-red-900">
            <span className="text-white text-3xl font-black">M</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">MAWEJA Driver</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Version 1.0.0</p>
        </div>
        <div className="space-y-3">
          {[
            { label: "Plateforme", value: "Livraison & Services — Kinshasa, RDC" },
            { label: "Développeur", value: "Khevin Andrew Kita" },
            { label: "Entreprise", value: "Ed Corporation" },
            { label: "Contact", value: "+243 819 994 041" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-6">
          © 2026 Ed Corporation — Tous droits réservés
        </p>
      </div>
    </div>
  );
}

export default function DriverSettings() {
  const { lang, setLang, t } = useI18n();
  const { user } = useAuth();
  const [modal, setModal] = useState<"notifications" | "privacy" | "support" | "about" | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <DriverNav />
      {modal === "notifications" && <NotificationsModal onClose={() => setModal(null)} />}
      {modal === "privacy" && <PrivacyPolicyModal onClose={() => setModal(null)} />}
      {modal === "support" && <ContactSupportModal onClose={() => setModal(null)} userId={user?.id} />}
      {modal === "about" && <AboutModal onClose={() => setModal(null)} />}

      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5" data-testid="text-driver-settings-title">{t.settings.title}</h2>

        {user && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-4 flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center">
              <User size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{user.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{user.phone}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <MonitorSmartphone size={16} className="text-red-500" />
              Thème de l'application
            </h3>
          </div>
          <div className="p-4">
            <ThemePicker />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Globe size={16} className="text-red-500" />
              {t.settings.language}
            </h3>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={() => setLang("fr")}
              data-testid="button-lang-fr"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${lang === "fr" ? "bg-red-50 dark:bg-red-950 border-2 border-red-500" : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600"}`}
            >
              <span className="text-xl">🇫🇷</span>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{t.common.french}</span>
              {lang === "fr" && <span className="ml-auto text-red-600 font-bold text-xs">✓</span>}
            </button>
            <button
              onClick={() => setLang("en")}
              data-testid="button-lang-en"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${lang === "en" ? "bg-red-50 dark:bg-red-950 border-2 border-red-500" : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600"}`}
            >
              <span className="text-xl">🇬🇧</span>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{t.common.english}</span>
              {lang === "en" && <span className="ml-auto text-red-600 font-bold text-xs">✓</span>}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              { icon: Bell, label: t.settings.notifications, testId: "button-notif", action: "notifications" as const },
              { icon: Shield, label: t.settings.privacyPolicy, testId: "button-privacy", action: "privacy" as const },
              { icon: HelpCircle, label: t.settings.contactSupport, testId: "button-support", action: "support" as const },
              { icon: Info, label: t.settings.about, testId: "button-about", action: "about" as const },
            ].map((item) => (
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
