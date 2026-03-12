import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Advertisement } from "@shared/schema";

export default function AdBanner() {
  const { data: ads = [] } = useQuery<Advertisement[]>({
    queryKey: ["/api/advertisements?active=true"],
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<any>(null);
  const visibleAds = ads.slice(0, 5);

  useEffect(() => {
    if (visibleAds.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAds.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [visibleAds.length]);

  if (visibleAds.length === 0) return null;

  const goTo = (i: number) => {
    setCurrentIndex(i);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAds.length);
    }, 5000);
  };

  const ad = visibleAds[currentIndex];

  return (
    <div className="relative mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-black" data-testid="ad-banner">
      <div className="relative aspect-[16/7] w-full">
        {ad.mediaType === "video" ? (
          <video
            key={ad.id}
            src={ad.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            data-testid={`ad-video-${ad.id}`}
          />
        ) : (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
            data-testid={`ad-image-${ad.id}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {ad.title && (
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white text-xs font-bold drop-shadow-lg">{ad.title}</p>
          </div>
        )}
      </div>

      {visibleAds.length > 1 && (
        <>
          <button onClick={() => goTo((currentIndex - 1 + visibleAds.length) % visibleAds.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-10"
            data-testid="ad-prev">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => goTo((currentIndex + 1) % visibleAds.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-10"
            data-testid="ad-next">
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {visibleAds.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-white w-4" : "bg-white/50"}`}
                data-testid={`ad-dot-${i}`} />
            ))}
          </div>
        </>
      )}

      {ad.linkUrl && (
        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" data-testid="ad-link" />
      )}
    </div>
  );
}
