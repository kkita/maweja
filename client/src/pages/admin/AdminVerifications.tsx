import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, resolveImg } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  Shield, CheckCircle2, XCircle, User, Mail, Phone, MapPin, Calendar,
  Camera, CreditCard, ChevronRight, AlertCircle, Clock, Users, Eye, Loader2
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

const FIELD_LABELS: Record<string, string> = {
  name: "Nom complet",
  sex: "Sexe",
  dateOfBirth: "Date de naissance",
  fullAddress: "Adresse complete",
  email: "Adresse email",
  phone: "Numero de telephone",
  idPhotoUrl: "Photo piece d'identite",
  profilePhotoUrl: "Photo de profil",
};

const FIELDS = ["name", "sex", "dateOfBirth", "fullAddress", "email", "phone", "idPhotoUrl", "profilePhotoUrl"] as const;

export default function AdminVerifications() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<any>(null);
  const [rejectedFields, setRejectedFields] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: pendingDrivers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/verifications"],
    refetchInterval: 5000,
  });

  const handleApprove = async (driverId: number) => {
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/verify/${driverId}`, {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ title: "Agent approuve!", description: "L'agent peut maintenant utiliser l'application" });
      setSelected(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleReject = async (driverId: number) => {
    if (rejectedFields.length === 0) {
      toast({ title: "Selectionnez les champs", description: "Cochez les champs a corriger avant de rejeter", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/verify/${driverId}`, {
        method: "POST",
        body: JSON.stringify({ action: "reject", rejectedFields }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      toast({ title: "Corrections demandees", description: "L'agent a ete notifie" });
      setSelected(null);
      setRejectedFields([]);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const toggleRejected = (field: string) => {
    setRejectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  const getFieldValue = (driver: any, field: string) => {
    return (driver as any)[field] || "";
  };

  return (
    <AdminLayout title="Verifications agents">
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{pendingDrivers.filter(d => d.verificationStatus === "pending").length}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">En attente</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{pendingDrivers.filter(d => d.verificationStatus === "rejected").length}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Rejetes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 240px)", minHeight: 400 }}>
        <div className="w-[320px] shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Shield size={14} className="text-red-600" /> Demandes ({pendingDrivers.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {pendingDrivers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CheckCircle2 size={36} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">Aucune demande en attente</p>
              </div>
            ) : (
              pendingDrivers.map((d: any) => (
                <div key={d.id} onClick={() => { setSelected(d); setRejectedFields([]); }}
                  data-testid={`verification-card-${d.id}`}
                  className={`p-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${selected?.id === d.id ? "bg-red-50 border-l-[3px] border-l-red-600" : ""}`}>
                  <div className="flex items-center gap-3">
                    {d.profilePhotoUrl ? (
                      <img src={resolveImg(d.profilePhotoUrl)} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <User size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate">{d.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{d.email}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                        d.verificationStatus === "pending" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                      }`}>
                        {d.verificationStatus === "pending" ? "EN ATTENTE" : "REJETE"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          {selected ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  {selected.profilePhotoUrl ? (
                    <img src={resolveImg(selected.profilePhotoUrl)} alt="" className="w-16 h-16 rounded-2xl object-cover cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewImage(selected.profilePhotoUrl)} />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <User size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white" data-testid="verification-driver-name">{selected.name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selected.email} - {selected.phone}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                      selected.verificationStatus === "pending" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    }`}>
                      {selected.verificationStatus === "pending" ? "EN ATTENTE DE VERIFICATION" : "CORRECTIONS DEMANDEES"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[10px] text-gray-500 font-semibold mb-3">
                  INFORMATIONS SOUMISES — Cochez les champs incorrects pour demander une correction
                </p>
                <div className="space-y-3">
                  {FIELDS.map(field => {
                    const value = getFieldValue(selected, field);
                    const isPhoto = field === "idPhotoUrl" || field === "profilePhotoUrl";
                    const isChecked = rejectedFields.includes(field);
                    const wasRejected = (selected.rejectedFields as string[] || []).includes(field);

                    return (
                      <div key={field}
                        className={`rounded-xl border-2 p-3 transition-all cursor-pointer ${isChecked ? "border-red-300 bg-red-50" : wasRejected ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}
                        onClick={() => toggleRejected(field)}
                        data-testid={`field-${field}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${isChecked ? "border-red-500 bg-red-500" : "border-gray-300"}`}>
                            {isChecked && <XCircle size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                              {FIELD_LABELS[field]}
                              {wasRejected && <span className="text-[8px] bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full">DEJA REJETE</span>}
                            </p>
                            {isPhoto ? (
                              value ? (
                                <img src={resolveImg(value)} alt={FIELD_LABELS[field]}
                                  className="w-full max-w-xs h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                  onClick={e => { e.stopPropagation(); setPreviewImage(resolveImg(value)); }} />
                              ) : (
                                <p className="text-xs text-red-500 italic">Non fourni</p>
                              )
                            ) : (
                              <p className="text-sm text-gray-900 dark:text-white">{value || <span className="text-red-500 italic">Non renseigne</span>}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => handleApprove(selected.id)} disabled={submitting} data-testid="button-approve-driver"
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Approuver l'agent
                  </button>
                  <button onClick={() => handleReject(selected.id)} disabled={submitting || rejectedFields.length === 0} data-testid="button-reject-driver"
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Rejeter ({rejectedFields.length} champ{rejectedFields.length !== 1 ? "s" : ""})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Eye size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-gray-500 dark:text-gray-400">Selectionnez une demande</p>
                <p className="text-xs mt-1">pour examiner les informations de l'agent</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
