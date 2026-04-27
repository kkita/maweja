export default function KpiCard({ icon, color, label, value, sub }: { icon: React.ReactNode; color: string; label: string; value: string; sub?: string }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600 text-indigo-50",
    amber: "from-amber-500 to-amber-600 text-amber-50",
    emerald: "from-emerald-500 to-emerald-600 text-emerald-50",
    rose: "from-rose-500 to-rose-600 text-rose-50",
    green: "from-green-500 to-green-600 text-green-50",
    yellow: "from-yellow-500 to-yellow-600 text-yellow-50",
  };
  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full blur-2xl -mr-6 -mt-6`} />
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center shadow-md`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
