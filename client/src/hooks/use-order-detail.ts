import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetchJson, apiRequest, queryClient, authFetch } from "../lib/queryClient";
import { useToast } from "./use-toast";
import type { Order, Restaurant, User } from "@shared/schema";

export function useOrderDetail(id: number) {
  const { toast } = useToast();

  const orderQuery = useQuery<Order>({
    queryKey: ["/api/orders", id],
    queryFn: () => authFetchJson(`/api/orders/${id}`),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const restaurantQuery = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", orderQuery.data?.restaurantId],
    queryFn: () => authFetchJson(`/api/restaurants/${orderQuery.data?.restaurantId}`),
    enabled: !!orderQuery.data?.restaurantId,
  });

  const settingsQuery = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000,
  });

  const driverQuery = useQuery<Omit<User, "password">>({
    queryKey: ["/api/drivers", orderQuery.data?.driverId],
    queryFn: () =>
      authFetch("/api/drivers")
        .then(r => r.json())
        .then((drivers: any[]) => drivers.find(d => d.id === orderQuery.data?.driverId)),
    enabled: !!orderQuery.data?.driverId,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      apiRequest(`/api/orders/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande annulee", description: "Votre commande a ete annulee avec succes." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'annuler la commande.", variant: "destructive" });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (data: { rating: number; feedback: string }) =>
      apiRequest(`/api/orders/${id}/rate`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Merci!", description: "Votre avis a ete enregistre." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'envoyer l'avis.", variant: "destructive" });
    },
  });

  const whatsappNumber = ((settingsQuery.data?.whatsapp_number || "+243802540138")
    .replace(/\s+/g, "")
    .replace("+", ""));

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    restaurant: restaurantQuery.data,
    driver: driverQuery.data,
    whatsappNumber,
    cancelMutation,
    rateMutation,
  };
}
