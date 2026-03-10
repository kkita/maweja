import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import {
  Hotel, Car, Sparkles, Package, PartyPopper, Wrench, Bike, HelpCircle,
  Briefcase, ChevronRight, Clock, CheckCircle, AlertCircle, Loader2, Plus
} from "lucide-react";
import type { ServiceCategory, ServiceRequest } from "@shared/schema";

const iconMap: Record<string, any> = {
  Hotel, Car, Sparkles, Package, PartyPopper, Wrench, Bike, HelpCircle, Briefcase,
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "En attente", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  reviewing: { label: "En cours d'examen", color: "text-blue-600", bg: "bg-blue-50", icon: Loader2 },
  accepted: { label: "Acceptee", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  rejected: { label: "Refusee", color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
  completed: { label: "Terminee", color: "text-gray-600", bg: "bg-gray-50", icon: CheckCircle },
};

const categoryColors = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-violet-600",
  "from-pink-500 to-fuchsia-600",
  "from-cyan-500 to-sky-600",
  "from-gray-500 to-slate-600",
];

export default function ServicesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: categories = [], isLoading: catsLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const { data: myRequests = [], isLoading: reqsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
    queryFn: () => authFetch("/api/service-requests").then(r => r.json()),
    enabled: !!user,
  });

  const activeCategories = categories.filter(c => c.isActive);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900" data-testid="text-services-title">Services</h2>
          <p className="text-sm text-gray-500 mt-1">Demandez un devis pour nos services professionnels</p>
        </div>

        {catsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {activeCategories.map((cat, i) => {
              const Icon = iconMap[cat.icon] || Briefcase;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/services/new?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`)}
                  data-testid={`card-service-${cat.id}`}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[i % categoryColors.length]} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">{cat.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>
                  <ChevronRight size={16} className="absolute top-4 right-3 text-gray-300 group-hover:text-red-500 transition-colors" />
                </button>
              );
            })}
          </div>
        )}

        {user && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900" data-testid="text-my-requests">Mes demandes</h3>
              <span className="text-xs text-gray-400 font-medium">{myRequests.length} demande{myRequests.length !== 1 ? "s" : ""}</span>
            </div>

            {reqsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Aucune demande</p>
                <p className="text-xs text-gray-400">Selectionnez un service ci-dessus pour creer votre premiere demande</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map(req => {
                  const status = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`request-card-${req.id}`}
                      onClick={() => navigate(`/services/request/${req.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{req.categoryName}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(req.createdAt!).toLocaleDateString("fr-CD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${status.bg} ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-gray-500">
                        {req.serviceType && <span>Type: {req.serviceType}</span>}
                        {req.budget && <span>Budget: {req.budget}</span>}
                        <span className="capitalize">{req.contactMethod}</span>
                      </div>
                      {req.adminNotes && (
                        <div className="mt-2 bg-blue-50 rounded-lg p-2">
                          <p className="text-[10px] font-semibold text-blue-700">Note de l'equipe:</p>
                          <p className="text-[11px] text-blue-600 mt-0.5">{req.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!user && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500">Connectez-vous pour creer une demande de service</p>
            <button
              onClick={() => navigate("/login")}
              data-testid="button-login-services"
              className="mt-3 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700"
            >
              Se connecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
