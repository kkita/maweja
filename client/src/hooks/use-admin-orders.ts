import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch, authFetchJson } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { playAdminAlertSound } from "../lib/notify";
import type { Order, User, Restaurant } from "@shared/schema";

export type OrderFilterType = "all" | "pending" | "confirmed" | "picked_up" | "delivered" | "returned" | "cancelled";

export function useAdminOrders() {
  const { toast } = useToast();

  const [filter,           setFilter]           = useState<string>("all");
  const [selectedOrder,    setSelectedOrder]     = useState<Order | null>(null);
  const [filtersOpen,      setFiltersOpen]       = useState(false);
  const [searchQuery,      setSearchQuery]       = useState("");
  const [restaurantFilter, setRestaurantFilter]  = useState("");
  const [paymentFilter,    setPaymentFilter]     = useState("");
  const [dateFrom,         setDateFrom]          = useState("");
  const [dateTo,           setDateTo]            = useState("");
  const [headerFlash,      setHeaderFlash]       = useState(false);
  const prevCountRef = useRef<number>(0);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const { data: drivers = [] } = useQuery<User[]>({
    queryKey: ["/api/drivers"],
    queryFn: () => authFetchJson("/api/drivers"),
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const { data: deliveryZones = [] } = useQuery<{ id: number; name: string; fee: number; color: string; isActive: boolean }[]>({
    queryKey: ["/api/delivery-zones"],
  });

  const { data: appSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    queryFn: () => authFetchJson("/api/settings"),
  });

  useEffect(() => {
    if (orders.length > 0 && prevCountRef.current > 0 && orders.length > prevCountRef.current) {
      playAdminAlertSound();
      setHeaderFlash(true);
      setTimeout(() => setHeaderFlash(false), 1500);
    }
    prevCountRef.current = orders.length;
  }, [orders.length]);

  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  const filteredOrders = orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (searchQuery && !o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (restaurantFilter && o.restaurantId !== Number(restaurantFilter)) return false;
    if (paymentFilter && o.paymentMethod !== paymentFilter) return false;
    if (dateFrom && o.createdAt && new Date(o.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && o.createdAt && new Date(o.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Statut mis à jour" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de mettre à jour le statut", variant: "destructive" });
    }
  };

  const assignDriver = async (orderId: number, driverId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ driverId, status: "confirmed" }) });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Agent assigne!" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible d'assigner l'agent", variant: "destructive" });
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (restaurantFilter) params.set("restaurantId", restaurantFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const url = `/api/orders/export${params.toString() ? "?" + params.toString() : ""}`;
      const res = await authFetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Erreur export" }));
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `commandes_maweja_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast({ title: "Erreur", description: "Impossible de telecharger", variant: "destructive" });
    }
  };

  const getRestaurantName = useCallback((id: number) => {
    return restaurants.find(r => r.id === id)?.name || `Restaurant #${id}`;
  }, [restaurants]);

  return {
    orders,
    filteredOrders,
    drivers,
    restaurants,
    deliveryZones,
    appSettings,
    filter, setFilter,
    selectedOrder, setSelectedOrder,
    filtersOpen, setFiltersOpen,
    searchQuery, setSearchQuery,
    restaurantFilter, setRestaurantFilter,
    paymentFilter, setPaymentFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    headerFlash,
    updateOrderStatus,
    assignDriver,
    handleExport,
    getRestaurantName,
  };
}
