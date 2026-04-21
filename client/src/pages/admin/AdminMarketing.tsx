import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetchJson } from "../../lib/queryClient";
import { formatPrice } from "../../lib/utils";
import AdminLayout from "../../components/AdminLayout";
import {
  TrendingUp, Clock, Star, DollarSign, CheckCircle, XCircle, ShoppingBag, Truck,
  Users, UserPlus, RotateCcw, Eye, Bell, ChevronDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Treemap
} from "recharts";

interface ClientInsight {
  id: number; name: string; email: string; phone: string;
  orderCount: number; totalSpent: number; avgOrder: number;
  favoriteRestaurant: string | null; favoriteRestaurantId: number | null;
  topCuisines: string[]; daysSinceLastOrder: number; isInactive: boolean;
  revenueContribution: number;
}

interface MarketShareItem {
  id: number; name: string; revenue: number; subtotal: number; commissionRate: number; mawejaCommission: number; restaurantNet: number; orderCount: number;
  avgRating: number; sharePercent: number;
}

interface MarketingData {
  kpis: {
    totalOrders: number; deliveredOrders: number; cancelledOrders: number;
    returnedOrders: number; onTimeRate: number; avgRating: number;
    totalRevenue: number; avgOrderAmount: number; avgDeliveryCost: number;
    totalClients: number; newClientsCount: number;
  };
  topProducts: { name: string; count: number; revenue: number }[];
  dailyTrend: { date: string; orders: number; revenue: number }[];
  ordersByHour: number[];
  ordersByDayOfWeek: number[];
  topClients: ClientInsight[];
  newClients: { id: number; name: string; email: string; phone: string }[];
  driverPerformance: { id: number; name: string; deliveries: number; onTimeRate: number; avgRating: number; isOnline: boolean }[];
  paymentBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  marketShare: MarketShareItem[];
  affinityMatrix: any[];
}

const PIE_COLORS = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a", "#fee2e2"];
const GRADIENT_COLORS = ["#dc2626", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const paymentLabels: Record<string, string> = {
  mobile_money: "Mobile Money", cash: "Cash", illico_cash: "Illico Cash",
  wallet: "Wallet", card: "Carte", google_pay: "Google Pay",
  pos: "POS", credit_card: "Carte Credit", loyalty: "Fidélité",
};

const statusLabelsLocal: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée",
  picked_up: "En Cours de Livraison", delivered: "Livrée",
  returned: "Retournée", cancelled: "Annulée",
};

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

type ViewTab = "overview" | "restaurants" | "clients" | "drivers" | "retention";
type ChartType = "bar" | "pie" | "area" | "line" | "treemap" | "radar";

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { dateFrom: from.toISOString().split("T")[0], dateTo: to.toISOString().split("T")[0] };
}

function ChartSelector({ value, onChange }: { value: ChartType; onChange: (v: ChartType) => void }) {
  return (
    <div className="flex gap-1">
      {(["bar", "pie", "area", "line"] as ChartType[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors ${value === t ? "bg-red-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
          data-testid={`chart-type-${t}`}
        >
          {t === "bar" ? "Barres" : t === "pie" ? "Camembert" : t === "area" ? "Aire" : "Ligne"}
        </button>
      ))}
    </div>
  );
}

function FlexChart({ type, data, dataKey, nameKey, colors }: { type: ChartType; data: any[]; dataKey: string; nameKey: string; colors?: string[] }) {
  const c = colors || PIE_COLORS;
  if (type === "pie") {
    const total = data.reduce((s, d) => s + (d[dataKey] || 0), 0);
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey={dataKey} nameKey={nameKey}
            label={({ name, value }) => `${name} ${total > 0 ? Math.round(value / total * 100) : 0}%`}
          >
            {data.map((_, i) => <Cell key={i} fill={c[i % c.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} /><stop offset="95%" stopColor="#dc2626" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <Tooltip />
          <Area type="monotone" dataKey={dataKey} stroke="#dc2626" fill="url(#areaGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#dc2626" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map(i => (
        <Star key={i} size={13} className={i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
      ))}
    </div>
  );
}

export default function AdminMarketing() {
  const defaults = getDefaultDates();
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [tab, setTab] = useState<ViewTab>("overview");
  const [trendChart, setTrendChart] = useState<ChartType>("bar");
  const [hourChart, setHourChart] = useState<ChartType>("area");
  const [paymentChart, setPaymentChart] = useState<ChartType>("pie");
  const [shareChart, setShareChart] = useState<ChartType>("pie");
  const [productChart, setProductChart] = useState<ChartType>("bar");
  const [dayChart, setDayChart] = useState<ChartType>("bar");
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  const { data, isLoading } = useQuery<MarketingData>({
    queryKey: ["/api/analytics/marketing", dateFrom, dateTo],
    queryFn: () => authFetchJson(`/api/analytics/marketing?dateFrom=${dateFrom}&dateTo=${dateTo}`),
  });

  const hourData = (data?.ordersByHour || []).map((val, i) => ({ hour: `${i}h`, orders: val }));
  const dayData = (data?.ordersByDayOfWeek || []).map((val, i) => ({ day: DAY_NAMES[i], orders: val }));
  const pieData = Object.entries(data?.paymentBreakdown || {}).map(([key, value]) => ({ name: paymentLabels[key] || key, value }));
  const statusData = Object.entries(data?.statusBreakdown || {}).map(([key, value]) => ({ name: statusLabelsLocal[key] || key, value }));

  const tabs: { key: ViewTab; label: string }[] = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "restaurants", label: "Part de marché" },
    { key: "clients", label: "Comportement clients" },
    { key: "drivers", label: "Agents" },
    { key: "retention", label: "Rétention & Alertes" },
  ];

  const kpis = data?.kpis;
  const kpiCards = kpis ? [
    { label: "Commandes totales", value: kpis.totalOrders.toString(), icon: TrendingUp, color: "text-red-600 bg-red-50 dark:bg-red-950" },
    { label: "Taux livraison à temps", value: `${kpis.onTimeRate}%`, icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
    { label: "Satisfaction client", value: `${kpis.avgRating}/5`, icon: Star, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950" },
    { label: "Chiffre d'affaires", value: formatPrice(kpis.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-950" },
    { label: "Commandes livrées", value: kpis.deliveredOrders.toString(), icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
    { label: "Commandes annulées", value: kpis.cancelledOrders.toString(), icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-950" },
    { label: "Commandes retournées", value: kpis.returnedOrders.toString(), icon: RotateCcw, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
    { label: "Panier moyen", value: formatPrice(kpis.avgOrderAmount), icon: ShoppingBag, color: "text-purple-600 bg-purple-50 dark:bg-purple-950" },
    { label: "Coût moyen livraison", value: formatPrice(kpis.avgDeliveryCost), icon: Truck, color: "text-orange-600 bg-orange-50 dark:bg-orange-950" },
    { label: "Total clients", value: kpis.totalClients.toString(), icon: Users, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950" },
    { label: "Nouveaux clients", value: kpis.newClientsCount.toString(), icon: UserPlus, color: "text-teal-600 bg-teal-50 dark:bg-teal-950" },
  ] : [];

  const Skeleton = () => (
    <div className="space-y-6" data-testid="loading-skeleton">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );

  const ChartCard = ({ title, children, chartType, onChartChange }: { title: string; children: any; chartType?: ChartType; onChartChange?: (v: ChartType) => void }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {chartType && onChartChange && <ChartSelector value={chartType} onChange={onChartChange} />}
      </div>
      {children}
    </div>
  );

  return (
    <AdminLayout title="Marketing & Analytics">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4" data-testid="date-filter">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Du</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            data-testid="input-date-from" />
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Au</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            data-testid="input-date-to" />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.key ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
              data-testid={`tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? <Skeleton /> : (
          <>
            {/* ── KPIs ── */}
            {tab === "overview" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpiCards.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                      <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5" data-testid={`kpi-card-${i}`}>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</span>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.color}`}><Icon size={16} /></div>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid={`kpi-value-${i}`}>{kpi.value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Tendance Revenus & Commandes" chartType={trendChart} onChartChange={setTrendChart}>
                    {trendChart === "pie" ? (
                      <FlexChart type="pie" data={(data?.dailyTrend || []).slice(-7)} dataKey="revenue" nameKey="date" />
                    ) : trendChart === "area" ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data?.dailyTrend || []}>
                          <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} /><stop offset="95%" stopColor="#dc2626" stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <Tooltip />
                          <Area type="monotone" dataKey="orders" stroke="#dc2626" fill="url(#revGrad)" strokeWidth={2} name="Commandes" />
                          <Area type="monotone" dataKey="revenue" stroke="#9ca3af" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Revenus" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : trendChart === "line" ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data?.dailyTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <Tooltip /><Legend />
                          <Line type="monotone" dataKey="orders" stroke="#dc2626" strokeWidth={2} name="Commandes" />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenus" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
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
                    )}
                  </ChartCard>

                  <ChartCard title="Commandes par Heure" chartType={hourChart} onChartChange={setHourChart}>
                    <FlexChart type={hourChart} data={hourData} dataKey="orders" nameKey="hour" />
                  </ChartCard>

                  <ChartCard title="Commandes par Jour de la semaine" chartType={dayChart} onChartChange={setDayChart}>
                    <FlexChart type={dayChart} data={dayData} dataKey="orders" nameKey="day" />
                  </ChartCard>

                  <ChartCard title="Modes de Paiement" chartType={paymentChart} onChartChange={setPaymentChart}>
                    <FlexChart type={paymentChart} data={pieData} dataKey="value" nameKey="name" />
                  </ChartCard>

                  <ChartCard title="Top 10 Produits" chartType={productChart} onChartChange={setProductChart}>
                    {productChart === "bar" ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={(data?.topProducts || []).slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <Tooltip />
                          <Bar dataKey="count" fill="#dc2626" radius={[0, 6, 6, 0]} name="Quantité" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <FlexChart type={productChart} data={(data?.topProducts || []).slice(0, 10)} dataKey="count" nameKey="name" />
                    )}
                  </ChartCard>

                  <ChartCard title="Répartition des Statuts">
                    <FlexChart type="pie" data={statusData} dataKey="value" nameKey="name" />
                  </ChartCard>
                </div>
              </>
            )}

            {/* ── RESTAURANTS: Market Share ── */}
            {tab === "restaurants" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Part de Marché (Revenus)" chartType={shareChart} onChartChange={setShareChart}>
                    <FlexChart type={shareChart} data={(data?.marketShare || []).slice(0, 10)} dataKey="revenue" nameKey="name" colors={GRADIENT_COLORS} />
                  </ChartCard>

                  <ChartCard title="Volume de Commandes par Restaurant">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={(data?.marketShare || []).slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <Tooltip />
                        <Bar dataKey="orderCount" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Commandes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Classement des Restaurants</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-market-share">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Rang</th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Restaurant</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Commandes</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Revenus</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Taux %</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Commission Maweja</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Net Restaurant</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-medium">Part %</th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.marketShare || []).map((r, i) => (
                          <tr key={r.id} className={i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""} data-testid={`row-restaurant-${r.id}`}>
                            <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{r.name}</td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{r.orderCount}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{formatPrice(r.revenue)}</td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{r.commissionRate}%</td>
                            <td className="py-3 px-4 text-right font-semibold text-red-600">{formatPrice(r.mawejaCommission)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-green-600">{formatPrice(r.restaurantNet)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(r.sharePercent, 100)}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{r.sharePercent}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{renderStars(r.avgRating)} <span className="text-xs text-gray-500">{r.avgRating}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── CLIENTS: Behavior & Preferences ── */}
            {tab === "clients" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Clients actifs</span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{(data?.topClients || []).filter(c => c.orderCount > 0).length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Clients inactifs (+14j)</span>
                    <p className="text-2xl font-bold text-amber-600 mt-2">{(data?.topClients || []).filter(c => c.isInactive).length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nouveaux clients</span>
                    <p className="text-2xl font-bold text-green-600 mt-2">{data?.newClients?.length || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Revenu moyen/client</span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatPrice(kpis && (data?.topClients || []).filter(c => c.orderCount > 0).length > 0 ? Math.round(kpis.totalRevenue / (data?.topClients || []).filter(c => c.orderCount > 0).length) : 0)}
                    </p>
                  </div>
                </div>

                {(data?.newClients || []).length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <UserPlus size={16} className="text-green-600" /> Nouveaux Clients ({data?.newClients?.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(data?.newClients || []).map(c => (
                        <span key={c.id} className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium px-3 py-1.5 rounded-full" data-testid={`new-client-${c.id}`}>
                          {c.name} — {c.phone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Profils Clients — Préférences & Contribution
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-client-insights">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left py-3 px-3 text-gray-500 font-medium">Client</th>
                          <th className="text-right py-3 px-3 text-gray-500 font-medium">Commandes</th>
                          <th className="text-right py-3 px-3 text-gray-500 font-medium">Dépensé</th>
                          <th className="text-right py-3 px-3 text-gray-500 font-medium">Contrib. %</th>
                          <th className="text-left py-3 px-3 text-gray-500 font-medium">Restaurant favori</th>
                          <th className="text-left py-3 px-3 text-gray-500 font-medium">Cuisines préférées</th>
                          <th className="text-center py-3 px-3 text-gray-500 font-medium">Dernière cmd</th>
                          <th className="text-center py-3 px-3 text-gray-500 font-medium w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.topClients || []).filter(c => c.orderCount > 0).map((client, i) => (
                          <>
                            <tr key={client.id} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}`}
                              onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                              data-testid={`row-client-${client.id}`}
                            >
                              <td className="py-3 px-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                                  <p className="text-[10px] text-gray-400">{client.phone}</p>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">{client.orderCount}</td>
                              <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">{formatPrice(client.totalSpent)}</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${client.revenueContribution > 5 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                  {client.revenueContribution}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{client.favoriteRestaurant || "—"}</td>
                              <td className="py-3 px-3">
                                <div className="flex gap-1 flex-wrap">
                                  {(client.topCuisines || []).map(c => (
                                    <span key={c} className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">{c}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {client.daysSinceLastOrder >= 0 ? (
                                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${client.isInactive ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                                    {client.daysSinceLastOrder === 0 ? "Aujourd'hui" : `${client.daysSinceLastOrder}j`}
                                  </span>
                                ) : <span className="text-gray-400 text-xs">Jamais</span>}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${expandedClient === client.id ? "rotate-180" : ""}`} />
                              </td>
                            </tr>
                            {expandedClient === client.id && (
                              <tr key={`detail-${client.id}`}>
                                <td colSpan={8} className="p-4 bg-gray-50 dark:bg-gray-800/50">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <p className="text-gray-500 mb-1">Email</p>
                                      <p className="font-medium text-gray-900 dark:text-white">{client.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 mb-1">Panier moyen</p>
                                      <p className="font-bold text-gray-900 dark:text-white">{formatPrice(client.avgOrder)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 mb-1">Gains générés pour le système</p>
                                      <p className="font-bold text-green-600">{formatPrice(Math.round(client.totalSpent * 0.15))}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 mb-1">Suggestion Push</p>
                                      {client.isInactive ? (
                                        <p className="text-amber-600 font-semibold flex items-center gap-1"><Bell size={12} /> Envoyer rappel</p>
                                      ) : client.favoriteRestaurant ? (
                                        <p className="text-blue-600 font-semibold flex items-center gap-1"><Bell size={12} /> Promo {client.favoriteRestaurant}</p>
                                      ) : (
                                        <p className="text-gray-400">Aucune action requise</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── DRIVERS ── */}
            {tab === "drivers" && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance des Agents</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-driver-performance">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Rang</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Nom</th>
                        <th className="text-right py-3 px-4 text-gray-500 font-medium">Livraisons</th>
                        <th className="text-right py-3 px-4 text-gray-500 font-medium">Taux ponctualité</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Note moyenne</th>
                        <th className="text-center py-3 px-4 text-gray-500 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.driverPerformance || []).map((driver, i) => {
                        const rateColor = driver.onTimeRate > 80 ? "text-green-600" : driver.onTimeRate >= 50 ? "text-orange-500" : "text-red-600";
                        return (
                          <tr key={driver.id} className={i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""} data-testid={`row-driver-${driver.id}`}>
                            <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{driver.name}</td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{driver.deliveries}</td>
                            <td className={`py-3 px-4 text-right font-semibold ${rateColor}`}>
                              <div className="flex items-center gap-2 justify-end">
                                <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${driver.onTimeRate > 80 ? "bg-green-500" : driver.onTimeRate >= 50 ? "bg-orange-500" : "bg-red-500"}`} style={{ width: `${driver.onTimeRate}%` }} />
                                </div>
                                {driver.onTimeRate}%
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">{renderStars(driver.avgRating)} <span className="text-gray-500 ml-1">{driver.avgRating.toFixed(1)}</span></div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${driver.isOnline ? "bg-green-50 dark:bg-green-950 text-green-700" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${driver.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
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
            )}

            {/* ── RETENTION & ALERTS ── */}
            {tab === "retention" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Bell size={16} className="text-amber-500" /> Clients à réactiver (inactifs +14 jours)
                    </h3>
                    {(data?.topClients || []).filter(c => c.isInactive && c.orderCount > 0).length === 0 ? (
                      <p className="text-gray-400 text-sm">Tous les clients sont actifs</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {(data?.topClients || []).filter(c => c.isInactive && c.orderCount > 0).map(c => (
                          <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" data-testid={`inactive-client-${c.id}`}>
                            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                              <span className="text-amber-700 font-bold text-sm">{c.name?.[0] || "?"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</p>
                              <p className="text-[10px] text-gray-500">{c.phone} — {c.orderCount} cmd — Favori: {c.favoriteRestaurant || "?"}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-amber-600">{c.daysSinceLastOrder}j sans commande</p>
                              <p className="text-[10px] text-gray-400">Suggestion: Push promo {c.favoriteRestaurant}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Eye size={16} className="text-blue-500" /> Cotation Clients / Restaurants
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">Qui commande où — Top 20 clients x Top 10 restaurants</p>
                    <div className="overflow-x-auto">
                      <table className="text-[10px] w-full" data-testid="table-affinity">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-2 px-2 text-left text-gray-500 font-medium sticky left-0 bg-white dark:bg-gray-900">Client</th>
                            {(data?.marketShare || []).slice(0, 10).map(r => (
                              <th key={r.id} className="py-2 px-1.5 text-center text-gray-500 font-medium" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", maxWidth: 30 }}>
                                {r.name.slice(0, 12)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.affinityMatrix || []).map((row: any, i: number) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}>
                              <td className="py-1.5 px-2 font-medium text-gray-900 dark:text-white sticky left-0 bg-inherit whitespace-nowrap">{row.clientName}</td>
                              {(data?.marketShare || []).slice(0, 10).map(r => {
                                const val = row[r.name] || 0;
                                return (
                                  <td key={r.id} className="py-1.5 px-1.5 text-center">
                                    {val > 0 ? (
                                      <span className={`inline-block w-6 h-6 rounded-lg flex items-center justify-center font-bold ${val >= 5 ? "bg-red-500 text-white" : val >= 3 ? "bg-red-200 text-red-800" : "bg-red-50 text-red-600"}`}>
                                        {val}
                                      </span>
                                    ) : <span className="text-gray-300">·</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Suggestions Push Notifications Automatiques
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Basées sur les préférences et le comportement de chaque client</p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {(data?.topClients || []).filter(c => c.orderCount > 0 && (c.isInactive || c.favoriteRestaurant)).map(c => {
                      const isInactive = c.isInactive;
                      return (
                        <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isInactive ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"}`}>
                          <Bell size={14} className={isInactive ? "text-red-500" : "text-blue-500"} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {isInactive
                                ? `⚠️ Inactif depuis ${c.daysSinceLastOrder}j → Envoyer: "Vous nous manquez ! -10% chez ${c.favoriteRestaurant || "nos restaurants"} pour votre retour"`
                                : `💡 Client fidèle de ${c.favoriteRestaurant} → Envoyer promos de ce restaurant automatiquement`
                              }
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isInactive ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                            {isInactive ? "Urgent" : "Promo ciblée"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
