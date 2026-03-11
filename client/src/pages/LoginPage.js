import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { MapPin, Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";
export default function LoginPage() {
    const { login, register } = useAuth();
    const [, navigate] = useLocation();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password, "client");
            }
            else {
                if (password.length < 6) {
                    setError("Le mot de passe doit contenir au moins 6 caracteres");
                    setLoading(false);
                    return;
                }
                await register({ email, password, name, phone, role: "client", address });
            }
            navigate("/");
        }
        catch (err) {
            setError(err.message || "Une erreur est survenue");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex", children: [_jsx("div", { className: "hidden lg:flex flex-1 items-center justify-center p-12", children: _jsxs("div", { className: "max-w-md", children: [_jsx("img", { src: logoImg, alt: "MAWEJA", className: "w-20 h-20 rounded-3xl mb-8 object-cover shadow-2xl opacity-90" }), _jsxs("h2", { className: "text-5xl font-black text-white leading-tight mb-4", children: ["La meilleure", _jsx("br", {}), "livraison de", _jsx("br", {}), _jsx("span", { className: "text-red-200", children: "Kinshasa" })] }), _jsx("p", { className: "text-red-200 text-lg leading-relaxed mb-8", children: "Commandez vos plats preferes et recevez-les en un temps record. Plus de 50 restaurants partenaires a votre service." }), _jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-3xl font-black text-white", children: "50+" }), _jsx("p", { className: "text-xs text-red-200", children: "Restaurants" })] }), _jsx("div", { className: "w-px h-10 bg-red-400/40" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-3xl font-black text-white", children: "30min" }), _jsx("p", { className: "text-xs text-red-200", children: "Livraison moy." })] }), _jsx("div", { className: "w-px h-10 bg-red-400/40" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-3xl font-black text-white", children: "24/7" }), _jsx("p", { className: "text-xs text-red-200", children: "Disponible" })] })] })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8 lg:hidden", children: [_jsx("img", { src: logoImg, alt: "MAWEJA", className: "w-20 h-20 rounded-3xl mx-auto mb-4 shadow-2xl object-cover" }), _jsx("h1", { className: "text-3xl font-black text-white", children: "MAWEJA" }), _jsx("p", { className: "text-red-200 mt-1 text-sm", children: "Espace Client" })] }), _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl p-8", children: [_jsx("div", { className: "lg:block hidden mb-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("img", { src: logoImg, alt: "MAWEJA", className: "w-10 h-10 rounded-xl object-cover" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-black text-gray-900", children: "MAWEJA" }), _jsx("p", { className: "text-xs text-gray-400", children: "Espace Client" })] })] }) }), _jsxs("div", { className: "flex gap-2 mb-6 bg-gray-100 rounded-2xl p-1", children: [_jsx("button", { onClick: () => { setIsLogin(true); setError(""); }, "data-testid": "tab-login", className: `flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLogin ? "bg-red-600 text-white shadow-lg" : "text-gray-500"}`, children: "Connexion" }), _jsx("button", { onClick: () => { setIsLogin(false); setError(""); }, "data-testid": "tab-register", className: `flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isLogin ? "bg-red-600 text-white shadow-lg" : "text-gray-500"}`, children: "Inscription" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [!isLogin && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative", children: [_jsx(User, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Nom complet", value: name, onChange: e => setName(e.target.value), "data-testid": "input-name", className: "w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500", required: true })] }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "tel", placeholder: "Telephone (ex: 0812345678)", value: phone, onChange: e => setPhone(e.target.value), "data-testid": "input-phone", className: "w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500", required: true })] }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Adresse (quartier, commune)", value: address, onChange: e => setAddress(e.target.value), "data-testid": "input-address", className: "w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" })] })] })), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "email", placeholder: "Adresse email", value: email, onChange: e => setEmail(e.target.value), "data-testid": "input-email", className: "w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500", required: true })] }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: showPassword ? "text" : "password", placeholder: "Mot de passe", value: password, onChange: e => setPassword(e.target.value), "data-testid": "input-password", className: "w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-xl px-4 py-3", children: _jsx("p", { className: "text-red-600 text-sm font-medium", "data-testid": "error-message", children: error }) })), _jsx("button", { type: "submit", disabled: loading, "data-testid": "button-submit", className: "w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2", children: loading ? (_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [isLogin ? "Se connecter" : "Creer mon compte", _jsx(ArrowRight, { size: 16 })] })) })] }), _jsxs("p", { className: "text-center text-gray-400 text-xs mt-6", children: [isLogin ? "Pas encore de compte ?" : "Deja inscrit ?", " ", _jsx("button", { onClick: () => { setIsLogin(!isLogin); setError(""); }, className: "text-red-600 font-semibold hover:underline", children: isLogin ? "S'inscrire" : "Se connecter" })] })] }), _jsx("p", { className: "text-center text-red-200/60 text-xs mt-6", children: "Made By Khevin Andrew Kita - Ed Corporation" })] }) })] }));
}
//# sourceMappingURL=LoginPage.js.map