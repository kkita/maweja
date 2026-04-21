import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetchJson, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";
import type { Order, Restaurant, User } from "@shared/schema";

export function useDriverOrderDetail(orderId: number) {
  const { toast }    = useToast();
  const [, navigate] = useLocation();

  const orderQuery = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    queryFn: () => authFetchJson(`/api/orders/${orderId}`),
    enabled: orderId > 0,
  });

  const restaurantQuery = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", orderQuery.data?.restaurantId],
    queryFn: () => authFetchJson(`/api/restaurants/${orderQuery.data?.restaurantId}`),
    enabled: !!orderQuery.data?.restaurantId,
  });

  const clientQuery = useQuery<User>({
    queryKey: ["/api/users", orderQuery.data?.clientId],
    queryFn: () => authFetchJson(`/api/users/${orderQuery.data?.clientId}`),
    enabled: !!orderQuery.data?.clientId,
  });

  const updateStatus = async (status: string) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      toast({ title: status === "delivered" ? "🎉 Livraison terminée !" : "✅ Statut mis à jour" });
    } catch {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  };

  const acceptMutation = useMutation({
    mutationFn: () => apiRequest(`/api/orders/${orderId}/accept`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      toast({ title: "Commande acceptée ✓", description: "Allez récupérer la commande" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message || "Impossible d'accepter", variant: "destructive" }),
  });

  const refuseMutation = useMutation({
    mutationFn: (reason: string) =>
      apiRequest(`/api/orders/${orderId}/refuse`, { method: "POST", body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande refusée", description: "L'admin a été notifié" });
      navigate("/driver/orders");
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message || "Impossible de refuser", variant: "destructive" }),
  });

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    restaurant: restaurantQuery.data,
    client: clientQuery.data,
    updateStatus,
    acceptMutation,
    refuseMutation,
  };
}
