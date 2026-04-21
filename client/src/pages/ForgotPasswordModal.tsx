import { useState } from "react";
import { X, MessageCircle, Mail, Phone, Send, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

interface ForgotPasswordModalProps {
  onClose: () => void;
  userRole?: "client" | "driver";
}

type Step = "identifier" | "method" | "chat-message" | "done";

export default function ForgotPasswordModal({ onClose, userRole = "client" }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<"chat" | "email">("chat");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  const handleIdentifierNext = () => {
    if (!identifier.trim()) { setError("Entrez votre email ou numero de telephone"); return; }
    setError("");
    setStep("method");
  };

  const handleSubmit = async (selectedMethod: "chat" | "email") => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim(), requestType: selectedMethod, message, role: userRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Erreur"); setLoading(false); return; }
      setDoneMsg(data.message || "Demande envoyee avec succes");
      setStep("done");
    } catch (e: any) {
      setError(e.message || "Erreur reseau");
    } finally {
      setLoading(false);
    }
  };

  const isEmail = identifier.includes("@");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {step !== "identifier" && step !== "done" && (
              <button onClick={() => setStep(step === "chat-message" ? "method" : "identifier")} className="p-1 text-gray-400 hover:text-gray-600" data-testid="btn-back-forgot">
                <ArrowLeft size={18} />
              </button>
            )}
            <Lock size={18} className="text-red-500" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Mot de passe oublie</h2>
          </div>
          <button onClick={onClose} data-testid="btn-close-forgot" className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === "identifier" && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Entrez votre adresse email ou votre numero de telephone associe a votre compte.
              </p>
              <div className="relative mb-4">
                {isEmail
                  ? <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  : <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                }
                <input
                  type="text"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError(""); }}
                  placeholder="Email ou numero de telephone"
                  data-testid="input-forgot-identifier"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
                />
              </div>
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <button
                onClick={handleIdentifierNext}
                data-testid="btn-forgot-next"
                className="w-full py-3.5 text-white rounded-2xl font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #EC0000 0%, #D00000 100%)" }}
              >
                Continuer
              </button>
            </>
          )}

          {step === "method" && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Comment souhaitez-vous reinitialiser votre mot de passe ?
              </p>
              <div className="space-y-3 mb-4">
                <button
                  onClick={() => handleSubmit("chat")}
                  disabled={loading}
                  data-testid="btn-method-chat"
                  className="w-full flex items-start gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Contacter l'administrateur</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Un message sera envoye automatiquement a l'admin qui reinitializera votre compte.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleSubmit("email")}
                  disabled={loading || !isEmail}
                  data-testid="btn-method-email"
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left disabled:opacity-50 ${!isEmail ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Lien par email</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {isEmail
                        ? "L'admin vous enverra un lien de reinitialisation a votre adresse email."
                        : "Option disponible uniquement avec un email. Entrez votre email pour utiliser cette option."
                      }
                    </p>
                  </div>
                </button>
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-2">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </div>
              )}
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Demande envoyee !</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{doneMsg}</p>
              <button
                onClick={onClose}
                data-testid="btn-done-close"
                className="w-full py-3.5 text-white rounded-2xl font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #EC0000 0%, #D00000 100%)" }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
