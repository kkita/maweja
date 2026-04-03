import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../lib/auth";
import {
  UserPlus, Trash2, Edit2, Shield, Key, User, Mail, Phone,
  Eye, EyeOff, X, Ban, CheckCircle, AlertCircle, LayoutDashboard,
  Package, Truck, Store, Users, MessageCircle, DollarSign, BarChart3,
  Briefcase, Image, Megaphone, Settings, UserCog
} from "lucide-react";

const ALL_PERMISSIONS = [
  { key: "orders", label: "Commandes", icon: Package },
  {key: "drivers", label: "Agents", icon: Truck },
  { key: "verifications", label: "Vérifications", icon: Shield },
  { key: "restaurants", label: "Restaurants", icon: Store },
  { key: "customers", label: "Clients", icon: Users },
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "finance", label: "Finance", icon: DollarSign },
  { key: "marketing", label: "Marketing", icon: BarChart3 },
  { key: "services", label: "Services", icon: Briefcase },
  { key: "ads", label: "Publicités", icon: Image },
  { key: "notifications", label: "Notifications", icon: Megaphone },
  { key: "accounts", label: "Comptes Admin", icon: UserCog },
  { key: "settings", label: "Paramètres", icon: Settings },
];

interface AdminAccount {
  id: number;
  name: string;
  email: string;
  phone: string;
  adminRole: string | null;
  adminPermissions: string[] | null;
  isBlocked: boolean;
  createdAt: string;
}

const PRIMARY_EMAILS = ["admin@maweja.cd", "admin@maweja.net"];

function isPrimary(account: AdminAccount) {
  return PRIMARY_EMAILS.includes(account.email);
}

function AccountModal({ account, onClose, onSave }: {
  account?: AdminAccount; onClose: () => void; onSave: () => void;
}) {
  const { toast } = useToast();
  // An account is superadmin if: adminRole is explicitly "superadmin",
  // OR adminRole is null with no adminPermissions set (primary accounts like admin@maweja.cd)
  const permsArr = account?.adminPermissions as string[] | null;
  const hasDedicatedPermissions = Array.isArray(permsArr) && permsArr.length > 0;
  const isSuperAdminDefault = !account?.adminRole || account?.adminRole === "superadmin";
  const isRestricted = isSuperAdminDefault && hasDedicatedPermissions; // null role but has permissions
  const isSuperAdmin = isSuperAdminDefault && !isRestricted;

  const [form, setForm] = useState({
    name: account?.name || "",
    email: account?.email || "",
    phone: account?.phone || "",
    password: "",
    isSuperAdmin: isSuperAdmin,
    permissions: permsArr || [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!account;

  const togglePermission = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const selectAll = () => setForm(f => ({ ...f, permissions: ALL_PERMISSIONS.map(p => p.key) }));
  const clearAll = () => setForm(f => ({ ...f, permissions: [] }));

  const save = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Champs requis", description: "Nom, email et téléphone sont obligatoires", variant: "destructive" });
      return;
    }
    if (!isEdit && !form.password) {
      toast({ title: "Mot de passe requis", description: "Un mot de passe est nécessaire pour le nouveau compte", variant: "destructive" });
      return;
    }
    if (!form.isSuperAdmin && form.permissions.length === 0) {
      toast({ title: "Permissions requises", description: "Sélectionnez au moins une permission pour ce compte", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const body: any = {
        name: form.name,
        phone: form.phone,
        adminRole: form.isSuperAdmin ? "superadmin" : null,
        adminPermissions: form.isSuperAdmin ? [] : form.permissions,
      };
      if (form.password) body.password = form.password;
      if (!isEdit) {
        body.email = form.email;
        await authFetchJson("/api/admin/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: "Compte créé avec succès" });
      } else {
        await authFetchJson(`/api/admin/accounts/${account!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: "Compte mis à jour" });
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
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
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

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Access type */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Type d'accès</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, isSuperAdmin: true }))}
                data-testid="role-superadmin"
                className={`p-4 rounded-2xl border-2 text-left transition-all ${form.isSuperAdmin
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <Shield size={18} className={form.isSuperAdmin ? "text-red-600 mb-1" : "text-gray-400 mb-1"} />
                <p className={`text-sm font-black ${form.isSuperAdmin ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>Super Admin</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Accès complet</p>
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, isSuperAdmin: false }))}
                data-testid="role-custom"
                className={`p-4 rounded-2xl border-2 text-left transition-all ${!form.isSuperAdmin
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <UserCog size={18} className={!form.isSuperAdmin ? "text-red-600 mb-1" : "text-gray-400 mb-1"} />
                <p className={`text-sm font-black ${!form.isSuperAdmin ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>Accès Limité</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Permissions choisies</p>
              </button>
            </div>
          </div>

          {/* Permissions checkboxes (only shown when not superadmin) */}
          {!form.isSuperAdmin && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Accès aux menus</label>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-[11px] font-bold text-red-600 hover:underline" data-testid="btn-select-all-perms">Tout sélectionner</button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button onClick={clearAll} className="text-[11px] font-bold text-gray-500 hover:underline" data-testid="btn-clear-all-perms">Effacer</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3">
                {ALL_PERMISSIONS.map(({ key, label, icon: Icon }) => {
                  const checked = form.permissions.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => togglePermission(key)}
                      data-testid={`perm-${key}`}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                        checked
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <Icon size={13} className={checked ? "text-white" : "text-gray-400"} />
                      <span className="text-[12px] font-semibold truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
              {form.permissions.length > 0 && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                  {form.permissions.length} permission{form.permissions.length > 1 ? "s" : ""} sélectionnée{form.permissions.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

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

        <div className="p-6 pt-0 flex gap-3 flex-shrink-0">
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
  const [blocking, setBlocking] = useState<number | null>(null);

  const { data: accounts = [], refetch } = useQuery<AdminAccount[]>({
    queryKey: ["/api/admin/accounts"],
  });

  const isSuperAdmin = !(currentUser as any)?.adminRole || (currentUser as any)?.adminRole === "superadmin";

  const deleteAccount = async (id: number) => {
    if (!confirm("Supprimer ce compte admin définitivement ?")) return;
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

  const toggleBlock = async (account: AdminAccount) => {
    const action = account.isBlocked ? "débloquer" : "bloquer";
    if (!confirm(`Voulez-vous ${action} ce compte ?`)) return;
    setBlocking(account.id);
    try {
      await authFetchJson(`/api/admin/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !account.isBlocked }),
      });
      toast({
        title: account.isBlocked ? "Compte débloqué" : "Compte bloqué",
        description: account.isBlocked ? "Le compte peut à nouveau se connecter." : "Ce compte ne peut plus accéder au panel.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setBlocking(null);
    }
  };

  const isAccountSuperAdmin = (account: AdminAccount) => {
    const perms = account.adminPermissions as string[] | null;
    return account.adminRole === "superadmin" || (!account.adminRole && (!perms || perms.length === 0));
  };

  const getAccountLabel = (account: AdminAccount) => {
    if (isAccountSuperAdmin(account)) return "Super Admin";
    const perms = account.adminPermissions;
    if (!perms || perms.length === 0) return "Aucune permission";
    return `${perms.length} permission${perms.length > 1 ? "s" : ""}`;
  };

  const getAccountColor = (account: AdminAccount) => {
    if (isAccountSuperAdmin(account)) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  };

  const superAdminCount = accounts.filter(a => isAccountSuperAdmin(a)).length;
  const limitedCount = accounts.filter(a => !isAccountSuperAdmin(a)).length;
  const blockedCount = accounts.filter(a => a.isBlocked).length;

  return (
    <AdminLayout title="Gestion des Comptes" subtitle="Créez et gérez les comptes administrateurs avec permissions granulaires">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm" data-testid="stat-superadmins">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
                <Shield size={15} className="text-red-600" />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Super Admins</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{superAdminCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm" data-testid="stat-limited">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                <UserCog size={15} className="text-blue-600" />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Accès Limité</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{limitedCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm" data-testid="stat-blocked">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center">
                <Ban size={15} className="text-orange-600" />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Bloqués</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{blockedCount}</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Tous les Comptes Admin</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{accounts.length} compte{accounts.length !== 1 ? "s" : ""} enregistrés</p>
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
              const isCurrentUser = account.id === currentUser?.id;
              const primary = isPrimary(account);
              return (
                <div
                  key={account.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all flex items-center gap-4 ${
                    account.isBlocked ? "border-orange-200 dark:border-orange-900/40" : "border-gray-100 dark:border-gray-800"
                  }`}
                  data-testid={`account-row-${account.id}`}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg shadow-lg ${
                    account.isBlocked ? "bg-gray-400 shadow-gray-200 dark:shadow-gray-900" : "bg-gradient-to-br from-red-500 to-red-700 shadow-red-200 dark:shadow-red-900/30"
                  }`}>
                    {account.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-gray-900 dark:text-white truncate">{account.name}</p>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Vous</span>
                      )}
                      {primary && (
                        <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">Principal</span>
                      )}
                      {account.isBlocked && (
                        <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Ban size={9} /> Bloqué
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{account.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{account.phone}</p>
                    {/* Permissions preview */}
                    {account.adminRole !== "superadmin" && account.adminPermissions && account.adminPermissions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {account.adminPermissions.slice(0, 4).map(key => {
                          const perm = ALL_PERMISSIONS.find(p => p.key === key);
                          return perm ? (
                            <span key={key} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-lg">
                              {perm.label}
                            </span>
                          ) : null;
                        })}
                        {account.adminPermissions.length > 4 && (
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">+{account.adminPermissions.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Role badge */}
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl flex-shrink-0 ${getAccountColor(account)}`}>
                    {getAccountLabel(account)}
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
                      {!primary && !isCurrentUser && (
                        <>
                          <button
                            onClick={() => toggleBlock(account)}
                            disabled={blocking === account.id}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${
                              account.isBlocked
                                ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40"
                                : "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                            }`}
                            data-testid={`btn-block-${account.id}`}
                          >
                            {account.isBlocked
                              ? <CheckCircle size={14} className="text-green-600" />
                              : <Ban size={14} className="text-orange-600" />
                            }
                          </button>
                          <button
                            onClick={() => deleteAccount(account.id)}
                            disabled={deleting === account.id}
                            className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors disabled:opacity-50"
                            data-testid={`btn-delete-${account.id}`}
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
