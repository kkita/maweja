import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Gift, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { resolveImg } from "../../lib/queryClient";
import type { Advertisement, PromoBanner } from "@shared/schema";

const FALLBACK_BANNERS = [
  {
    id: "f1",
    bg: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
    icon: <Zap size={22} className="text-yellow-300" />,
    title: "Livraison rapide",
    subtitle: "Commandez maintenant, livré en moins de 45 min",
  },
  {
    id: "f2",
    bg: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
    icon: <Gift size={22} className="text-white" />,
    title: "Première commande",
    subtitle: "Profitez de nos offres exclusives dès aujourd'hui",
  },
  {
    id: "f3",
    bg: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    icon: <MapPin size={22} className="text-red-400" />,
    title: "Livraison sur Kinshasa",
    subtitle: "Gombe · Lingwala · Limete · Ngaliema et plus",
  },
];

export default function AdBanner() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: ads = [] } = useQuery<Advertisement[]>({
    queryKey: ["/api/advertisements"],
    staleTime: 60_000,
  });

  const { data: promoBanner } = useQuery<PromoBanner>({
    queryKey: ["/api/promo-banner"],
    staleTime: 60_000,
  });

  const activeAds = ads.filter(a => a.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const useAds = activeAds.length > 0;
  const total = useAds ? activeAds.length : (promoBanner?.isActive ? FALLBACK_BANNERS.length + 1 : FALLBACK_BANNERS.length);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % total);
    }, 4500);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total]);

  const go = (dir: 1 | -1) => {
    setActive(prev => (prev + dir + total) % total);
    resetTimer();
  };

  if (total === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-[20px] shadow-sm" style={{ height: 140 }} data-testid="ad-banner">

      {useAds ? (
        activeAds.map((ad, i) => (
          <div
            key={ad.id}
            className={`absolute inset-0 transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {ad.mediaType === "video" ? (
              <video
                src={resolveImg(ad.mediaUrl)}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={resolveImg(ad.mediaUrl)}
                alt={ad.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {ad.title && (
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6">
                <p className="text-white font-bold text-sm leading-tight drop-shadow">{ad.title}</p>
              </div>
            )}
            {ad.linkUrl && (
              <a
                href={ad.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0"
                aria-label={ad.title}
              />
            )}
          </div>
        ))
      ) : (
        <>
          {FALLBACK_BANNERS.map((b, i) => (
            <div
              key={b.id}
              className={`absolute inset-0 flex items-center px-5 gap-4 transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{ background: b.bg }}
            >
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                {b.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-base leading-tight">{b.title}</p>
                <p className="text-white/70 text-xs mt-1 leading-snug">{b.subtitle}</p>
              </div>
            </div>
          ))}

          {promoBanner?.isActive && (
            <div
              className={`absolute inset-0 flex flex-col justify-center px-5 transition-opacity duration-500 ${active === FALLBACK_BANNERS.length ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{ background: `linear-gradient(135deg, ${promoBanner.bgColorFrom} 0%, ${promoBanner.bgColorTo} 100%)` }}
            >
              <span className="text-[10px] font-black tracking-widest text-white/70 uppercase mb-1">{promoBanner.tagText}</span>
              <p className="text-white font-bold text-base leading-tight">{promoBanner.title}</p>
              <p className="text-white/75 text-xs mt-0.5">{promoBanner.subtitle}</p>
            </div>
          )}
        </>
      )}

      {total > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            data-testid="ad-prev"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            data-testid="ad-next"
          >
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); resetTimer(); }}
                className={`rounded-full transition-all ${i === active ? "bg-white w-4 h-1.5" : "bg-white/40 w-1.5 h-1.5"}`}
                data-testid={`ad-dot-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
