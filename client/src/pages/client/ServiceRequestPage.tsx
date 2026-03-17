import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { apiRequest, queryClient, authFetch , authFetchJson} from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  ArrowLeft, Calendar, Clock, User, Phone, MapPin, Tag, DollarSign,
  FileText, MessageCircle, Send, CheckCircle2, Loader2, AlertTriangle, Zap,
} from "lucide-react";
import type { ServiceRequest } from "@shared/schema";

function parseMinPrice(priceStr: string): number | null {
  const match = priceStr.match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/* ─── Shared style constants ───────────────────────────────────────────────── */
const input =
  "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 " +
  "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 " +
  "rounded-2xl text-[15px] font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all";

const inputIcon =
  "w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 " +
  "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 " +
  "rounded-2xl text-[15px] font-medium focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all";

const card =
  "bg-white dark:bg-gray-900/80 rounded-3xl border border-gray-100 dark:border-gray-800/60 shadow-sm";

const label =
  "text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block";

const sectionTitle =
  "font-black text-[15px] text-gray-900 dark:text-white mb-4 flex items-center gap-2";

const iconBox =
  "w-8 h-8 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center flex-shrink-0";

/* ─── Step number badge ─────────────────────────────────────────────────── */
function Step({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 bg-red-600 text-white rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0">
      {n}
    </span>
  );
}

export default function ServiceRequestPage() {
  const [currentPath, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const pathParts = currentPath.split("/");
  const requestId = pathParts[pathParts.length - 1];
  const isViewMode = pathParts.includes("request") && requestId && !isNaN(Number(requestId));

  const stored = sessionStorage.getItem("maweja_service_request");
  const catalogData = stored ? JSON.parse(stored) : null;

  const categoryId = catalogData?.categoryId || null;
  const categoryName = catalogData?.categoryName || "";
  const catalogItemId = catalogData?.catalogItemId || null;
  const catalogItemName = catalogData?.catalogItemName || null;
  const catalogItemPrice = catalogData?.catalogItemPrice || null;
  const catalogItemImage = catalogData?.catalogItemImage || null;

  const hasCatalogModel = !!catalogItemName;
  const minPrice = catalogItemPrice ? parseMinPrice(catalogItemPrice) : null;

  const { data: existingRequest } = useQuery<ServiceRequest>({
    queryKey: ["/api/service-requests", requestId],
    queryFn: () => authFetchJson(`/api/service-requests/${requestId}`),
    enabled: !!isViewMode && !!user,
  });

  const [scheduledType, setScheduledType] = useState("asap");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [budget, setBudget] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [contactMethod, setContactMethod] = useState("phone");
  const [submitted, setSubmitted] = useState(false);
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    if (user && !fullName) {
      setFullName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const serviceTypeOptions: Record<string, string[]> = {
    Hotellerie: ["Reservation chambre", "Suite VIP", "Salle de conference", "Reception", "Autre"],
    Transport: ["Vehicule prive", "Minibus", "Camion", "Moto", "Quad", "Autre"],
    Nettoyage: ["Maison", "Bureau", "Apres evenement", "Vitres", "Tapis", "Autre"],
    Demenagement: ["Local", "Interurbain", "Bureau", "Entrepot", "Autre"],
    Evenementiel: ["Mariage", "Anniversaire", "Conference", "Soiree", "Team building", "Autre"],
    Reparation: ["Plomberie", "Electricite", "Peinture", "Menuiserie", "Electronique", "Autre"],
    Coursier: ["Document", "Colis petit", "Colis moyen", "Colis lourd", "Achats", "Autre"],
    Autre: ["A preciser"],
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-requests", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setSubmitted(true);
    },
    onError: (err: any) => {
      let msg = err?.message || t.common.error;
      try { msg = JSON.parse(msg)?.message || msg; } catch {}
      if (msg.includes("401") || msg.includes("Non authentifie")) {
        toast({ title: "Connexion requise", description: "Veuillez vous connecter pour envoyer une demande.", variant: "destructive" });
        navigate("/login");
      } else if (msg.includes("403") || msg.includes("interdit")) {
        toast({ title: "Accès refusé", description: "Seuls les clients peuvent envoyer des demandes de service.", variant: "destructive" });
      } else {
        toast({ title: "Erreur d'envoi", description: msg, variant: "destructive" });
      }
    },
  });

  const validatePrice = (value: string): boolean => {
    if (!minPrice || !value.trim()) return true;
    const numMatch = value.match(/(\d+)/);
    if (!numMatch) return true;
    const enteredPrice = parseInt(numMatch[1], 10);
    if (enteredPrice < minPrice) {
      setPriceError(`${t.services.priceTooLow} (${t.services.minPrice}: $${minPrice})`);
      return false;
    }
    setPriceError("");
    return true;
  };

  const handleBudgetChange = (value: string) => {
    setBudget(value);
    if (priceError) validatePrice(value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour envoyer une demande de service.", variant: "destructive" });
      navigate("/login");
      return;
    }

    if (user.role !== "client") {
      toast({ title: "Accès refusé", description: "Seuls les clients peuvent envoyer des demandes de service.", variant: "destructive" });
      return;
    }

    if (!categoryId && !categoryName) {
      toast({ title: "Catégorie manquante", description: "Veuillez sélectionner une catégorie de service.", variant: "destructive" });
      navigate("/services");
      return;
    }

    if (!phone.trim()) {
      toast({ title: "Numéro requis", description: "Veuillez entrer votre numéro de téléphone.", variant: "destructive" });
      return;
    }

    if (hasCatalogModel && budget.trim() && !validatePrice(budget)) {
      return;
    }

    if (!hasCatalogModel && (!fullName.trim() || !phone.trim())) {
      toast({ title: "Champs requis", description: "Veuillez remplir votre nom et téléphone.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      categoryId: Number(categoryId) || 1,
      categoryName: categoryName || "Service",
      scheduledType,
      scheduledDate: scheduledType === "scheduled" ? scheduledDate : null,
      scheduledTime: scheduledType === "scheduled" ? scheduledTime : null,
      fullName: fullName || user?.name || "Client",
      phone,
      address: address || user?.address || "Non précisé",
      serviceType: catalogItemName ? `${catalogItemName}${serviceType ? ` - ${serviceType}` : ""}` : serviceType || "Non précisé",
      budget: budget || catalogItemPrice || "",
      additionalInfo: hasCatalogModel
        ? `[${t.services.selectedModel}: ${catalogItemName}${catalogItemPrice ? ` (${catalogItemPrice})` : ""}]${catalogItemImage ? `\n[Image: ${catalogItemImage}]` : ""}${additionalInfo ? `\n${additionalInfo}` : ""}`
        : additionalInfo,
      contactMethod,
    });
  };

  /* ─── Success screen ──────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm">
            <div className="w-24 h-24 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2" style={{ fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "-0.02em" }} data-testid="text-request-sent">
              {t.services.requestSent}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">{t.services.requestSentDesc}</p>

            {hasCatalogModel && catalogItemImage && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <img src={catalogItemImage} alt={catalogItemName || ""} className="w-full h-48 object-cover" />
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-5 mb-7 text-left space-y-2">
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t.services.summary}</p>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t.services.service}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{categoryName}</span>
              </div>
              {catalogItemName && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t.services.selectedModel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{catalogItemName}</span>
                </div>
              )}
              {(budget || catalogItemPrice) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t.services.yourPrice}</span>
                  <span className="text-sm font-bold text-red-600">{budget || catalogItemPrice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t.services.contact}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {contactMethod === "whatsapp" ? "WhatsApp" : contactMethod === "phone" ? t.services.telephone : t.common.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/services")}
              data-testid="button-back-services"
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[15px] hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-red-900/40"
              style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}
            >
              {t.services.backToServices}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── View existing request ───────────────────────────────────────────── */
  if (isViewMode && existingRequest) {
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

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/services")}
              className="w-11 h-11 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm"
              data-testid="button-back">
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

          {/* Details card */}
          <div className={`${card} p-5 space-y-4`}>
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

  /* ─── Catalog model form ─────────────────────────────────────────────── */
  if (hasCatalogModel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto">

          {/* Hero image + back button */}
          <div className="relative">
            {catalogItemImage ? (
              <div className="w-full" style={{ height: 240 }}>
                <img src={catalogItemImage} alt={catalogItemName || ""} className="w-full h-full object-cover" data-testid="img-selected-model" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
              </div>
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-red-600 to-red-800" />
            )}

            {/* Back button over image */}
            <button onClick={() => navigate("/services")}
              className="absolute top-4 left-4 w-11 h-11 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"
              data-testid="button-back">
              <ArrowLeft size={18} className="text-white" />
            </button>

            {/* Category + model name overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider">{categoryName}</p>
              <h1 className="text-white text-xl font-black leading-tight" style={{ fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "-0.02em" }} data-testid="text-form-title">
                {catalogItemName}
              </h1>
              {catalogItemPrice && (
                <span className="inline-block mt-1 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full">
                  {catalogItemPrice}
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="px-4 py-5 space-y-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{t.services.quickRequestDesc}</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Step 1 — Date/time */}
              <div className={`${card} p-5`}>
                <h3 className={sectionTitle}>
                  <Step n={1} />
                  {t.services.dateTime}
                </h3>
                <div className="flex gap-2 mb-3">
                  {[
                    { key: "asap", label: t.services.asap, icon: Zap, testId: "button-asap" },
                    { key: "scheduled", label: t.services.schedule, icon: Calendar, testId: "button-schedule" },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => setScheduledType(opt.key)}
                      data-testid={opt.testId}
                      className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        scheduledType === opt.key
                          ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40"
                          : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60"
                      }`}>
                      <opt.icon size={15} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                {scheduledType === "scheduled" && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className={label}>{t.common.date}</label>
                      <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                        data-testid="input-date" className={input} />
                    </div>
                    <div>
                      <label className={label}>Heure</label>
                      <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                        data-testid="input-time" className={input} />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 — Contact */}
              <div className={`${card} p-5 space-y-4`}>
                <h3 className={sectionTitle}>
                  <Step n={2} />
                  {t.services.personalInfo}
                </h3>
                <div>
                  <label className={label}>{t.common.phone} *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                      data-testid="input-phone" placeholder={t.services.phonePlaceholder}
                      className={inputIcon} />
                  </div>
                </div>
                <div>
                  <label className={label}>{t.common.address}</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                      data-testid="input-address" placeholder={t.services.addressPlaceholder}
                      className={inputIcon} />
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className={label}>
                    {t.services.yourPrice}
                    {minPrice && <span className="ml-1 normal-case font-normal text-gray-400">({t.services.minPrice}: ${minPrice})</span>}
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={budget} onChange={e => handleBudgetChange(e.target.value)}
                      onBlur={() => validatePrice(budget)}
                      data-testid="input-budget"
                      placeholder={catalogItemPrice ? `${t.services.minPrice}: ${catalogItemPrice}` : t.services.budgetPlaceholder}
                      className={`${inputIcon} ${priceError ? "border-red-400 bg-red-50 dark:bg-red-950/30 focus:ring-red-400" : ""}`} />
                  </div>
                  {priceError && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-600 dark:text-red-400" data-testid="text-price-error">
                      <AlertTriangle size={13} />
                      <p className="text-[12px] font-semibold">{priceError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 — Notes */}
              <div className={`${card} p-5`}>
                <h3 className={sectionTitle}>
                  <Step n={3} />
                  {t.services.optionalNotes}
                </h3>
                <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
                  data-testid="input-additional-info" placeholder={t.services.optionalNotesPlaceholder}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-[15px] font-medium resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all" />
              </div>

              {/* Step 4 — Contact method */}
              <div className={`${card} p-5`}>
                <h3 className={sectionTitle}>
                  <Step n={4} />
                  {t.services.preferredContact}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "phone", label: t.services.telephone, icon: Phone },
                    { key: "whatsapp", label: t.services.whatsapp, icon: MessageCircle },
                    { key: "email", label: t.common.email, icon: FileText },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => setContactMethod(opt.key)}
                      data-testid={`button-contact-${opt.key}`}
                      className={`py-4 rounded-2xl text-[12px] font-bold flex flex-col items-center gap-2 transition-all ${
                        contactMethod === opt.key
                          ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40 scale-[1.02]"
                          : "bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60 hover:border-red-200 hover:text-red-600"
                      }`}>
                      <opt.icon size={18} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={createMutation.isPending}
                data-testid="button-submit-request"
                className="w-full bg-red-600 text-white py-4.5 rounded-2xl font-black text-[16px] hover:bg-red-700 disabled:opacity-50 shadow-2xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                style={{ fontFamily: "system-ui,-apple-system,sans-serif", paddingTop: "1.125rem", paddingBottom: "1.125rem" }}>
                {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                {createMutation.isPending ? t.services.sending : t.services.sendRequest}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Standard form (no catalog model) ──────────────────────────────── */
  const typeOptions = serviceTypeOptions[categoryName] || serviceTypeOptions["Autre"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto">

        {/* Hero band */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-rose-800 px-5 pt-5 pb-8 relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute top-6 -right-4 w-20 h-20 bg-white/5 rounded-full" />

          <button onClick={() => navigate("/services")}
            className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 mb-5"
            data-testid="button-back">
            <ArrowLeft size={18} className="text-white" />
          </button>

          <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">{t.services.newRequest}</p>
          <h1 className="text-white text-2xl font-black leading-tight" style={{ fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "-0.02em" }} data-testid="text-form-title">
            {categoryName}
          </h1>
        </div>

        {/* Form */}
        <div className="px-4 -mt-4 space-y-4 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Step 1 — Date/time */}
            <div className={`${card} p-5`}>
              <h3 className={sectionTitle}>
                <Step n={1} />
                {t.services.dateTime}
              </h3>
              <div className="flex gap-2">
                {[
                  { key: "asap", label: t.services.asap, icon: Zap, testId: "button-asap" },
                  { key: "scheduled", label: t.services.schedule, icon: Calendar, testId: "button-schedule" },
                ].map(opt => (
                  <button key={opt.key} type="button" onClick={() => setScheduledType(opt.key)}
                    data-testid={opt.testId}
                    className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      scheduledType === opt.key
                        ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40"
                        : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60"
                    }`}>
                    <opt.icon size={15} />
                    {opt.label}
                  </button>
                ))}
              </div>
              {scheduledType === "scheduled" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={label}>{t.common.date}</label>
                    <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                      data-testid="input-date" className={input} />
                  </div>
                  <div>
                    <label className={label}>Heure</label>
                    <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                      data-testid="input-time" className={input} />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 — Personal info */}
            <div className={`${card} p-5 space-y-4`}>
              <h3 className={sectionTitle}>
                <Step n={2} />
                {t.services.personalInfo}
              </h3>
              <div>
                <label className={label}>{t.services.fullName} *</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                    data-testid="input-fullname" placeholder={t.services.fullNamePlaceholder}
                    className={inputIcon} />
                </div>
              </div>
              <div>
                <label className={label}>{t.common.phone} *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                    data-testid="input-phone" placeholder={t.services.phonePlaceholder}
                    className={inputIcon} />
                </div>
              </div>
              <div>
                <label className={label}>{t.common.address} *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
                    data-testid="input-address" placeholder={t.services.addressPlaceholder}
                    className={inputIcon} />
                </div>
              </div>
            </div>

            {/* Step 3 — Service details */}
            <div className={`${card} p-5 space-y-4`}>
              <h3 className={sectionTitle}>
                <Step n={3} />
                {t.services.serviceDetails}
              </h3>
              <div>
                <label className={label}>{t.services.serviceType} — {categoryName}</label>
                <div className="relative">
                  <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select value={serviceType} onChange={e => setServiceType(e.target.value)}
                    data-testid="select-service-type"
                    className={inputIcon + " appearance-none"}>
                    <option value="">{t.services.select}</option>
                    {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={label}>{t.services.estimatedBudget}</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                    data-testid="input-budget" placeholder={t.services.budgetPlaceholder}
                    className={inputIcon} />
                </div>
              </div>
              <div>
                <label className={label}>{t.services.additionalInfo}</label>
                <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
                  data-testid="input-additional-info" placeholder={t.services.additionalInfoPlaceholder}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-[15px] font-medium resize-none h-28 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all" />
              </div>
            </div>

            {/* Step 4 — Contact method */}
            <div className={`${card} p-5`}>
              <h3 className={sectionTitle}>
                <Step n={4} />
                {t.services.preferredContact}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "phone", label: t.services.telephone, icon: Phone },
                  { key: "whatsapp", label: t.services.whatsapp, icon: MessageCircle },
                  { key: "email", label: t.common.email, icon: FileText },
                ].map(opt => (
                  <button key={opt.key} type="button" onClick={() => setContactMethod(opt.key)}
                    data-testid={`button-contact-${opt.key}`}
                    className={`py-4 rounded-2xl text-[12px] font-bold flex flex-col items-center gap-2 transition-all ${
                      contactMethod === opt.key
                        ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40 scale-[1.02]"
                        : "bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60 hover:border-red-200 hover:text-red-600"
                    }`}>
                    <opt.icon size={18} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={createMutation.isPending}
              data-testid="button-submit-request"
              className="w-full bg-red-600 text-white rounded-2xl font-black text-[16px] hover:bg-red-700 disabled:opacity-50 shadow-2xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
              style={{ fontFamily: "system-ui,-apple-system,sans-serif", paddingTop: "1.125rem", paddingBottom: "1.125rem" }}>
              {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
              {createMutation.isPending ? t.services.sending : t.services.sendRequest}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
