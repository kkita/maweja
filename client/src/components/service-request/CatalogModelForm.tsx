import ClientNav from "../ClientNav";
import { ArrowLeft, Phone, MapPin, DollarSign, Send, Loader2, Calendar, Zap, AlertTriangle, MessageCircle, Smartphone } from "lucide-react";
import { resolveImg } from "../../lib/queryClient";
import { srCard, srLabel, srInput, srInputIcon, srSectionTitle, SrStep } from "./srStyles";

interface CatalogModelFormProps {
  navigate: (href: string) => void;
  t: any;
  categoryName: string;
  categoryImageUrl: string | null;
  catalogItemImage: string | null;
  catalogItemName: string | null;
  catalogItemPrice: string | null;
  minPrice: number | null;
  currentCategory: any;
  scheduledType: string;
  setScheduledType: (v: string) => void;
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  scheduledTime: string;
  setScheduledTime: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  budget: string;
  handleBudgetChange: (v: string) => void;
  validatePrice: (v: string) => boolean;
  priceError: string;
  additionalInfo: string;
  setAdditionalInfo: (v: string) => void;
  contactMethod: string;
  setContactMethod: (v: string) => void;
  handleSubmit: (e: any) => void;
  isPending: boolean;
  capitalizeWords: (s: string) => string;
}

export default function CatalogModelForm({
  navigate, t, categoryName, categoryImageUrl, catalogItemImage, catalogItemName, catalogItemPrice,
  minPrice, currentCategory, scheduledType, setScheduledType, scheduledDate, setScheduledDate,
  scheduledTime, setScheduledTime, phone, setPhone, address, setAddress,
  budget, handleBudgetChange, validatePrice, priceError, additionalInfo, setAdditionalInfo,
  contactMethod, setContactMethod, handleSubmit, isPending, capitalizeWords,
}: CatalogModelFormProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto">

        <div className="relative">
          {catalogItemImage ? (
            <div className="w-full" style={{ height: 240 }}>
              <img src={resolveImg(catalogItemImage)} alt={catalogItemName || ""} className="w-full h-full object-cover" data-testid="img-selected-model" />
            </div>
          ) : categoryImageUrl ? (
            <div className="w-full" style={{ height: 240 }}>
              <img src={resolveImg(categoryImageUrl)} alt={categoryName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-red-600 to-red-800" />
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

        <div className="px-4 py-5 space-y-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{t.services.quickRequestDesc}</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Step 1 — Date/time */}
            <div className={`${srCard} p-5`}>
              <h3 className={srSectionTitle}>
                <SrStep n={1} />
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

            {/* Step 2 — Contact */}
            <div className={`${srCard} p-5 space-y-4`}>
              <h3 className={srSectionTitle}>
                <SrStep n={2} />
                {t.services.personalInfo}
              </h3>
              <div>
                <label className={srLabel}>{t.common.phone} *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                    data-testid="input-phone" placeholder={t.services.phonePlaceholder} className={srInputIcon} />
                </div>
              </div>
              <div>
                <label className={srLabel}>{t.common.address}</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                    data-testid="input-address" placeholder={t.services.addressPlaceholder} className={srInputIcon} />
                </div>
              </div>

              {!!(currentCategory as any)?.showBudget && (
                <div>
                  <label className={srLabel}>
                    {t.services.yourPrice}
                    {minPrice && <span className="ml-1 normal-case font-normal text-gray-400">({t.services.minPrice}: ${minPrice})</span>}
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={budget} onChange={e => handleBudgetChange(e.target.value)}
                      onBlur={() => validatePrice(budget)} data-testid="input-budget"
                      placeholder={catalogItemPrice ? `${t.services.minPrice}: ${catalogItemPrice}` : t.services.budgetPlaceholder}
                      className={`${srInputIcon} ${priceError ? "border-red-400 bg-red-50 dark:bg-red-950/30 focus:ring-red-400" : ""}`} />
                  </div>
                  {priceError && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-600 dark:text-red-400" data-testid="text-price-error">
                      <AlertTriangle size={13} />
                      <p className="text-[12px] font-semibold">{priceError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3 — Notes */}
            <div className={`${srCard} p-5`}>
              <h3 className={srSectionTitle}>
                <SrStep n={3} />
                {t.services.optionalNotes}
              </h3>
              <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
                data-testid="input-additional-info" placeholder={t.services.optionalNotesPlaceholder}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-[15px] font-medium resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all" />
            </div>

            {/* Step 4 — Contact method */}
            <div className={`${srCard} p-5`}>
              <h3 className={srSectionTitle}>
                <SrStep n={4} />
                {t.services.preferredContact}
              </h3>
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
