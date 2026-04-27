import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { ServiceRequest } from "@shared/schema";
import type { Translations } from "../../../lib/i18n";

export default function RequestDetailModal({
  request, t, onClose, onSubmit, pending,
}: {
  request: ServiceRequest | null;
  t: Translations;
  onClose: () => void;
  onSubmit: (data: { status: string; adminNotes: string }) => void;
  pending: boolean;
}) {
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (request) {
      setNewStatus(request.status);
      setAdminNotes(request.adminNotes || "");
    }
  }, [request?.id]);

  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" data-testid="modal-manage-request">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{t.services.request} #{request.id}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="space-y-3 mb-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-sm">
          <p><strong>{t.services.service}:</strong> {request.categoryName}</p>
          <p><strong>{t.common.name}:</strong> {request.fullName}</p>
          <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.contactMethod === "whatsapp" ? "bg-green-100 text-green-600" :
              request.contactMethod === "email" ? "bg-blue-100 text-blue-600" :
              "bg-red-100 text-red-600"
            }`}>
              {request.contactMethod === "whatsapp" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.49l4.624-1.215A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.17 0-4.18-.682-5.832-1.843l-.418-.248-2.745.72.734-2.682-.274-.435A9.78 9.78 0 012.182 12c0-5.413 4.405-9.818 9.818-9.818S21.818 6.587 21.818 12 17.413 21.818 12 21.818z"/></svg>
              ) : request.contactMethod === "email" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase">
                {request.contactMethod === "whatsapp" ? "WhatsApp" : request.contactMethod === "email" ? "Email" : "Téléphone"}
              </p>
              <p className="font-bold text-zinc-900 dark:text-white text-base">{request.phone}</p>
            </div>
          </div>
          <p><strong>{t.common.address}:</strong> {request.address}</p>
          {request.serviceType && <p><strong>{t.services.type}:</strong> {request.serviceType}</p>}
          {request.budget && <p><strong>{t.admin.budget}:</strong> {request.budget}</p>}
          <p><strong>{t.admin.schedule}:</strong> {request.scheduledType === "asap" ? t.services.asap : `${request.scheduledDate} ${request.scheduledTime}`}</p>
          {(() => {
            const info = request.additionalInfo || "";
            const imageMatch = info.match(/\[Image:\s*([^\]]+)\]/);
            const customFieldsMatch = info.match(/\[CustomFields:(.*)\]/s);
            let parsedCustomFields: { label: string; value: string }[] = [];
            try { if (customFieldsMatch) parsedCustomFields = JSON.parse(customFieldsMatch[1]); } catch {}
            const cleanedInfo = info.replace(/\[Image:\s*[^\]]+\]/g, "").replace(/\[CustomFields:.*\]/s, "").trim();
            return (
              <>
                {imageMatch && imageMatch[1] && (
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-1.5">Photo du catalogue</p>
                    <a href={imageMatch[1]} target="_blank" rel="noopener noreferrer">
                      <img
                        src={imageMatch[1]}
                        alt="Modèle sélectionné"
                        className="w-full max-h-48 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity cursor-pointer"
                        data-testid="img-request-catalog"
                      />
                    </a>
                  </div>
                )}
                {parsedCustomFields.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Champs personnalisés</p>
                    {parsedCustomFields.map((cf, i) => (
                      <div key={i} className="flex justify-between items-start gap-2">
                        <span className="text-xs text-zinc-500 font-medium">{cf.label}</span>
                        {cf.value.startsWith("/uploads/") || cf.value.startsWith("/cloud/") || cf.value.startsWith("http") ? (
                          <a href={cf.value} target="_blank" rel="noopener noreferrer">
                            <img src={cf.value} alt={cf.label} className="w-16 h-16 object-cover rounded-lg border" />
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-900 dark:text-white font-bold text-right">{cf.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {cleanedInfo && <p><strong>{t.admin.info}:</strong> {cleanedInfo}</p>}
              </>
            );
          })()}
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.statusLabel}</label>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            data-testid="select-new-status"
            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white">
            <option value="pending">{t.status.pending}</option>
            <option value="reviewing">{t.status.reviewing}</option>
            <option value="accepted">{t.status.accepted}</option>
            <option value="rejected">{t.status.rejected}</option>
            <option value="completed">{t.status.completed}</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.adminNotes}</label>
          <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder={t.admin.adminNotesPlaceholder}
            data-testid="input-admin-notes"
            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white h-24 resize-none" />
        </div>
        <button onClick={() => onSubmit({ status: newStatus, adminNotes })}
          disabled={pending}
          data-testid="button-save-request"
          className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
          {pending ? t.admin.updating : t.admin.updateButton}
        </button>
      </div>
    </div>
  );
}
