import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { I18nProvider, useI18n } from "./lib/i18n";
import { ThemeProvider } from "./lib/theme";
import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { connectWS, disconnectWS } from "./lib/websocket";
import { requestNotifPermission } from "./lib/notify";
import AdminAccounts from "./pages/admin/AdminAccounts";
import { Toaster } from "./components/Toaster";
import { useDynamicFavicon } from "./hooks/use-dynamic-favicon";
import ClientContactBubble from "./components/ClientContactBubble";
import SplashScreen from "./components/SplashScreen";
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
import ClientSettings from "./pages/client/ClientSettings";
import NotificationsPage from "./pages/client/NotificationsPage";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverOrders from "./pages/driver/DriverOrders";
import DriverEarnings from "./pages/driver/DriverEarnings";
import DriverChat from "./pages/driver/DriverChat";
import DriverOnboarding from "./pages/driver/DriverOnboarding";
import DriverSettings from "./pages/driver/DriverSettings";
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
import AdminServices from "./pages/admin/AdminServices";
import AdminAds from "./pages/admin/AdminAds";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminRestaurantCategories from "./pages/admin/AdminRestaurantCategories";
import ServicesPage from "./pages/client/ServicesPage";
import ServiceRequestPage from "./pages/client/ServiceRequestPage";
import PresentationPage from "./pages/PresentationPage";
const MOBILE_MODE = import.meta.env.VITE_MOBILE_MODE;
function MobileModeGuard() {
    const [location, navigate] = useLocation();
    useEffect(() => {
        if (!MOBILE_MODE)
            return;
        if (MOBILE_MODE === "driver") {
            if (location !== "/" && !location.startsWith("/driver") && !location.startsWith("/admin")) {
                navigate("/driver/login");
            }
        }
        else if (MOBILE_MODE === "client") {
            if (location.startsWith("/driver/") || location.startsWith("/admin/")) {
                navigate("/");
            }
        }
    }, [location]);
    return null;
}
function AppRoutes() {
    const { user, loading } = useAuth();
    const { hasChosenLanguage, t } = useI18n();
    const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("maweja_splashed"));
    useDynamicFavicon();
    useEffect(() => {
        if (user?.id) {
            connectWS(user.id);
            requestNotifPermission().catch(() => { });
        }
        else if (user === null) {
            disconnectWS();
        }
    }, [user?.id]);
    const dismissSplash = () => {
        sessionStorage.setItem("maweja_splashed", "1");
        setShowSplash(false);
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-white dark:bg-gray-950", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 font-medium", children: t.common.loading })] }) }));
    }
    if (showSplash && user?.role !== "admin") {
        return _jsx(SplashScreen, { onDone: dismissSplash });
    }
    if (user?.role === "admin" && MOBILE_MODE !== "client" && MOBILE_MODE !== "driver") {
        return (_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: AdminDashboard }), _jsx(Route, { path: "/admin/orders", component: AdminOrders }), _jsx(Route, { path: "/admin/drivers", component: AdminDrivers }), _jsx(Route, { path: "/admin/restaurants", component: AdminRestaurants }), _jsx(Route, { path: "/admin/customers", component: AdminCustomers }), _jsx(Route, { path: "/admin/chat", component: AdminChat }), _jsx(Route, { path: "/admin/finance", component: AdminFinance }), _jsx(Route, { path: "/admin/settings", component: AdminSettings }), _jsx(Route, { path: "/admin/verifications", component: AdminVerifications }), _jsx(Route, { path: "/admin/marketing", component: AdminMarketing }), _jsx(Route, { path: "/admin/services", component: AdminServices }), _jsx(Route, { path: "/admin/promotions", component: AdminPromotions }), _jsx(Route, { path: "/admin/restaurant-categories", component: AdminRestaurantCategories }), _jsx(Route, { path: "/admin/ads", component: AdminAds }), _jsx(Route, { path: "/admin/notifications", component: AdminNotifications }), _jsx(Route, { path: "/admin/accounts", component: AdminAccounts }), _jsx(Route, { path: "/admin/gallery", component: AdminGallery }), _jsx(Route, { component: AdminDashboard })] }));
    }
    if (user?.role === "driver") {
        if (user.verificationStatus !== "approved") {
            return _jsx(DriverOnboarding, {});
        }
        return (_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: DriverDashboard }), _jsx(Route, { path: "/driver/login", component: DriverLoginPage }), _jsx(Route, { path: "/driver/orders", component: DriverOrders }), _jsx(Route, { path: "/driver/chat", component: DriverChat }), _jsx(Route, { path: "/driver/earnings", component: DriverEarnings }), _jsx(Route, { path: "/driver/settings", component: DriverSettings }), _jsx(Route, { component: DriverDashboard })] }));
    }
    if (user?.role === "client") {
        return (_jsxs(_Fragment, { children: [_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: ClientHome }), _jsx(Route, { path: "/restaurant/:id", component: RestaurantPage }), _jsx(Route, { path: "/cart", component: CartPage }), _jsx(Route, { path: "/checkout", component: CheckoutPage }), _jsx(Route, { path: "/orders", component: OrdersPage }), _jsx(Route, { path: "/order/:id", component: OrderDetailPage }), _jsx(Route, { path: "/tracking/:id", component: TrackingPage }), _jsx(Route, { path: "/wallet", component: WalletPage }), _jsx(Route, { path: "/addresses", component: AddressPage }), _jsx(Route, { path: "/services", component: ServicesPage }), _jsx(Route, { path: "/services/new", component: ServiceRequestPage }), _jsx(Route, { path: "/services/request/:id", component: ServiceRequestPage }), _jsx(Route, { path: "/settings", component: ClientSettings }), _jsx(Route, { path: "/notifications", component: NotificationsPage }), _jsx(Route, { component: ClientHome })] }), _jsx(ClientContactBubble, {})] }));
    }
    if (MOBILE_MODE === "driver") {
        return (_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: DriverLoginPage }), _jsx(Route, { path: "/driver/login", component: DriverLoginPage }), _jsx(Route, { component: DriverLoginPage })] }));
    }
    return (_jsxs(Switch, { children: [_jsx(Route, { path: "/login", component: LoginPage }), _jsx(Route, { path: "/driver/login", component: DriverLoginPage }), _jsx(Route, { path: "/admin/login", component: AdminLoginPage }), _jsx(Route, { path: "/presentation", component: PresentationPage }), _jsx(Route, { component: LoginPage })] }));
}
export default function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(ThemeProvider, { children: _jsx(I18nProvider, { children: _jsx(AuthProvider, { children: _jsxs(CartProvider, { children: [_jsx(MobileModeGuard, {}), _jsx(AppRoutes, {}), _jsx(Toaster, {})] }) }) }) }) }));
}
//# sourceMappingURL=App.js.map