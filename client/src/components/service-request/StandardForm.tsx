import ClientNav from "../ClientNav";
import {
  ArrowLeft, Calendar, Zap, User, Phone, MapPin, Tag, DollarSign,
  FileText, MessageCircle, Send, Loader2, Smartphone,
} from "lucide-react";
import { resolveImg } from "../../lib/queryClient";
import { srCard, srLabel, srInput, srInputIcon, srSectionTitle, SrStep } from "./srStyles";

interface CustomField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface StandardFormProps {
  navigate: (href: string) => void;
  t: any;
  categoryName: string;
  categoryImageUrl: string | null;
  typeOptions: string[];
  customFields: CustomField[];
  currentCategory: any;
  scheduledType: string;
  setScheduledType: (v: string) => void;
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  scheduledTime: string;
  setScheduledTime: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  serviceType: string;
  setServiceType: (v: string) => void;
  budget: string;
  setBudget: (v: string) => void;
  additionalInfo: string;
  setAdditionalInfo: (v: string) => void;
  contactMethod: string;
  setContactMethod: (v: string) => void;
  customFieldValues: Record<string, string>;
  setCustomFieldValues: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  handleSubmit: (e: any) => void;
  isPending: boolean;
  capitalizeWords: (s: string) => string;
}

export default function StandardForm({
  navigate, t, categoryName, categoryImageUrl, typeOptions, customFields, currentCategory,
  scheduledType, setScheduledType, scheduledDate, setScheduledDate, scheduledTime, setScheduledTime,
  fullName, setFullName, phone, setPhone, address, setAddress,
  serviceType, setServiceType, budget, setBudget, additionalInfo, setAdditionalInfo,
  contactMethod, setContactMethod, customFieldValues, setCustomFieldValues,
  handleSubmit, isPending, capitalizeWords,
}: StandardFormProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto">

        <div className="relative overflow-hidden">
          {categoryImageUrl ? (
            <div className="w-full" style={{ height: 240 }}>
              <img src={resolveImg(categoryImageUrl)} alt={categoryName} className="w-full h-full object-cover" data-testid="img-service-banner" />
            </div>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-red-600 via-red-700 to-rose-800">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute top-6 -right-4 w-20 h-20 bg-white/5 rounded-full" />
            </div>
          )}

          {categoryName && (
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)" }}>
              <h1 className="text-white font-black text-[22px] tracking-tight leading-tight" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
                {capitalizeWords(categoryName)}
              </h1>
            </div>
          )}

          <button onClick={() => navigate("/services")}
            className="absolute top-4 left-4 w-11 h-11 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"
            data-testid="button-back">
            <ArrowLeft size={18} className="text-white" />
          </button>
        </div>

        <div className="px-4 -mt-4 space-y-4 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Step 1 — Date/time */}
            <div className={`${srCard} p-5`}>
              <h3 className={srSectionTitle}><SrStep n={1} />{t.services.dateTime}</h3>
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
                    <opt.icon size={15} />{opt.label}
                  </button>
                ))}
              </div>
              {scheduledType === "scheduled" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={srLabel}>{t.common.date}</label>
                    <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} data-testid="input-date" className={srInput} />
                  </div>
                  <div>
                    <label className={srLabel}>Heure</label>
                    <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} data-testid="input-time" className={srInput} />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 — Personal info */}
            <div className={`${srCard} p-5 space-y-4`}>
              <h3 className={srSectionTitle}><SrStep n={2} />{t.services.personalInfo}</h3>
              <div>
                <label className={srLabel}>{t.services.fullName} *</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                    data-testid="input-fullname" placeholder={t.services.fullNamePlaceholder} className={srInputIcon} />
                </div>
              </div>
              <div>
                <label className={srLabel}>{t.common.phone} *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                    data-testid="input-phone" placeholder={t.services.phonePlaceholder} className={srInputIcon} />
                </div>
              </div>
              <div>
                <label className={srLabel}>{t.common.address} *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
                    data-testid="input-address" placeholder={t.services.addressPlaceholder} className={srInputIcon} />
                </div>
              </div>
            </div>

            {/* Step 3 — Service details */}
            <div className={`${srCard} p-5 space-y-4`}>
              <h3 className={srSectionTitle}><SrStep n={3} />{t.services.serviceDetails}</h3>
              <div>
                <label className={srLabel}>{t.services.serviceType} — {categoryName}</label>
                <div className="relative">
                  <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select value={serviceType} onChange={e => setServiceType(e.target.value)}
                    data-testid="select-service-type" className={srInputIcon + " appearance-none"}>
                    <option value="">{t.services.select}</option>
                    {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              {(currentCategory as any)?.showBudget && (
                <div>
                  <label className={srLabel}>{t.services.estimatedBudget}</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                      data-testid="input-budget" placeholder={t.services.budgetPlaceholder} className={srInputIcon} />
                  </div>
                </div>
              )}
              {customFields.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800/60">
                  <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Informations spécifiques</p>
                  {customFields.map(cf => (
                    <div key={cf.id}>
                      <label className={srLabel}>
                        {cf.label}
                        {cf.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      {cf.type === "text" && (
                        <input type="text" value={customFieldValues[cf.id] || ""}
                          onChange={e => setCustomFieldValues(v => ({ ...v, [cf.id]: e.target.value }))}
                          placeholder={cf.placeholder || cf.label} data-testid={`custom-field-${cf.id}`} className={srInput} />
                      )}
                      {cf.type === "number" && (
                        <input type="number" value={customFieldValues[cf.id] || ""}
                          onChange={e => setCustomFieldValues(v => ({ ...v, [cf.id]: e.target.value }))}
                          placeholder={cf.placeholder || cf.label} data-testid={`custom-field-${cf.id}`} className={srInput} />
                      )}
                      {cf.type === "textarea" && (
                        <textarea value={customFieldValues[cf.id] || ""}
                          onChange={e => setCustomFieldValues(v => ({ ...v, [cf.id]: e.target.value }))}
                          placeholder={cf.placeholder || cf.label} data-testid={`custom-field-${cf.id}`}
                          className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-[15px] font-medium resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all" />
                      )}
                      {cf.type === "select" && (
                        <select value={customFieldValues[cf.id] || ""}
                          onChange={e => setCustomFieldValues(v => ({ ...v, [cf.id]: e.target.value }))}
                          data-testid={`custom-field-${cf.id}`} className={srInput + " appearance-none"}>
                          <option value="">{cf.placeholder || "Sélectionner..."}</option>
                          {(cf.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {cf.type === "date" && (
                        <input type="date" value={customFieldValues[cf.id] || ""}
                          onChange={e => setCustomFieldValues(v => ({ ...v, [cf.id]: e.target.value }))}
                          data-testid={`custom-field-${cf.id}`} className={srInput} />
                      )}
                      {cf.type === "photo" && (
                        <div>
                          {customFieldValues[cf.id] ? (
                            <div className="relative">
                              <img src={customFieldValues[cf.id]} alt={cf.label} className="w-full h-32 object-cover rounded-2xl border border-gray-200 dark:border-gray-700" />
                              <button type="button" onClick={() => setCustomFieldValues(v => ({ ...v, [cf.id]: "" }))}
                                className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white">
                                <span className="text-xs font-bold">×</span>
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 text-sm cursor-pointer hover:border-red-300 hover:text-red-500 transition-colors"
                              data-testid={`custom-field-${cf.id}`}>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  try {
                                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                                    const data = await res.json();
                                    if (data.url) setCustomFieldValues(v => ({ ...v, [cf.id]: data.url }));
                                  } catch {}
                                }} />
                              📷 {cf.placeholder || "Ajouter une photo"}
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className={srLabel}>{t.services.additionalInfo}</label>
                <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
                  data-testid="input-additional-info" placeholder={t.services.additionalInfoPlaceholder}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-[15px] font-medium resize-none h-28 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all" />
              </div>
            </div>

            {/* Step 4 — Contact method */}
            <div className={`${srCard} p-5`}>
              <h3 className={srSectionTitle}><SrStep n={4} />{t.services.preferredContact}</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "phone", label: t.services.telephone, icon: Phone },
                  { key: "whatsapp", label: t.services.whatsapp, icon: MessageCircle },
                  { key: "inapp", label: t.services.inApp, icon: Smartphone },
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

            <button type="submit" disabled={isPending} data-testid="button-submit-request"
              className="w-full bg-red-600 text-white rounded-2xl font-black text-[16px] hover:bg-red-700 disabled:opacity-50 shadow-2xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
              style={{ fontFamily: "system-ui,-apple-system,sans-serif", paddingTop: "1.125rem", paddingBottom: "1.125rem" }}>
              {isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
              {isPending ? t.services.sending : t.services.sendRequest}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
