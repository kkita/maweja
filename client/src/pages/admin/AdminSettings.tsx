import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Settings, Bell, Globe, Shield, Palette, Save } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    appName: "MAWEJA",
    defaultDeliveryFee: 2500,
    minOrder: 3000,
    maxRadius: 15,
    notifications: true,
    autoAssign: true,
    loyaltyEnabled: true,
    pointsPerOrder: 10,
    currency: "FC",
  });

  const handleSave = () => {
    toast({ title: "Parametres sauvegardes", description: "Les modifications ont ete appliquees" });
  };

  return (
    <AdminLayout title="Parametres">
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Configuration generale</h3>
              <p className="text-xs text-gray-500">Parametres de base de l'application</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nom de l'application</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                data-testid="setting-app-name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Devise</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                data-testid="setting-currency"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Frais de livraison par defaut (FC)</label>
              <input
                type="number"
                value={settings.defaultDeliveryFee}
                onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })}
                data-testid="setting-delivery-fee"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Commande minimum (FC)</label>
              <input
                type="number"
                value={settings.minOrder}
                onChange={(e) => setSettings({ ...settings, minOrder: Number(e.target.value) })}
                data-testid="setting-min-order"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Rayon de livraison max (km)</label>
              <input
                type="number"
                value={settings.maxRadius}
                onChange={(e) => setSettings({ ...settings, maxRadius: Number(e.target.value) })}
                data-testid="setting-max-radius"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Points par commande</label>
              <input
                type="number"
                value={settings.pointsPerOrder}
                onChange={(e) => setSettings({ ...settings, pointsPerOrder: Number(e.target.value) })}
                data-testid="setting-points"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Notifications et automatisation</h3>
              <p className="text-xs text-gray-500">Gerer les alertes et l'attribution automatique</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: "notifications", label: "Notifications push", desc: "Recevoir des alertes pour les nouvelles commandes" },
              { key: "autoAssign", label: "Attribution automatique", desc: "Attribuer automatiquement les commandes aux livreurs disponibles" },
              { key: "loyaltyEnabled", label: "Programme de fidelite", desc: "Activer le systeme de points de fidelite" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, [item.key]: !(settings as any)[item.key] })}
                  data-testid={`toggle-${item.key}`}
                  className={`w-12 h-6 rounded-full transition-all relative ${(settings as any)[item.key] ? "bg-red-600" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${(settings as any)[item.key] ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          data-testid="button-save-settings"
          className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
        >
          <Save size={16} /> Sauvegarder les parametres
        </button>
      </div>
    </AdminLayout>
  );
}
