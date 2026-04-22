import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n, type Lang } from "../lib/i18n";
import { applySplashBars, syncNativeStatusBar } from "../lib/theme";

// ─── Détection native (évaluée une seule fois, jamais rejouée) ───────────────
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
    el.style.transition = "opacity 0.25s ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 280);
  }
}

// ─── Keyframes CSS — injectés une seule fois dans le <head> ─────────────────
const KEYFRAMES = `
  @keyframes mwM {
    0%   { opacity: 0; transform: scale(0.76) translateY(22px); }
    56%  { opacity: 1; transform: scale(1.045) translateY(-4px); }
    76%  { transform: scale(0.985) translateY(1px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes mwWord {
    0%   { opacity: 0; transform: translateY(11px) scaleX(0.96); }
    38%  { opacity: 1; }
    100% { opacity: 1; transform: translateY(0) scaleX(1); }
  }
  @keyframes mwTag {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
`;

let keyframesInjected = false;
function ensureKeyframes() {
  if (keyframesInjected) return;
  keyframesInjected = true;
  const style = document.createElement("style");
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

// ─── Composant animation premium ─────────────────────────────────────────────
interface MobileSplashAnimProps {
  withFadeOut: boolean;
  onEnd: () => void;
}

function MobileSplashAnim({ withFadeOut, onEnd }: MobileSplashAnimProps) {
  const [mIn,  setMIn]  = useState(false);
  const [wIn,  setWIn]  = useState(false);
  const [tIn,  setTIn]  = useState(false);
  const [fade, setFade] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    ensureKeyframes();
    alive.current = true;
    applySplashBars();

    const schedule = (fn: () => void, ms: number) =>
      setTimeout(() => { if (alive.current) fn(); }, ms);

    // ── Séquence précise ──────────────────────────────────────────────────
    // t=0      : fond rouge affiché (même couleur que splash natif → aucun flash)
    // t=150ms  : "M" entre — spring 700ms cubic-bezier(0.22,1,0.36,1)
    // t=800ms  : "MAWEJA" entre — 600ms ease-out (léger overlap avec fin du M)
    // t=1150ms : tagline entre — 500ms ease
    // ── Returning user (withFadeOut=true) ────────────────────────────────
    // t=2100ms : fondu-sortant commence (transition CSS 320ms)
    // t=2430ms : onEnd() → app
    // ── New user (withFadeOut=false) ─────────────────────────────────────
    // t=2200ms : onEnd() → lang picker (fond rouge continu, transition invisible)

    const t1 = schedule(() => setMIn(true),  150);
    const t2 = schedule(() => setWIn(true),  800);
    const t3 = schedule(() => setTIn(true),  1150);

    let t4: ReturnType<typeof setTimeout>;
    let t5: ReturnType<typeof setTimeout>;

    if (withFadeOut) {
      t4 = schedule(() => setFade(true), 2100);
      t5 = schedule(onEnd, 2430);
    } else {
      t4 = schedule(onEnd, 2200);
    }

    return () => {
      alive.current = false;
      [t1, t2, t3, t4, t5].forEach(t => t && clearTimeout(t));
    };
  }, []); // intentionnellement vide — l'animation ne se rejoue jamais

  // Styles dynamiques sans conflit opacity/animation
  // fill-mode "both" → 0% du keyframe appliqué immédiatement (opacity:0)
  // → aucun flash entre l'état caché et le début de l'animation
  const mStyle: React.CSSProperties = mIn
    ? { animation: "mwM 0.70s cubic-bezier(0.22, 1, 0.36, 1) both", willChange: "transform, opacity" }
    : { opacity: 0 };

  const wStyle: React.CSSProperties = wIn
    ? { animation: "mwWord 0.60s cubic-bezier(0.25, 0.46, 0.45, 0.94) both", willChange: "transform, opacity" }
    : { opacity: 0 };

  const tStyle: React.CSSProperties = tIn
    ? { animation: "mwTag 0.50s ease both", willChange: "opacity" }
    : { opacity: 0 };

  return (
    <div
      data-testid="splash-root"
      style={{
        // Fond identique au splash natif Capacitor → zéro flash blanc
        position: "fixed",
        inset: 0,
        backgroundColor: "#EC0000",
        zIndex: 9999,
        // Centrage géométrique parfait — indépendant des safe areas
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // Fondu sortant global
        opacity: fade ? 0 : 1,
        transition: fade ? "opacity 0.32s ease" : "none",
        willChange: "opacity",
        // Blocage des interactions
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        // Pas de padding ici → centrage au cœur exact de l'écran
      }}
    >
      {/* ── Centre : M + MAWEJA ────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          // translateZ force la couche GPU dès le départ — zéro jank au premier frame
          transform: "translateZ(0)",
        }}
      >
        {/* Logo M MAWEJA (vrai logo, pas une lettre) ───────────────────── */}
        <div style={mStyle}>
          <img
            src="/maweja-splash-logo.png"
            alt="MAWEJA"
            draggable={false}
            style={{
              display: "block",
              width: 168,
              height: 168,
              objectFit: "contain",
              filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.28))",
              userSelect: "none",
              WebkitUserSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Wordmark retiré — le logo contient déjà "Maweja" */}
      </div>

      {/* ── Tagline bas — respecte la safe area iOS ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          // max() entre la valeur fixe et la safe area iOS (Dynamic Island, etc.)
          bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          ...tStyle,
        }}
      >
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 10,
            color: "rgba(255,255,255,0.32)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Made By Khevin Andrew Kita — Ed Corporation
        </span>
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

  // ── Timer web uniquement (natif géré par MobileSplashAnim) ───────────────
  useEffect(() => {
    if (phase !== "anim" || IS_NATIVE) return;
    const delay = hasChosenLanguage ? 350 : 1500;
    const t = setTimeout(() => {
      if (mounted.current && !hasEnded.current) goNext();
    }, delay);
    return () => clearTimeout(t);
  }, [phase, goNext, hasChosenLanguage]);

  // ── Phase anim — mobile natif ─────────────────────────────────────────────
  if (phase === "anim" && IS_NATIVE) {
    return (
      <MobileSplashAnim
        withFadeOut={hasChosenLanguage}
        onEnd={goNext}
      />
    );
  }

  // ── Phase anim — web (fond rouge rapide, aucune animation) ───────────────
  if (phase === "anim") {
    return (
      <div
        className="fixed inset-0"
        style={{ backgroundColor: "#EC0000", zIndex: 9998 }}
        onClick={goNext}
        data-testid="splash-root"
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

        <p
          className="text-center px-4 w-full pb-4"
          style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui, sans-serif" }}
          data-testid="text-splash-signature"
        >
          Made By Khevin Andrew Kita — Ed Corporation
        </p>
      </div>
    </div>
  );
}
