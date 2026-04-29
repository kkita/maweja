import { useState, useEffect, useRef, useCallback } from "react";
import Lottie from "lottie-react";
import { useI18n, type Lang } from "../lib/i18n";
import { applySplashBars } from "../lib/theme";

// JSON de l'animation Maweja (~575 KB, 150 frames @ 30 fps = 5 s) — bundlé une
// seule fois, partagé par les deux apps mobiles (client + driver) via le webDir
// Capacitor. Import relatif : alias TS et alias Vite divergent sur `@assets`.
import lottieData from "../assets/maweja-splash.json";

// ─── Détection native (évaluée une seule fois) ───────────────────────────────
const IS_NATIVE: boolean =
  typeof window !== "undefined" &&
  !!(window as any).Capacitor?.isNativePlatform?.();

// ─── Nettoyage du fallback HTML splash ───────────────────────────────────────
function removeHtmlSplash() {
  const w = window as any;
  if (w.__MAWEJA_SPLASH_TIMER__) {
    clearTimeout(w.__MAWEJA_SPLASH_TIMER__);
    w.__MAWEJA_SPLASH_TIMER__ = null;
  }
  const el = document.getElementById("maweja-native-splash");
  if (el) {
    el.style.transition = "opacity 0.20s ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 230);
  }
}

// ─── Composant animation Lottie plein écran ──────────────────────────────────
interface MobileSplashAnimProps {
  withFadeOut: boolean;
  onEnd: () => void;
}

function MobileSplashAnim({ withFadeOut, onEnd }: MobileSplashAnimProps) {
  const [tagIn,  setTagIn]  = useState(false);
  const [fade,   setFade]   = useState(false);
  const alive    = useRef(true);
  const ended    = useRef(false);

  const finish = useCallback(() => {
    if (!alive.current || ended.current) return;
    ended.current = true;
    if (withFadeOut) {
      setFade(true);
      setTimeout(() => onEnd(), 320);
    } else {
      onEnd();
    }
  }, [withFadeOut, onEnd]);

  useEffect(() => {
    alive.current = true;
    applySplashBars();

    // Tagline apparaît après 1.2 s (pendant que le Lottie joue)
    const tagT = setTimeout(() => alive.current && setTagIn(true), 1200);

    // ── Timer principal : 5.0 s (durée exacte du Lottie : 150 frames @ 30 fps).
    // Indépendant de onComplete pour garantir une transition fiable même si la
    // librairie ne déclenche pas le callback (rare mais constaté en dev/web).
    const mainT = setTimeout(() => alive.current && finish(), 5000);

    // ── Filet de sécurité absolu : 7 s max, jamais d'écran bloqué.
    const safetyT = setTimeout(() => alive.current && finish(), 7000);

    return () => {
      alive.current = false;
      clearTimeout(tagT);
      clearTimeout(mainT);
      clearTimeout(safetyT);
    };
  }, [finish]);

  return (
    <div
      data-testid="splash-root"
      style={{
        // Fond identique au splash natif Capacitor → zéro flash blanc
        position: "fixed",
        inset: 0,
        backgroundColor: "#EC0000",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade ? 0 : 1,
        transition: fade ? "opacity 0.32s ease" : "none",
        willChange: "opacity",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        overflow: "hidden",
      }}
    >
      {/* ── Lottie Maweja centré, plein cadre carré responsive ─────────────── */}
      <div
        style={{
          width:  "min(78vw, 380px)",
          height: "min(78vw, 380px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateZ(0)",
        }}
      >
        <Lottie
          animationData={lottieData}
          loop={false}
          autoplay
          onComplete={finish}
          rendererSettings={{
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: true,
          }}
          style={{
            width:  "100%",
            height: "100%",
            filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.22))",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Tagline bas, respecte la safe area iOS ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: tagIn ? 1 : 0,
          transition: "opacity 0.55s ease",
        }}
      >
      </div>
    </div>
  );
}

// ─── Composant principal SplashScreen ────────────────────────────────────────
interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
  const [phase,        setPhase]        = useState<"anim" | "lang">("anim");
  const [langVisible,  setLangVisible]  = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [fadeOut,      setFadeOut]      = useState(false);
  const mounted  = useRef(true);
  const hasEnded = useRef(false);

  // Retire le fallback HTML dès que React prend le relais (même frame)
  useEffect(() => {
    removeHtmlSplash();
    return () => { mounted.current = false; };
  }, []);

  const goNext = useCallback(() => {
    if (!mounted.current || hasEnded.current) return;
    hasEnded.current = true;
    if (hasChosenLanguage) {
      // Returning user → fondu + fin
      setFadeOut(true);
      setTimeout(() => mounted.current && onDone?.(), 350);
    } else {
      // New user → lang picker (fond rouge commun = transition invisible)
      setPhase("lang");
      setTimeout(() => mounted.current && setLangVisible(true), 80);
    }
  }, [hasChosenLanguage, onDone]);

  // ── Phase anim — Lottie plein écran (mobile + web même expérience) ────────
  if (phase === "anim") {
    return (
      <MobileSplashAnim
        withFadeOut={hasChosenLanguage}
        onEnd={goNext}
      />
    );
  }

  // ── Phase lang — sélecteur de langue ─────────────────────────────────────
  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
    setFadeOut(true);
    setTimeout(() => onDone?.(), 350);
  };

  return (
    <div
      className="fixed inset-0 select-none overflow-hidden"
      style={{
        backgroundColor: "#EC0000",
        zIndex: 9999,
        opacity:    fadeOut ? 0 : 1,
        transform:  fadeOut ? "scale(1.03)" : "scale(1)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
      data-testid="splash-root"
    >
      <div className="flex flex-col w-full h-full" style={{ backgroundColor: "#EC0000" }}>
        <div className="flex-1 flex flex-col items-center justify-center" />

        <div
          className="w-full max-w-sm mx-auto px-6 pb-10 pt-8"
          style={{
            transition: "opacity 0.35s ease, transform 0.35s ease",
            opacity:   langVisible ? 1 : 0,
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
              { code: "fr" as Lang, flag: "🇫🇷", label: "Français", sub: "French"  },
              { code: "en" as Lang, flag: "🇬🇧", label: "English",  sub: "Anglais" },
            ].map(({ code, flag, label, sub }) => (
              <button
                key={code}
                onClick={() => setSelectedLang(code)}
                data-testid={`button-lang-${code}`}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 active:scale-[0.97]"
                style={{
                  background:  selectedLang === code ? "#fff" : "rgba(255,255,255,0.15)",
                  border:      selectedLang === code ? "none" : "1px solid rgba(255,255,255,0.25)",
                  boxShadow:   selectedLang === code ? "0 8px 24px rgba(0,0,0,0.25)" : "none",
                }}
              >
                <span className="text-3xl">{flag}</span>
                <div className="text-left flex-1">
                  <p
                    className="font-bold text-base"
                    style={{
                      color:      selectedLang === code ? "#111827" : "#fff",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
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
                    background:  selectedLang === code ? "#dc2626" : "transparent",
                  }}
                >
                  {selectedLang === code && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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
              boxShadow:  "0 16px 40px rgba(0,0,0,0.35)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 800,
            }}
          >
            {selectedLang === "fr" ? "Commencer →" : "Get Started →"}
          </button>
        </div>

      </div>
    </div>
  );
}
