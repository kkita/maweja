import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Eye, EyeOff, User, Mail, Lock, Phone, MapPin, ArrowRight } from "lucide-react";
import splashIcon from "@assets/maweja-icon-512.png";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password, "client");
      } else {
        if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caracteres"); setLoading(false); return; }
        await register({ email, password, name, phone, role: "client", address });
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: "linear-gradient(160deg, #EC0000 0%, #B80000 50%, #8B0000 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-20 h-20 rounded-[22px] overflow-hidden mb-4"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
          >
            <img src={splashIcon} alt="Maweja" className="w-full h-full object-cover" data-testid="img-logo" />
          </div>
          <h1
            className="text-white text-2xl tracking-wider"
            style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 900, letterSpacing: "0.08em" }}
            data-testid="text-app-title"
          >
            MAWEJA
          </h1>
          <p className="text-white/60 text-xs mt-1 font-medium tracking-wide" data-testid="text-subtitle">
            Livraison & Services — Kinshasa
          </p>
        </div>

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          <div className="p-6 pb-0">
            <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                data-testid="tab-login"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                style={{
                  background: isLogin ? "#EC0000" : "transparent",
                  color: isLogin ? "#fff" : "#9CA3AF",
                  boxShadow: isLogin ? "0 4px 12px rgba(236,0,0,0.3)" : "none",
                }}
              >
                Connexion
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                data-testid="tab-register"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                style={{
                  background: !isLogin ? "#EC0000" : "transparent",
                  color: !isLogin ? "#fff" : "#9CA3AF",
                  boxShadow: !isLogin ? "0 4px 12px rgba(236,0,0,0.3)" : "none",
                }}
              >
                Inscription
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
            {!isLogin && (
              <>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    data-testid="input-name"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Telephone (ex: 0812345678)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    data-testid="input-phone"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Adresse (quartier, commune)"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    data-testid="input-address"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                data-testid="input-email"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                data-testid="input-password"
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <p className="text-red-600 text-sm font-medium" data-testid="error-message">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="button-submit"
              className="w-full py-4 text-white rounded-2xl font-bold text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #EC0000 0%, #D00000 100%)",
                boxShadow: "0 8px 24px rgba(236,0,0,0.35)",
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Se connecter" : "Creer mon compte"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={() => {}}
                className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                data-testid="link-forgot-password"
              >
                Mot de passe oublie ?
              </button>
            )}
          </form>
        </div>

        <div className="mt-5 text-center">
          <p className="text-white/70 text-xs">
            {isLogin ? "Pas encore de compte ?" : "Deja inscrit ?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="text-white font-bold underline underline-offset-2"
              data-testid="link-toggle-auth"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/driver/login" className="text-white/40 text-xs hover:text-white/60 transition-colors" data-testid="link-driver-login">
            Espace livreur →
          </a>
        </div>

        <p
          className="text-center text-white/30 text-[10px] mt-8"
          style={{ fontFamily: "system-ui, sans-serif" }}
          data-testid="text-signature"
        >
          Made By Khevin Andrew Kita — Ed Corporation
        </p>
      </div>
    </div>
  );
}
