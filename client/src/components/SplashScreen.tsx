import { useState, useEffect, useRef } from "react";
import { useI18n, type Lang } from "../lib/i18n";

interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
  const [phase, setPhase] = useState<"video" | "lang">("video");
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [langVisible, setLangVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* When the video ends (or fails), transition to next phase */
  const handleVideoEnd = () => {
    if (hasChosenLanguage) {
      onDone?.();
    } else {
      setPhase("lang");
      setTimeout(() => setLangVisible(true), 80);
    }
  };

  /* Safety fallback — if video doesn't play within 6 s, skip */
  useEffect(() => {
    const timer = setTimeout(handleVideoEnd, 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
    onDone?.();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end select-none overflow-hidden"
      style={{ backgroundColor: "#dc2626", zIndex: 9999 }}
    >
      {/* ── Full-screen video ─────────────────────────────────────── */}
      {phase === "video" && (
        <video
          ref={videoRef}
          src="/splash.mov"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
          data-testid="splash-video"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover" }}
        />
      )}

      {/* ── Language picker — slides up after video ────────────────── */}
      {phase === "lang" && (
        <div
          className="relative z-10 w-full max-w-sm px-6 pb-10 pt-8"
          style={{
            transition: "opacity 0.4s, transform 0.4s",
            opacity: langVisible ? 1 : 0,
            transform: langVisible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <p
            className="text-center text-white/90 font-bold mb-5 tracking-wide uppercase"
            style={{ fontSize: 13 }}
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
                    style={{ color: selectedLang === code ? "#111827" : "#fff" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: selectedLang === code ? "#9CA3AF" : "rgba(255,255,255,0.6)" }}
                  >
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
            style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}
          >
            {selectedLang === "fr" ? "Commencer →" : "Get Started →"}
          </button>
        </div>
      )}

      {/* ── Signature ─────────────────────────────────────────────── */}
      <p
        className="absolute bottom-4 text-center px-4 w-full"
        style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", zIndex: 11 }}
        data-testid="text-splash-signature"
      >
        Made By Khevin Andrew Kita — Ed Corporation
      </p>
    </div>
  );
}
