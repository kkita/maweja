import { pct, fmtVal } from "./kpiHelpers";

export default function KpiAnalCard({ label, evalVal, cmpVal, mode = "int" }: {
  label: string; evalVal: number | null; cmpVal: number | null;
  mode?: "int" | "price" | "dec2";
}) {
  const d = pct(evalVal, cmpVal);
  const isUp   = d !== null && d > 0;
  const isDown = d !== null && d < 0;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 flex flex-col gap-1">
      <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide leading-tight">{label}</p>
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-sm font-black text-zinc-900 dark:text-white">{fmtVal(evalVal, mode)}</span>
        {d !== null ? (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
            isUp ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                 : isDown ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                 : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400"
          }`}>
            {d > 0 ? "+" : ""}{d.toFixed(2)}%
          </span>
        ) : (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-50 text-zinc-400 dark:bg-zinc-800/40">N/A</span>
        )}
      </div>
    </div>
  );
}
