import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../lib/auth";
import { UserPlus, Trash2, Edit2, Shield, Key, User, Mail, Phone, Eye, EyeOff, X, Ban, CheckCircle, Package, Truck, Store, Users, MessageCircle, DollarSign, BarChart3, Briefcase, Image, Megaphone, Settings, UserCog } from "lucide-react";
const ALL_PERMISSIONS = [
    { key: "orders", label: "Commandes", icon: Package },
    { key: "drivers", label: "Livreurs", icon: Truck },
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
const PRIMARY_EMAILS = ["admin@maweja.cd", "admin@maweja.net"];
function isPrimary(account) {
    return PRIMARY_EMAILS.includes(account.email);
}
function AccountModal({ account, onClose, onSave }) {
    const { toast } = useToast();
    // An account is superadmin if: adminRole is explicitly "superadmin",
    // OR adminRole is null with no adminPermissions set (primary accounts like admin@maweja.cd)
    const permsArr = account?.adminPermissions;
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
    const togglePermission = (key) => {
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
            const body = {
                name: form.name,
                phone: form.phone,
                adminRole: form.isSuperAdmin ? "superadmin" : null,
                adminPermissions: form.isSuperAdmin ? [] : form.permissions,
            };
            if (form.password)
                body.password = form.password;
            if (!isEdit) {
                body.email = form.email;
                await authFetchJson("/api/admin/accounts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                toast({ title: "Compte créé avec succès" });
            }
            else {
                await authFetchJson(`/api/admin/accounts/${account.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                toast({ title: "Compte mis à jour" });
            }
            onSave();
            onClose();
        }
        catch (e) {
            toast({ title: "Erreur", description: e.message, variant: "destructive" });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center", children: isEdit ? _jsx(Edit2, { size: 18, className: "text-red-600" }) : _jsx(UserPlus, { size: 18, className: "text-red-600" }) }), _jsx("h2", { className: "font-black text-gray-900 dark:text-white text-lg", children: isEdit ? "Modifier le compte" : "Nouveau compte admin" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors", "data-testid": "close-modal", children: _jsx(X, { size: 16, className: "text-gray-500" }) })] }), _jsxs("div", { className: "p-6 space-y-5 overflow-y-auto flex-1", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block", children: "Type d'acc\u00E8s" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("button", { onClick: () => setForm(f => ({ ...f, isSuperAdmin: true })), "data-testid": "role-superadmin", className: `p-4 rounded-2xl border-2 text-left transition-all ${form.isSuperAdmin
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`, children: [_jsx(Shield, { size: 18, className: form.isSuperAdmin ? "text-red-600 mb-1" : "text-gray-400 mb-1" }), _jsx("p", { className: `text-sm font-black ${form.isSuperAdmin ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`, children: "Super Admin" }), _jsx("p", { className: "text-[11px] text-gray-500 dark:text-gray-400 mt-0.5", children: "Acc\u00E8s complet" })] }), _jsxs("button", { onClick: () => setForm(f => ({ ...f, isSuperAdmin: false })), "data-testid": "role-custom", className: `p-4 rounded-2xl border-2 text-left transition-all ${!form.isSuperAdmin
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`, children: [_jsx(UserCog, { size: 18, className: !form.isSuperAdmin ? "text-red-600 mb-1" : "text-gray-400 mb-1" }), _jsx("p", { className: `text-sm font-black ${!form.isSuperAdmin ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`, children: "Acc\u00E8s Limit\u00E9" }), _jsx("p", { className: "text-[11px] text-gray-500 dark:text-gray-400 mt-0.5", children: "Permissions choisies" })] })] })] }), !form.isSuperAdmin && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide", children: "Acc\u00E8s aux menus" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: selectAll, className: "text-[11px] font-bold text-red-600 hover:underline", "data-testid": "btn-select-all-perms", children: "Tout s\u00E9lectionner" }), _jsx("span", { className: "text-gray-300 dark:text-gray-600", children: "|" }), _jsx("button", { onClick: clearAll, className: "text-[11px] font-bold text-gray-500 hover:underline", "data-testid": "btn-clear-all-perms", children: "Effacer" })] })] }), _jsx("div", { className: "grid grid-cols-2 gap-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3", children: ALL_PERMISSIONS.map(({ key, label, icon: Icon }) => {
                                        const checked = form.permissions.includes(key);
                                        return (_jsxs("button", { onClick: () => togglePermission(key), "data-testid": `perm-${key}`, className: `flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${checked
                                                ? "bg-red-600 text-white shadow-sm"
                                                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"}`, children: [_jsx(Icon, { size: 13, className: checked ? "text-white" : "text-gray-400" }), _jsx("span", { className: "text-[12px] font-semibold truncate", children: label })] }, key));
                                    }) }), form.permissions.length > 0 && (_jsxs("p", { className: "text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 ml-1", children: [form.permissions.length, " permission", form.permissions.length > 1 ? "s" : "", " s\u00E9lectionn\u00E9e", form.permissions.length > 1 ? "s" : ""] }))] })), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block", children: "Nom complet" }), _jsxs("div", { className: "flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-red-400 transition-colors", children: [_jsx(User, { size: 14, className: "text-gray-400" }), _jsx("input", { value: form.name, onChange: e => setForm(f => ({ ...f, name: e.target.value })), placeholder: "Pr\u00E9nom Nom", className: "flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none", "data-testid": "input-name" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block", children: "Email" }), _jsxs("div", { className: `flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-colors ${isEdit ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50" : "border-gray-200 dark:border-gray-700 focus-within:border-red-400"}`, children: [_jsx(Mail, { size: 14, className: "text-gray-400" }), _jsx("input", { value: form.email, onChange: e => !isEdit && setForm(f => ({ ...f, email: e.target.value })), disabled: isEdit, placeholder: "admin@example.com", type: "email", className: "flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none disabled:text-gray-400", "data-testid": "input-email" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block", children: "T\u00E9l\u00E9phone" }), _jsxs("div", { className: "flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-red-400 transition-colors", children: [_jsx(Phone, { size: 14, className: "text-gray-400" }), _jsx("input", { value: form.phone, onChange: e => setForm(f => ({ ...f, phone: e.target.value })), placeholder: "081XXXXXXX", className: "flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none", "data-testid": "input-phone" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block", children: isEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe" }), _jsxs("div", { className: "flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-red-400 transition-colors", children: [_jsx(Key, { size: 14, className: "text-gray-400" }), _jsx("input", { value: form.password, onChange: e => setForm(f => ({ ...f, password: e.target.value })), type: showPassword ? "text" : "password", placeholder: isEdit ? "Laisser vide pour conserver" : "Minimum 6 caractères", className: "flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none", "data-testid": "input-password" }), _jsx("button", { onClick: () => setShowPassword(s => !s), className: "text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { size: 14 }) : _jsx(Eye, { size: 14 }) })] })] })] }), _jsxs("div", { className: "p-6 pt-0 flex gap-3 flex-shrink-0", children: [_jsx("button", { onClick: onClose, className: "flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors", children: "Annuler" }), _jsx("button", { onClick: save, disabled: loading, className: "flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-black shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all active:scale-95 disabled:opacity-50", "data-testid": "btn-save-account", children: loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le compte" })] })] }) }));
}
export default function AdminAccounts() {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [blocking, setBlocking] = useState(null);
    const { data: accounts = [], refetch } = useQuery({
        queryKey: ["/api/admin/accounts"],
    });
    const isSuperAdmin = !currentUser?.adminRole || currentUser?.adminRole === "superadmin";
    const deleteAccount = async (id) => {
        if (!confirm("Supprimer ce compte admin définitivement ?"))
            return;
        setDeleting(id);
        try {
            await authFetchJson(`/api/admin/accounts/${id}`, { method: "DELETE" });
            toast({ title: "Compte supprimé" });
            refetch();
            queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
        }
        catch (e) {
            toast({ title: "Erreur", description: e.message, variant: "destructive" });
        }
        finally {
            setDeleting(null);
        }
    };
    const toggleBlock = async (account) => {
        const action = account.isBlocked ? "débloquer" : "bloquer";
        if (!confirm(`Voulez-vous ${action} ce compte ?`))
            return;
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
        }
        catch (e) {
            toast({ title: "Erreur", description: e.message, variant: "destructive" });
        }
        finally {
            setBlocking(null);
        }
    };
    const isAccountSuperAdmin = (account) => {
        const perms = account.adminPermissions;
        return account.adminRole === "superadmin" || (!account.adminRole && (!perms || perms.length === 0));
    };
    const getAccountLabel = (account) => {
        if (isAccountSuperAdmin(account))
            return "Super Admin";
        const perms = account.adminPermissions;
        if (!perms || perms.length === 0)
            return "Aucune permission";
        return `${perms.length} permission${perms.length > 1 ? "s" : ""}`;
    };
    const getAccountColor = (account) => {
        if (isAccountSuperAdmin(account))
            return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    };
    const superAdminCount = accounts.filter(a => isAccountSuperAdmin(a)).length;
    const limitedCount = accounts.filter(a => !isAccountSuperAdmin(a)).length;
    const blockedCount = accounts.filter(a => a.isBlocked).length;
    return (_jsxs(AdminLayout, { title: "Gestion des Comptes", subtitle: "Cr\u00E9ez et g\u00E9rez les comptes administrateurs avec permissions granulaires", children: [_jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4 mb-8", children: [_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm", "data-testid": "stat-superadmins", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center", children: _jsx(Shield, { size: 15, className: "text-red-600" }) }), _jsx("span", { className: "text-xs font-bold text-gray-500 dark:text-gray-400", children: "Super Admins" })] }), _jsx("p", { className: "text-3xl font-black text-gray-900 dark:text-white", children: superAdminCount })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm", "data-testid": "stat-limited", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center", children: _jsx(UserCog, { size: 15, className: "text-blue-600" }) }), _jsx("span", { className: "text-xs font-bold text-gray-500 dark:text-gray-400", children: "Acc\u00E8s Limit\u00E9" })] }), _jsx("p", { className: "text-3xl font-black text-gray-900 dark:text-white", children: limitedCount })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm", "data-testid": "stat-blocked", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center", children: _jsx(Ban, { size: 15, className: "text-orange-600" }) }), _jsx("span", { className: "text-xs font-bold text-gray-500 dark:text-gray-400", children: "Bloqu\u00E9s" })] }), _jsx("p", { className: "text-3xl font-black text-gray-900 dark:text-white", children: blockedCount })] })] }), _jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "Tous les Comptes Admin" }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: [accounts.length, " compte", accounts.length !== 1 ? "s" : "", " enregistr\u00E9s"] })] }), isSuperAdmin && (_jsxs("button", { onClick: () => setModal("create"), className: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all active:scale-95", "data-testid": "btn-add-account", children: [_jsx(UserPlus, { size: 16 }), "Nouveau compte"] }))] }), accounts.length === 0 ? (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl p-16 border border-gray-100 dark:border-gray-800 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Shield, { size: 28, className: "text-gray-300 dark:text-gray-600" }) }), _jsx("p", { className: "font-bold text-gray-500 dark:text-gray-400", children: "Aucun compte admin trouv\u00E9" })] })) : (_jsx("div", { className: "space-y-3", children: accounts.map(account => {
                            const isCurrentUser = account.id === currentUser?.id;
                            const primary = isPrimary(account);
                            return (_jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all flex items-center gap-4 ${account.isBlocked ? "border-orange-200 dark:border-orange-900/40" : "border-gray-100 dark:border-gray-800"}`, "data-testid": `account-row-${account.id}`, children: [_jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg shadow-lg ${account.isBlocked ? "bg-gray-400 shadow-gray-200 dark:shadow-gray-900" : "bg-gradient-to-br from-red-500 to-red-700 shadow-red-200 dark:shadow-red-900/30"}`, children: account.name.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [_jsx("p", { className: "font-black text-gray-900 dark:text-white truncate", children: account.name }), isCurrentUser && (_jsx("span", { className: "text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full", children: "Vous" })), primary && (_jsx("span", { className: "text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full", children: "Principal" })), account.isBlocked && (_jsxs("span", { className: "text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1", children: [_jsx(Ban, { size: 9 }), " Bloqu\u00E9"] }))] }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 truncate", children: account.email }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: account.phone }), account.adminRole !== "superadmin" && account.adminPermissions && account.adminPermissions.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1 mt-1.5", children: [account.adminPermissions.slice(0, 4).map(key => {
                                                        const perm = ALL_PERMISSIONS.find(p => p.key === key);
                                                        return perm ? (_jsx("span", { className: "text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-lg", children: perm.label }, key)) : null;
                                                    }), account.adminPermissions.length > 4 && (_jsxs("span", { className: "text-[10px] font-medium text-gray-400 dark:text-gray-500", children: ["+", account.adminPermissions.length - 4] }))] }))] }), _jsx("span", { className: `text-[11px] font-bold px-3 py-1.5 rounded-xl flex-shrink-0 ${getAccountColor(account)}`, children: getAccountLabel(account) }), isSuperAdmin && (_jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsx("button", { onClick: () => setModal(account), className: "w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors", "data-testid": `btn-edit-${account.id}`, children: _jsx(Edit2, { size: 14, className: "text-gray-600 dark:text-gray-400" }) }), !primary && !isCurrentUser && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => toggleBlock(account), disabled: blocking === account.id, className: `w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${account.isBlocked
                                                            ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40"
                                                            : "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40"}`, "data-testid": `btn-block-${account.id}`, children: account.isBlocked
                                                            ? _jsx(CheckCircle, { size: 14, className: "text-green-600" })
                                                            : _jsx(Ban, { size: 14, className: "text-orange-600" }) }), _jsx("button", { onClick: () => deleteAccount(account.id), disabled: deleting === account.id, className: "w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors disabled:opacity-50", "data-testid": `btn-delete-${account.id}`, children: _jsx(Trash2, { size: 14, className: "text-red-600" }) })] }))] }))] }, account.id));
                        }) })), _jsx("p", { className: "text-center text-[11px] text-gray-400 mt-8", children: "Made By Khevin Andrew Kita - Ed Corporation" })] }), modal && (_jsx(AccountModal, { account: modal === "create" ? undefined : modal, onClose: () => setModal(null), onSave: () => {
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
                } }))] }));
}
//# sourceMappingURL=AdminAccounts.js.map