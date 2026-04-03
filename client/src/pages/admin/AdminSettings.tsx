import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Settings, Bell, Save, Loader2, Check, RefreshCw } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";

const DEFAULTS = {
  app_name: "MAWEJA",
  delivery_fee: "2",
  min_order: "5",
  max_radius: "15",
  service_fee: "0.76",
  notifications: "true",
  auto_assign: "true",
  loyalty_enabled: "true",
  points_per_order: "10",
  currency: "USD",
  whatsapp_number: "+243802540138",
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings) setForm({ ...DEFAULTS, ...settings });
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => apiRequest("/api/settings", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "Parametres sauvegardes", description: "Les modifications sont actives" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" }),
  });

  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
  const toggle = (key: keyof typeof form) => setForm(f => ({ ...f, [key]: f[key] === "true" ? "false" : "true" }));

  const textField = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" />
    </div>
  );

  if (isLoading) return (
    <AdminLayout title="Parametres">
      <div className="max-w-2xl space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Parametres">
      <div className="max-w-2xl space-y-6">

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Configuration generale</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Parametres de base de l'application MAWEJA</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {textField("app_name", "Nom de l'application", "text", "MAWEJA")}
            {textField("currency", "Devise", "text", "USD ($)")}
            {textField("delivery_fee", "Frais de livraison par defaut ($)", "number", "2")}
            {textField("min_order", "Commande minimum ($)", "number", "5")}
            {textField("service_fee", "Frais de service par commande ($)", "number", "0.76")}
            {textField("max_radius", "Rayon de livraison max (km)", "number", "15")}
            {textField("points_per_order", "Points de fidelite par commande", "number", "10")}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Notifications et automatisation</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gerer les alertes et l'attribution automatique</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: "notifications" as const, label: "Notifications push", desc: "Recevoir des alertes pour les nouvelles commandes" },
              { key: "auto_assign" as const, label: "Attribution automatique", desc: "Attribuer automatiquement les commandes aux agents disponibles" },
              { key: "loyalty_enabled" as const, label: "Programme de fidelite", desc: "Activer le systeme de points de fidelite" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
                <button onClick={() => toggle(item.key)} data-testid={`toggle-${item.key}`}
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${form[item.key] === "true" ? "bg-red-600" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${form[item.key] === "true" ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-900 rounded-2xl border border-green-100 dark:border-gray-800 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
              <SiWhatsapp size={22} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">WhatsApp Contact</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Numero WhatsApp affiche aux clients pour le support</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Numero WhatsApp (avec indicatif pays)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SiWhatsapp size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                <input type="text" value={form.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)}
                  placeholder="+243 812 345 678" data-testid="input-whatsapp-number"
                  className="w-full pl-9 pr-4 py-3 bg-white dark:bg-gray-800 border border-green-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
              Ce numero apparaitra dans le bouton WhatsApp de l'application client. Exemple: +243802540138
            </p>
            {form.whatsapp_number && (
              <a href={`https://wa.me/${form.whatsapp_number.replace(/\s+/g, "").replace("+", "")}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-green-700 font-semibold hover:underline">
                <SiWhatsapp size={12} /> Tester ce numero WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="button-save-settings"
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${saved ? "bg-green-600 shadow-green-200 hover:bg-green-700" : "bg-red-600 shadow-red-200 hover:bg-red-700"} text-white disabled:opacity-50`}>
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {mutation.isPending ? "Sauvegarde..." : saved ? "Sauvegarde !" : "Sauvegarder les parametres"}
          </button>
          <button onClick={() => setForm({ ...DEFAULTS, ...settings })} data-testid="button-reset-settings"
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Reinitialiser
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
