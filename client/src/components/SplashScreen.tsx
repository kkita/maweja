import { useState, useEffect, useRef } from "react";
import { useI18n, type Lang } from "../lib/i18n";
import splashIcon from "@assets/maweja-icon-512.png";

interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
  const [phase, setPhase] = useState<"intro" | "lang">("intro");
  const [langVisible, setLangVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [fadeOut, setFadeOut] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => mounted.current && setIntroStep(1), 100);
    const t2 = setTimeout(() => mounted.current && setIntroStep(2), 600);
    const t3 = setTimeout(() => mounted.current && setIntroStep(3), 1100);
    const t4 = setTimeout(() => {
      if (!mounted.current) return;
      if (hasChosenLanguage) {
        setFadeOut(true);
        setTimeout(() => mounted.current && onDone?.(), 400);
      } else {
        setPhase("lang");
        setTimeout(() => mounted.current && setLangVisible(true), 80);
      }
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
    setFadeOut(true);
    setTimeout(() => onDone?.(), 400);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center select-none overflow-hidden"
      style={{
        backgroundColor: "#EC0000",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? "scale(1.03)" : "scale(1)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {phase === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div
            style={{
              opacity: introStep >= 1 ? 1 : 0,
              transform: introStep >= 1 ? "scale(1)" : "scale(0.6)",
              transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <img
              src={splashIcon}
              alt="Maweja"
              style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                objectFit: "cover",
                boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
              }}
              data-testid="img-splash-logo"
            />
          </div>

          <h1
            style={{
              fontFamily: "'Montserrat', 'SF Pro Display', system-ui, -apple-system, sans-serif",
              fontWeight: 900,
              fontSize: 36,
              color: "#fff",
              letterSpacing: "0.04em",
              marginTop: 20,
              opacity: introStep >= 2 ? 1 : 0,
              transform: introStep >= 2 ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            MAWEJA
          </h1>

          <p
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "0.05em",
              marginTop: 10,
              opacity: introStep >= 3 ? 1 : 0,
              transform: introStep >= 3 ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            Livraison ultra-rapide à Kinshasa
          </p>

          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 40,
              opacity: introStep >= 3 ? 1 : 0,
              transition: "opacity 0.5s ease 0.2s",
            }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.7)",
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
              src={splashIcon}
              alt="Maweja"
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                objectFit: "cover",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            />
            <h2
              style={{
                fontFamily: "'Montserrat', 'SF Pro Display', system-ui, sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: "#fff",
                marginTop: 12,
                letterSpacing: "0.03em",
              }}
            >
              MAWEJA
            </h2>
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
        style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", zIndex: 11, fontFamily: "system-ui, sans-serif" }}
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
