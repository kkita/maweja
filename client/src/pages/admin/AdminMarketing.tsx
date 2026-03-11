import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../../lib/queryClient";
import { formatPrice } from "../../lib/utils";
import AdminLayout from "../../components/AdminLayout";
import {
  TrendingUp, Clock, Star, DollarSign, CheckCircle, XCircle, ShoppingBag, Truck
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

interface MarketingData {
  kpis: {
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    onTimeRate: number;
    avgRating: number;
    totalRevenue: number;
    avgOrderAmount: number;
    avgDeliveryCost: number;
    totalClients: number;
  };
  topProducts: { name: string; count: number; revenue: number }[];
  dailyTrend: { date: string; orders: number; revenue: number }[];
  ordersByHour: number[];
  topClients: { id: number; name: string; email: string; phone: string; orderCount: number; totalSpent: number; avgOrder: number }[];
  driverPerformance: { id: number; name: string; deliveries: number; onTimeRate: number; avgRating: number; isOnline: boolean }[];
  paymentBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

const PIE_COLORS = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#b91c1c", "#991b1b", "#7f1d1d"];

const paymentLabels: Record<string, string> = {
  mobile_money: "Mobile Money",
  cash: "Cash",
  illico_cash: "Illico Cash",
  wallet: "Wallet",
  card: "Carte",
  google_pay: "Google Pay",
  pos: "POS",
  credit_card: "Carte Credit",
  loyalty: "Fidelite",
};

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    dateFrom: from.toISOString().split("T")[0],
    dateTo: to.toISOString().split("T")[0],
  };
}

export default function AdminMarketing() {
  const defaults = getDefaultDates();
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);

  const { data, isLoading } = useQuery<MarketingData>({
    queryKey: ["/api/analytics/marketing", dateFrom, dateTo],
    queryFn: () =>
      authFetch(`/api/analytics/marketing?dateFrom=${dateFrom}&dateTo=${dateTo}`).then((r) => r.json()),
  });

  const hourData = (data?.ordersByHour || []).map((val, i) => ({ hour: `${i}h`, orders: val }));
  const pieData = Object.entries(data?.paymentBreakdown || {}).map(([key, value]) => ({
    name: paymentLabels[key] || key,
    value,
  }));
  const totalPie = pieData.reduce((s, p) => s + p.value, 0);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={i < full ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
        />
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const Skeleton = () => (
    <div className="space-y-6" data-testid="loading-skeleton">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-64 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );

  const kpis = data?.kpis;
  const kpiCards = kpis
    ? [
        { label: "Commandes totales", value: kpis.totalOrders.toString(), icon: TrendingUp, color: "text-red-600 bg-red-50" },
        { label: "Taux de livraison a temps", value: `${kpis.onTimeRate}%`, icon: Clock, color: "text-blue-600 bg-blue-50" },
        { label: "Satisfaction client", value: `${kpis.avgRating}/5`, icon: Star, color: "text-yellow-600 bg-yellow-50" },
        { label: "Chiffre d'affaires", value: formatPrice(kpis.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-50" },
        { label: "Commandes livrees", value: kpis.deliveredOrders.toString(), icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
        { label: "Commandes annulees", value: kpis.cancelledOrders.toString(), icon: XCircle, color: "text-red-600 bg-red-50" },
        { label: "Panier moyen", value: formatPrice(kpis.avgOrderAmount), icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
        { label: "Cout moyen livraison", value: formatPrice(kpis.avgDeliveryCost), icon: Truck, color: "text-orange-600 bg-orange-50" },
      ]
    : [];

  return (
    <AdminLayout title="Marketing & Analytics">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4" data-testid="date-filter">
          <label className="text-sm font-medium text-gray-600">Du</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            data-testid="input-date-from"
          />
          <label className="text-sm font-medium text-gray-600">Au</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            data-testid="input-date-to"
          />
        </div>

        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
                    data-testid={`kpi-card-${i}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.color}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid={`kpi-value-${i}`}>{kpi.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tendance Revenus & Commandes</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#dc2626" radius={[6, 6, 0, 0]} name="Commandes" />
                    <Bar dataKey="revenue" fill="#9ca3af" radius={[6, 6, 0, 0]} name="Revenus" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Commandes par Heure</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hourData}>
                    <defs>
                      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Area type="monotone" dataKey="orders" stroke="#dc2626" fill="url(#redGrad)" strokeWidth={2} name="Commandes" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 10 Produits</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(data?.topProducts || []).slice(0, 10)} layout="vertical">
                    <defs>
                      <linearGradient id="redBarGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#dc2626" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="count" fill="url(#redBarGrad)" radius={[0, 6, 6, 0]} name="Quantite" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Modes de Paiement</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) =>
                        `${name} ${totalPie > 0 ? Math.round((value / totalPie) * 100) : 0}%`
                      }
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Clients</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-top-clients">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Rang</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Nom</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Commandes</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Total depense</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Panier moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topClients || []).map((client, i) => (
                      <tr
                        key={client.id}
                        className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                        data-testid={`row-client-${client.id}`}
                      >
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{i + 1}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{client.name}</td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{client.email}</td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{client.orderCount}</td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{formatPrice(client.totalSpent)}</td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{formatPrice(client.avgOrder)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance des Livreurs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-driver-performance">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Nom</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Livraisons</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Taux ponctualite</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Note moyenne</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.driverPerformance || []).map((driver, i) => {
                      const rateColor =
                        driver.onTimeRate > 80
                          ? "text-green-600"
                          : driver.onTimeRate >= 50
                          ? "text-orange-500"
                          : "text-red-600";
                      return (
                        <tr
                          key={driver.id}
                          className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                          data-testid={`row-driver-${driver.id}`}
                        >
                          <td className="py-3 px-4 text-gray-900 font-medium">{driver.name}</td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{driver.deliveries}</td>
                          <td className={`py-3 px-4 text-right font-semibold ${rateColor}`}>
                            {driver.onTimeRate}%
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {renderStars(driver.avgRating)}
                              <span className="text-gray-500 ml-1">{driver.avgRating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                driver.isOnline
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-500 dark:text-gray-400"
                              }`}
                              data-testid={`status-driver-${driver.id}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  driver.isOnline ? "bg-green-500" : "bg-gray-400"
                                }`}
                              />
                              {driver.isOnline ? "En ligne" : "Hors ligne"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
