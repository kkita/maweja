import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useI18n } from "../lib/i18n";
export default function SplashScreen({ onDone }) {
    const { setLang, setHasChosenLanguage, hasChosenLanguage } = useI18n();
    const [phase, setPhase] = useState("logo");
    const [logoReady, setLogoReady] = useState(false);
    const [taglineReady, setTaglineReady] = useState(false);
    const [langVisible, setLangVisible] = useState(false);
    const [selectedLang, setSelectedLang] = useState("fr");
    /* ── Animation sequence ─────────────────────────────────────────── */
    useEffect(() => {
        const t1 = setTimeout(() => setLogoReady(true), 120);
        const t2 = setTimeout(() => setTaglineReady(true), 700);
        const t3 = setTimeout(() => {
            if (hasChosenLanguage) {
                onDone?.();
            }
            else {
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
    return (_jsxs("div", { className: "fixed inset-0 flex flex-col items-center select-none overflow-hidden", style: {
            backgroundColor: "#EC0000",
            zIndex: 9999,
            fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
        }, children: [phase === "logo" && (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center w-full px-8", children: [_jsx("div", { style: {
                            position: "absolute",
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            opacity: logoReady ? 1 : 0,
                            transform: logoReady ? "scale(1)" : "scale(0.5)",
                            transition: "opacity 0.6s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                        } }), _jsx("div", { style: {
                            position: "absolute",
                            width: 160,
                            height: 160,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.12)",
                            opacity: logoReady ? 1 : 0,
                            transform: logoReady ? "scale(1)" : "scale(0.5)",
                            transition: "opacity 0.5s ease 0.05s, transform 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.05s",
                        } }), _jsx("div", { style: {
                            position: "relative",
                            zIndex: 2,
                            opacity: logoReady ? 1 : 0,
                            transform: logoReady ? "scale(1) translateY(0)" : "scale(0.6) translateY(20px)",
                            transition: "opacity 0.5s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                            marginBottom: 28,
                        }, children: _jsx("img", { src: "/maweja-logo-red.png", alt: "Maweja", style: {
                                width: 110,
                                height: 110,
                                objectFit: "contain",
                                filter: "brightness(0) invert(1)",
                            }, "data-testid": "img-splash-logo" }) }), _jsx("div", { style: {
                            position: "relative",
                            zIndex: 2,
                            opacity: logoReady ? 1 : 0,
                            transform: logoReady ? "translateY(0)" : "translateY(16px)",
                            transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
                            textAlign: "center",
                        }, children: _jsx("p", { style: {
                                fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                                fontWeight: 800,
                                fontSize: 42,
                                color: "#ffffff",
                                letterSpacing: "-1px",
                                lineHeight: 1,
                                margin: 0,
                            }, "data-testid": "text-splash-brand", children: "Maweja" }) }), _jsx("div", { style: {
                            opacity: taglineReady ? 1 : 0,
                            transform: taglineReady ? "translateY(0)" : "translateY(12px)",
                            transition: "opacity 0.55s ease, transform 0.55s ease",
                            marginTop: 12,
                            textAlign: "center",
                        }, children: _jsx("p", { style: {
                                fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                                fontWeight: 500,
                                fontSize: 14,
                                color: "rgba(255,255,255,0.75)",
                                letterSpacing: "0.05em",
                            }, children: "Livraison ultra-rapide \u00E0 Kinshasa" }) }), _jsx("div", { style: {
                            display: "flex",
                            gap: 6,
                            marginTop: 48,
                            opacity: taglineReady ? 1 : 0,
                            transition: "opacity 0.4s ease 0.3s",
                        }, children: [0, 1, 2].map(i => (_jsx("div", { style: {
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.6)",
                                animation: `splash-bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
                            } }, i))) })] })), phase === "lang" && (_jsxs("div", { className: "flex-1 flex flex-col w-full", children: [_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center", children: [_jsx("img", { src: "/maweja-logo-red.png", alt: "Maweja", style: {
                                    width: 72,
                                    height: 72,
                                    objectFit: "contain",
                                    filter: "brightness(0) invert(1)",
                                    marginBottom: 12,
                                } }), _jsx("p", { style: {
                                    fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                                    fontWeight: 800,
                                    fontSize: 30,
                                    color: "#ffffff",
                                    letterSpacing: "-0.5px",
                                }, children: "Maweja" })] }), _jsxs("div", { className: "w-full max-w-sm mx-auto px-6 pb-10 pt-8", style: {
                            transition: "opacity 0.4s, transform 0.4s",
                            opacity: langVisible ? 1 : 0,
                            transform: langVisible ? "translateY(0)" : "translateY(28px)",
                        }, children: [_jsx("p", { className: "text-center text-white/90 font-bold mb-5 tracking-wide uppercase", style: { fontSize: 13, fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }, "data-testid": "text-choose-language", children: selectedLang === "fr" ? "Choisissez votre langue" : "Choose your language" }), _jsx("div", { className: "space-y-3 mb-5", children: [
                                    { code: "fr", flag: "🇫🇷", label: "Français", sub: "French" },
                                    { code: "en", flag: "🇬🇧", label: "English", sub: "Anglais" },
                                ].map(({ code, flag, label, sub }) => (_jsxs("button", { onClick: () => setSelectedLang(code), "data-testid": `button-lang-${code}`, className: "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 active:scale-[0.97]", style: {
                                        background: selectedLang === code ? "#fff" : "rgba(255,255,255,0.15)",
                                        border: selectedLang === code ? "none" : "1px solid rgba(255,255,255,0.25)",
                                        boxShadow: selectedLang === code ? "0 8px 24px rgba(0,0,0,0.25)" : "none",
                                    }, children: [_jsx("span", { className: "text-3xl", children: flag }), _jsxs("div", { className: "text-left flex-1", children: [_jsx("p", { className: "font-bold text-base", style: {
                                                        color: selectedLang === code ? "#111827" : "#fff",
                                                        fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                                                    }, children: label }), _jsx("p", { className: "text-xs mt-0.5", style: { color: selectedLang === code ? "#9CA3AF" : "rgba(255,255,255,0.6)" }, children: sub })] }), _jsx("div", { className: "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all", style: {
                                                borderColor: selectedLang === code ? "#dc2626" : "rgba(255,255,255,0.4)",
                                                background: selectedLang === code ? "#dc2626" : "transparent",
                                            }, children: selectedLang === code && (_jsx("svg", { width: "10", height: "8", viewBox: "0 0 10 8", fill: "none", children: _jsx("path", { d: "M1 4L3.5 6.5L9 1", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })) })] }, code))) }), _jsx("button", { onClick: handleContinue, "data-testid": "button-splash-continue", className: "w-full bg-white text-red-600 py-4 rounded-2xl font-black text-base tracking-wide active:scale-[0.97] transition-all", style: {
                                    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                                    fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                                    fontWeight: 800,
                                }, children: selectedLang === "fr" ? "Commencer →" : "Get Started →" })] })] })), _jsx("p", { className: "absolute bottom-4 text-center px-4 w-full", style: { fontSize: 10, color: "rgba(255,255,255,0.35)", zIndex: 11, fontFamily: "system-ui, sans-serif" }, "data-testid": "text-splash-signature", children: "Made By Khevin Andrew Kita \u2014 Ed Corporation" }), _jsx("style", { children: `
        @keyframes splash-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      ` })] }));
}
//# sourceMappingURL=SplashScreen.js.map