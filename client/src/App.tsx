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
import DriverRapport from "./pages/driver/DriverRapport";
import DriverOrderDetail from "./pages/driver/DriverOrderDetail";

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

const MOBILE_MODE = import.meta.env.VITE_MOBILE_MODE as string | undefined;

function MobileModeGuard() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!MOBILE_MODE) return;
    if (MOBILE_MODE === "driver") {
      if (location !== "/" && !location.startsWith("/driver") && !location.startsWith("/admin")) {
        navigate("/driver/login");
      }
    } else if (MOBILE_MODE === "client") {
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
  const [showSplash, setShowSplash] = useState(true);

  useDynamicFavicon();

  useEffect(() => {
    if (user?.id) {
      connectWS(user.id);
      requestNotifPermission().catch(() => {});
    } else if (user === null) {
      disconnectWS();
    }
  }, [user?.id]);

  const dismissSplash = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onDone={dismissSplash} />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: "#EC0000", zIndex: 9998 }}>
        <img
          src="/maweja-icon.png"
          alt="Maweja"
          style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
        />
        <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 800, fontSize: 20, marginTop: 12, fontFamily: "system-ui, sans-serif", letterSpacing: "-0.01em" }}>MAWEJA</p>
      </div>
    );
  }

  if (user?.role === "admin" && MOBILE_MODE !== "client" && MOBILE_MODE !== "driver") {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/drivers" component={AdminDrivers} />
        <Route path="/admin/restaurants" component={AdminRestaurants} />
        <Route path="/admin/customers" component={AdminCustomers} />
        <Route path="/admin/chat" component={AdminChat} />
        <Route path="/admin/finance" component={AdminFinance} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/verifications" component={AdminVerifications} />
        <Route path="/admin/marketing" component={AdminMarketing} />
        <Route path="/admin/services" component={AdminServices} />
        <Route path="/admin/promotions" component={AdminPromotions} />
        <Route path="/admin/restaurant-categories" component={AdminRestaurantCategories} />
        <Route path="/admin/ads" component={AdminAds} />
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/accounts" component={AdminAccounts} />
        <Route path="/admin/gallery" component={AdminGallery} />
        <Route component={AdminDashboard} />
      </Switch>
    );
  }

  if (user?.role === "driver") {
    if (user.verificationStatus !== "approved") {
      return <DriverOnboarding />;
    }
    return (
      <Switch>
        <Route path="/" component={DriverDashboard} />
        <Route path="/driver/login" component={DriverLoginPage} />
        <Route path="/driver/orders" component={DriverOrders} />
        <Route path="/driver/order/:id" component={DriverOrderDetail} />
        <Route path="/driver/chat" component={DriverChat} />
        <Route path="/driver/earnings" component={DriverEarnings} />
        <Route path="/driver/rapport" component={DriverRapport} />
        <Route path="/driver/settings" component={DriverSettings} />
        <Route component={DriverDashboard} />
      </Switch>
    );
  }

  if (user?.role === "client") {
    if (MOBILE_MODE === "driver") {
      return (
        <Switch>
          <Route path="/" component={DriverLoginPage} />
          <Route path="/driver/login" component={DriverLoginPage} />
          <Route component={DriverLoginPage} />
        </Switch>
      );
    }
    return (
      <>
        <Switch>
          <Route path="/" component={ClientHome} />
          <Route path="/restaurant/:id" component={RestaurantPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/orders" component={OrdersPage} />
          <Route path="/order/:id" component={OrderDetailPage} />
          <Route path="/tracking/:id" component={TrackingPage} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/addresses" component={AddressPage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/services/new" component={ServiceRequestPage} />
          <Route path="/services/request/:id" component={ServiceRequestPage} />
          <Route path="/settings" component={ClientSettings} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route component={ClientHome} />
        </Switch>
        <ClientContactBubble />
      </>
    );
  }

  if (MOBILE_MODE === "driver") {
    return (
      <Switch>
        <Route path="/" component={DriverLoginPage} />
        <Route path="/driver/login" component={DriverLoginPage} />
        <Route component={DriverLoginPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/driver/login" component={DriverLoginPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/presentation" component={PresentationPage} />
      <Route component={LoginPage} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <CartProvider>
              <MobileModeGuard />
              <AppRoutes />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
