/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : événements liés aux commandes & services
   ───────────────────────────────────────────────────────────── */
import { playRingtone, vibrate, showNotif } from "./notifyAudio";

const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée ✅",
  preparing: "En préparation 👨‍🍳",
  ready: "Prête - Agent en route 🛵",
  picked_up: "Récupérée par l'agent 🛵",
  delivered: "Livrée ! 🎉",
  cancelled: "Annulée ❌",
};

const SERVICE_STATUS_FR: Record<string, string> = {
  pending: "En attente",
  reviewing: "En cours d'examen",
  accepted: "Acceptée ✅",
  rejected: "Refusée ❌",
  completed: "Terminée ✅",
};

export interface OrderEventData {
  type: string;
  status?: string;
  order?: { id?: number; orderNumber?: string | number; status?: string; imageUrl?: string | null } | null;
  request?: { serviceType?: string; categoryName?: string; imageUrl?: string | null } | null;
  data?: { status?: string; categoryName?: string; adminNotes?: string; imageUrl?: string | null } | null;
  imageUrl?: string | null;
  [k: string]: unknown;
}

function extractOrderImage(data: OrderEventData): string | undefined {
  return (
    data.order?.imageUrl ||
    data.request?.imageUrl ||
    data.data?.imageUrl ||
    data.imageUrl ||
    undefined
  );
}

/**
 * Returns true if the event was matched & handled.
 * Caller is responsible for dedupe and user-pref gating (ordersOn).
 */
export function handleOrderEvent(data: OrderEventData): boolean {
  const img = extractOrderImage(data);
  switch (data.type) {
    case "order_status": {
      const label = STATUS_FR[data.status ?? ""] || data.status || "";
      playRingtone(); vibrate("medium");
      showNotif("🍽️ MAWEJA – Commande", `Statut : ${label}`, undefined, img);
      return true;
    }
    case "order_updated": {
      const o = data.order;
      if (!o) return true;
      const label = STATUS_FR[o.status ?? ""] || o.status || "";
      playRingtone(); vibrate("medium");
      showNotif("🍽️ MAWEJA – Commande", `Commande #${o.orderNumber} : ${label}`, undefined, img);
      return true;
    }
    case "order_assigned": {
      playRingtone(); vibrate("double");
      showNotif("🛵 MAWEJA – Agent", "Un agent a été assigné à votre commande !", undefined, img);
      return true;
    }
    case "new_order": {
      const o = data.order;
      playRingtone(); vibrate("heavy");
      showNotif(
        "🛵 MAWEJA – Nouvelle commande",
        o ? `Commande #${o.orderNumber} disponible !` : "Nouvelle commande disponible !",
        undefined,
        img,
      );
      return true;
    }
    case "order_picked_up": {
      playRingtone(); vibrate("medium");
      const o = data.order;
      showNotif("🛵 MAWEJA – Récupérée", o ? `Commande #${o.orderNumber} en route` : "Commande récupérée", undefined, img);
      return true;
    }
    case "order_cancelled": {
      const oc = data.order;
      playRingtone(); vibrate("long");
      showNotif("❌ MAWEJA – Commande annulée", oc ? `Commande #${oc.orderNumber} a été annulée` : "Une commande a été annulée", undefined, img);
      return true;
    }
    case "driver_accepted_order": {
      playRingtone(); vibrate("medium");
      showNotif("✅ MAWEJA – Agent", "Un agent a accepté la commande", undefined, img);
      return true;
    }
    case "driver_refused_order": {
      vibrate("light");
      showNotif("⚠️ MAWEJA – Agent", "Un agent a refusé la commande", undefined, img);
      return true;
    }
    case "service_update": {
      const srv = data.data || (data as { status?: string; categoryName?: string; adminNotes?: string });
      const label = SERVICE_STATUS_FR[srv.status ?? ""] || srv.status || "";
      const note = srv.adminNotes ? `\n${srv.adminNotes}` : "";
      playRingtone(); vibrate("medium");
      showNotif("📋 MAWEJA – Service", `${srv.categoryName || "Demande"} : ${label}${note}`, undefined, img);
      return true;
    }
    case "new_service_request": {
      playRingtone(); vibrate("medium");
      const r = data.request;
      showNotif("📋 MAWEJA – Service", r ? `Nouvelle demande : ${r.serviceType || r.categoryName || "service"}` : "Nouvelle demande de service", undefined, img);
      return true;
    }
    default:
      return false;
  }
}
