import { useEffect, useRef } from "react";
import * as L from "leaflet";
import type { Order } from "@shared/schema";

interface DriverLiveMapProps {
  lat: number | null;
  lng: number | null;
  orders: Order[];
}

export default function DriverLiveMap({ lat, lng, orders }: DriverLiveMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const orderMarkersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [lat ?? -4.3222, lng ?? 15.3222], zoom: 14,
      zoomControl: false, attributionControl: false,
    });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    const icon = L.divIcon({
      html: `<div style="width:36px;height:36px;background:#E10000;border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(225,0,0,0.5);display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg></div>`,
      className: "", iconSize: [36, 36], iconAnchor: [18, 18],
    });
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else markerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current).bindPopup("📍 Vous");
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    orderMarkersRef.current.forEach(m => m.remove());
    orderMarkersRef.current = [];
    orders.forEach((order, i) => {
      if (!order.deliveryLat || !order.deliveryLng) return;
      const icon = L.divIcon({
        html: `<div style="width:30px;height:30px;background:#60a5fa;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:11px;">${i + 1}</div>`,
        className: "", iconSize: [30, 30], iconAnchor: [15, 15],
      });
      orderMarkersRef.current.push(
        L.marker([order.deliveryLat, order.deliveryLng], { icon }).addTo(mapRef.current).bindPopup(`🚚 #${order.orderNumber}`)
      );
    });
  }, [orders]);

  return <div ref={containerRef} className="w-full h-44 rounded-2xl overflow-hidden" data-testid="driver-map" />;
}
