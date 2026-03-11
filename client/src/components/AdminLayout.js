import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useI18n } from "../lib/i18n";
export default function AdminLayout({ children, title }) {
    const { lang, setLang } = useI18n();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target))
                setShowLangMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex", children: [_jsx(AdminSidebar, {}), _jsxs("main", { className: "flex-1 ml-64", children: [_jsxs("header", { className: "bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-30 flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-black text-gray-900", children: title }), _jsxs("div", { className: "relative", ref: menuRef, children: [_jsxs("button", { onClick: () => setShowLangMenu(!showLangMenu), "data-testid": "button-admin-lang", className: "flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200", children: [_jsx("span", { className: "text-lg", children: lang === "fr" ? "🇫🇷" : "🇬🇧" }), _jsx("span", { className: "text-xs font-semibold text-gray-700", children: lang === "fr" ? "FR" : "EN" })] }), showLangMenu && (_jsxs("div", { className: "absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]", children: [_jsxs("button", { onClick: () => { setLang("fr"); setShowLangMenu(false); }, "data-testid": "button-admin-lang-fr", className: `w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${lang === "fr" ? "bg-red-50 text-red-700 font-bold" : "text-gray-700"}`, children: [_jsx("span", { children: "\uD83C\uDDEB\uD83C\uDDF7" }), " Francais"] }), _jsxs("button", { onClick: () => { setLang("en"); setShowLangMenu(false); }, "data-testid": "button-admin-lang-en", className: `w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${lang === "en" ? "bg-red-50 text-red-700 font-bold" : "text-gray-700"}`, children: [_jsx("span", { children: "\uD83C\uDDEC\uD83C\uDDE7" }), " English"] })] }))] })] }), _jsx("div", { className: "p-8", children: children }), _jsx("footer", { className: "p-8 text-center text-xs text-gray-400", children: "Made By Khevin Andrew Kita - Ed Corporation" })] })] }));
}
//# sourceMappingURL=AdminLayout.js.map