import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, X, Check, Navigation, Keyboard } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const KINSHASA_CENTER: [number, number] = [-4.325, 15.322];

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  initialAddress?: string;
  onConfirm: (address: string) => void;
  onClose: () => void;
}

export default function AddressPickerModal({ initialAddress = "", onConfirm, onClose }: Props) {
  const [tab, setTab] = useState<"map" | "text">("map");
  const [position, setPosition] = useState<[number, number]>(KINSHASA_CENTER);
  const [addressText, setAddressText] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Auto-focus input when switching to text tab ── */
  useEffect(() => {
    if (tab === "text") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [tab]);

  /* ── Try to get user GPS on mount ──────────────────────────────── */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(p);
          reverseGeocode(p[0], p[1]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
      );
      const data = await res.json();
      if (data.display_name) {
        const parts = data.display_name.split(",").slice(0, 4).join(", ");
        setAddressText(parts);
      }
    } catch {
      setAddressText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
      }
    },
  }), []);

  const handleConfirm = () => {
    const trimmed = addressText.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="mt-auto w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ height: "92dvh", maxHeight: "92dvh", boxShadow: "0 -12px 60px rgba(0,0,0,0.25)" }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FEE2E2" }}>
              <MapPin size={15} style={{ color: "#EC0000" }} />
            </div>
            <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 16 }}>
              Adresse de livraison
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 active:scale-90 transition-transform"
            data-testid="button-close-address-modal"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex gap-2 px-5 pb-3 flex-shrink-0">
          <button
            onClick={() => setTab("map")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === "map" ? "#EC0000" : "transparent",
              color: tab === "map" ? "white" : "#6B7280",
              border: tab === "map" ? "none" : "1.5px solid #E5E7EB",
            }}
            data-testid="tab-map"
          >
            <Navigation size={14} />
            Choisir sur la carte
          </button>
          <button
            onClick={() => setTab("text")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === "text" ? "#EC0000" : "transparent",
              color: tab === "text" ? "white" : "#6B7280",
              border: tab === "text" ? "none" : "1.5px solid #E5E7EB",
            }}
            data-testid="tab-text"
          >
            <Keyboard size={14} />
            Saisir manuellement
          </button>
        </div>

        {/* ── Map tab ────────────────────────────────────────────────── */}
        {tab === "map" && (
          <div className="flex-1 relative overflow-hidden">
            {/* Hint overlay */}
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-full text-white text-xs font-medium shadow-lg"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", whiteSpace: "nowrap" }}
            >
              Touchez ou déplacez le marqueur
            </div>

            <MapContainer
              center={position}
              zoom={15}
              className="w-full h-full"
              style={{ zIndex: 0 }}
              data-testid="address-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={position}
                draggable
                eventHandlers={eventHandlers}
                ref={markerRef}
                data-testid="address-marker"
              />
              <MapClickHandler onSelect={handleMapSelect} />
            </MapContainer>
          </div>
        )}

        {/* ── Text tab ───────────────────────────────────────────────── */}
        {tab === "text" && (
          <div className="flex-1 px-5 pt-2 flex flex-col">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Votre adresse
            </label>
            <textarea
              ref={inputRef as any}
              value={addressText}
              onChange={e => setAddressText(e.target.value)}
              placeholder="Ex: Avenue Kasa-Vubu, Gombe, Kinshasa&#10;Quartier Matonge, Commune de Kalamu..."
              rows={4}
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ caretColor: "#EC0000" }}
              data-testid="input-address-text-modal"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Soyez précis pour que le livreur vous trouve facilement.
            </p>
          </div>
        )}

        {/* ── Address detected bar (shown on map tab) ─────────────────── */}
        {tab === "map" && (
          <div className="flex-shrink-0 px-5 pt-3">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
            >
              <MapPin size={16} style={{ color: "#EC0000", flexShrink: 0 }} />
              {loading ? (
                <span className="text-xs text-gray-400 animate-pulse flex-1">Détection de l'adresse…</span>
              ) : (
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 leading-snug line-clamp-2">
                  {addressText || "Touchez la carte pour obtenir une adresse"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Confirm button ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-5 py-5">
          <button
            onClick={handleConfirm}
            disabled={!addressText.trim() || loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{ background: "#EC0000" }}
            data-testid="button-confirm-address-map"
          >
            <Check size={16} />
            Confirmer cette adresse
          </button>
        </div>
      </div>
    </div>
  );
}
