import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ArrowLeft, MapPin, Trash2, Star, Plus, Home, Briefcase, Church, MoreHorizontal } from "lucide-react";
import { apiRequest, queryClient } from "../../lib/queryClient";
import type { SavedAddress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AppEmptyState } from "../../design-system/primitives";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const KINSHASA_CENTER: [number, number] = [-4.325, 15.322];

const labelOptions = [
  { key: "Maison", icon: Home },
  { key: "Bureau", icon: Briefcase },
  { key: "Eglise", icon: Church },
  { key: "Autre", icon: MoreHorizontal },
];

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AddressPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [position, setPosition] = useState<[number, number]>(KINSHASA_CENTER);
  const [addressText, setAddressText] = useState("");
  const [label, setLabel] = useState("Maison");
  const [showForm, setShowForm] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);

  const { data: addresses = [], isLoading } = useQuery<SavedAddress[]>({
    queryKey: ["/api/saved-addresses"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { label: string; address: string; lat: number; lng: number }) => {
      await apiRequest("/api/saved-addresses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-addresses"] });
      setShowForm(false);
      setLabel("Maison");
      setAddressText("");
      toast({ title: "Adresse sauvegardee" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder l'adresse", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/saved-addresses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-addresses"] });
      toast({ title: "Adresse supprimee" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/saved-addresses/${id}/default`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-addresses"] });
      toast({ title: "Adresse par defaut mise a jour" });
    },
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          reverseGeocode(newPos[0], newPos[1]);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      if (data.display_name) {
        setAddressText(data.display_name);
      }
    } catch {
      setAddressText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
    setShowForm(true);
  };

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const latlng = marker.getLatLng();
          setPosition([latlng.lat, latlng.lng]);
          reverseGeocode(latlng.lat, latlng.lng);
          setShowForm(true);
        }
      },
    }),
    []
  );

  const handleSave = () => {
    if (!addressText.trim()) return;
    saveMutation.mutate({
      label,
      address: addressText,
      lat: position[0],
      lng: position[1],
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950" data-testid="address-page">
      <div className="relative flex-1 min-h-[50vh]">
        <div className="absolute top-4 left-4 z-[1000]">
          <button
            className="w-10 h-10 rounded-full shadow-lg bg-white dark:bg-gray-900 flex items-center justify-center"
            onClick={() => navigate("/cart")}
            data-testid="button-back-cart"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>

        <div className="absolute top-4 right-4 z-[1000]">
          <button
            className="w-10 h-10 rounded-full shadow-lg bg-red-600 flex items-center justify-center"
            onClick={() => setShowForm(true)}
            data-testid="button-add-address"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        <MapContainer
          center={position}
          zoom={14}
          className="w-full h-full"
          style={{ zIndex: 0 }}
          data-testid="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={eventHandlers}
            ref={markerRef}
            data-testid="marker-draggable"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-100 dark:border-gray-800 p-5 space-y-4" data-testid="form-address">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto" />

          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle adresse</h3>

          <div className="flex gap-2 flex-wrap">
            {labelOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = label === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setLabel(opt.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                  data-testid={`button-label-${opt.key.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.key}
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="Adresse detectee automatiquement..."
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400"
              data-testid="input-address-text"
            />
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              onClick={() => setShowForm(false)}
              data-testid="button-cancel-address"
            >
              Annuler
            </button>
            <button
              className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-medium disabled:opacity-50"
              onClick={handleSave}
              disabled={saveMutation.isPending || !addressText.trim()}
              data-testid="button-save-address"
            >
              {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 p-4 space-y-3 overflow-y-auto max-h-[35vh]" data-testid="saved-addresses-list">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Adresses sauvegardees</h3>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="w-8 h-8 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && addresses.length === 0 && (
          <div data-testid="text-no-addresses">
            <AppEmptyState
              icon={MapPin}
              title="Aucune adresse sauvegardee"
              description="Touchez la carte pour en ajouter."
              size="sm"
            />
          </div>
        )}

        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-3 flex items-center gap-3 rounded-xl border ${
              addr.isDefault ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            }`}
            data-testid={`card-address-${addr.id}`}
          >
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-900 dark:text-white" data-testid={`text-label-${addr.id}`}>
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded-full font-medium" data-testid={`badge-default-${addr.id}`}>
                    Par defaut
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate" data-testid={`text-address-${addr.id}`}>
                {addr.address}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!addr.isDefault && (
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  onClick={() => setDefaultMutation.mutate(addr.id)}
                  data-testid={`button-set-default-${addr.id}`}
                >
                  <Star className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full"
                onClick={() => deleteMutation.mutate(addr.id)}
                data-testid={`button-delete-address-${addr.id}`}
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
