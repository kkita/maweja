import { useState } from "react";
import { useAuth } from "../lib/auth";
import { MapPin, Truck, ChefHat, Shield, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, name, phone, role });
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { label: "Client Demo", email: "client@test.cd", password: "test123", icon: MapPin, color: "bg-red-600" },
    { label: "Livreur Demo", email: "driver1@maweja.cd", password: "driver123", icon: Truck, color: "bg-gray-800" },
    { label: "Admin Demo", email: "admin@maweja.cd", password: "admin123", icon: Shield, color: "bg-red-800" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-4xl font-black text-red-600">M</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">MAWEJA</h1>
          <p className="text-red-200 mt-2 text-sm font-medium">Livraison ultra-rapide a Kinshasa</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              data-testid="tab-login"
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLogin ? "bg-red-600 text-white shadow-lg" : "text-gray-500"}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              data-testid="tab-register"
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isLogin ? "bg-red-600 text-white shadow-lg" : "text-gray-500"}`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <input
                  type="tel"
                  placeholder="Telephone (ex: 0812345678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="input-phone"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <div className="flex gap-2">
                  {[
                    { value: "client", label: "Client", icon: MapPin },
                    { value: "driver", label: "Livreur", icon: Truck },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      data-testid={`role-${r.value}`}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        role === r.value
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <r.icon size={16} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="text-red-600 text-sm font-medium" data-testid="error-message">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              data-testid="button-submit"
              className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-200"
            >
              {loading ? "Chargement..." : isLogin ? "Se connecter" : "Creer un compte"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium">ACCES RAPIDE DEMO</p>
            <div className="grid grid-cols-3 gap-2">
              {demoLogins.map((d) => (
                <button
                  key={d.email}
                  onClick={async () => {
                    setLoading(true);
                    try { await login(d.email, d.password); } catch (err: any) { setError(err.message); }
                    setLoading(false);
                  }}
                  data-testid={`demo-${d.label.toLowerCase().replace(" ", "-")}`}
                  className={`${d.color} text-white py-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 hover:opacity-90 transition-all`}
                >
                  <d.icon size={16} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-red-200 text-xs mt-6">Demo by Khevin Andrew Kita - Ed Corporation 0911742202</p>
      </div>
    </div>
  );
}
