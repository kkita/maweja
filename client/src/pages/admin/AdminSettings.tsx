import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useRef } from "react";
import { Settings, Bell, Save, Loader2, Check, RefreshCw, Lock, Volume2, Play, Music, Upload, Trash2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import {
  RINGTONES, type RingtoneId,
  getSelectedRingtone, setSelectedRingtone,
  getRingtoneVolume, setRingtoneVolume,
  playRingtone,
  getCustomRingtone, setCustomRingtone, clearCustomRingtone, fileToDataUrl,
} from "../../lib/notify";

const CUSTOM_MAX_BYTES = 3 * 1024 * 1024; // 3 Mo

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
  override_code: "MAWEJA2025",
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

  /* ─── Sonneries (stockées en localStorage) ─── */
  const [ringtone, setRingtone] = useState<RingtoneId>("maweja");
  const [volume, setVolume] = useState<number>(1);
  const [customName, setCustomName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRingtone(getSelectedRingtone());
    setVolume(getRingtoneVolume());
    const c = getCustomRingtone();
    setCustomName(c?.name || null);
  }, []);

  const onPickRingtone = (id: RingtoneId) => {
    if (id === "custom" && !customName) {
      fileInputRef.current?.click();
      return;
    }
    setRingtone(id);
    setSelectedRingtone(id);
    playRingtone(id, volume);
    const label = id === "custom" ? (customName || "Sonnerie personnalisée") : RINGTONES.find(r => r.id === id)?.label || "";
    toast({ title: "Sonnerie sélectionnée", description: label });
  };

  const onChangeVolume = (v: number) => {
    setVolume(v);
    setRingtoneVolume(v);
  };

  const onUploadCustom = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Format invalide", description: "Choisis un fichier audio (mp3, wav, ogg, m4a…)", variant: "destructive" });
      return;
    }
    if (file.size > CUSTOM_MAX_BYTES) {
      toast({
        title: "Fichier trop volumineux",
        description: `Limite : ${(CUSTOM_MAX_BYTES / 1024 / 1024).toFixed(0)} Mo. Le tien : ${(file.size / 1024 / 1024).toFixed(2)} Mo.`,
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setCustomRingtone(dataUrl, file.name);
      setCustomName(file.name);
      setRingtone("custom");
      setSelectedRingtone("custom");
      playRingtone("custom", volume);
      toast({ title: "Sonnerie importée 🎵", description: file.name });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Import impossible", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onClearCustom = () => {
    clearCustomRingtone();
    setCustomName(null);
    if (ringtone === "custom") {
      setRingtone("maweja");
      setSelectedRingtone("maweja");
    }
    toast({ title: "Sonnerie personnalisée supprimée" });
  };

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

        {/* ─── Sonneries de notification ─── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-purple-50 dark:bg-purple-950/30 rounded-xl flex items-center justify-center">
              <Music size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Sonneries de notification</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choisissez la sonnerie jouée pour les nouvelles commandes et messages</p>
            </div>
          </div>

          {/* Volume */}
          <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Volume2 size={14} /> Volume
              </label>
              <span className="text-xs font-bold text-purple-600 tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => onChangeVolume(parseFloat(e.target.value))}
              data-testid="slider-ringtone-volume"
              className="w-full accent-purple-600"
            />
          </div>

          {/* Liste de sonneries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {RINGTONES.map(r => {
              const active = ringtone === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onPickRingtone(r.id)}
                  data-testid={`ringtone-${r.id}`}
                  className={`relative text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    active
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800/40"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                  }`}>
                    {active ? <Check size={16} /> : <Play size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${active ? "text-purple-700 dark:text-purple-300" : "text-gray-900 dark:text-white"}`}>
                      {r.label}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{r.description}</p>
                  </div>
                  {r.id === "maweja" && (
                    <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">DÉFAUT</span>
                  )}
                </button>
              );
            })}

            {/* Carte sonnerie personnalisée */}
            <button
              type="button"
              onClick={() => onPickRingtone("custom")}
              data-testid="ringtone-custom"
              className={`relative text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                ringtone === "custom"
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-950/30"
                  : customName
                    ? "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800/40"
                    : "border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/10 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              } sm:col-span-2`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                ringtone === "custom" ? "bg-purple-600 text-white" : "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
              }`}>
                {ringtone === "custom" ? <Check size={16} /> : <Upload size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold truncate ${ringtone === "custom" ? "text-purple-700 dark:text-purple-300" : "text-gray-900 dark:text-white"}`}>
                  {customName || "Importer ma propre sonnerie"}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {customName ? "Sonnerie personnalisée importée" : "Clique pour choisir un fichier audio (MP3, WAV, OGG, M4A · max 3 Mo)"}
                </p>
              </div>
              <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">PERSO</span>
            </button>
          </div>

          {/* Input file caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
            className="hidden"
            data-testid="input-custom-ringtone"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadCustom(f);
            }}
          />

          {/* Actions */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => playRingtone(ringtone, volume)}
              data-testid="button-test-ringtone"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors"
            >
              <Play size={14} /> Tester la sonnerie sélectionnée
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="button-upload-ringtone"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-purple-600 text-purple-700 dark:text-purple-400 text-sm font-bold hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Import en cours…" : customName ? "Remplacer la sonnerie perso" : "Importer une sonnerie"}
            </button>
            {customName && (
              <button
                type="button"
                onClick={onClearCustom}
                data-testid="button-clear-ringtone"
                title="Supprimer la sonnerie personnalisée"
                className="sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30 text-sm font-bold transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            La sonnerie est sauvegardée dans ton navigateur (localStorage) et jouée automatiquement à chaque nouvelle commande / message.
            Le fichier perso reste sur ton appareil — il n'est pas envoyé sur le serveur.
          </p>
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

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center">
              <Lock size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Sécurité — Code d'accès Override</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Code requis pour modifier les statuts finaux des commandes (Livrée, Annulée, Retournée)</p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Code d'accès override</label>
            <input
              type="text"
              value={form.override_code}
              onChange={e => set("override_code", e.target.value)}
              placeholder="MAWEJA2025"
              data-testid="input-override-code"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1">
              <Lock size={10} /> Ce code est confidentiel. Partagez-le uniquement avec les personnes autorisées à modifier les statuts finaux.
            </p>
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
