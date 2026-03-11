import { useState, useEffect } from "react";
import { useI18n, type Lang } from "../lib/i18n";
import logoPath from "@assets/image_1772833363714.png";

export default function SplashScreen() {
  const { setLang, setHasChosenLanguage, t } = useI18n();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");

  useEffect(() => {
    const timer = setTimeout(() => setShowLangPicker(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50" />

      <div className="relative z-10 flex flex-col items-center">
        <div className={`transition-all duration-1000 ${showLangPicker ? "mb-8" : "mb-0"}`}>
          <img src={logoPath} alt="MAWEJA" className="w-32 h-32 object-contain animate-pulse" data-testid="img-splash-logo" />
          <h1 className="text-4xl font-black text-red-600 text-center mt-4" data-testid="text-splash-title">MAWEJA</h1>
          <p className="text-gray-400 text-xs text-center mt-2 font-medium tracking-wide">Food & Services Delivery</p>
        </div>

        {showLangPicker && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-xs">
            <p className="text-center text-gray-700 font-semibold mb-6" data-testid="text-choose-language">
              {selectedLang === "fr" ? "Choisissez votre langue" : "Choose your language"}
            </p>

            <div className="space-y-3 mb-8">
              <button
                onClick={() => setSelectedLang("fr")}
                data-testid="button-lang-fr"
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${
                  selectedLang === "fr"
                    ? "border-red-600 bg-red-50 shadow-lg shadow-red-100"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">🇫🇷</span>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Francais</p>
                  <p className="text-xs text-gray-500">French</p>
                </div>
                {selectedLang === "fr" && <div className="ml-auto w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
              </button>

              <button
                onClick={() => setSelectedLang("en")}
                data-testid="button-lang-en"
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${
                  selectedLang === "en"
                    ? "border-red-600 bg-red-50 shadow-lg shadow-red-100"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">🇬🇧</span>
                <div className="text-left">
                  <p className="font-bold text-gray-900">English</p>
                  <p className="text-xs text-gray-500">Anglais</p>
                </div>
                {selectedLang === "en" && <div className="ml-auto w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
              </button>
            </div>

            <button
              onClick={handleContinue}
              data-testid="button-splash-continue"
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-red-700 shadow-xl shadow-red-200 transition-all"
            >
              {selectedLang === "fr" ? "Continuer" : "Continue"}
            </button>
          </div>
        )}
      </div>

      <p className="absolute bottom-6 text-[10px] text-gray-400 font-medium" data-testid="text-splash-signature">
        Made By Khevin Andrew Kita - Ed Corporation
      </p>
    </div>
  );
}
