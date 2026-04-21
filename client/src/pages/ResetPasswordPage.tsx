import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import splashIcon from "@assets/maweja-icon-512.png";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = window.location.pathname.split("/reset-password/")[1] || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Le mot de passe doit contenir au moins 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    if (!token) { setError("Lien invalide"); return; }
    setLoading(true);
    try {
      const res = await apiRequest(`/api/auth/reset-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Erreur"); return; }
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Erreur reseau");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(160deg, #EC0000 0%, #8B0000 100%)" }}>
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 text-sm mb-6">Ce lien de reinitialisation est invalide ou a expire.</p>
          <button onClick={() => navigate("/login")} className="w-full py-3 text-white rounded-2xl font-bold text-sm" style={{ backgroundColor: "#EC0000" }}>
            Retour a la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: "linear-gradient(160deg, #EC0000 0%, #B80000 50%, #8B0000 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-[22px] overflow-hidden mb-4" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
            <img src={splashIcon} alt="Maweja" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-white text-2xl tracking-wider" style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif", fontWeight: 900 }}>MAWEJA</h1>
          <p className="text-white/60 text-xs mt-1 font-medium">Reinitialisation du mot de passe</p>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
          <div className="p-6">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Mot de passe reinitialise !</h2>
                <p className="text-gray-500 text-sm mb-6">Votre mot de passe a ete mis a jour avec succes. Vous pouvez maintenant vous connecter.</p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3.5 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #EC0000 0%, #D00000 100%)" }}
                >
                  Se connecter <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Lock size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Nouveau mot de passe</h2>
                    <p className="text-xs text-gray-400">Choisissez un mot de passe securise</p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Nouveau mot de passe (min. 6 caracteres)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      data-testid="input-new-password"
                      className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Confirmer le mot de passe"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      data-testid="input-confirm-password"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                      required
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                      <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                  )}
                  <button type="submit" disabled={loading} data-testid="btn-reset-submit"
                    className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #EC0000 0%, #D00000 100%)", boxShadow: "0 8px 24px rgba(236,0,0,0.35)" }}
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock size={16} /> Reinitialiser le mot de passe</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
