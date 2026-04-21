import { useState, useEffect } from "react";
import { Bell, Shield, HelpCircle, Info, X, Check, Send } from "lucide-react";
import { apiRequest, authFetch } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { requestNotifPermission, getNotifPermission, showNotif } from "../../../lib/notify";

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl pb-10 animate-in slide-in-from-top" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, title, onClose }: { icon: any; title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 pb-0 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
          <Icon size={18} className="text-red-600" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">{title}</h3>
      </div>
      <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <X size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}

export function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [permission, setPermission] = useState<"granted" | "denied" | "default">("default");
  const [appNotifs,   setAppNotifs]   = useState(() => localStorage.getItem("maweja_notif_app")    !== "false");
  const [orderNotifs, setOrderNotifs] = useState(() => localStorage.getItem("maweja_notif_orders") !== "false");
  const [promoNotifs, setPromoNotifs] = useState(() => localStorage.getItem("maweja_notif_promos") !== "false");

  useEffect(() => { getNotifPermission().then(setPermission); }, []);

  const requestPermission = async () => {
    const granted = await requestNotifPermission();
    setPermission(granted ? "granted" : "denied");
    if (granted) showNotif("MAWEJA", "Notifications activées ! 🎉");
  };

  const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader icon={Bell} title="Notifications" onClose={onClose} />
      <div className="px-6 space-y-3">
        {permission !== "granted" && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Notifications navigateur désactivées</p>
            <p className="text-xs text-red-600 dark:text-red-500 mb-3">Activez les notifications pour recevoir des alertes en temps réel.</p>
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
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-2xl p-4 flex items-center gap-3">
            <Check size={16} className="text-green-600" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Notifications navigateur activées</p>
          </div>
        )}
        {[
          { label: "Notifications in-app", desc: "Alertes dans l'application",  key: "maweja_notif_app",    val: appNotifs,   set: setAppNotifs   },
          { label: "Suivi de commandes",   desc: "Mises à jour de livraison",   key: "maweja_notif_orders", val: orderNotifs, set: setOrderNotifs },
          { label: "Promotions & offres",  desc: "Bons plans et réductions",    key: "maweja_notif_promos", val: promoNotifs, set: setPromoNotifs },
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
    </ModalShell>
  );
}

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  const sections = [
    { title: "1. Collecte des données",  body: "MAWEJA collecte les informations que vous nous fournissez lors de la création de votre compte : nom, email, numéro de téléphone et adresse de livraison. Ces données sont nécessaires pour le traitement de vos commandes et la livraison à domicile à Kinshasa." },
    { title: "2. Utilisation des données", body: "Vos données sont utilisées exclusivement pour : traiter et livrer vos commandes, vous envoyer des notifications relatives à vos commandes, améliorer notre service, vous contacter en cas de problème avec votre commande." },
    { title: "3. Partage des données",   body: "Nous partageons vos données uniquement avec les livreurs assignés à vos commandes (nom et adresse de livraison) et les restaurants partenaires (détails de commande). Vos données ne sont jamais vendues à des tiers." },
    { title: "4. Sécurité",              body: "Vos données sont protégées par des mesures de sécurité standard de l'industrie. Les mots de passe sont chiffrés et ne sont jamais stockés en clair. Nos serveurs sont sécurisés et les accès sont contrôlés." },
    { title: "5. Vos droits",            body: "Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données en contactant notre support au 0802540138. Nous traiterons votre demande dans un délai de 30 jours." },
    { title: "6. Cookies",               body: "MAWEJA utilise des cookies de session pour maintenir votre connexion. Aucun cookie de traçage publicitaire n'est utilisé." },
    { title: "7. Contact",               body: "Pour toute question relative à la confidentialité : Ed Corporation - Kinshasa, RDC - Tél : 0802540138 - Email : support@maweja.cd" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10 max-h-[85vh] flex flex-col animate-in slide-in-from-top" onClick={e => e.stopPropagation()}>
        <ModalHeader icon={Shield} title="Politique de Confidentialité" onClose={onClose} />
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {sections.map(({ title, body }) => (
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

export function ContactSupportModal({ onClose, userId }: { onClose: () => void; userId?: number }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const send = async () => {
    if (!message.trim() || !userId) return;
    setSending(true);
    try {
      const admins = await authFetch("/api/chat/users-by-role/admin").then(r => r.json());
      const admin = admins[0];
      if (!admin) throw new Error("No admin");
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: userId, receiverId: admin.id, message: `[SUPPORT] ${message.trim()}`, isRead: false }),
      });
      setSent(true);
      setMessage("");
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader icon={HelpCircle} title="Contacter le Support" onClose={onClose} />
      <div className="px-6">
        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">Message envoyé !</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Notre équipe vous répondra dans les meilleurs délais.</p>
            <button onClick={onClose} className="mt-6 bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm">Fermer</button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-4 mb-5">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Support disponible 24h/24</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Tél : <a href="tel:+243802540138" className="font-bold">0802540138</a></p>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Envoyez-nous un message :</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Décrivez votre problème..."
              data-testid="input-support-message"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 mb-4"
            />
            {!userId && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">Connectez-vous pour envoyer un message.</p>
            )}
            <button
              onClick={send}
              disabled={!message.trim() || sending || !userId}
              data-testid="button-send-support"
              className="w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {sending ? "Envoi..." : "Envoyer le message"}
            </button>
          </>
        )}
      </div>
    </ModalShell>
  );
}

export function AboutModal({ onClose }: { onClose: () => void }) {
  const rows = [
    { label: "Plateforme", value: "Livraison & Services — Kinshasa, RDC" },
    { label: "Développeur", value: "Khevin Andrew Kita" },
    { label: "Entreprise",  value: "Ed Corporation" },
    { label: "Contact",     value: "0802540138" },
    { label: "Email",       value: "support@maweja.cd" },
  ];
  return (
    <ModalShell onClose={onClose}>
      <ModalHeader icon={Info} title="À propos" onClose={onClose} />
      <div className="px-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 dark:shadow-red-900">
            <span className="text-white text-3xl font-black">M</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">MAWEJA</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Version 1.0.0</p>
        </div>
        <div className="space-y-3">
          {rows.map(({ label, value }) => (
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
    </ModalShell>
  );
}
