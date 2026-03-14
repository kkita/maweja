import { useState, useEffect } from "react";
import { useI18n, type Lang } from "../lib/i18n";
import logoPath from "@assets/image_1772833363714.png";

export default function SplashScreen() {
  const { setLang, setHasChosenLanguage } = useI18n();
  const [phase, setPhase] = useState<"intro" | "lang">("intro");
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setLogoVisible(true), 200);
    const t1 = setTimeout(() => setTextVisible(true), 700);
    const t2 = setTimeout(() => setTaglineVisible(true), 1100);
    const t3 = setTimeout(() => setPhase("lang"), 2200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)" }}>

      {/* Animated circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-10 animate-pulse"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", animationDelay: "1s" }} />
        <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-white/25 rounded-full animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
        {/* Decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-white/5 animate-spin" style={{ animationDuration: "20s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full border border-white/5 animate-spin" style={{ animationDuration: "30s", animationDirection: "reverse" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm">

        {/* Logo block */}
        <div className={`flex flex-col items-center transition-all duration-700 ${phase === "lang" ? "mb-8 scale-90" : "mb-0"}`}>

          {/* Logo circle */}
          <div
            className={`transition-all duration-700 ease-out ${logoVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-8"}`}
          >
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 -m-3 rounded-[32px] bg-white/15 blur-xl" />
              {/* Logo container */}
              <div className="relative w-28 h-28 bg-white rounded-[28px] shadow-2xl flex items-center justify-center overflow-hidden"
                style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.15)" }}>
                <img
                  src={logoPath}
                  alt="MAWEJA"
                  className="w-full h-full object-contain p-2"
                  data-testid="img-splash-logo"
                />
              </div>
              {/* Pulse ring */}
              {logoVisible && (
                <div className="absolute inset-0 -m-1.5 rounded-[32px] border-2 border-white/30 animate-ping" style={{ animationDuration: "2s" }} />
              )}
            </div>
          </div>

          {/* MAWEJA title */}
          <div className={`mt-6 text-center transition-all duration-600 delay-300 ${textVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg" data-testid="text-splash-title">
              MAWEJA
            </h1>
          </div>

          {/* Tagline */}
          <div className={`mt-2 transition-all duration-600 delay-500 ${taglineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <p className="text-white/70 text-sm font-medium tracking-[0.2em] uppercase text-center">
              Food & Services Delivery
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-8 bg-white/30" />
              <span className="text-white/50 text-xs font-medium">Kinshasa, RDC</span>
              <div className="h-px w-8 bg-white/30" />
            </div>
          </div>
        </div>

        {/* Language picker */}
        {phase === "lang" && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500">

            <p className="text-center text-white/80 font-semibold mb-5 text-sm tracking-wide uppercase" data-testid="text-choose-language">
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

        {/* Loading dots when still in intro phase */}
        {phase === "intro" && logoVisible && (
          <div className="mt-10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
