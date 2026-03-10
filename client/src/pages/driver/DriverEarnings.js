import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { TrendingUp, Package, Clock } from "lucide-react";
import { formatPrice } from "../../lib/utils";
export default function DriverEarnings() {
    const { user } = useAuth();
    const { data: orders = [] } = useQuery({
        queryKey: ["/api/orders", { driverId: user?.id }],
        queryFn: () => authFetch(`/api/orders?driverId=${user?.id}`).then((r) => r.json()),
        enabled: !!user,
    });
    const delivered = orders.filter((o) => o.status === "delivered");
    const totalEarnings = delivered.reduce((s, o) => s + o.deliveryFee, 0);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(DriverNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-6", children: "Mes revenus" }), _jsxs("div", { className: "bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white mb-6", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Revenus totaux" }), _jsx("p", { className: "text-4xl font-black mt-1", children: formatPrice(totalEarnings) }), _jsxs("div", { className: "flex items-center gap-1 mt-2 text-green-400 text-sm", children: [_jsx(TrendingUp, { size: 14 }), _jsx("span", { className: "font-medium", children: "+12% cette semaine" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mb-6", children: [_jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", children: [_jsx("div", { className: "w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2", children: _jsx(Package, { size: 18, className: "text-green-600" }) }), _jsx("p", { className: "text-2xl font-black", children: delivered.length }), _jsx("p", { className: "text-xs text-gray-500", children: "Livraisons terminees" })] }), _jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", children: [_jsx("div", { className: "w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2", children: _jsx(Clock, { size: 18, className: "text-blue-600" }) }), _jsx("p", { className: "text-2xl font-black", children: delivered.length > 0 ? Math.round(totalEarnings / delivered.length) : 0 }), _jsx("p", { className: "text-xs text-gray-500", children: "Moy. par livraison (FC)" })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-100", children: _jsx("h3", { className: "font-semibold text-sm", children: "Historique des gains" }) }), delivered.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-400 text-sm", children: "Aucun gain pour le moment" })) : (_jsx("div", { className: "divide-y divide-gray-50", children: delivered.map((o) => (_jsxs("div", { className: "p-4 flex items-center justify-between", "data-testid": `earning-${o.id}`, children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: o.orderNumber }), _jsx("p", { className: "text-xs text-gray-400", children: o.deliveryAddress?.split(",")[0] })] }), _jsxs("span", { className: "font-bold text-green-600", children: ["+", formatPrice(o.deliveryFee)] })] }, o.id))) }))] })] })] }));
}
//# sourceMappingURL=DriverEarnings.js.map