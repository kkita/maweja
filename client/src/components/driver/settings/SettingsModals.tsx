import { useState, useEffect } from "react";
import { Bell, Shield, HelpCircle, Info, Check, Send } from "lucide-react";
import { apiRequest, authFetch } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { requestNotifPermission, getNotifPermission, showNotif } from "../../../lib/notify";
import { BottomSheet, SheetHeader } from "./SettingsUI";

export function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [permission, setPermission] = useState<"granted" | "denied" | "default">("default");
  const [deliveryNotifs, setDeliveryNotifs] = useState(() => localStorage.getItem("maweja_driver_notif_delivery") !== "false");
  const [earningsNotifs, setEarningsNotifs] = useState(() => localStorage.getItem("maweja_driver_notif_earnings") !== "false");

  useEffect(() => { getNotifPermission().then(setPermission); }, []);

  const requestPermission = async () => {
    const granted = await requestNotifPermission();
    setPermission(granted ? "granted" : "denied");
    if (granted) showNotif("MAWEJA Agent", "Notifications activées ! 🎉");
  };

  const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader icon={Bell} title="Notifications" onClose={onClose} />
      <div className="px-5 py-4 space-y-4">
        {permission !== "granted" && (
          <div className="rounded-2xl p-4 bg-driver-red/8 border border-driver-red/20">
            <p className="text-sm font-bold text-driver-text mb-1">Notifications désactivées</p>
            <p className="text-xs mb-3 text-driver-muted">Activez pour recevoir les nouvelles commandes et alertes.</p>
            <button
              onClick={requestPermission}
              data-testid="button-enable-browser-notif"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-driver-accent"
            >
              Activer les notifications
            </button>
          </div>
        )}
        {permission === "granted" && (
          <div className="flex items-center gap-3 rounded-2xl p-4 bg-driver-green/8 border border-driver-green/20">
            <Check size={16} className="text-driver-green" />
            <p className="text-sm font-bold text-driver-text">Notifications activées</p>
          </div>
        )}
        {[
          { label: "Nouvelles commandes", desc: "Alertes pour les livraisons disponibles", key: "maweja_driver_notif_delivery", val: deliveryNotifs, set: setDeliveryNotifs },
          { label: "Revenus et gains",    desc: "Confirmation de livraisons payées",       key: "maweja_driver_notif_earnings", val: earningsNotifs, set: setEarningsNotifs },
        ].map(({ label, desc, key, val, set }) => (
          <div key={key} className="flex items-center justify-between rounded-2xl p-4 bg-driver-s2">
            <div>
              <p className="text-sm font-bold text-driver-text">{label}</p>
              <p className="text-xs mt-0.5 text-driver-subtle">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key, !val, set)}
              data-testid={`toggle-${key}`}
              className={`w-12 h-6 rounded-full relative transition-all flex-shrink-0 ${val ? "bg-driver-accent" : "bg-driver-s3"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${val ? "left-7" : "left-1"}`} />
            </button>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  const sections = [
    { title: "1. Données collectées",     body: "MAWEJA collecte vos informations de compte (nom, email, téléphone), votre statut de localisation GPS (activé/désactivé), et l'historique de vos livraisons." },
    { title: "2. Utilisation des données", body: "Vos données servent à : assigner et suivre les livraisons, calculer vos revenus, améliorer la plateforme, vous contacter en cas de problème." },
    { title: "3. Localisation GPS",        body: "Votre position GPS n'est partagée avec les clients que pendant une livraison active. Elle est désactivée dès que vous passez hors ligne." },
    { title: "4. Revenus et paiements",    body: "Vos données de revenus sont confidentielles et ne sont partagées qu'avec l'administration MAWEJA pour le calcul des commissions." },
    { title: "5. Vos droits",              body: "Vous pouvez demander la modification ou suppression de votre compte à tout moment en contactant le support au 0802540138." },
    { title: "6. Contact",                 body: "MAWEJA — Kinshasa, RDC — Tél : 0802540138 — Email : support@maweja.cd" },
  ];
  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader icon={Shield} title="Politique de Confidentialité" onClose={onClose} />
      <div className="px-5 py-4 space-y-4">
        {sections.map(({ title, body }) => (
          <div key={title} className="rounded-2xl p-4 bg-driver-s2">
            <h4 className="font-bold text-sm text-driver-text mb-1.5">{title}</h4>
            <p className="text-xs leading-relaxed text-driver-muted">{body}</p>
          </div>
        ))}
        <p className="text-center text-[10px] text-driver-subtle">Dernière mise à jour : Mars 2026 — MAWEJA</p>
      </div>
    </BottomSheet>
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
    <BottomSheet onClose={onClose}>
      <SheetHeader icon={HelpCircle} title="Contacter le Support" onClose={onClose} />
      <div className="px-5 py-4">
        {sent ? (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-driver-green/15">
              <Check size={28} className="text-driver-green" />
            </div>
            <h4 className="text-lg font-black text-driver-text mb-2">Message envoyé !</h4>
            <p className="text-sm text-driver-muted">L'administration vous répondra dans les meilleurs délais.</p>
            <button
              onClick={onClose}
              className="mt-6 px-8 py-3 rounded-2xl font-bold text-sm text-white bg-driver-accent"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-driver-blue/8 border border-driver-blue/20">
              <p className="text-sm font-bold text-driver-text mb-1">Support Agent — Disponible 24h/24</p>
              <a href="tel:+243802540138" className="text-xs font-bold text-driver-blue">📞 0802540138</a>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-2 text-driver-subtle">Votre message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Problème technique, question sur les revenus..."
                data-testid="input-support-message"
                rows={4}
                className="w-full px-4 py-3 rounded-2xl text-sm text-driver-text resize-none focus:outline-none placeholder-driver-subtle bg-driver-s2 border border-driver-border"
              />
            </div>
            <button
              onClick={send}
              disabled={!message.trim() || sending}
              data-testid="button-send-support"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white disabled:opacity-50 transition-all bg-driver-accent"
            >
              <Send size={16} />
              {sending ? "Envoi en cours..." : "Envoyer le message"}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

