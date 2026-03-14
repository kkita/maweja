import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { MapPin, Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, Utensils } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex">
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="w-20 h-20 rounded-3xl mb-8 bg-red-600 shadow-2xl shadow-red-900/50 flex items-center justify-center overflow-hidden">
            <img src={logoImg} alt="MAWEJA" className="w-full h-full object-contain p-1" />
          </div>
          <h2 className="text-5xl font-black text-white leading-tight mb-4">
            La meilleure
            <br />
            livraison de
            <br />
            <span className="text-red-200">Kinshasa</span>
          </h2>
          <p className="text-red-200 text-lg leading-relaxed mb-8">
            Commandez vos plats preferes et recevez-les en un temps record.
            Plus de 50 restaurants partenaires a votre service.
          </p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-white">50+</p>
              <p className="text-xs text-red-200">Restaurants</p>
            </div>
            <div className="w-px h-10 bg-red-400/40" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">30min</p>
              <p className="text-xs text-red-200">Livraison moy.</p>
            </div>
            <div className="w-px h-10 bg-red-400/40" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-xs text-red-200">Disponible</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-4 bg-red-600 shadow-2xl shadow-red-900/30 flex items-center justify-center overflow-hidden">
              <img src={logoImg} alt="MAWEJA" className="w-full h-full object-contain p-1" />
            </div>
            <h1 className="text-3xl font-black text-white">MAWEJA</h1>
            <p className="text-red-200 mt-1 text-sm">Espace Client</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
            <div className="lg:block hidden mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-600 shadow-md shadow-red-600/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={logoImg} alt="MAWEJA" className="w-full h-full object-contain p-0.5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-900 dark:text-white">MAWEJA</h1>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Espace Client</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
              <button onClick={() => { setIsLogin(true); setError(""); }} data-testid="tab-login"
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLogin ? "bg-red-600 text-white shadow-lg" : "text-gray-500"}`}>
                Connexion
              </button>
              <button onClick={() => { setIsLogin(false); setError(""); }} data-testid="tab-register"
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isLogin ? "bg-red-600 text-white shadow-lg" : "text-gray-500"}`}>
                Inscription
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)}
                      data-testid="input-name" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
                  </div>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" placeholder="Telephone (ex: 0812345678)" value={phone} onChange={e => setPhone(e.target.value)}
                      data-testid="input-phone" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
                  </div>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Adresse (quartier, commune)" value={address} onChange={e => setAddress(e.target.value)}
                      data-testid="input-address" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)}
                  data-testid="input-email" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
                  data-testid="input-password" className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm font-medium" data-testid="error-message">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} data-testid="button-submit"
                className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Se connecter" : "Creer mon compte"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs mt-6">
              {isLogin ? "Pas encore de compte ?" : "Deja inscrit ?"}{" "}
              <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-red-600 font-semibold hover:underline">
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>

          <p className="text-center text-red-200/60 text-xs mt-6">
            Made By Khevin Andrew Kita - Ed Corporation
          </p>
        </div>
      </div>
    </div>
  );
}
