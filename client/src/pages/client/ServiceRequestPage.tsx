import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  ArrowLeft, Calendar, Clock, User, Phone, MapPin, Tag, DollarSign,
  Camera, FileText, MessageCircle, Send, CheckCircle2, Loader2
} from "lucide-react";
import type { ServiceRequest } from "@shared/schema";

export default function ServiceRequestPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get("categoryId");
  const categoryName = params.get("categoryName") || "";
  const catalogItemId = params.get("catalogItemId");
  const catalogItemName = params.get("catalogItemName");
  const catalogItemPrice = params.get("catalogItemPrice");

  const pathParts = window.location.pathname.split("/");
  const requestId = pathParts[pathParts.length - 1];
  const isViewMode = pathParts.includes("request") && requestId && !isNaN(Number(requestId));

  const { data: existingRequest } = useQuery<ServiceRequest>({
    queryKey: ["/api/service-requests", requestId],
    queryFn: () => authFetch(`/api/service-requests/${requestId}`).then(r => r.json()),
    enabled: !!isViewMode && !!user,
  });

  const [scheduledType, setScheduledType] = useState("asap");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [budget, setBudget] = useState(catalogItemPrice || "");
  const [additionalInfo, setAdditionalInfo] = useState(
    catalogItemName ? `${t.services.selectedModel}: ${catalogItemName}${catalogItemPrice ? ` (${catalogItemPrice})` : ""}` : ""
  );
  const [contactMethod, setContactMethod] = useState("phone");
  const [submitted, setSubmitted] = useState(false);

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
    onError: () => {
      toast({ title: t.common.error, description: t.common.error, variant: "destructive" });
    },
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast({ title: t.common.error, description: t.common.error, variant: "destructive" });
      return;
    }
    createMutation.mutate({
      categoryId: Number(categoryId),
      categoryName,
      scheduledType,
      scheduledDate: scheduledType === "scheduled" ? scheduledDate : null,
      scheduledTime: scheduledType === "scheduled" ? scheduledTime : null,
      fullName,
      phone,
      address,
      serviceType: catalogItemName ? `${catalogItemName}${serviceType ? ` - ${serviceType}` : ""}` : serviceType,
      budget,
      additionalInfo,
      contactMethod,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2" data-testid="text-request-sent">{t.services.requestSent}</h2>
            <p className="text-sm text-gray-500 mb-6">{t.services.requestSentDesc}</p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-gray-500 mb-2">{t.services.summary}</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-700"><strong>{t.services.service}:</strong> {categoryName}</p>
                {catalogItemName && <p className="text-sm text-gray-700"><strong>{t.services.selectedModel}:</strong> {catalogItemName}</p>}
                {serviceType && <p className="text-sm text-gray-700"><strong>{t.services.type}:</strong> {serviceType}</p>}
                <p className="text-sm text-gray-700"><strong>{t.services.contact}:</strong> {contactMethod === "whatsapp" ? "WhatsApp" : contactMethod === "phone" ? t.services.telephone : t.common.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/services")}
              data-testid="button-back-services"
              className="w-full bg-red-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200"
            >
              {t.services.backToServices}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isViewMode && existingRequest) {
    const statusLabels: Record<string, string> = {
      pending: t.services.statusPending, reviewing: t.services.statusReviewing, accepted: t.services.statusAccepted, rejected: t.services.statusRejected, completed: t.services.statusCompleted,
    };
    const statusColors: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      reviewing: "bg-blue-50 text-blue-700 border-blue-200",
      accepted: "bg-green-50 text-green-700 border-green-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      completed: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/services")} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200" data-testid="button-back">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t.services.request} #{existingRequest.id}</h2>
              <p className="text-xs text-gray-500">{existingRequest.categoryName}</p>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 mb-4 ${statusColors[existingRequest.status] || statusColors.pending}`}>
            <p className="font-bold text-sm">{t.common.status}: {statusLabels[existingRequest.status] || existingRequest.status}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div><p className="text-[10px] font-semibold text-gray-400 uppercase">{t.services.fullName}</p><p className="text-sm text-gray-900 font-medium">{existingRequest.fullName}</p></div>
            <div><p className="text-[10px] font-semibold text-gray-400 uppercase">{t.common.phone}</p><p className="text-sm text-gray-900 font-medium">{existingRequest.phone}</p></div>
            <div><p className="text-[10px] font-semibold text-gray-400 uppercase">{t.common.address}</p><p className="text-sm text-gray-900 font-medium">{existingRequest.address}</p></div>
            {existingRequest.serviceType && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">{t.services.type}</p><p className="text-sm text-gray-900 font-medium">{existingRequest.serviceType}</p></div>}
            {existingRequest.budget && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">{t.admin.budget}</p><p className="text-sm text-gray-900 font-medium">{existingRequest.budget}</p></div>}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase">{t.admin.schedule}</p>
              <p className="text-sm text-gray-900 font-medium">
                {existingRequest.scheduledType === "asap" ? t.services.asap : `${existingRequest.scheduledDate} ${existingRequest.scheduledTime}`}
              </p>
            </div>
            {existingRequest.additionalInfo && <div><p className="text-[10px] font-semibold text-gray-400 uppercase">{t.services.additionalInfo}</p><p className="text-sm text-gray-700">{existingRequest.additionalInfo}</p></div>}
            {existingRequest.adminNotes && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">{t.services.teamResponse}</p>
                <p className="text-sm text-blue-800">{existingRequest.adminNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const typeOptions = serviceTypeOptions[categoryName] || serviceTypeOptions["Autre"];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/services")} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200" data-testid="button-back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900" data-testid="text-form-title">{t.services.newRequest}</h2>
            <p className="text-xs text-gray-500">{categoryName}</p>
          </div>
        </div>

        {catalogItemName && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4 mb-4">
            <p className="text-xs font-semibold text-red-700 mb-1">{t.services.selectedModel}</p>
            <p className="font-bold text-sm text-gray-900">{catalogItemName}</p>
            {catalogItemPrice && <p className="text-xs text-red-600 font-semibold mt-0.5">{catalogItemPrice}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-red-500" />
              {t.services.dateTime}
            </h3>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setScheduledType("asap")}
                data-testid="button-asap"
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${scheduledType === "asap" ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                <Clock size={14} className="inline mr-1.5" />{t.services.asap}
              </button>
              <button type="button" onClick={() => setScheduledType("scheduled")}
                data-testid="button-schedule"
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${scheduledType === "scheduled" ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                <Calendar size={14} className="inline mr-1.5" />{t.services.schedule}
              </button>
            </div>
            {scheduledType === "scheduled" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">{t.common.date}</label>
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                    data-testid="input-date" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Heure</label>
                  <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                    data-testid="input-time" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-2">
              <User size={16} className="text-red-500" />
              {t.services.personalInfo}
            </h3>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">{t.services.fullName} *</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                data-testid="input-fullname" placeholder={t.services.fullNamePlaceholder}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">{t.common.phone} *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                  data-testid="input-phone" placeholder={t.services.phonePlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">{t.common.address} *</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
                  data-testid="input-address" placeholder={t.services.addressPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-2">
              <Tag size={16} className="text-red-500" />
              {t.services.serviceDetails}
            </h3>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">{t.services.serviceType} {categoryName}</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)}
                data-testid="select-service-type"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none">
                <option value="">{t.services.select}</option>
                {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">{t.services.estimatedBudget}</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                  data-testid="input-budget" placeholder={t.services.budgetPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">{t.services.additionalInfo}</label>
              <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
                data-testid="input-additional-info" placeholder={t.services.additionalInfoPlaceholder}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none h-24 focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <MessageCircle size={16} className="text-red-500" />
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
                  className={`py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${contactMethod === opt.key ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={createMutation.isPending}
            data-testid="button-submit-request"
            className="w-full bg-red-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 shadow-xl shadow-red-200 flex items-center justify-center gap-2">
            {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
            {createMutation.isPending ? t.services.sending : t.services.sendRequest}
          </button>
        </form>
      </div>
    </div>
  );
}
