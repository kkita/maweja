import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";
export default function AdminLoginPage() {
    const { login } = useAuth();
    const [, navigate] = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password, "admin");
            navigate("/");
        }
        catch (err) {
            setError(err.message || "Une erreur est survenue");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 flex items-center justify-center p-6", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("img", { src: logoImg, alt: "MAWEJA", className: "w-20 h-20 rounded-3xl mx-auto mb-4 shadow-2xl shadow-red-900/50 object-cover" }), _jsx("h1", { className: "text-3xl font-black text-white", children: "MAWEJA" }), _jsx("p", { className: "text-slate-400 mt-1 text-sm", children: "Administration & Dashboard" })] }), _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl p-8", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center", children: _jsx(Shield, { size: 18, className: "text-slate-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-gray-900 text-sm", children: "Acces Administrateur" }), _jsx("p", { className: "text-xs text-gray-400", children: "Connectez-vous avec vos identifiants admin" })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "email", placeholder: "Email administrateur", value: email, onChange: e => setEmail(e.target.value), "data-testid": "admin-input-email", className: "w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500", required: true })] }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: showPassword ? "text" : "password", placeholder: "Mot de passe", value: password, onChange: e => setPassword(e.target.value), "data-testid": "admin-input-password", className: "w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-xl px-4 py-3", children: _jsx("p", { className: "text-red-600 text-sm font-medium", "data-testid": "admin-error-message", children: error }) })), _jsx("button", { type: "submit", disabled: loading, "data-testid": "admin-button-submit", className: "w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2", children: loading ? (_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: ["Acceder au Dashboard", _jsx(ArrowRight, { size: 16 })] })) })] })] }), _jsx("p", { className: "text-center text-slate-500/60 text-xs mt-6", children: "Made By Khevin Andrew Kita - Ed Corporation" })] }) }));
}
//# sourceMappingURL=AdminLoginPage.js.map