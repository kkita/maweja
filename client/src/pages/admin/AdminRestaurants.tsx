import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Store, Star, Clock, MapPin } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Restaurant } from "@shared/schema";

export default function AdminRestaurants() {
  const { data: restaurants = [] } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });

  return (
    <AdminLayout title="Gestion des restaurants">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <Store size={20} className="text-red-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{restaurants.length}</p>
          <p className="text-sm text-gray-500">Total restaurants</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <Star size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">
            {restaurants.length > 0 ? (restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length).toFixed(1) : 0}
          </p>
          <p className="text-sm text-gray-500">Note moyenne</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <Clock size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{restaurants.filter((r) => r.isActive).length}</p>
          <p className="text-sm text-gray-500">Actifs</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Tous les restaurants</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {restaurants.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-4" data-testid={`restaurant-row-${r.id}`}>
              <img src={r.image} alt={r.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">{r.cuisine} - {r.address}</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold">{r.rating}</span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={14} /> {r.deliveryTime}
              </div>
              <span className="font-semibold text-sm text-red-600">{formatPrice(r.deliveryFee)}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {r.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
