import { useState, useEffect } from "react";
import { useI18n, type Lang } from "../lib/i18n";
import mawejaLogoSrc from "@assets/image_1772833363714.png";

interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
  const [phase, setPhase] = useState<"intro" | "lang">("intro");
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 200);
    const t1 = setTimeout(() => setTextVisible(true), 600);
    const t2 = setTimeout(() => setTaglineVisible(true), 1000);
    const t3 = setTimeout(() => {
      if (hasChosenLanguage) {
        onDone?.();
      } else {
        setPhase("lang");
      }
    }, 5000);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
    onDone?.();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{ backgroundColor: "#dc2626" }}
    >
      {/* Subtle vignette edges */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.12) 100%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm">

        {/* Logo block */}
        <div className={`flex flex-col items-center transition-all duration-500 ${phase === "lang" ? "mb-10 scale-90" : "mb-0"}`}>

          {/* MAWEJA logo image — white on red, no visible background */}
          <div className={`transition-all duration-700 ease-out ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-6"}`}>
            <img
              src={mawejaLogoSrc}
              alt="MAWEJA"
              data-testid="text-splash-title"
              className="w-56 h-auto object-contain"
              style={{ mixBlendMode: "normal" }}
            />
          </div>

          {/* Divider line */}
          <div className={`mt-4 transition-all duration-500 ${textVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-white/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <div className="h-px w-12 bg-white/40" />
            </div>
          </div>

          {/* Tagline */}
          <div className={`mt-3 text-center transition-all duration-500 ${taglineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <p className="text-white/75 text-sm font-medium tracking-[0.22em] uppercase">
              Food &amp; Services Delivery
            </p>
            <p className="text-white/50 text-xs mt-1.5 tracking-widest font-medium">
              Kinshasa, RDC
            </p>
          </div>

          {/* Loading dots (intro phase only) */}
          {phase === "intro" && taglineVisible && (
            <div className="mt-10 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {/* Language picker (only if language not chosen yet) */}
        {phase === "lang" && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
            <p className="text-center text-white/85 font-semibold mb-5 text-sm tracking-wide uppercase" data-testid="text-choose-language">
              {selectedLang === "fr" ? "Choisissez votre langue" : "Choose your language"}
            </p>

            <div className="space-y-3 mb-6">
              {[
                { code: "fr" as Lang, flag: "🇫🇷", label: "Français", sub: "French" },
                { code: "en" as Lang, flag: "🇬🇧", label: "English", sub: "Anglais" },
              ].map(({ code, flag, label, sub }) => (
                <button
                  key={code}
                  onClick={() => setSelectedLang(code)}
                  data-testid={`button-lang-${code}`}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 active:scale-[0.97] ${
                    selectedLang === code
                      ? "bg-white shadow-2xl scale-[1.02]"
                      : "bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25"
                  }`}
                >
                  <span className="text-3xl">{flag}</span>
                  <div className="text-left flex-1">
                    <p className={`font-bold text-base ${selectedLang === code ? "text-gray-900" : "text-white"}`}>{label}</p>
                    <p className={`text-xs mt-0.5 ${selectedLang === code ? "text-gray-400" : "text-white/60"}`}>{sub}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedLang === code ? "border-red-600 bg-red-600" : "border-white/40"
                  }`}>
                    {selectedLang === code && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleContinue}
              data-testid="button-splash-continue"
              className="w-full bg-white text-red-600 py-4 rounded-2xl font-black text-base tracking-wide hover:bg-red-50 active:scale-[0.97] transition-all shadow-2xl"
              style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
            >
              {selectedLang === "fr" ? "Commencer →" : "Get Started →"}
            </button>
          </div>
        )}
      </div>

      {/* Signature */}
      <p className="absolute bottom-6 text-[10px] text-white/30 font-medium text-center px-4" data-testid="text-splash-signature">
        Made By Khevin Andrew Kita — Ed Corporation
      </p>
    </div>
  );
}
