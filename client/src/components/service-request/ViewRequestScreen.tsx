import ClientNav from "../ClientNav";
import { ArrowLeft } from "lucide-react";
import { srCard } from "./srStyles";
import type { ServiceRequest } from "@shared/schema";

interface ViewRequestScreenProps {
  navigate: (href: string) => void;
  t: any;
  existingRequest: ServiceRequest;
}

export default function ViewRequestScreen({ navigate, t, existingRequest }: ViewRequestScreenProps) {
  const statusLabels: Record<string, string> = {
    pending: t.services.statusPending,
    reviewing: t.services.statusReviewing,
    accepted: t.services.statusAccepted,
    rejected: t.services.statusRejected,
    completed: t.services.statusCompleted,
  };
  const statusStyles: Record<string, { pill: string; dot: string }> = {
    pending:   { pill: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40", dot: "bg-amber-500" },
    reviewing: { pill: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40", dot: "bg-blue-500" },
    accepted:  { pill: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/40", dot: "bg-green-500" },
    rejected:  { pill: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/40", dot: "bg-red-500" },
    completed: { pill: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700", dot: "bg-gray-400" },
  };
  const st = statusStyles[existingRequest.status] || statusStyles.pending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/services")}
            className="w-11 h-11 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm"
            data-testid="button-back"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-gray-900 dark:text-white" style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}>
              {t.services.request} #{existingRequest.id}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">{existingRequest.categoryName}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${st.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {statusLabels[existingRequest.status] || existingRequest.status}
          </span>
        </div>

        <div className={`${srCard} p-5 space-y-4`}>
          {[
            { label: t.services.fullName, value: existingRequest.fullName },
            { label: t.common.phone, value: existingRequest.phone },
            { label: t.common.address, value: existingRequest.address },
            existingRequest.serviceType ? { label: t.services.type, value: existingRequest.serviceType } : null,
            existingRequest.budget ? { label: t.admin.budget, value: existingRequest.budget } : null,
            {
              label: t.admin.schedule,
              value: existingRequest.scheduledType === "asap"
                ? t.services.asap
                : `${existingRequest.scheduledDate} ${existingRequest.scheduledTime}`,
            },
            existingRequest.additionalInfo ? { label: t.services.additionalInfo, value: existingRequest.additionalInfo } : null,
          ].filter(Boolean).map((row: any, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{row.label}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{row.value}</p>
            </div>
          ))}

          {existingRequest.adminNotes && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/40 mt-2">
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">{t.services.teamResponse}</p>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{existingRequest.adminNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
