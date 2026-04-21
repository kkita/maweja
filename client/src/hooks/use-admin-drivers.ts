import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetchJson } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import { useAuth } from "../lib/auth";
import { useToast } from "./use-toast";
import type { Order } from "@shared/schema";

export function useAdminDrivers() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: hideFeeSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "hideDeliveryFees"],
    queryFn: () => authFetchJson("/api/settings/hideDeliveryFees"),
  });
  const hideFeesFromDrivers = hideFeeSetting?.value === "true";

  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
    queryFn: () => authFetchJson("/api/drivers"),
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const { data: restaurants = [] } = useQuery<any[]>({
    queryKey: ["/api/restaurants"],
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "driver_location" || data.type === "driver_status") {
        queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      }
    });
  }, []);

  const activeOrders = useMemo(
    () => orders.filter(o => ["confirmed", "picked_up"].includes(o.status)),
    [orders]
  );

  const getDriverActiveOrders = (driverId: number) =>
    activeOrders.filter(o => o.driverId === driverId);

  const getDriverDelivered = (driverId: number) =>
    orders.filter(o => o.driverId === driverId && o.status === "delivered");

  const getDriverStatus = (d: any): string => {
    if (d.isBlocked) return "blocked";
    if (!d.isOnline) return "offline";
    if (getDriverActiveOrders(d.id).length > 0) return "busy";
    return "online";
  };

  const getRestaurantName = (restaurantId: number) => {
    const r = restaurants.find((rest: any) => rest.id === restaurantId);
    return r?.name || `Restaurant #${restaurantId}`;
  };

  const driversWithLocation = useMemo(
    () => drivers.filter((d: any) => d.lat && d.lng && d.isOnline),
    [drivers]
  );

  const unassignedOrders = useMemo(
    () => orders.filter(o => !o.driverId && ["pending", "confirmed"].includes(o.status)),
    [orders]
  );

  const assignedOrders = useMemo(
    () => orders.filter(o => o.driverId && !["delivered", "cancelled"].includes(o.status)),
    [orders]
  );

  const assignedByDriver = useMemo(() => {
    const map = new Map<number, Order[]>();
    assignedOrders.forEach(o => {
      if (o.driverId) {
        const existing = map.get(o.driverId) || [];
        existing.push(o);
        map.set(o.driverId, existing);
      }
    });
    return map;
  }, [assignedOrders]);

  const completedOrders = useMemo(
    () => orders.filter(o => o.status === "delivered"),
    [orders]
  );

  const freeDrivers = useMemo(
    () => drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length === 0),
    [drivers, activeOrders]
  );

  const busyDrivers = useMemo(
    () => drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length > 0),
    [drivers, activeOrders]
  );

  const offlineDrivers = useMemo(
    () => drivers.filter((d: any) => !d.isOnline),
    [drivers]
  );

  const availableDriversForAssign = useMemo(
    () => drivers.filter((d: any) => d.isOnline && !d.isBlocked),
    [drivers]
  );

  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
  }, []);

  const getDriverTodayDeliveries = (driverId: number) =>
    orders.filter(o =>
      o.driverId === driverId &&
      o.status === "delivered" &&
      o.updatedAt &&
      new Date(o.updatedAt).getTime() >= todayStart
    ).length;

  const statusCounts = {
    all: drivers.length,
    online: freeDrivers.length,
    busy: busyDrivers.length,
    offline: offlineDrivers.length,
    blocked: drivers.filter((d: any) => d.isBlocked).length,
  };

  const handleAssignDriver = async (orderId: number, driverId: number): Promise<boolean> => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ driverId, status: "confirmed" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Agent attribue" });
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const handleDelete = async (id: number): Promise<boolean> => {
    if (!confirm("Supprimer cet agent definitivement ?")) return false;
    try {
      await apiRequest(`/api/drivers/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ title: "Agent supprime" });
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de supprimer l'agent", variant: "destructive" });
      return false;
    }
  };

  const handleBlock = async (id: number, isBlocked: boolean) => {
    try {
      await apiRequest(`/api/drivers/${id}/block`, { method: "PATCH", body: JSON.stringify({ isBlocked: !isBlocked }) });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ title: isBlocked ? "Agent debloque" : "Agent bloque" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de modifier le statut", variant: "destructive" });
    }
  };

  const sendAlarm = async (driverId: number, reason: string): Promise<boolean> => {
    try {
      await apiRequest(`/api/drivers/${driverId}/alarm`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Urgence - Contactez l'administration immediatement" }),
      });
      toast({ title: "Alarme envoyee", description: "L'agent a ete alerte" });
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const sendQuickMessage = async (driverId: number, message: string): Promise<boolean> => {
    if (!message.trim() || !user) return false;
    try {
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: driverId, message: message.trim(), isRead: false }),
      });
      toast({ title: "Message envoye" });
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const toggleHideFees = async () => {
    const newVal = hideFeesFromDrivers ? "false" : "true";
    await apiRequest("/api/settings/hideDeliveryFees", { method: "PUT", body: JSON.stringify({ value: newVal }) });
    queryClient.invalidateQueries({ queryKey: ["/api/settings", "hideDeliveryFees"] });
    toast({ title: newVal === "true" ? "Frais masques pour les agents" : "Frais visibles pour les agents" });
  };

  return {
    drivers, orders, restaurants,
    hideFeesFromDrivers,
    activeOrders,
    getDriverActiveOrders, getDriverDelivered, getDriverStatus, getRestaurantName,
    driversWithLocation,
    unassignedOrders, assignedOrders, assignedByDriver, completedOrders,
    freeDrivers, busyDrivers, offlineDrivers, availableDriversForAssign,
    getDriverTodayDeliveries, statusCounts,
    handleAssignDriver, handleDelete, handleBlock,
    sendAlarm, sendQuickMessage, toggleHideFees,
  };
}
