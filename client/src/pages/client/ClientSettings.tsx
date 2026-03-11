import { useI18n, type Lang } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import ClientNav from "../../components/ClientNav";
import { ArrowLeft, Globe, ChevronRight, Bell, Shield, HelpCircle, Info } from "lucide-react";
import { useLocation } from "wouter";

export default function ClientSettings() {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200" data-testid="button-back">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-black text-gray-900" data-testid="text-settings-title">{t.settings.title}</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Globe size={16} className="text-red-500" />
              {t.settings.language}
            </h3>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={() => setLang("fr")}
              data-testid="button-lang-fr"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${lang === "fr" ? "bg-red-50 border-2 border-red-500" : "bg-gray-50 border-2 border-transparent hover:border-gray-200"}`}
            >
              <span className="text-xl">🇫🇷</span>
              <span className="font-semibold text-sm text-gray-900">{t.common.french}</span>
              {lang === "fr" && <span className="ml-auto text-red-600 font-bold text-xs">✓</span>}
            </button>
            <button
              onClick={() => setLang("en")}
              data-testid="button-lang-en"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${lang === "en" ? "bg-red-50 border-2 border-red-500" : "bg-gray-50 border-2 border-transparent hover:border-gray-200"}`}
            >
              <span className="text-xl">🇬🇧</span>
              <span className="font-semibold text-sm text-gray-900">{t.common.english}</span>
              {lang === "en" && <span className="ml-auto text-red-600 font-bold text-xs">✓</span>}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[
              { icon: Bell, label: t.settings.notifications, testId: "button-notif" },
              { icon: Shield, label: t.settings.privacyPolicy, testId: "button-privacy" },
              { icon: HelpCircle, label: t.settings.contactSupport, testId: "button-support" },
              { icon: Info, label: t.settings.about, testId: "button-about" },
            ].map((item) => (
              <button key={item.label} data-testid={item.testId} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <item.icon size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700 flex-1 text-left">{item.label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">
          MAWEJA v1.0 - Made By Khevin Andrew Kita - Ed Corporation
        </p>
      </div>
    </div>
  );
}
