import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Megaphone, Phone } from "lucide-react";
import { resolveImg } from "../lib/queryClient";
import type { Advertisement } from "@shared/schema";

function AdSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ height: 140 }}>
      <div className="w-full h-full flex items-center justify-center">
        <Megaphone size={28} className="text-gray-300 dark:text-gray-600" />
      </div>
    </div>
  );
}

function AdMediaItem({ ad, active }: { ad: Advertisement; active: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (active && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [active]);

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
        </div>
      )}
      {ad.mediaType === "video" ? (
        <video
          ref={videoRef}
          key={ad.id}
          src={resolveImg(ad.mediaUrl)}
          autoPlay={active}
          loop
          muted
          playsInline
          onLoadedData={() => setLoaded(true)}
          className="w-full h-full object-cover"
          data-testid={`ad-video-${ad.id}`}
        />
      ) : (
        <img
          src={resolveImg(ad.mediaUrl)}
          alt={ad.title || "Publicité"}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          data-testid={`ad-image-${ad.id}`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      {ad.title && (
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white text-sm font-bold drop-shadow-lg leading-tight">{ad.title}</p>
          {(ad as any).description && (
            <p className="text-white/80 text-xs mt-0.5 leading-tight">{(ad as any).description}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdBanner() {
  const { data: ads = [], isLoading } = useQuery<Advertisement[]>({
    queryKey: ["/api/advertisements?active=true"],
  });

  const { data: appSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<any>(null);
  const visibleAds = ads.slice(0, 5);

  const contactNumber = (appSettings?.whatsapp_number || "+243802540138")
    .replace(/\s+/g, "");
  const displayNumber = contactNumber.startsWith("+") ? contactNumber : `+${contactNumber}`;

  useEffect(() => {
    if (visibleAds.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAds.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [visibleAds.length]);

  const goTo = (i: number) => {
    setCurrentIndex(i);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAds.length);
    }, 5000);
  };

  if (isLoading) return <AdSkeleton />;

  if (visibleAds.length === 0) {
    return (
      <div
        className="rounded-2xl overflow-hidden flex items-center gap-4 px-5"
        style={{
          height: 140,
          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
        }}
        data-testid="ad-placeholder"
      >
        {/* Icon */}
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 flex-col gap-0.5">
          <Megaphone size={24} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full mb-1.5">
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Espace publicitaire MAWEJA</span>
          </div>
          <p className="text-[15px] font-black text-white leading-tight">Votre publicité ici</p>
          <p className="text-[11px] text-white/80 mt-0.5 leading-snug">Touchez des milliers de clients à Kinshasa</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Phone size={11} className="text-white/80 flex-shrink-0" />
            <span className="text-[12px] font-black text-white tracking-wide">{displayNumber}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm" data-testid="ad-banner"
      style={{ height: 140, boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}>
      {visibleAds.map((ad, i) => (
        <div
          key={ad.id}
          className={`absolute inset-0 transition-opacity duration-500 ${i === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <AdMediaItem ad={ad} active={i === currentIndex} />
        </div>
      ))}

      {visibleAds.length > 1 && (
        <>
          <button onClick={() => goTo((currentIndex - 1 + visibleAds.length) % visibleAds.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20"
            data-testid="ad-prev">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => goTo((currentIndex + 1) % visibleAds.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20"
            data-testid="ad-next">
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {visibleAds.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
                data-testid={`ad-dot-${i}`} />
            ))}
          </div>
        </>
      )}

      {visibleAds[currentIndex]?.linkUrl && (
        <a href={visibleAds[currentIndex].linkUrl!} target="_blank" rel="noopener noreferrer"
          className="absolute inset-0 z-10" data-testid="ad-link" />
      )}
    </div>
  );
}
