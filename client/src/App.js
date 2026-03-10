import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { connectWS } from "./lib/websocket";
import { Toaster } from "./components/Toaster";
import ClientContactBubble from "./components/ClientContactBubble";
import LoginPage from "./pages/LoginPage";
import DriverLoginPage from "./pages/DriverLoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ClientHome from "./pages/client/HomePage";
import RestaurantPage from "./pages/client/RestaurantPage";
import CartPage from "./pages/client/CartPage";
import CheckoutPage from "./pages/client/CheckoutPage";
import OrdersPage from "./pages/client/OrdersPage";
import TrackingPage from "./pages/client/TrackingPage";
import OrderDetailPage from "./pages/client/OrderDetailPage";
import WalletPage from "./pages/client/WalletPage";
import AddressPage from "./pages/client/AddressPage";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverOrders from "./pages/driver/DriverOrders";
import DriverEarnings from "./pages/driver/DriverEarnings";
import DriverChat from "./pages/driver/DriverChat";
import DriverOnboarding from "./pages/driver/DriverOnboarding";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminChat from "./pages/admin/AdminChat";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminMarketing from "./pages/admin/AdminMarketing";
function AppRoutes() {
    const { user, loading } = useAuth();
    useEffect(() => {
        if (user?.id)
            connectWS(user.id);
    }, [user?.id]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-white", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 font-medium", children: "Chargement..." })] }) }));
    }
    if (user?.role === "admin") {
        return (_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: AdminDashboard }), _jsx(Route, { path: "/admin/orders", component: AdminOrders }), _jsx(Route, { path: "/admin/drivers", component: AdminDrivers }), _jsx(Route, { path: "/admin/restaurants", component: AdminRestaurants }), _jsx(Route, { path: "/admin/customers", component: AdminCustomers }), _jsx(Route, { path: "/admin/chat", component: AdminChat }), _jsx(Route, { path: "/admin/finance", component: AdminFinance }), _jsx(Route, { path: "/admin/settings", component: AdminSettings }), _jsx(Route, { path: "/admin/verifications", component: AdminVerifications }), _jsx(Route, { path: "/admin/marketing", component: AdminMarketing }), _jsx(Route, { component: AdminDashboard })] }));
    }
    if (user?.role === "driver") {
        if (user.verificationStatus !== "approved") {
            return _jsx(DriverOnboarding, {});
        }
        return (_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: DriverDashboard }), _jsx(Route, { path: "/driver/orders", component: DriverOrders }), _jsx(Route, { path: "/driver/chat", component: DriverChat }), _jsx(Route, { path: "/driver/earnings", component: DriverEarnings }), _jsx(Route, { component: DriverDashboard })] }));
    }
    if (user?.role === "client") {
        return (_jsxs(_Fragment, { children: [_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: ClientHome }), _jsx(Route, { path: "/restaurant/:id", component: RestaurantPage }), _jsx(Route, { path: "/cart", component: CartPage }), _jsx(Route, { path: "/checkout", component: CheckoutPage }), _jsx(Route, { path: "/orders", component: OrdersPage }), _jsx(Route, { path: "/order/:id", component: OrderDetailPage }), _jsx(Route, { path: "/tracking/:id", component: TrackingPage }), _jsx(Route, { path: "/wallet", component: WalletPage }), _jsx(Route, { path: "/addresses", component: AddressPage }), _jsx(Route, { component: ClientHome })] }), _jsx(ClientContactBubble, {})] }));
    }
    return (_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: ClientHome }), _jsx(Route, { path: "/restaurant/:id", component: RestaurantPage }), _jsx(Route, { path: "/cart", component: CartPage }), _jsx(Route, { path: "/checkout", component: CheckoutPage }), _jsx(Route, { path: "/login", component: LoginPage }), _jsx(Route, { path: "/driver/login", component: DriverLoginPage }), _jsx(Route, { path: "/admin/login", component: AdminLoginPage }), _jsx(Route, { path: "/order/:id", component: OrderDetailPage }), _jsx(Route, { path: "/tracking/:id", component: TrackingPage }), _jsx(Route, { path: "/addresses", component: AddressPage }), _jsx(Route, { component: ClientHome })] }));
}
export default function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(AuthProvider, { children: _jsxs(CartProvider, { children: [_jsx(AppRoutes, {}), _jsx(Toaster, {})] }) }) }));
}
//# sourceMappingURL=App.js.map