import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { backdropVariants, scaleInVariants } from "../../../lib/motion";
import type { DispatchDriver } from "./types";

interface Props {
  editingDriver: DispatchDriver | null;
  onClose: () => void;
}

interface DriverForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicleType: string;
  vehiclePlate: string;
  driverLicense: string;
  commissionRate: number;
}

const defaultForm: DriverForm = { name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 };

const TEXT_FIELD_KEYS = ["name", "email", "phone", "password", "vehiclePlate", "driverLicense"] as const;
type TextFieldKey = (typeof TEXT_FIELD_KEYS)[number];

export default function DriverFormModal({ editingDriver, onClose }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editingDriver) {
      setForm({
        name: editingDriver.name,
        email: editingDriver.email ?? "",
        phone: editingDriver.phone,
        password: "",
        vehicleType: editingDriver.vehicleType || "moto",
        vehiclePlate: (editingDriver as { vehiclePlate?: string }).vehiclePlate ?? "",
        driverLicense: (editingDriver as { driverLicense?: string }).driverLicense ?? "",
        commissionRate: (editingDriver as { commissionRate?: number }).commissionRate ?? 15,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingDriver]);

  const handleSave = async () => {
    try {
      if (editingDriver) {
        const { password, ...updateData } = form;
        const payload = password ? { ...updateData, password } : updateData;
        await apiRequest(`/api/drivers/${editingDriver.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast({ title: "Agent mis a jour" });
      } else {
        if (!form.password) { toast({ title: "Mot de passe requis", variant: "destructive" }); return; }
        await apiRequest("/api/drivers", { method: "POST", body: JSON.stringify(form) });
        toast({ title: "Agent ajoute!" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  };

  const fields: { label: string; key: TextFieldKey; type: string; testid: string }[] = [
    { label: "Nom complet *", key: "name", type: "text", testid: "input-driver-name" },
    { label: "Email (optionnel)", key: "email", type: "email", testid: "input-driver-email" },
    { label: "Telephone *", key: "phone", type: "tel", testid: "input-driver-phone" },
    ...(!editingDriver ? [{ label: "Mot de passe *", key: "password" as TextFieldKey, type: "password", testid: "input-driver-password" }] : []),
    { label: "Plaque", key: "vehiclePlate", type: "text", testid: "input-vehicle-plate" },
    { label: "N° pièce d'identité", key: "driverLicense", type: "text", testid: "input-license" },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ zIndex: 10000 }}
        onClick={e => e.stopPropagation()}
        variants={scaleInVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{editingDriver ? "Modifier l'agent" : "Nouvel agent"}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold text-zinc-500 mb-1 block">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                data-testid={f.testid}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 mb-1 block">Vehicule</label>
            <select
              value={form.vehicleType}
              onChange={e => setForm({ ...form, vehicleType: e.target.value })}
              data-testid="select-vehicle-type"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
            >
              <option value="moto">Moto</option>
              <option value="velo">Velo</option>
              <option value="voiture">Voiture</option>
              <option value="scooter">Scooter</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 mb-1 block">Commission (%)</label>
            <input
              type="number"
              value={form.commissionRate}
              onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })}
              data-testid="input-commission"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            data-testid="button-save-driver"
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200"
          >
            {editingDriver ? "Mettre a jour" : "Creer l'agent"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-zinc-100 rounded-xl text-sm font-semibold text-zinc-600">Annuler</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
