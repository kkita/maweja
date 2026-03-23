import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const options = [
        { value: "auto", icon: MonitorSmartphone, title: "Auto" },
        { value: "light", icon: Sun, title: "Clair" },
        { value: "dark", icon: Moon, title: "Sombre" },
    ];
    return (_jsx("div", { className: "flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1", children: options.map(({ value, icon: Icon, title }) => (_jsx("button", { onClick: () => setTheme(value), title: title, "data-testid": `admin-theme-${value}`, className: `p-2 rounded-lg transition-all ${theme === value ? "bg-white dark:bg-gray-700 shadow text-red-600" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`, children: _jsx(Icon, { size: 15 }) }, value))) }));
}
export default function AdminLayout({ children, title, subtitle }) {
    const { lang, setLang, t } = useI18n();
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
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-950 flex", children: [_jsx(AdminSidebar, {}), _jsxs("main", { className: "flex-1 ml-64", children: [_jsxs("header", { className: "bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-8 py-5 sticky top-0 z-30 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-black text-gray-900 dark:text-white", children: title }), subtitle && _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 font-medium", children: subtitle })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ThemeToggle, {}), _jsxs("div", { className: "relative", ref: menuRef, children: [_jsxs("button", { onClick: () => setShowLangMenu(!showLangMenu), "data-testid": "button-admin-lang", className: "flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700", children: [_jsx("span", { className: "text-lg", children: lang === "fr" ? "🇫🇷" : "🇬🇧" }), _jsx("span", { className: "text-xs font-semibold text-gray-700 dark:text-gray-300", children: lang === "fr" ? "FR" : "EN" })] }), showLangMenu && (_jsxs("div", { className: "absolute right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]", children: [_jsxs("button", { onClick: () => { setLang("fr"); setShowLangMenu(false); }, "data-testid": "button-admin-lang-fr", className: `w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${lang === "fr" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold" : "text-gray-700 dark:text-gray-300"}`, children: [_jsx("span", { children: "\uD83C\uDDEB\uD83C\uDDF7" }), " ", t.common.french] }), _jsxs("button", { onClick: () => { setLang("en"); setShowLangMenu(false); }, "data-testid": "button-admin-lang-en", className: `w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${lang === "en" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold" : "text-gray-700 dark:text-gray-300"}`, children: [_jsx("span", { children: "\uD83C\uDDEC\uD83C\uDDE7" }), " ", t.common.english] })] }))] })] })] }), _jsx("div", { className: "p-8", children: children }), _jsx("footer", { className: "p-8 text-center text-xs text-gray-400 dark:text-gray-500", children: "Made By Khevin Andrew Kita - Ed Corporation" })] })] }));
}
//# sourceMappingURL=AdminLayout.js.map