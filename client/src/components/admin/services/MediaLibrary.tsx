import { Copy, Check } from "lucide-react";
import type { ServiceCategory } from "@shared/schema";
import { palette, chipSurface } from "../../../design-system/tokens";
import MediaCard from "./MediaCard";
import { SERVICE_ICONS, LOGOS } from "./constants";

export default function MediaLibrary({ categories, copiedUrl, setCopiedUrl }: {
  categories: ServiceCategory[];
  copiedUrl: string | null;
  setCopiedUrl: (url: string | null) => void;
}) {
  const catImages = categories.filter(c => c.imageUrl);
  const totalImages = SERVICE_ICONS.length + LOGOS.length + catImages.length;

  const copy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const allItems = [
    ...SERVICE_ICONS,
    ...LOGOS,
    ...catImages.map(c => ({ name: c.name, url: c.imageUrl! })),
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Médiathèque</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Survolez une image et cliquez pour copier son URL. Utilisez-la lors de la création de services ou catégories.
          </p>
        </div>
        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
          {totalImages} images
        </span>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-red-600 rounded-full" />
          <h4 className="font-bold text-sm text-zinc-800">Icônes de services</h4>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{SERVICE_ICONS.length} images</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {SERVICE_ICONS.map(item => (
            <MediaCard
              key={item.url}
              name={item.name}
              url={item.url}
              testKey={item.name.toLowerCase()}
              copiedUrl={copiedUrl}
              onCopy={copy}
            />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h4 className="font-bold text-sm text-zinc-800">Logos MAWEJA</h4>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{LOGOS.length} images</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {LOGOS.map(item => (
            <MediaCard
              key={item.url}
              name={item.name}
              url={item.url}
              testKey={item.name.replace(/\s+/g, "-").toLowerCase()}
              copiedUrl={copiedUrl}
              onCopy={copy}
            />
          ))}
        </div>
      </div>

      {catImages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h4 className="font-bold text-sm text-zinc-800">Images de catégories (personnalisées)</h4>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{catImages.length} images</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {catImages.map(cat => (
              <MediaCard
                key={cat.id}
                name={cat.name}
                url={cat.imageUrl!}
                testKey={String(cat.id)}
                copiedUrl={copiedUrl}
                onCopy={copy}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h4 className="font-bold text-sm text-zinc-900">Référence rapide — toutes les URLs</h4>
          <button
            onClick={() => {
              const all = allItems.map(i => `${i.name}: ${i.url}`).join("\n");
              navigator.clipboard.writeText(all).then(() => {
                setCopiedUrl("__all__");
                setTimeout(() => setCopiedUrl(null), 2000);
              });
            }}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-all"
            style={{
              background: copiedUrl === "__all__" ? chipSurface.successBg : chipSurface.neutralBg,
              color: copiedUrl === "__all__" ? palette.semantic.successDark : palette.semantic.neutralStrong,
              borderColor: copiedUrl === "__all__" ? chipSurface.successBorder : chipSurface.neutralBorder,
            }}
            data-testid="button-copy-all-urls"
          >
            {copiedUrl === "__all__" ? <><Check size={10} /> Copié</> : <><Copy size={10} /> Tout copier</>}
          </button>
        </div>
        <div className="divide-y divide-zinc-50 max-h-96 overflow-y-auto">
          {allItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-5 py-3">
              <img src={item.url} alt={item.name} className="w-10 h-10 object-contain rounded-lg bg-zinc-50 border border-zinc-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800 truncate">{item.name}</p>
                <p className="text-[10px] text-zinc-400 truncate font-mono">{item.url}</p>
              </div>
              <button
                onClick={() => copy(item.url + "_ref")}
                data-testid={`button-copy-ref-${idx}`}
                className="flex-shrink-0 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1"
                style={{
                  background: copiedUrl === item.url + "_ref" ? chipSurface.successBg : chipSurface.neutralBg,
                  color: copiedUrl === item.url + "_ref" ? palette.semantic.successDark : palette.semantic.neutralStrong,
                  borderColor: copiedUrl === item.url + "_ref" ? chipSurface.successBorder : chipSurface.neutralBorder,
                }}
              >
                {copiedUrl === item.url + "_ref" ? <><Check size={10} /> Copié</> : <><Copy size={10} /> Copier</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
