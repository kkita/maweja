import { useState, useEffect } from "react";
import { useI18n, type Lang } from "../lib/i18n";

interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
  const [phase, setPhase] = useState<"logo" | "lang">("logo");
  const [logoReady, setLogoReady] = useState(false);
  const [taglineReady, setTaglineReady] = useState(false);
  const [langVisible, setLangVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");

  /* ── Animation sequence ─────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setLogoReady(true), 120);
    const t2 = setTimeout(() => setTaglineReady(true), 700);
    const t3 = setTimeout(() => {
      if (hasChosenLanguage) {
        onDone?.();
      } else {
        setPhase("lang");
        setTimeout(() => setLangVisible(true), 80);
      }
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
    onDone?.();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center select-none overflow-hidden"
      style={{
        backgroundColor: "#dc2626",
        zIndex: 9999,
        fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Logo phase ──────────────────────────────────────────────── */}
      {phase === "logo" && (
        <div className="flex-1 flex flex-col items-center justify-center w-full px-8">
          {/* Glow ring */}
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              opacity: logoReady ? 1 : 0,
              transform: logoReady ? "scale(1)" : "scale(0.5)",
              transition: "opacity 0.6s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              opacity: logoReady ? 1 : 0,
              transform: logoReady ? "scale(1)" : "scale(0.5)",
              transition: "opacity 0.5s ease 0.05s, transform 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.05s",
            }}
          />

          {/* Logo */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              opacity: logoReady ? 1 : 0,
              transform: logoReady ? "scale(1) translateY(0)" : "scale(0.6) translateY(20px)",
              transition: "opacity 0.5s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
              marginBottom: 28,
            }}
          >
            <img
              src="/maweja-logo-red.png"
              alt="Maweja"
              style={{
                width: 110,
                height: 110,
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
              }}
              data-testid="img-splash-logo"
            />
          </div>

          {/* "Maweja" in Montserrat Bold */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              opacity: logoReady ? 1 : 0,
              transform: logoReady ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                fontWeight: 800,
                fontSize: 42,
                color: "#ffffff",
                letterSpacing: "-1px",
                lineHeight: 1,
                margin: 0,
              }}
              data-testid="text-splash-brand"
            >
              Maweja
            </p>
          </div>

          {/* Tagline */}
          <div
            style={{
              opacity: taglineReady ? 1 : 0,
              transform: taglineReady ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.55s ease, transform 0.55s ease",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: "rgba(255,255,255,0.75)",
                letterSpacing: "0.05em",
              }}
            >
              Livraison ultra-rapide à Kinshasa
            </p>
          </div>

          {/* Animated dots loader */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 48,
              opacity: taglineReady ? 1 : 0,
              transition: "opacity 0.4s ease 0.3s",
            }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                  animation: `splash-bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Language picker — slides up after logo ────────────────────── */}
      {phase === "lang" && (
        <div className="flex-1 flex flex-col w-full">
          {/* Top: logo compact */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <img
              src="/maweja-logo-red.png"
              alt="Maweja"
              style={{
                width: 72,
                height: 72,
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
                marginBottom: 12,
              }}
            />
            <p
              style={{
                fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                fontWeight: 800,
                fontSize: 30,
                color: "#ffffff",
                letterSpacing: "-0.5px",
              }}
            >
              Maweja
            </p>
          </div>

          {/* Bottom sheet */}
          <div
            className="w-full max-w-sm mx-auto px-6 pb-10 pt-8"
            style={{
              transition: "opacity 0.4s, transform 0.4s",
              opacity: langVisible ? 1 : 0,
              transform: langVisible ? "translateY(0)" : "translateY(28px)",
            }}
          >
            <p
              className="text-center text-white/90 font-bold mb-5 tracking-wide uppercase"
              style={{ fontSize: 13, fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }}
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
                        fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
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
                fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                fontWeight: 800,
              }}
            >
              {selectedLang === "fr" ? "Commencer →" : "Get Started →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Signature ─────────────────────────────────────────────────── */}
      <p
        className="absolute bottom-4 text-center px-4 w-full"
        style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", zIndex: 11, fontFamily: "system-ui, sans-serif" }}
        data-testid="text-splash-signature"
      >
        Made By Khevin Andrew Kita — Ed Corporation
      </p>

      <style>{`
        @keyframes splash-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
