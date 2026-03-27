import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Truck, Navigation, DollarSign, Clock } from "lucide-react";
const logoImg = "/maweja-icon.png";

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
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      {/* Desktop left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <img src={logoImg} alt="Maweja" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white/60 text-sm font-medium tracking-wider uppercase">Application</h3>
              <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }}>MAWEJA</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EC0000" }}>
              <Truck size={24} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }}>
              Espace Livreur
            </h2>
          </div>
          <p className="text-white/60 text-lg leading-relaxed mb-10">
            Gerez vos livraisons, suivez vos gains et restez connecte avec vos clients en temps reel.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <Navigation size={22} className="text-green-400 mx-auto mb-2" />
              <p className="text-xl font-black text-white">GPS</p>
              <p className="text-[11px] text-white/50 mt-1">Suivi en direct</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <Clock size={22} className="text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-black text-white">24/7</p>
              <p className="text-[11px] text-white/50 mt-1">Disponibilite</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <DollarSign size={22} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-black text-white">USD</p>
              <p className="text-[11px] text-white/50 mt-1">Gains en dollars</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel / mobile full screen */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <img src={logoImg} alt="Maweja" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl text-white" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 800 }}>MAWEJA</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Truck size={16} className="text-white/70" />
              <p className="text-white/70 text-sm font-semibold tracking-wide uppercase">Espace Livreur</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
            {/* Desktop card header */}
            <div className="lg:block hidden mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)" }}>
                  <Truck size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 800 }}>Connexion Livreur</h1>
                  <p className="text-xs text-gray-400 dark:text-gray-500">MAWEJA Driver</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6">
              <div className="flex items-start gap-2">
                <Shield size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-700 dark:text-blue-300 text-xs font-medium leading-relaxed">Les comptes livreurs sont crees par l'administration. Contactez votre responsable si vous n'avez pas encore de compte.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)}
                  data-testid="driver-input-email" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
                  data-testid="driver-input-password" className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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
                style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", boxShadow: "0 4px 14px rgba(15,52,96,0.5)" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Truck size={16} />
                    Se connecter comme livreur
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs mt-5">
              Vous etes un client ?{" "}
              <button onClick={() => navigate("/login")} className="text-blue-600 font-semibold hover:underline">
                Connexion client
              </button>
            </p>
          </div>

          <p className="text-center text-white/30 text-xs mt-6">
            Made By Khevin Andrew Kita - Ed Corporation
          </p>
        </div>
      </div>
    </div>
  );
}
