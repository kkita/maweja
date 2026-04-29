import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { Eye, EyeOff, Phone, Lock, ArrowRight, Truck, Navigation, DollarSign, Clock, User, Mail, ChevronRight } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import ForgotPasswordModal from "./ForgotPasswordModal";
const logoImg = "/maweja-agent-icon-512.png";

type AuthTab = "login" | "register";

export default function DriverLoginPage() {
  const { login, setUser } = useAuth() as any;
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<AuthTab>("login");
  const [showForgot, setShowForgot] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [regIdentifier, setRegIdentifier] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regVehicle, setRegVehicle] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password, "driver");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regIdentifier.trim()) { setRegError("Email ou telephone requis"); return; }
    if (!regName.trim()) { setRegError("Nom complet requis"); return; }
    if (regPassword.length < 6) { setRegError("Le mot de passe doit contenir au moins 6 caracteres"); return; }
    if (regPassword !== regConfirm) { setRegError("Les mots de passe ne correspondent pas"); return; }
    setRegLoading(true);
    try {
      const res = await apiRequest("/api/auth/driver-register", {
        method: "POST",
        body: JSON.stringify({ identifier: regIdentifier.trim(), name: regName.trim(), password: regPassword, vehicleType: regVehicle || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setRegError(data.message || "Erreur"); setRegLoading(false); return; }
      setRegSuccess(true);
      if (typeof setUser === "function") setUser(data);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setRegError(err.message || "Erreur reseau");
    } finally {
      setRegLoading(false);
    }
  };

  const isRegEmail = regIdentifier.includes("@");

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#EC0000" }}>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} userRole="driver" />}

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
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Truck size={24} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }}>
              Espace Agent
            </h2>
          </div>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            Gerez vos livraisons, suivez vos gains et restez connecte avec vos clients en temps reel.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <Navigation size={22} className="text-white mx-auto mb-2" />
              <p className="text-xl font-black text-white">GPS</p>
              <p className="text-[11px] text-white/60 mt-1">Suivi en direct</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <Clock size={22} className="text-white mx-auto mb-2" />
              <p className="text-xl font-black text-white">24/7</p>
              <p className="text-[11px] text-white/60 mt-1">Disponibilite</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <DollarSign size={22} className="text-white mx-auto mb-2" />
              <p className="text-xl font-black text-white">USD</p>
              <p className="text-[11px] text-white/60 mt-1">Gains en dollars</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <img src={logoImg} alt="Maweja" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl text-white" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 800 }}>MAWEJA</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Truck size={16} className="text-white/80" />
              <p className="text-white/80 text-sm font-semibold tracking-wide uppercase">Espace Agent</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => { setTab("login"); setError(""); }}
                data-testid="tab-agent-login"
                className="flex-1 py-4 text-sm font-bold transition-all"
                style={{ color: tab === "login" ? "#EC0000" : "#9CA3AF", borderBottom: tab === "login" ? "2px solid #EC0000" : "2px solid transparent" }}
              >
                Connexion
              </button>
              <button
                onClick={() => { setTab("register"); setRegError(""); }}
                data-testid="tab-agent-register"
                className="flex-1 py-4 text-sm font-bold transition-all"
                style={{ color: tab === "register" ? "#EC0000" : "#9CA3AF", borderBottom: tab === "register" ? "2px solid #EC0000" : "2px solid transparent" }}
              >
                S'inscrire
              </button>
            </div>

            <div className="p-8">
              {tab === "login" && (
                <>
                  <div className="flex items-center gap-3 mb-6 lg:flex hidden">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: "#EC0000" }}>
                      <Truck size={22} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 800 }}>Connexion Agent</h1>
                      <p className="text-xs text-gray-400 dark:text-gray-500">MAWEJA Agent</p>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Email ou numero de telephone" value={identifier} onChange={e => setIdentifier(e.target.value)}
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
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Truck size={16} />Se connecter comme agent<ArrowRight size={16} /></>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      data-testid="driver-link-forgot-password"
                      className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                    >
                      Mot de passe oublie ?
                    </button>
                  </form>
                </>
              )}

              {tab === "register" && (
                <>
                  {regSuccess ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck size={28} className="text-green-500" />
                      </div>
                      <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Inscription reussie !</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Votre compte a ete cree. Vous allez etre redirige vers la verification de votre profil.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                        <p className="text-amber-700 text-xs font-medium leading-relaxed">
                          Inscrivez-vous avec votre numero de telephone ou votre email. Votre compte sera verifie par l'administration avant activation.
                        </p>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-3">
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" placeholder="Nom complet" value={regName} onChange={e => setRegName(e.target.value)}
                            data-testid="driver-input-name"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            required />
                        </div>

                        <div className="relative">
                          {isRegEmail
                            ? <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            : <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          }
                          <input type="text" placeholder="Email ou numero de telephone" value={regIdentifier} onChange={e => setRegIdentifier(e.target.value)}
                            data-testid="driver-input-identifier"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            required />
                        </div>

                        <div className="relative">
                          <Truck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <select value={regVehicle} onChange={e => setRegVehicle(e.target.value)}
                            data-testid="driver-input-vehicle"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none">
                            <option value="">Type de vehicule (optionnel)</option>
                            <option value="moto">Moto</option>
                            <option value="velo">Velo</option>
                            <option value="voiture">Voiture</option>
                            <option value="pietons">A pied</option>
                          </select>
                        </div>

                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type={showPassword ? "text" : "password"} placeholder="Mot de passe (min. 6 caracteres)" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                            data-testid="driver-input-reg-password"
                            className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            required />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type={showPassword ? "text" : "password"} placeholder="Confirmer le mot de passe" value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                            data-testid="driver-input-confirm"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            required />
                        </div>

                        {regError && (
                          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <p className="text-red-600 text-sm font-medium" data-testid="driver-reg-error">{regError}</p>
                          </div>
                        )}

                        <button type="submit" disabled={regLoading} data-testid="driver-button-register"
                          className="w-full py-3.5 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          style={{ backgroundColor: "#EC0000", boxShadow: "0 4px 14px rgba(236,0,0,0.35)" }}
                        >
                          {regLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><ChevronRight size={16} />Creer mon compte agent</>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
