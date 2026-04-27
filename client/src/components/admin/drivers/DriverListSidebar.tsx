import { Plus, Search, Truck } from "lucide-react";
import { EmptyState } from "../AdminUI";
import { CountdownTimer } from "./DriverTimers";
import type { Order } from "@shared/schema";
import type { DispatchDriver } from "./types";

interface FilterButton {
  key: "all" | "online" | "busy" | "offline" | "blocked";
  label: string;
  active: string;
  idle: string;
}

interface Props {
  visible: boolean;
  filteredDrivers: DispatchDriver[];
  selectedDriverId: number | null;
  search: string;
  onSearchChange: (v: string) => void;
  filter: FilterButton["key"];
  onFilterChange: (k: FilterButton["key"]) => void;
  filterButtons: FilterButton[];
  statusCounts: Record<FilterButton["key"], number>;
  getDriverStatus: (d: DispatchDriver) => string;
  getDriverActiveOrders: (id: number) => Order[];
  onSelect: (d: DispatchDriver) => void;
  onAdd: () => void;
}

export default function DriverListSidebar({
  visible, filteredDrivers, selectedDriverId, search, onSearchChange,
  filter, onFilterChange, filterButtons, statusCounts,
  getDriverStatus, getDriverActiveOrders, onSelect, onAdd,
}: Props) {
  return (
    <div className={`${visible ? "flex" : "hidden"} lg:flex w-full lg:w-[280px] xl:w-[300px] shrink-0 flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden`}>
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Agents ({filteredDrivers.length})</h3>
          <button onClick={onAdd} data-testid="button-add-driver"
            className="bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-700 shadow-lg shadow-red-200">
            <Plus size={14} />
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => onSearchChange(e.target.value)}
            data-testid="search-drivers"
            className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {filterButtons.map(f => (
            <button key={f.key} onClick={() => onFilterChange(f.key)} data-testid={`filter-${f.key}`}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${filter === f.key ? f.active : f.idle}`}>
              {f.label} {statusCounts[f.key]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredDrivers.map(d => {
          const status = getDriverStatus(d);
          const active = getDriverActiveOrders(d.id);
          const isSelected = selectedDriverId === d.id;
          return (
            <div key={d.id} onClick={() => onSelect(d)} data-testid={`driver-card-${d.id}`}
              className={`px-3 py-2.5 border-b border-gray-50 cursor-pointer transition-all hover:bg-zinc-50 ${isSelected ? "bg-red-50 border-l-[3px] border-l-red-600" : ""}`}>
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-zinc-100"
                  }`}>
                    <Truck size={14} className={
                      status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-zinc-400"
                    } />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[1.5px] border-white ${
                    status === "busy" ? "bg-orange-500" : status === "online" ? "bg-green-500" : status === "blocked" ? "bg-red-500" : "bg-zinc-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-zinc-900 truncate">{d.name}</p>
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      status === "busy" ? "bg-orange-100 text-orange-700" :
                      status === "online" ? "bg-green-100 text-green-700" :
                      status === "blocked" ? "bg-red-100 text-red-700" :
                      "bg-zinc-100 text-zinc-500 dark:text-zinc-400"
                    }`}>
                      {status === "busy" ? "OCCUPE" : status === "online" ? "DISPO" : status === "blocked" ? "BLOQUE" : "OFF"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-zinc-400 capitalize">{d.vehicleType || "Moto"}</span>
                    <span className="text-[9px] text-zinc-400">{d.phone}</span>
                  </div>
                  {active.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] text-orange-600 font-semibold">{active.length} cmd</span>
                      {active[0]?.estimatedDelivery && (
                        <CountdownTimer estimatedDelivery={active[0].estimatedDelivery} compact />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredDrivers.length === 0 && (
          <EmptyState icon={Truck} title="Aucun agent trouve" />
        )}
      </div>
    </div>
  );
}
