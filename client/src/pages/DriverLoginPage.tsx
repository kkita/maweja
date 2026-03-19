import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";

export default function DriverLoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, "driver");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#EC0000" }}>
      {/* Desktop left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="w-24 h-24 mb-8">
            <img src={logoImg} alt="Maweja" className="w-full h-full object-contain" style={{ mixBlendMode: "multiply" }} />
          </div>
          <h2 className="text-5xl font-black text-white leading-tight mb-4" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }}>
            Espace
            <br />
            <span className="text-white/70">Livreur</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            Gerez vos livraisons, suivez vos gains et restez connecte avec vos clients en temps reel.
          </p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-white">GPS</p>
              <p className="text-xs text-white/60">Suivi en direct</p>
            </div>
            <div className="w-px h-10 bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-xs text-white/60">Disponibilite</p>
            </div>
            <div className="w-px h-10 bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">$</p>
              <p className="text-xs text-white/60">Gains en USD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel / mobile full screen */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="w-24 h-24 mx-auto mb-4">
              <img src={logoImg} alt="Maweja" className="w-full h-full object-contain" style={{ mixBlendMode: "multiply" }} />
            </div>
            <h1 className="text-3xl text-white" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 800 }}>Maweja</h1>
            <p className="text-white/70 mt-1 text-sm">Espace Livreur</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
            {/* Desktop card header */}
            <div className="lg:block hidden mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: "#EC0000" }}>
                  <img src={logoImg} alt="Maweja" className="w-full h-full object-contain p-0.5" style={{ mixBlendMode: "multiply" }} />
                </div>
                <div>
                  <h1 className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 800 }}>Maweja</h1>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Espace Livreur</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-amber-600" />
                <p className="text-amber-700 text-xs font-medium">Les comptes livreurs sont crees par l'administration. Contactez votre responsable si vous n'avez pas encore de compte.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)}
                  data-testid="driver-input-email" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
                  data-testid="driver-input-password" className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm font-medium" data-testid="driver-error-message">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} data-testid="driver-button-submit"
                className="w-full py-3.5 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#EC0000", boxShadow: "0 4px 14px rgba(236,0,0,0.35)" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#D00000")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#EC0000")}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Se connecter
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            Made By Khevin Andrew Kita - Ed Corporation
          </p>
        </div>
      </div>
    </div>
  );
}
