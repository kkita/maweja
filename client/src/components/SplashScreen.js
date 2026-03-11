import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import logoPath from "@assets/image_1772833363714.png";
export default function SplashScreen() {
    const { setLang, setHasChosenLanguage, t } = useI18n();
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [selectedLang, setSelectedLang] = useState("fr");
    useEffect(() => {
        const timer = setTimeout(() => setShowLangPicker(true), 2000);
        return () => clearTimeout(timer);
    }, []);
    const handleContinue = () => {
        setLang(selectedLang);
        setHasChosenLanguage(true);
    };
    return (_jsxs("div", { className: "min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50" }), _jsxs("div", { className: "relative z-10 flex flex-col items-center", children: [_jsxs("div", { className: `transition-all duration-1000 ${showLangPicker ? "mb-8" : "mb-0"}`, children: [_jsx("img", { src: logoPath, alt: "MAWEJA", className: "w-32 h-32 object-contain animate-pulse", "data-testid": "img-splash-logo" }), _jsx("h1", { className: "text-4xl font-black text-red-600 text-center mt-4", "data-testid": "text-splash-title", children: "MAWEJA" }), _jsx("p", { className: "text-gray-400 text-xs text-center mt-2 font-medium tracking-wide", children: "Food & Services Delivery" })] }), showLangPicker && (_jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-xs", children: [_jsx("p", { className: "text-center text-gray-700 font-semibold mb-6", "data-testid": "text-choose-language", children: selectedLang === "fr" ? "Choisissez votre langue" : "Choose your language" }), _jsxs("div", { className: "space-y-3 mb-8", children: [_jsxs("button", { onClick: () => setSelectedLang("fr"), "data-testid": "button-lang-fr", className: `w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${selectedLang === "fr"
                                            ? "border-red-600 bg-red-50 shadow-lg shadow-red-100"
                                            : "border-gray-200 bg-white hover:border-gray-300"}`, children: [_jsx("span", { className: "text-2xl", children: "\uD83C\uDDEB\uD83C\uDDF7" }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "font-bold text-gray-900", children: "Francais" }), _jsx("p", { className: "text-xs text-gray-500", children: "French" })] }), selectedLang === "fr" && _jsx("div", { className: "ml-auto w-5 h-5 bg-red-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-xs", children: "\u2713" }) })] }), _jsxs("button", { onClick: () => setSelectedLang("en"), "data-testid": "button-lang-en", className: `w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${selectedLang === "en"
                                            ? "border-red-600 bg-red-50 shadow-lg shadow-red-100"
                                            : "border-gray-200 bg-white hover:border-gray-300"}`, children: [_jsx("span", { className: "text-2xl", children: "\uD83C\uDDEC\uD83C\uDDE7" }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "font-bold text-gray-900", children: "English" }), _jsx("p", { className: "text-xs text-gray-500", children: "Anglais" })] }), selectedLang === "en" && _jsx("div", { className: "ml-auto w-5 h-5 bg-red-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-xs", children: "\u2713" }) })] })] }), _jsx("button", { onClick: handleContinue, "data-testid": "button-splash-continue", className: "w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-red-700 shadow-xl shadow-red-200 transition-all", children: selectedLang === "fr" ? "Continuer" : "Continue" })] }))] }), _jsx("p", { className: "absolute bottom-6 text-[10px] text-gray-400 font-medium", "data-testid": "text-splash-signature", children: "Made By Khevin Andrew Kita - Ed Corporation" })] }));
}
//# sourceMappingURL=SplashScreen.js.map