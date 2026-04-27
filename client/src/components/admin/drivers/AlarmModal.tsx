import { Bell, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { backdropVariants, scaleInVariants } from "../../../lib/motion";

interface Props {
  driver: { id: number; name: string };
  reason: string;
  onReasonChange: (v: string) => void;
  onSend: (driverId: number, reason: string) => void;
  onClose: () => void;
}

export default function AlarmModal({ driver, reason, onReasonChange, onSend, onClose }: Props) {
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
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-5 w-full max-w-md"
        style={{ zIndex: 10000 }}
        onClick={e => e.stopPropagation()}
        variants={scaleInVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Bell size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Envoyer une alarme</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">a {driver.name}</p>
          </div>
        </div>
        <select
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
          data-testid="alarm-reason-select"
          className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white mb-2"
        >
          <option value="">Choisir un motif...</option>
          <option value="Retard de livraison detecte - Accelerez votre course">Retard de livraison</option>
          <option value="Client en attente - Merci de vous depecher">Client en attente</option>
          <option value="Changement d'adresse de livraison - Verifiez vos commandes">Changement d'adresse</option>
          <option value="Contactez l'administration immediatement">Contact urgent</option>
          <option value="Votre position GPS n'est plus visible - Reactiver la localisation">GPS perdu</option>
        </select>
        <input
          type="text"
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
          placeholder="Ou tapez un message personnalise..."
          data-testid="alarm-reason-input"
          className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSend(driver.id, reason)}
            data-testid="button-send-alarm"
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
          >
            <Zap size={14} /> Envoyer l'alarme
          </button>
          <button onClick={onClose} className="px-5 py-3 bg-zinc-100 rounded-xl text-sm font-semibold text-zinc-600">Annuler</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
