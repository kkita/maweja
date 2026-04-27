import { Briefcase, Eye } from "lucide-react";
import type { ServiceRequest } from "@shared/schema";
import { AdminSearchInput, EmptyState } from "../AdminUI";
import type { Translations } from "../../../lib/i18n";

type StatusEntry = { label: string; color: string; bg: string };

export default function RequestsTab({
  requests, search, setSearch, statusFilter, setStatusFilter, statusConfig, t, onManage,
}: {
  requests: ServiceRequest[];
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  statusConfig: Record<string, StatusEntry>;
  t: Translations;
  onManage: (req: ServiceRequest) => void;
}) {
  return (
    <>
      <div className="flex gap-3 mb-4">
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t.admin.searchPlaceholder}
          className="flex-1"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          data-testid="select-status-filter"
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30">
          <option value="all">{t.admin.allStatuses}</option>
          <option value="pending">{t.admin.pending}</option>
          <option value="reviewing">{t.admin.reviewing}</option>
          <option value="accepted">{t.admin.accepted}</option>
          <option value="rejected">{t.admin.rejected}</option>
          <option value="completed">{t.admin.completed}</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <EmptyState icon={Briefcase} title={t.admin.noRequests} description="Aucune demande ne correspond à votre filtre." />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const status = statusConfig[req.status] || statusConfig.pending;
            return (
              <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow"
                data-testid={`admin-request-${req.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">#{req.id} - {req.categoryName}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{req.fullName} • {req.phone}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{req.address}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {req.serviceType && <span>{t.services.type}: {req.serviceType}</span>}
                      {req.budget && <span>{t.admin.budget}: {req.budget}</span>}
                      <span>{req.scheduledType === "asap" ? t.services.asap : `${req.scheduledDate} ${req.scheduledTime}`}</span>
                    </div>
                    {req.additionalInfo && <p className="text-xs text-zinc-500 mt-1 italic">"{req.additionalInfo}"</p>}
                  </div>
                  <button onClick={() => onManage(req)}
                    data-testid={`button-manage-${req.id}`}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1">
                    <Eye size={14} /> {t.admin.manageRequest}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
