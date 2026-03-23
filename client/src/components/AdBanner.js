import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Megaphone, Phone } from "lucide-react";
import { resolveImg } from "../lib/queryClient";
function AdSkeleton() {
    return (_jsx("div", { className: "rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse", style: { height: 140 }, children: _jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(Megaphone, { size: 28, className: "text-gray-300 dark:text-gray-600" }) }) }));
}
function AdMediaItem({ ad, active }) {
    const [loaded, setLoaded] = useState(false);
    const videoRef = useRef(null);
    useEffect(() => {
        if (active && videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    }, [active]);
    return (_jsxs("div", { className: "relative w-full h-full", children: [!loaded && (_jsx("div", { className: "absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-10", children: _jsx("div", { className: "w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin", style: { borderWidth: 3 } }) })), ad.mediaType === "video" ? (_jsx("video", { ref: videoRef, src: resolveImg(ad.mediaUrl), autoPlay: active, loop: true, muted: true, playsInline: true, onLoadedData: () => setLoaded(true), className: "w-full h-full object-cover", "data-testid": `ad-video-${ad.id}` }, ad.id)) : (_jsx("img", { src: resolveImg(ad.mediaUrl), alt: ad.title || "Publicité", onLoad: () => setLoaded(true), className: `w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`, "data-testid": `ad-image-${ad.id}` })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" }), ad.title && (_jsxs("div", { className: "absolute bottom-3 left-3 right-3", children: [_jsx("p", { className: "text-white text-sm font-bold drop-shadow-lg leading-tight", children: ad.title }), ad.description && (_jsx("p", { className: "text-white/80 text-xs mt-0.5 leading-tight", children: ad.description }))] }))] }));
}
export default function AdBanner() {
    const { data: ads = [], isLoading } = useQuery({
        queryKey: ["/api/advertisements?active=true"],
    });
    const { data: appSettings } = useQuery({
        queryKey: ["/api/settings"],
        staleTime: 5 * 60 * 1000,
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef(null);
    const visibleAds = ads.slice(0, 5);
    const contactNumber = (appSettings?.whatsapp_number || "+243802540138")
        .replace(/\s+/g, "");
    const displayNumber = contactNumber.startsWith("+") ? contactNumber : `+${contactNumber}`;
    useEffect(() => {
        if (visibleAds.length <= 1)
            return;
        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % visibleAds.length);
        }, 5000);
        return () => clearInterval(timerRef.current);
    }, [visibleAds.length]);
    const goTo = (i) => {
        setCurrentIndex(i);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % visibleAds.length);
        }, 5000);
    };
    if (isLoading)
        return _jsx(AdSkeleton, {});
    if (visibleAds.length === 0) {
        return (_jsxs("div", { className: "rounded-2xl overflow-hidden flex items-center gap-4 px-5", style: {
                height: 140,
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            }, "data-testid": "ad-placeholder", children: [_jsx("div", { className: "w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 flex-col gap-0.5", children: _jsx(Megaphone, { size: 24, className: "text-white" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full mb-1.5", children: _jsx("span", { className: "text-[9px] font-bold text-white uppercase tracking-wider", children: "Espace publicitaire MAWEJA" }) }), _jsx("p", { className: "text-[15px] font-black text-white leading-tight", children: "Votre publicit\u00E9 ici" }), _jsx("p", { className: "text-[11px] text-white/80 mt-0.5 leading-snug", children: "Touchez des milliers de clients \u00E0 Kinshasa" }), _jsxs("div", { className: "flex items-center gap-1.5 mt-2", children: [_jsx(Phone, { size: 11, className: "text-white/80 flex-shrink-0" }), _jsx("span", { className: "text-[12px] font-black text-white tracking-wide", children: displayNumber })] })] })] }));
    }
    return (_jsxs("div", { className: "relative rounded-2xl overflow-hidden shadow-sm", "data-testid": "ad-banner", style: { height: 140, boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }, children: [visibleAds.map((ad, i) => (_jsx("div", { className: `absolute inset-0 transition-opacity duration-500 ${i === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`, children: _jsx(AdMediaItem, { ad: ad, active: i === currentIndex }) }, ad.id))), visibleAds.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => goTo((currentIndex - 1 + visibleAds.length) % visibleAds.length), className: "absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20", "data-testid": "ad-prev", children: _jsx(ChevronLeft, { size: 14 }) }), _jsx("button", { onClick: () => goTo((currentIndex + 1) % visibleAds.length), className: "absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20", "data-testid": "ad-next", children: _jsx(ChevronRight, { size: 14 }) }), _jsx("div", { className: "absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20", children: visibleAds.map((_, i) => (_jsx("button", { onClick: () => goTo(i), className: `h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "bg-white w-5" : "bg-white/50 w-1.5"}`, "data-testid": `ad-dot-${i}` }, i))) })] })), visibleAds[currentIndex]?.linkUrl && (_jsx("a", { href: visibleAds[currentIndex].linkUrl, target: "_blank", rel: "noopener noreferrer", className: "absolute inset-0 z-10", "data-testid": "ad-link" }))] }));
}
//# sourceMappingURL=AdBanner.js.map