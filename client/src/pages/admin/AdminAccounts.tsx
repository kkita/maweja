import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../lib/auth";
import { UserPlus, Trash2, Edit2, Shield, Key, User, Mail, Phone, ChevronDown, Eye, EyeOff, X } from "lucide-react";

type AdminRole = "superadmin" | "marketing" | "finance" | "support";

const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super Admin",
  marketing: "Agent Marketing",
  finance: "Agent Financier",
  support: "Support Client",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  superadmin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  marketing: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  finance: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  support: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  superadmin: ["Accès complet à toutes les sections", "Gestion des comptes admin", "Paramètres système"],
  marketing: ["Marketing & Publicités", "Notifications", "Clients", "Analyse des données"],
  finance: ["Finance & Paiements", "Reversements restaurants", "Rapports financiers"],
  support: ["Commandes", "Chat client", "Clients", "Services à la demande"],
};

interface AdminAccount {
  id: number;
  name: string;
  email: string;
  phone: string;
  adminRole: AdminRole | null;
  createdAt: string;
}

function AccountModal({ account, onClose, onSave }: { account?: AdminAccount; onClose: () => void; onSave: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: account?.name || "",
    email: account?.email || "",
    phone: account?.phone || "",
    password: "",
    adminRole: (account?.adminRole || "support") as AdminRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!account;

  const save = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Champs requis", description: "Nom, email et téléphone sont obligatoires", variant: "destructive" });
      return;
    }
    if (!isEdit && !form.password) {
      toast({ title: "Mot de passe requis", description: "Un mot de passe est nécessaire pour le nouveau compte", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        const body: any = { adminRole: form.adminRole, name: form.name, phone: form.phone };
        if (form.password) body.password = form.password;
        await authFetchJson(`/api/admin/accounts/${account!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: "Compte mis à jour" });
      } else {
        await authFetchJson("/api/admin/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast({ title: "Compte créé avec succès" });
      }
      onSave();
      onClose();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center">
              {isEdit ? <Edit2 size={18} className="text-red-600" /> : <UserPlus size={18} className="text-red-600" />}
            </div>
            <h2 className="font-black text-gray-900 dark:text-white text-lg">
              {isEdit ? "Modifier le compte" : "Nouveau compte admin"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors" data-testid="close-modal">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Role selection */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Rôle</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_LABELS) as AdminRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => setForm(f => ({ ...f, adminRole: role }))}
                  data-testid={`role-${role}`}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${form.adminRole === role
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Shield size={14} className={form.adminRole === role ? "text-red-600 mb-1" : "text-gray-400 mb-1"} />
                  <p className={`text-xs font-bold ${form.adminRole === role ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>
                    {ROLE_LABELS[role]}
                  </p>
                </button>
              ))}
            </div>
            {form.adminRole && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Accès autorisés:</p>
                <ul className="space-y-0.5">
                  {ROLE_PERMISSIONS[form.adminRole].map(perm => (
                    <li key={perm} className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Nom complet</label>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-red-400 transition-colors">
              <User size={14} className="text-gray-400" />
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Prénom Nom"
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                data-testid="input-name"
              />
            </div>
          </div>

          {/* Email - disabled in edit */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Email</label>
            <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-colors ${isEdit ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50" : "border-gray-200 dark:border-gray-700 focus-within:border-red-400"}`}>
              <Mail size={14} className="text-gray-400" />
              <input
                value={form.email}
                onChange={e => !isEdit && setForm(f => ({ ...f, email: e.target.value }))}
                disabled={isEdit}
                placeholder="admin@example.com"
                type="email"
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none disabled:text-gray-400"
                data-testid="input-email"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Téléphone</label>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-red-400 transition-colors">
              <Phone size={14} className="text-gray-400" />
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="081XXXXXXX"
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                data-testid="input-phone"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              {isEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
            </label>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-red-400 transition-colors">
              <Key size={14} className="text-gray-400" />
              <input
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                type={showPassword ? "text" : "password"}
                placeholder={isEdit ? "Laisser vide pour conserver" : "Minimum 6 caractères"}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                data-testid="input-password"
              />
              <button onClick={() => setShowPassword(s => !s)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-black shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all active:scale-95 disabled:opacity-50"
            data-testid="btn-save-account"
          >
            {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAccounts() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [modal, setModal] = useState<"create" | AdminAccount | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: accounts = [], refetch } = useQuery<AdminAccount[]>({
    queryKey: ["/api/admin/accounts"],
  });

  const deleteAccount = async (id: number) => {
    if (!confirm("Supprimer ce compte admin ?")) return;
    setDeleting(id);
    try {
      await authFetchJson(`/api/admin/accounts/${id}`, { method: "DELETE" });
      toast({ title: "Compte supprimé" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const isSuperAdmin = !currentUser?.adminRole || currentUser?.adminRole === "superadmin";

  const roleStats = (Object.keys(ROLE_LABELS) as AdminRole[]).map(role => ({
    role,
    count: accounts.filter(a => (a.adminRole || "superadmin") === role).length,
  }));

  return (
    <AdminLayout title="Gestion des Comptes" subtitle="Créez et gérez les comptes administrateurs">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {roleStats.map(({ role, count }) => (
            <div key={role} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm" data-testid={`stat-role-${role}`}>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">compte{count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>

        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Tous les Comptes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{accounts.length} compte{accounts.length !== 1 ? "s" : ""} admin enregistrés</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setModal("create")}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all active:scale-95"
              data-testid="btn-add-account"
            >
              <UserPlus size={16} />
              Nouveau compte
            </button>
          )}
        </div>

        {/* Accounts list */}
        {accounts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-16 border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-bold text-gray-500 dark:text-gray-400">Aucun compte admin trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(account => {
              const role = (account.adminRole || "superadmin") as AdminRole;
              const isCurrentUser = account.id === currentUser?.id;
              return (
                <div
                  key={account.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                  data-testid={`account-row-${account.id}`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg shadow-lg shadow-red-200 dark:shadow-red-900/30">
                    {account.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-gray-900 dark:text-white truncate">{account.name}</p>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Vous</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{account.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{account.phone}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl flex-shrink-0 ${ROLE_COLORS[role]}`}>
                    {ROLE_LABELS[role]}
                  </span>

                  {/* Actions */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setModal(account)}
                        className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                        data-testid={`btn-edit-${account.id}`}
                      >
                        <Edit2 size={14} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      {!isCurrentUser && (
                        <button
                          onClick={() => deleteAccount(account.id)}
                          disabled={deleting === account.id}
                          className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors disabled:opacity-50"
                          data-testid={`btn-delete-${account.id}`}
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Role permissions reference */}
        <div className="mt-10">
          <h3 className="font-black text-gray-900 dark:text-white mb-4">Référence des Permissions par Rôle</h3>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(ROLE_LABELS) as AdminRole[]).map(role => (
              <div key={role} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-red-600" />
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
                </div>
                <ul className="space-y-1.5">
                  {ROLE_PERMISSIONS[role].map(perm => (
                    <li key={perm} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">Made By Khevin Andrew Kita - Ed Corporation</p>
      </div>

      {modal && (
        <AccountModal
          account={modal === "create" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
          }}
        />
      )}
    </AdminLayout>
  );
}
