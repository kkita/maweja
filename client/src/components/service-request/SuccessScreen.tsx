import ClientNav from "../ClientNav";
import { CheckCircle2 } from "lucide-react";

interface SuccessScreenProps {
  navigate: (href: string) => void;
  t: any;
  hasCatalogModel: boolean;
  catalogItemImage: string | null;
  catalogItemName: string | null;
  categoryName: string;
  budget: string;
  catalogItemPrice: string | null;
  contactMethod: string;
}

export default function SuccessScreen({
  navigate, t,
  hasCatalogModel, catalogItemImage, catalogItemName,
  categoryName, budget, catalogItemPrice, contactMethod,
}: SuccessScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm">
          <div className="w-24 h-24 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h2
            className="text-2xl font-black text-gray-900 dark:text-white mb-2"
            style={{ fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "-0.02em" }}
            data-testid="text-request-sent"
          >
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
                {contactMethod === "whatsapp" ? "WhatsApp" : contactMethod === "phone" ? t.services.telephone : t.services.inApp}
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
