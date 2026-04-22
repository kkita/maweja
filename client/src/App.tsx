import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, getAuthToken } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { I18nProvider } from "./lib/i18n";
import { ThemeProvider } from "./lib/theme";
import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState, lazy, Suspense } from "react";
import { connectWS, disconnectWS } from "./lib/websocket";
import { requestNotifPermission, installAudioUnlockOnce } from "./lib/notify";
import { syncNativeStatusBar, useTheme } from "./lib/theme";
import { Toaster } from "./components/Toaster";
import { useDynamicFavicon } from "./hooks/use-dynamic-favicon";
import SplashScreen from "./components/SplashScreen";
import { MobilePageSkeleton, AdminPageSkeleton } from "./components/PageSkeleton";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ─── Auth / Public pages (small — always needed) ─────────────────────────────
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DriverLoginPage = lazy(() => import("./pages/DriverLoginPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const PresentationPage = lazy(() => import("./pages/PresentationPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

// ─── Client pages ─────────────────────────────────────────────────────────────
const ClientHome = lazy(() => import("./pages/client/HomePage"));
const RestaurantPage = lazy(() => import("./pages/client/RestaurantPage"));
const CartPage = lazy(() => import("./pages/client/CartPage"));
const CheckoutPage = lazy(() => import("./pages/client/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/client/OrdersPage"));
const TrackingPage = lazy(() => import("./pages/client/TrackingPage"));
const OrderDetailPage = lazy(() => import("./pages/client/OrderDetailPage"));
const WalletPage = lazy(() => import("./pages/client/WalletPage"));
const AddressPage = lazy(() => import("./pages/client/AddressPage"));
const ClientSettings = lazy(() => import("./pages/client/ClientSettings"));
const NotificationsPage = lazy(() => import("./pages/client/NotificationsPage"));
const ServicesPage = lazy(() => import("./pages/client/ServicesPage"));
const BoutiquesPage = lazy(() => import("./pages/client/BoutiquesPage"));
const ServiceRequestPage = lazy(() => import("./pages/client/ServiceRequestPage"));
const ClientContactBubble = lazy(() => import("./components/ClientContactBubble"));

// ─── Driver pages ─────────────────────────────────────────────────────────────
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));
const DriverOrders = lazy(() => import("./pages/driver/DriverOrders"));
const DriverEarnings = lazy(() => import("./pages/driver/DriverEarnings"));
const DriverChat = lazy(() => import("./pages/driver/DriverChat"));
const DriverOnboarding = lazy(() => import("./pages/driver/DriverOnboarding"));
const DriverSettings = lazy(() => import("./pages/driver/DriverSettings"));
const DriverRapport = lazy(() => import("./pages/driver/DriverRapport"));
const DriverOrderDetail = lazy(() => import("./pages/driver/DriverOrderDetail"));

// ─── Admin pages (never loaded for client/driver users) ──────────────────────
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminDrivers = lazy(() => import("./pages/admin/AdminDrivers"));
const AdminRestaurants = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminAds = lazy(() => import("./pages/admin/AdminAds"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminRestaurantCategories = lazy(() => import("./pages/admin/AdminRestaurantCategories"));
const AdminBoutiques = lazy(() => import("./pages/admin/AdminBoutiques"));
const AdminBoutiqueCategories = lazy(() => import("./pages/admin/AdminBoutiqueCategories"));
const AdminDeliveryZones = lazy(() => import("./pages/admin/AdminDeliveryZones"));
const AdminMenuCategories = lazy(() => import("./pages/admin/AdminMenuCategories"));
const AdminPasswordResets = lazy(() => import("./pages/admin/AdminPasswordResets"));
const AdminAccounts = lazy(() => import("./pages/admin/AdminAccounts"));

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
  const [showSplash, setShowSplash] = useState(true);

  useDynamicFavicon();

  const { resolvedTheme } = useTheme();

  useEffect(() => {
    installAudioUnlockOnce();
  }, []);

  // Restaurer les barres système (blanc / noir) dès la fin du splash
  useEffect(() => {
    if (!showSplash) {
      syncNativeStatusBar(resolvedTheme);
    }
  }, [showSplash, resolvedTheme]);

  useEffect(() => {
    if (user?.id) {
      connectWS(user.id, getAuthToken() ?? undefined);
      requestNotifPermission().catch(() => {});
    } else if (user === null) {
      disconnectWS();
    }
  }, [user?.id]);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: "#EC0000", zIndex: 9998 }} data-testid="auth-loading">
        <div style={{ fontFamily: "Montserrat, system-ui, sans-serif", fontWeight: 900, fontSize: 56, color: "#fff", letterSpacing: 2 }}>MAWEJA</div>
        <div style={{ marginTop: 28, width: 32, height: 32, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user?.role === "admin" && MOBILE_MODE !== "client" && MOBILE_MODE !== "driver") {
    return (
      <Suspense fallback={<AdminPageSkeleton />}>
        <Switch>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/drivers" component={AdminDrivers} />
          <Route path="/admin/restaurants">{() => <AdminRestaurants />}</Route>
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/chat" component={AdminChat} />
          <Route path="/admin/finance" component={AdminFinance} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/verifications" component={AdminVerifications} />
          <Route path="/admin/marketing" component={AdminMarketing} />
          <Route path="/admin/services" component={AdminServices} />
          <Route path="/admin/promotions" component={AdminPromotions} />
          <Route path="/admin/restaurant-categories" component={AdminRestaurantCategories} />
          <Route path="/admin/boutiques">{() => <AdminBoutiques />}</Route>
          <Route path="/admin/boutique-categories" component={AdminBoutiqueCategories} />
          <Route path="/admin/ads" component={AdminAds} />
          <Route path="/admin/notifications" component={AdminNotifications} />
          <Route path="/admin/accounts" component={AdminAccounts} />
          <Route path="/admin/gallery" component={AdminGallery} />
          <Route path="/admin/delivery-zones" component={AdminDeliveryZones} />
          <Route path="/admin/menu-categories" component={AdminMenuCategories} />
          <Route path="/admin/password-resets" component={AdminPasswordResets} />
          <Route component={AdminDashboard} />
        </Switch>
      </Suspense>
    );
  }

  if (user?.role === "driver") {
    if (user.verificationStatus !== "approved") {
      return (
        <Suspense fallback={<MobilePageSkeleton />}>
          <DriverOnboarding />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<MobilePageSkeleton />}>
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
      </Suspense>
    );
  }

  if (user?.role === "client") {
    if (MOBILE_MODE === "driver") {
      return (
        <Suspense fallback={<MobilePageSkeleton />}>
          <Switch>
            <Route path="/" component={DriverLoginPage} />
            <Route path="/driver/login" component={DriverLoginPage} />
            <Route component={DriverLoginPage} />
          </Switch>
        </Suspense>
      );
    }
    return (
      <>
        <Suspense fallback={<MobilePageSkeleton />}>
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
            <Route path="/boutiques" component={BoutiquesPage} />
            <Route path="/services" component={ServicesPage} />
            <Route path="/services/new" component={ServiceRequestPage} />
            <Route path="/services/request/:id" component={ServiceRequestPage} />
            <Route path="/settings" component={ClientSettings} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route component={ClientHome} />
          </Switch>
        </Suspense>
        <Suspense fallback={null}>
          <ClientContactBubble />
        </Suspense>
      </>
    );
  }

  if (MOBILE_MODE === "driver") {
    return (
      <Suspense fallback={<MobilePageSkeleton />}>
        <Switch>
          <Route path="/" component={DriverLoginPage} />
          <Route path="/driver/login" component={DriverLoginPage} />
          <Route component={DriverLoginPage} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#EC0000]" />}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/driver/login" component={DriverLoginPage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/presentation" component={PresentationPage} />
        <Route path="/reset-password/:token" component={ResetPasswordPage} />
        <Route component={LoginPage} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <CartProvider>
                <MobileModeGuard />
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
                <Toaster />
              </CartProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
