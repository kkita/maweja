import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { Package, MapPin } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
export default function DriverOrders() {
    const { user } = useAuth();
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["/api/orders", { driverId: user?.id }],
        queryFn: () => authFetch(`/api/orders?driverId=${user?.id}`).then((r) => r.json()),
        enabled: !!user,
    });
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(DriverNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-6", children: "Mes livraisons" }), isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => _jsx("div", { className: "bg-white rounded-2xl h-24 animate-pulse" }, i)) })) : orders.length === 0 ? (_jsxs("div", { className: "text-center pt-20", children: [_jsx(Package, { size: 40, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: "Aucune livraison pour le moment" })] })) : (_jsx("div", { className: "space-y-3", children: orders.map((order) => (_jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", "data-testid": `driver-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "font-bold text-sm", children: order.orderNumber }), _jsx("span", { className: `text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`, children: statusLabels[order.status] })] }), _jsxs("p", { className: "text-xs text-gray-500 flex items-center gap-1 mb-2", children: [_jsx(MapPin, { size: 12 }), " ", order.deliveryAddress] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-xs text-gray-400", children: formatDate(order.createdAt) }), _jsx("span", { className: "font-bold text-red-600", children: formatPrice(order.total) })] })] }, order.id))) }))] })] }));
}
//# sourceMappingURL=DriverOrders.js.map