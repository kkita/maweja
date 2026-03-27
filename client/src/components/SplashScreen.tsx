import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n, type Lang } from "../lib/i18n";
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
  const [videoPlaying, setVideoPlaying] = useState(false);
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
    if (phase !== "video") return;
    const v = videoRef.current;
    if (!v) return;

    let attempts = 0;
    const maxAttempts = 5;

    const tryPlay = () => {
      if (hasEnded.current) return;
      v.muted = true;
      v.play().then(() => {
        if (mounted.current) setVideoPlaying(true);
      }).catch(() => {
        attempts++;
        if (attempts < maxAttempts && mounted.current && !hasEnded.current) {
          setTimeout(tryPlay, 200);
        } else if (mounted.current) {
          goNext();
        }
      });
    };

    if (v.readyState >= 2) {
      tryPlay();
    } else {
      v.addEventListener("loadeddata", tryPlay, { once: true });
    }

    const fallback = setTimeout(() => {
      if (!mounted.current || hasEnded.current) return;
      goNext();
    }, 8000);

    return () => {
      clearTimeout(fallback);
      v.removeEventListener("loadeddata", tryPlay);
    };
  }, [phase, goNext]);

  const handleContinue = () => {
    setLang(selectedLang);
    setHasChosenLanguage(true);
    setFadeOut(true);
    setTimeout(() => onDone?.(), 400);
  };

  return (
    <div
      className="fixed inset-0 select-none overflow-hidden"
      style={{
        backgroundColor: "#EC0000",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? "scale(1.03)" : "scale(1)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
      data-testid="splash-root"
    >
      {phase === "video" && (
        <>
          <video
            ref={videoRef}
            src={splashVideoSrc}
            muted
            playsInline
            preload="auto"
            autoPlay
            onEnded={goNext}
            onError={goNext}
            onPlay={() => setVideoPlaying(true)}
            className="splash-video"
            style={{ opacity: videoPlaying ? 1 : 0 }}
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            data-testid="video-splash"
          />
          {!videoPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "#EC0000" }}
              onClick={() => {
                const v = videoRef.current;
                if (v) { v.muted = true; v.play().then(() => setVideoPlaying(true)).catch(() => {}); }
              }}
            >
              <div className="splash-loader" />
            </div>
          )}
        </>
      )}

      {phase === "lang" && (
        <div className="flex flex-col w-full h-full" style={{ backgroundColor: "#EC0000" }}>
          <div className="flex-1 flex flex-col items-center justify-center" />

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

          <p
            className="text-center px-4 w-full pb-4"
            style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui, sans-serif" }}
            data-testid="text-splash-signature"
          >
            Made By Khevin Andrew Kita — Ed Corporation
          </p>
        </div>
      )}

      <style>{`
        .splash-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background-color: #EC0000;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
          transition: opacity 0.2s ease;
        }
        .splash-video::-webkit-media-controls,
        .splash-video::-webkit-media-controls-enclosure,
        .splash-video::-webkit-media-controls-panel,
        .splash-video::-webkit-media-controls-start-playback-button,
        .splash-video::-webkit-media-controls-play-button,
        .splash-video::-webkit-media-controls-overlay-play-button,
        .splash-video::-webkit-media-controls-current-time-display,
        .splash-video::-webkit-media-controls-time-remaining-display,
        .splash-video::-webkit-media-controls-timeline,
        .splash-video::-webkit-media-controls-volume-slider,
        .splash-video::-webkit-media-controls-mute-button,
        .splash-video::-webkit-media-controls-fullscreen-button {
          display: none !important;
          -webkit-appearance: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .splash-loader {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: splash-spin 0.7s linear infinite;
        }
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
