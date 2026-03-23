import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import DriverNav from "../../components/DriverNav";
import { apiRequest, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Globe, ChevronRight, Bell, Shield, HelpCircle, Info, User, Sun, Moon, MonitorSmartphone, X, Send, Check } from "lucide-react";
import { requestNotifPermission, getNotifPermission, showNotif } from "../../lib/notify";
function ThemePicker() {
    const { theme, setTheme } = useTheme();
    const options = [
        { value: "auto", icon: MonitorSmartphone, label: "Auto" },
        { value: "light", icon: Sun, label: "Clair" },
        { value: "dark", icon: Moon, label: "Sombre" },
    ];
    return (_jsx("div", { className: "flex gap-2", children: options.map(({ value, icon: Icon, label }) => (_jsxs("button", { onClick: () => setTheme(value), "data-testid": `button-theme-${value}`, className: `flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-semibold ${theme === value
                ? "bg-red-50 border-red-500 text-red-600"
                : "bg-gray-50 dark:bg-gray-800/60 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-200 dark:border-gray-700:border-gray-600"}`, children: [_jsx(Icon, { size: 18 }), label] }, value))) }));
}
function NotificationsModal({ onClose }) {
    const [permission, setPermission] = useState("default");
    const [deliveryNotifs, setDeliveryNotifs] = useState(() => localStorage.getItem("maweja_driver_notif_delivery") !== "false");
    const [earningsNotifs, setEarningsNotifs] = useState(() => localStorage.getItem("maweja_driver_notif_earnings") !== "false");
    useEffect(() => {
        getNotifPermission().then(setPermission);
    }, []);
    const requestPermission = async () => {
        const granted = await requestNotifPermission();
        setPermission(granted ? "granted" : "denied");
        if (granted)
            showNotif("MAWEJA Driver", "Notifications activées ! 🎉");
    };
    const toggle = (key, value, setter) => {
        setter(value);
        localStorage.setItem(key, String(value));
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-in slide-in-from-top", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center", children: _jsx(Bell, { size: 18, className: "text-red-600" }) }), _jsx("h3", { className: "text-lg font-black text-gray-900 dark:text-white", children: "Notifications" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: _jsx(X, { size: 16, className: "text-gray-500 dark:text-gray-400 dark:text-gray-500" }) })] }), permission !== "granted" && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-2xl p-4 mb-5", children: [_jsx("p", { className: "text-sm font-semibold text-red-700 mb-1", children: "Notifications d\u00E9sactiv\u00E9es" }), _jsx("p", { className: "text-xs text-red-600 mb-3", children: "Activez pour recevoir les nouvelles commandes et alertes." }), _jsx("button", { onClick: requestPermission, "data-testid": "button-enable-browser-notif", className: "bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors", children: "Activer les notifications" })] })), permission === "granted" && (_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 flex items-center gap-3", children: [_jsx(Check, { size: 16, className: "text-green-600" }), _jsx("p", { className: "text-sm font-semibold text-green-700", children: "Notifications activ\u00E9es" })] })), _jsx("div", { className: "space-y-3", children: [
                        { label: "Nouvelles commandes", desc: "Alertes pour les livraisons disponibles", key: "maweja_driver_notif_delivery", val: deliveryNotifs, set: setDeliveryNotifs },
                        { label: "Revenus et gains", desc: "Confirmation de livraisons payées", key: "maweja_driver_notif_earnings", val: earningsNotifs, set: setEarningsNotifs },
                    ].map(({ label, desc, key, val, set }) => (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: label }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500", children: desc })] }), _jsx("button", { onClick: () => toggle(key, !val, set), "data-testid": `toggle-${key}`, className: `w-12 h-6 rounded-full transition-all relative ${val ? "bg-red-600" : "bg-gray-300"}`, children: _jsx("div", { className: `absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? "left-7" : "left-1"}` }) })] }, key))) })] }) }));
}
function PrivacyPolicyModal({ onClose }) {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 max-h-[85vh] flex flex-col animate-in slide-in-from-top", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center", children: _jsx(Shield, { size: 18, className: "text-red-600" }) }), _jsx("h3", { className: "text-lg font-black text-gray-900 dark:text-white", children: "Politique de Confidentialit\u00E9" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: _jsx(X, { size: 16, className: "text-gray-500 dark:text-gray-400 dark:text-gray-500" }) })] }), _jsxs("div", { className: "overflow-y-auto flex-1 space-y-4 pr-1", children: [[
                            { title: "1. Données collectées", body: "MAWEJA collecte vos informations de compte (nom, email, téléphone), votre statut de localisation GPS (activé/désactivé), et l'historique de vos livraisons." },
                            { title: "2. Utilisation des données", body: "Vos données servent à : assigner et suivre les livraisons, calculer vos revenus, améliorer la plateforme, vous contacter en cas de problème." },
                            { title: "3. Localisation GPS", body: "Votre position GPS n'est partagée avec les clients que pendant une livraison active. Elle est désactivée dès que vous passez hors ligne." },
                            { title: "4. Revenus et paiements", body: "Vos données de revenus sont confidentielles et ne sont partagées qu'avec l'administration MAWEJA pour le calcul des commissions." },
                            { title: "5. Vos droits", body: "Vous pouvez demander la modification ou suppression de votre compte à tout moment en contactant le support au 0802540138." },
                            { title: "6. Contact", body: "Ed Corporation — Kinshasa, RDC — Tél : 0802540138 — Email : support@maweja.cd" },
                        ].map(({ title, body }) => (_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-sm text-gray-900 dark:text-white mb-1", children: title }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-300 leading-relaxed", children: body })] }, title))), _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 text-center mt-4", children: "Derni\u00E8re mise \u00E0 jour : Mars 2026 \u2014 MAWEJA / Ed Corporation" })] })] }) }));
}
function ContactSupportModal({ onClose, userId }) {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const { toast } = useToast();
    const send = async () => {
        if (!message.trim() || !userId)
            return;
        setSending(true);
        try {
            const admins = await authFetch("/api/chat/users-by-role/admin").then(r => r.json());
            const admin = admins[0];
            if (!admin)
                throw new Error("No admin");
            await apiRequest("/api/chat", {
                method: "POST",
                body: JSON.stringify({ senderId: userId, receiverId: admin.id, message: `[DRIVER SUPPORT] ${message.trim()}`, isRead: false }),
            });
            setSent(true);
        }
        catch {
            toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
        }
        finally {
            setSending(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-in slide-in-from-top", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center", children: _jsx(HelpCircle, { size: 18, className: "text-red-600" }) }), _jsx("h3", { className: "text-lg font-black text-gray-900 dark:text-white", children: "Contacter le Support" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: _jsx(X, { size: 16, className: "text-gray-500 dark:text-gray-400 dark:text-gray-500" }) })] }), sent ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Check, { size: 28, className: "text-green-600" }) }), _jsx("h4", { className: "text-lg font-black text-gray-900 dark:text-white mb-2", children: "Message envoy\u00E9 !" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500", children: "L'administration vous r\u00E9pondra dans les meilleurs d\u00E9lais." }), _jsx("button", { onClick: onClose, className: "mt-6 bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm", children: "Fermer" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-blue-50 rounded-2xl p-4 mb-5", children: [_jsx("p", { className: "text-sm font-semibold text-blue-700 mb-1", children: "Support Livreur \u2014 Disponible 24h/24" }), _jsxs("p", { className: "text-xs text-blue-600", children: ["T\u00E9l : ", _jsx("a", { href: "tel:+243802540138", className: "font-bold", children: "0802540138" })] })] }), _jsx("p", { className: "text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3", children: "Votre message :" }), _jsx("textarea", { value: message, onChange: e => setMessage(e.target.value), placeholder: "Probl\u00E8me technique, question sur les revenus...", "data-testid": "input-support-message", rows: 4, className: "w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-4" }), _jsxs("button", { onClick: send, disabled: !message.trim() || sending, "data-testid": "button-send-support", className: "w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2", children: [_jsx(Send, { size: 16 }), sending ? "Envoi..." : "Envoyer le message"] })] }))] }) }));
}
function AboutModal({ onClose }) {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-in slide-in-from-top", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center", children: _jsx(Info, { size: 18, className: "text-red-600" }) }), _jsx("h3", { className: "text-lg font-black text-gray-900 dark:text-white", children: "\u00C0 propos" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: _jsx(X, { size: 16, className: "text-gray-500 dark:text-gray-400 dark:text-gray-500" }) })] }), _jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200", children: _jsx("span", { className: "text-white text-3xl font-black", children: "M" }) }), _jsx("h2", { className: "text-2xl font-black text-gray-900 dark:text-white", children: "MAWEJA Driver" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1", children: "Version 1.0.0" })] }), _jsx("div", { className: "space-y-3", children: [
                        { label: "Plateforme", value: "Livraison & Services — Kinshasa, RDC" },
                        { label: "Développeur", value: "Khevin Andrew Kita" },
                        { label: "Entreprise", value: "Ed Corporation" },
                        { label: "Contact", value: "0802540138" },
                    ].map(({ label, value }) => (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3", children: [_jsx("span", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500", children: label }), _jsx("span", { className: "text-sm font-bold text-gray-900 dark:text-white", children: value })] }, label))) }), _jsx("p", { className: "text-center text-[10px] text-gray-400 dark:text-gray-500 mt-6", children: "\u00A9 2026 Ed Corporation \u2014 Tous droits r\u00E9serv\u00E9s" })] }) }));
}
export default function DriverSettings() {
    const { lang, setLang, t } = useI18n();
    const { user } = useAuth();
    const [modal, setModal] = useState(null);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(DriverNav, {}), modal === "notifications" && _jsx(NotificationsModal, { onClose: () => setModal(null) }), modal === "privacy" && _jsx(PrivacyPolicyModal, { onClose: () => setModal(null) }), modal === "support" && _jsx(ContactSupportModal, { onClose: () => setModal(null), userId: user?.id }), modal === "about" && _jsx(AboutModal, { onClose: () => setModal(null) }), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-5", "data-testid": "text-driver-settings-title", children: t.settings.title }), user && (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-4 flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 bg-red-50 rounded-full flex items-center justify-center", children: _jsx(User, { size: 24, className: "text-red-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-gray-900 dark:text-white", children: user.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500", children: user.email }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: user.phone })] })] })), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4", children: [_jsx("div", { className: "px-5 py-4 border-b border-gray-50", children: _jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(MonitorSmartphone, { size: 16, className: "text-red-500" }), "Th\u00E8me de l'application"] }) }), _jsx("div", { className: "p-4", children: _jsx(ThemePicker, {}) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4", children: [_jsx("div", { className: "px-5 py-4 border-b border-gray-50", children: _jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Globe, { size: 16, className: "text-red-500" }), t.settings.language] }) }), _jsxs("div", { className: "p-4 space-y-2", children: [_jsxs("button", { onClick: () => setLang("fr"), "data-testid": "button-lang-fr", className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${lang === "fr" ? "bg-red-50 border-2 border-red-500" : "bg-gray-50 dark:bg-gray-800/60 border-2 border-transparent hover:border-gray-200 dark:border-gray-700:border-gray-600"}`, children: [_jsx("span", { className: "text-xl", children: "\uD83C\uDDEB\uD83C\uDDF7" }), _jsx("span", { className: "font-semibold text-sm text-gray-900 dark:text-white", children: t.common.french }), lang === "fr" && _jsx("span", { className: "ml-auto text-red-600 font-bold text-xs", children: "\u2713" })] }), _jsxs("button", { onClick: () => setLang("en"), "data-testid": "button-lang-en", className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${lang === "en" ? "bg-red-50 border-2 border-red-500" : "bg-gray-50 dark:bg-gray-800/60 border-2 border-transparent hover:border-gray-200 dark:border-gray-700:border-gray-600"}`, children: [_jsx("span", { className: "text-xl", children: "\uD83C\uDDEC\uD83C\uDDE7" }), _jsx("span", { className: "font-semibold text-sm text-gray-900 dark:text-white", children: t.common.english }), lang === "en" && _jsx("span", { className: "ml-auto text-red-600 font-bold text-xs", children: "\u2713" })] })] })] }), _jsx("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden", children: _jsx("div", { className: "divide-y divide-gray-50", children: [
                                { icon: Bell, label: t.settings.notifications, testId: "button-notif", action: "notifications" },
                                { icon: Shield, label: t.settings.privacyPolicy, testId: "button-privacy", action: "privacy" },
                                { icon: HelpCircle, label: t.settings.contactSupport, testId: "button-support", action: "support" },
                                { icon: Info, label: t.settings.about, testId: "button-about", action: "about" },
                            ].map((item) => (_jsxs("button", { "data-testid": item.testId, onClick: () => setModal(item.action), className: "w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:bg-gray-800/60:bg-gray-800 transition-colors", children: [_jsx(item.icon, { size: 18, className: "text-gray-400 dark:text-gray-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 text-left", children: item.label }), _jsx(ChevronRight, { size: 16, className: "text-gray-300" })] }, item.label))) }) }), _jsx("p", { className: "text-center text-[10px] text-gray-400 dark:text-gray-500 mt-6 font-medium", children: "MAWEJA v1.0 - Made By Khevin Andrew Kita - Ed Corporation" })] })] }));
}
//# sourceMappingURL=DriverSettings.js.map