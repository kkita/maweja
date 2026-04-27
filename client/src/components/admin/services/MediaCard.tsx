import { Copy, Check } from "lucide-react";

export default function MediaCard({ name, url, testKey, copiedUrl, onCopy }: {
  name: string; url: string; testKey: string;
  copiedUrl: string | null; onCopy: (url: string) => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
      data-testid={`media-card-${testKey}`}
    >
      <div className="relative w-full bg-zinc-50" style={{ paddingBottom: "100%" }}>
        <img
          src={url}
          alt={name}
          className="absolute inset-0 w-full h-full object-contain p-3"
          data-testid={`media-img-${testKey}`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
          <button
            onClick={() => onCopy(url)}
            className="opacity-0 group-hover:opacity-100 transition-all bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-zinc-700"
          >
            {copiedUrl === url ? <><Check size={12} className="text-green-600" /> Copié</> : <><Copy size={12} /> Copier URL</>}
          </button>
        </div>
      </div>
      <div className="p-2.5">
        <p className="font-bold text-[11px] text-zinc-800 line-clamp-1 mb-1">{name}</p>
        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
          <code className="text-[8px] text-zinc-400 flex-1 truncate font-mono">{url}</code>
          <button
            onClick={() => onCopy(url + "_inline")}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all hover:bg-zinc-200 active:scale-90"
          >
            {copiedUrl === url + "_inline" ? (
              <Check size={10} className="text-green-600" />
            ) : (
              <Copy size={10} className="text-zinc-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
