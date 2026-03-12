import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { apiRequest, resolveUrl, resolveImg } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";

import { onWSMessage } from "../../lib/websocket";

import {
  Upload, Camera, User, Mail, Phone, MapPin, Calendar, Users, Shield,
  CheckCircle2, Clock, AlertCircle, Loader2, X, ChevronRight
} from "lucide-react";

const isNativeMobile = (): boolean =>
  typeof (window as any).Capacitor !== "undefined" &&
  !!(window as any).Capacitor?.isNativePlatform?.();

const FIELD_LABELS: Record<string, string> = {
  name: "Nom complet",
  sex: "Sexe",
  dateOfBirth: "Date de naissance",
  fullAddress: "Adresse complete",
  email: "Adresse email",
  phone: "Numero de telephone",
  idPhotoUrl: "Photo de la piece d'identite",
  profilePhotoUrl: "Photo de profil",
};

async function uploadFileToServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const role = sessionStorage.getItem("maweja_role") || "driver";
  const res = await fetch(resolveUrl("/api/upload"), {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: { "X-User-Role": role },
  });
  if (!res.ok) throw new Error("Echec de l'upload");
  const data = await res.json();
  return resolveUrl(data.url);
}

async function pickImageNative(setUploading: (b: boolean) => void, onChange: (url: string) => void) {
  setUploading(true);
  try {
    const { Camera } = (window as any).Capacitor.Plugins;
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: "base64",
      source: "PHOTOS",
    });
    const blob = await fetch(`data:image/jpeg;base64,${photo.base64String}`).then(r => r.blob());
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    const url = await uploadFileToServer(file);
    onChange(url);
  } catch {
    onChange("");
  }
  setUploading(false);
}

function FileUploadField({ label, icon: Icon, value, onChange, rejected, disabled }: {
  label: string; icon: any; value: string; onChange: (url: string) => void; rejected?: boolean; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFileToServer(file);
      onChange(url);
    } catch {
      onChange("");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClick = () => {
    if (isNativeMobile()) {
      pickImageNative(setUploading, onChange);
    } else {
      inputRef.current?.click();
    }
  };

  const imgSrc = value ? (value.startsWith("http") ? value : resolveUrl(value)) : "";

  return (
    <div className={`rounded-2xl border-2 transition-all ${rejected ? "border-red-300 bg-red-50 dark:bg-red-950/30" : value ? "border-green-300 bg-green-50 dark:bg-green-950/30" : "border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {rejected && (
        <div className="px-4 pt-3 flex items-center gap-1.5">
          <AlertCircle size={12} className="text-red-500" />
          <span className="text-[10px] font-bold text-red-600">A CORRIGER</span>
        </div>
      )}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Icon size={14} className={rejected ? "text-red-500" : value ? "text-green-600" : "text-gray-400"} />
          {label} <span className="text-red-500">*</span>
        </p>
        {value ? (
          <div className="relative">
            <img src={imgSrc} alt={label} className="w-full h-40 object-cover rounded-xl" />
            {!disabled && (
              <button onClick={() => { onChange(""); }}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-800"
                data-testid={`change-${label.toLowerCase().replace(/\s/g, "-")}`}>
                <X size={12} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
            {!rejected && <CheckCircle2 size={20} className="absolute bottom-2 right-2 text-green-600 bg-white rounded-full" />}
          </div>
        ) : (
          <button onClick={handleClick} disabled={uploading}
            data-testid={`upload-${label.toLowerCase().replace(/\s/g, "-")}`}
            className="w-full py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center gap-2 hover:bg-white dark:hover:bg-gray-700 transition-colors">
            {uploading ? (
              <Loader2 size={24} className="text-red-500 animate-spin" />
            ) : (
              <Camera size={24} className="text-gray-400" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {uploading ? "Envoi en cours..." : isNativeMobile() ? "Appuyez pour choisir depuis la galerie" : "Cliquez pour choisir une photo"}
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default function DriverOnboarding() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    sex: user?.sex || "",
    dateOfBirth: user?.dateOfBirth || "",
    fullAddress: user?.fullAddress || "",
    email: user?.email || "",
    phone: user?.phone || "",
    idPhotoUrl: user?.idPhotoUrl || "",
    profilePhotoUrl: user?.profilePhotoUrl || "",
  });

  const rejectedFields: string[] = (user?.rejectedFields as string[]) || [];
  const isPending = user?.verificationStatus === "pending";
  const isRejected = user?.verificationStatus === "rejected";
  const isFirstTime = !user?.verificationStatus || user.verificationStatus === "not_started";

  const isFieldDisabled = (field: string) => {
    if (isFirstTime) return false;
    if (isRejected) return !rejectedFields.includes(field);
    return true;
  };

  const isFieldRejected = (field: string) => isRejected && rejectedFields.includes(field);

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "verification_approved") {
        toast({ title: "Compte approuve!", description: "Vous pouvez maintenant utiliser l'application" });
        window.location.reload();
      }
      if (data.type === "verification_rejected") {
        toast({ title: "Corrections requises", description: "Veuillez corriger les champs indiques", variant: "destructive" });
        window.location.reload();
      }
    });
  }, [toast]);

  const handleSubmit = async () => {
    const missing = Object.entries(form).filter(([_, v]) => !v);
    if (missing.length > 0 && isFirstTime) {
      toast({ title: "Champs manquants", description: "Tous les champs sont obligatoires", variant: "destructive" });
      return;
    }
    if (isRejected) {
      const missingRejected = rejectedFields.filter(f => !(form as any)[f]);
      if (missingRejected.length > 0) {
        toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs a corriger", variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await apiRequest("/api/driver/onboarding", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setUser(data);
      toast({ title: "Informations envoyees!", description: "En attente de verification par l'administration" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-950 dark:to-gray-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={36} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">En attente de verification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Vos informations ont ete envoyees avec succes. L'administration est en train de les examiner.
            Vous serez notifie des que votre compte sera valide.
          </p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
            <div className="flex items-center gap-3">
              {form.profilePhotoUrl && (
                <img src={resolveImg(form.profilePhotoUrl)} alt="Profile" className="w-12 h-12 rounded-xl object-cover" />
              )}
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900 dark:text-white">{form.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{form.email}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-2 justify-center">
              <Loader2 size={14} className="animate-spin" /> Verification en cours...
            </p>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-8">Made By Khevin Andrew Kita - Ed Corporation</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-950 dark:to-gray-950">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
            {isRejected ? "Corrections requises" : "Completez votre profil"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRejected
              ? "Certaines informations doivent etre corrigees avant la validation"
              : "Remplissez vos informations pour activer votre compte livreur"}
          </p>
        </div>

        {isRejected && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="font-bold text-sm text-red-700 dark:text-red-400">Champs a corriger</span>
            </div>
            <ul className="space-y-1">
              {rejectedFields.map(f => (
                <li key={f} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <ChevronRight size={10} /> {FIELD_LABELS[f] || f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("name") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`}>
            {isFieldRejected("name") && (
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-[10px] font-bold text-red-600">A CORRIGER</span>
              </div>
            )}
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
              <User size={12} /> Nom complet <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={isFieldDisabled("name")} data-testid="input-onboard-name"
              placeholder="Ex: Jean-Baptiste Mukoko"
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("sex") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`}>
              {isFieldRejected("sex") && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-600">A CORRIGER</span>
                </div>
              )}
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                <Users size={12} /> Sexe <span className="text-red-500">*</span>
              </label>
              <select value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}
                disabled={isFieldDisabled("sex")} data-testid="select-onboard-sex"
                className={inputClass}>
                <option value="">Choisir...</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
              </select>
            </div>

            <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("dateOfBirth") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`}>
              {isFieldRejected("dateOfBirth") && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-600">A CORRIGER</span>
                </div>
              )}
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                <Calendar size={12} /> Date de naissance <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                disabled={isFieldDisabled("dateOfBirth")} data-testid="input-onboard-dob"
                className={inputClass} />
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("fullAddress") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`}>
            {isFieldRejected("fullAddress") && (
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-[10px] font-bold text-red-600">A CORRIGER</span>
              </div>
            )}
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
              <MapPin size={12} /> Adresse complete <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.fullAddress} onChange={e => setForm({ ...form, fullAddress: e.target.value })}
              disabled={isFieldDisabled("fullAddress")} data-testid="input-onboard-address"
              placeholder="Ex: 12 Avenue Kasa-Vubu, Commune de Lingwala, Kinshasa"
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("email") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`}>
              {isFieldRejected("email") && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-600">A CORRIGER</span>
                </div>
              )}
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                <Mail size={12} /> Email <span className="text-red-500">*</span>
              </label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={isFieldDisabled("email")} data-testid="input-onboard-email"
                className={inputClass} />
            </div>

            <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${isFieldRejected("phone") ? "border-red-300" : "border-gray-100 dark:border-gray-800"} shadow-sm p-4`}>
              {isFieldRejected("phone") && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-600">A CORRIGER</span>
                </div>
              )}
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                <Phone size={12} /> Telephone <span className="text-red-500">*</span>
              </label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                disabled={isFieldDisabled("phone")} data-testid="input-onboard-phone"
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUploadField
              label="Photo de profil"
              icon={Camera}
              value={form.profilePhotoUrl}
              onChange={url => setForm({ ...form, profilePhotoUrl: url })}
              rejected={isFieldRejected("profilePhotoUrl")}
              disabled={isFieldDisabled("profilePhotoUrl")}
            />
            <FileUploadField
              label="Piece d'identite"
              icon={Shield}
              value={form.idPhotoUrl}
              onChange={url => setForm({ ...form, idPhotoUrl: url })}
              rejected={isFieldRejected("idPhotoUrl")}
              disabled={isFieldDisabled("idPhotoUrl")}
            />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting} data-testid="button-submit-onboarding"
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm mt-8 shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {submitting ? "Envoi en cours..." : isRejected ? "Renvoyer les corrections" : "Envoyer pour verification"}
        </button>

        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-6">Made By Khevin Andrew Kita - Ed Corporation</p>
      </div>
    </div>
  );
}
