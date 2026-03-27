import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n, type Lang } from "../lib/i18n";
import splashIcon from "@assets/maweja-icon-512.png";
import splashVideoSrc from "@assets/maweja-splash.mp4";

interface SplashScreenProps {
  onDone?: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
  const [phase, setPhase] = useState<"video" | "lang">("video");
  const [langVisible, setLangVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [fadeOut, setFadeOut] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const mounted = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasEnded = useRef(false);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const goNext = useCallback(() => {
    if (!mounted.current || hasEnded.current) return;
    hasEnded.current = true;
    if (hasChosenLanguage) {
      setFadeOut(true);
      setTimeout(() => mounted.current && onDone?.(), 400);
    } else {
      setPhase("lang");
      setTimeout(() => mounted.current && setLangVisible(true), 80);
    }
  }, [hasChosenLanguage, onDone]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = () => {
      v.play().then(() => {
        if (mounted.current) setVideoReady(true);
      }).catch(() => {
        if (mounted.current) {
          setVideoReady(true);
          goNext();
        }
      });
    };

    if (v.readyState >= 3) {
      tryPlay();
    } else {
      v.addEventListener("canplay", tryPlay, { once: true });
    }

    const fallback = setTimeout(() => {
      if (!mounted.current || hasEnded.current) return;
      goNext();
    }, 10000);

    return () => {
      clearTimeout(fallback);
      v.removeEventListener("canplay", tryPlay);
    };
  }, [goNext]);

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
      {phase === "video" && (
        <div className="absolute inset-0" style={{ backgroundColor: "#EC0000" }}>
          <video
            ref={videoRef}
            src={splashVideoSrc}
            muted
            playsInline
            preload="auto"
            autoPlay
            onEnded={goNext}
            onError={goNext}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              backgroundColor: "#EC0000",
              opacity: videoReady ? 1 : 0,
              transition: "opacity 0.15s ease",
              pointerEvents: "none",
              WebkitAppearance: "none",
            }}
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            data-testid="video-splash"
          />
          {!videoReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: "#EC0000" }}>
              <img
                src={splashIcon}
                alt="Maweja"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  objectFit: "cover",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  animation: "mw-breathe 1.5s ease-in-out infinite",
                }}
              />
              <h1
                style={{
                  fontFamily: "'Montserrat', system-ui, sans-serif",
                  fontWeight: 900,
                  fontSize: 28,
                  color: "#fff",
                  letterSpacing: "0.04em",
                  marginTop: 16,
                }}
              >
                MAWEJA
              </h1>
            </div>
          )}
        </div>
      )}

      {phase === "lang" && (
        <div className="flex-1 flex flex-col w-full" style={{ backgroundColor: "#EC0000" }}>
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
        @keyframes mw-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        video[data-testid="video-splash"]::-webkit-media-controls,
        video[data-testid="video-splash"]::-webkit-media-controls-enclosure,
        video[data-testid="video-splash"]::-webkit-media-controls-panel,
        video[data-testid="video-splash"]::-webkit-media-controls-start-playback-button,
        video[data-testid="video-splash"]::-webkit-media-controls-play-button,
        video[data-testid="video-splash"]::-webkit-media-controls-overlay-play-button {
          display: none !important;
          -webkit-appearance: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
}
