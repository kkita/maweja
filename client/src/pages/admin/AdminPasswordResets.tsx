import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../../lib/queryClient";
import AdminLayout from "../../components/AdminLayout";
import { Key, MessageCircle, Mail, Clock, CheckCircle2, XCircle, RefreshCw, Copy, Lock, User, Phone, ChevronDown, ChevronUp } from "lucide-react";
import type { PasswordResetRequest } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
    resolved: { label: "Resolu", color: "bg-green-100 text-green-700" },
    rejected: { label: "Rejete", color: "bg-red-100 text-red-700" },
  };
  const s = map[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.color}`}>{s.label}</span>;
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = { driver: "bg-blue-100 text-blue-700", client: "bg-purple-100 text-purple-700", admin: "bg-gray-100 text-gray-700" };
  const labels: Record<string, string> = { driver: "Agent", client: "Client", admin: "Admin" };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${map[role] || "bg-gray-100 text-gray-600"}`}>{labels[role] || role}</span>;
}

function ResetRequestCard({ req, onRefresh }: { req: PasswordResetRequest; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [note, setNote] = useState(req.adminNote || "");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [error, setError] = useState("");

  const resetLink = req.token ? `${window.location.origin}/reset-password/${req.token}` : null;

  const handleCopyLink = () => {
    if (!resetLink) return;
    navigator.clipboard.writeText(resetLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleUpdateStatus = async (status: string) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/api/admin/password-reset-requests/${req.id}`, { method: "PATCH", body: JSON.stringify({ status, adminNote: note || undefined }) });
      onRefresh();
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError("Le mot de passe doit contenir au moins 6 caracteres"); return; }
    setPwdLoading(true);
    setError("");
    try {
      await apiRequest(`/api/admin/password-reset-requests/${req.id}/set-password`, { method: "POST", body: JSON.stringify({ newPassword }) });
      setNewPassword("");
      onRefresh();
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setPwdLoading(false);
    }
  };

  const createdAt = req.createdAt ? new Date(req.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${req.requestType === "email" ? "bg-blue-100 dark:bg-blue-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
              {req.requestType === "email" ? <Mail size={18} className="text-blue-500" /> : <MessageCircle size={18} className="text-red-500" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{req.userName}</span>
                <RoleBadge role={req.userRole} />
                <StatusBadge status={req.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {req.userEmail && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Mail size={11} />{req.userEmail}</span>}
                {req.userPhone && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Phone size={11} />{req.userPhone}</span>}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Clock size={11} className="text-gray-400" />
                <span className="text-xs text-gray-400">{createdAt}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} data-testid={`btn-expand-${req.id}`} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg flex-shrink-0">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {req.message && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">"{req.message}"</p>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
          {req.status === "pending" && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Reinitialiser le mot de passe directement</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nouveau mot de passe (min. 6 car.)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      data-testid={`input-new-pwd-${req.id}`}
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    />
                  </div>
                  <button
                    onClick={handleSetPassword}
                    disabled={pwdLoading}
                    data-testid={`btn-set-pwd-${req.id}`}
                    className="px-4 py-2.5 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: "#EC0000" }}
                  >
                    {pwdLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock size={14} /> Appliquer</>}
                  </button>
                </div>
              </div>

              {req.requestType === "email" && resetLink && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Lien de reinitialisation a envoyer</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-xs text-blue-700 dark:text-blue-300 break-all font-mono">{resetLink}</div>
                    <button onClick={handleCopyLink} data-testid={`btn-copy-link-${req.id}`} className="px-3 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5">
                      <Copy size={14} />
                      {copied ? "Copie!" : "Copier"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Valide pendant 24h. Copiez ce lien et envoyez-le a l'utilisateur par email ou WhatsApp.</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Note admin (optionnel)</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Note interne sur cette demande..."
                  data-testid={`input-admin-note-${req.id}`}
                  rows={2}
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus("resolved")}
                  disabled={loading}
                  data-testid={`btn-resolve-${req.id}`}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Marquer resolu
                </button>
                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={loading}
                  data-testid={`btn-reject-${req.id}`}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <XCircle size={15} /> Rejeter
                </button>
              </div>
            </>
          )}

          {req.status !== "pending" && (
            <div className="space-y-2">
              {req.adminNote && (
                <div className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Note admin :</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{req.adminNote}</p>
                </div>
              )}
              {req.resolvedAt && (
                <p className="text-xs text-gray-400">
                  {req.status === "resolved" ? "Resolu" : "Rejete"} le {new Date(req.resolvedAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              <button
                onClick={() => handleUpdateStatus("pending")}
                disabled={loading}
                data-testid={`btn-reopen-${req.id}`}
                className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} /> Rouvrir la demande
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPasswordResets() {
  const [filter, setFilter] = useState<"all" | "pending" | "resolved" | "rejected">("all");

  const { data: requests = [], refetch, isLoading } = useQuery<PasswordResetRequest[]>({
    queryKey: ["/api/admin/password-reset-requests"],
  });

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <AdminLayout title="Réinitialisation Mots de Passe" subtitle="Gérez les demandes de réinitialisation">
      <div className="max-w-3xl mx-auto">
        {pendingCount > 0 && (
          <div className="flex justify-end mb-4">
            <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full" data-testid="badge-pending-count">{pendingCount} en attente</span>
          </div>
        )}

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(["all", "pending", "resolved", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filter === f ? "text-white shadow-md" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}`}
              style={filter === f ? { backgroundColor: "#EC0000" } : {}}
            >
              {f === "all" ? "Toutes" : f === "pending" ? "En attente" : f === "resolved" ? "Resolues" : "Rejetees"}
              {f === "all" && ` (${requests.length})`}
              {f !== "all" && ` (${requests.filter(r => r.status === f).length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-semibold">Aucune demande</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {filter === "pending" ? "Aucune demande en attente pour l'instant." : "Aucune demande dans cette categorie."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <ResetRequestCard key={req.id} req={req} onRefresh={() => { refetch(); queryClient.invalidateQueries({ queryKey: ["/api/admin/password-reset-requests"] }); }} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
