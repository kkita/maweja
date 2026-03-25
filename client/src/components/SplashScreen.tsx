import { useState, useEffect, useRef } from "react";
import { useI18n, type Lang } from "../lib/i18n";

interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
  const [phase, setPhase] = useState<"logo" | "lang">("logo");
  const [step, setStep] = useState(0);
  const [langVisible, setLangVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [fadeOut, setFadeOut] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => mounted.current && setStep(1), 50);
    const t2 = setTimeout(() => mounted.current && setStep(2), 350);
    const t3 = setTimeout(() => mounted.current && setStep(3), 650);
    const t4 = setTimeout(() => {
      if (!mounted.current) return;
      if (hasChosenLanguage) {
        setFadeOut(true);
        setTimeout(() => mounted.current && onDone?.(), 350);
      } else {
        setPhase("lang");
        setTimeout(() => mounted.current && setLangVisible(true), 60);
      }
    }, 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
    setFadeOut(true);
    setTimeout(() => onDone?.(), 350);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center select-none overflow-hidden"
      style={{
        backgroundColor: "#EC0000",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? "scale(1.05)" : "scale(1)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {phase === "logo" && (
        <div className="flex-1 flex flex-col items-center justify-center w-full px-8">
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              opacity: step >= 1 ? 1 : 0,
              transform: step >= 1 ? "scale(1)" : "scale(0.3)",
              transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              opacity: step >= 1 ? 1 : 0,
              transform: step >= 1 ? "scale(1) translateY(0)" : "scale(0.5) translateY(24px)",
              transition: "opacity 0.4s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <img
              src="/maweja-logo-red.png"
              alt="Maweja"
              style={{
                width: 160,
                height: 160,
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
              }}
              data-testid="img-splash-logo"
            />
          </div>

          <div
            style={{
              opacity: step >= 2 ? 1 : 0,
              transform: step >= 2 ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
              marginTop: 20,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.08em",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              Livraison ultra-rapide à Kinshasa
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 5,
              marginTop: 40,
              opacity: step >= 3 ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.55)",
                  animation: `mw-pulse 0.9s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === "lang" && (
        <div className="flex-1 flex flex-col w-full">
          <div className="flex-1 flex flex-col items-center justify-center">
            <img
              src="/maweja-logo-red.png"
              alt="Maweja"
              style={{
                width: 90,
                height: 90,
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
              }}
            />
          </div>

          <div
            className="w-full max-w-sm mx-auto px-6 pb-10 pt-8"
            style={{
              transition: "opacity 0.35s ease, transform 0.35s ease",
              opacity: langVisible ? 1 : 0,
              transform: langVisible ? "translateY(0)" : "translateY(24px)",
            }}
          >
            <p
              className="text-center text-white/90 font-bold mb-5 tracking-wide uppercase"
              style={{ fontSize: 13, fontFamily: "system-ui, -apple-system, sans-serif" }}
              data-testid="text-choose-language"
            >
              {selectedLang === "fr" ? "Choisissez votre langue" : "Choose your language"}
            </p>

            <div className="space-y-3 mb-5">
              {[
                { code: "fr" as Lang, flag: "🇫🇷", label: "Français", sub: "French" },
                { code: "en" as Lang, flag: "🇬🇧", label: "English", sub: "Anglais" },
              ].map(({ code, flag, label, sub }) => (
                <button
                  key={code}
                  onClick={() => setSelectedLang(code)}
                  data-testid={`button-lang-${code}`}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: selectedLang === code ? "#fff" : "rgba(255,255,255,0.15)",
                    border: selectedLang === code ? "none" : "1px solid rgba(255,255,255,0.25)",
                    boxShadow: selectedLang === code ? "0 8px 24px rgba(0,0,0,0.25)" : "none",
                  }}
                >
                  <span className="text-3xl">{flag}</span>
                  <div className="text-left flex-1">
                    <p
                      className="font-bold text-base"
                      style={{
                        color: selectedLang === code ? "#111827" : "#fff",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: selectedLang === code ? "#9CA3AF" : "rgba(255,255,255,0.6)" }}>
                      {sub}
                    </p>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: selectedLang === code ? "#dc2626" : "rgba(255,255,255,0.4)",
                      background: selectedLang === code ? "#dc2626" : "transparent",
                    }}
                  >
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
              className="w-full bg-white text-red-600 py-4 rounded-2xl font-black text-base tracking-wide active:scale-[0.97] transition-all"
              style={{
                boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: 800,
              }}
            >
              {selectedLang === "fr" ? "Commencer →" : "Get Started →"}
            </button>
          </div>
        </div>
      )}

      <p
        className="absolute bottom-4 text-center px-4 w-full"
        style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", zIndex: 11, fontFamily: "system-ui, sans-serif" }}
        data-testid="text-splash-signature"
      >
        Made By Khevin Andrew Kita — Ed Corporation
      </p>

      <style>{`
        @keyframes mw-pulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.35; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
