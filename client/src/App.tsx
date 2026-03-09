import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { Switch, Route, useLocation } from "wouter";
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

function AppRoutes() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user?.id) connectWS(user.id);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (user?.role === "admin") {
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
        <Route path="/driver/orders" component={DriverOrders} />
        <Route path="/driver/chat" component={DriverChat} />
        <Route path="/driver/earnings" component={DriverEarnings} />
        <Route component={DriverDashboard} />
      </Switch>
    );
  }

  if (user?.role === "client") {
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
          <Route component={ClientHome} />
        </Switch>
        <ClientContactBubble />
      </>
    );
  }

  return (
    <Switch>
      <Route path="/" component={ClientHome} />
      <Route path="/restaurant/:id" component={RestaurantPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/driver/login" component={DriverLoginPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/order/:id" component={OrderDetailPage} />
      <Route path="/tracking/:id" component={TrackingPage} />
      <Route path="/addresses" component={AddressPage} />
      <Route component={ClientHome} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
