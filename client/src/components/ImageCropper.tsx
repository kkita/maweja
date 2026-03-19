import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, AlertCircle } from "lucide-react";

interface ImageCropperProps {
  file: File;
  aspectRatio?: number; // e.g. 1 for square, 16/9 for cover
  maxSizeKB?: number;   // max output size in KB (default 800)
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

const MAX_KB = 1024;

export function validateImageFile(file: File): string | null {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return "Format non supporté. Utilisez JPG, PNG ou WebP.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "Fichier trop volumineux. Maximum 5MB.";
  }
  return null;
}

export default function ImageCropper({
  file,
  aspectRatio = 1,
  maxSizeKB = MAX_KB,
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

  /* Load file as dataURL */
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setImgSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    /* Auto-fit: compute initial zoom so image fills the crop frame */
    const containerW = containerRef.current?.clientWidth || 320;
    const containerH = containerRef.current?.clientHeight || 320;
    const scaleX = containerW / img.naturalWidth;
    const scaleY = containerH / img.naturalHeight;
    const initialZoom = Math.max(scaleX, scaleY);
    setZoom(initialZoom);
    setPosition({ x: 0, y: 0 });
  };

  /* ── Pointer drag ──────────────────────────────────────────────── */
  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  };

  const onPointerUp = () => setDragging(false);

  /* ── Wheel zoom ────────────────────────────────────────────────── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(5, Math.max(0.5, z - e.deltaY * 0.002)));
  };

  /* ── Crop & export ─────────────────────────────────────────────── */
  const handleCrop = useCallback(() => {
    const containerEl = containerRef.current;
    if (!containerEl || !imgSrc || imgNaturalSize.w === 0) return;

    const containerW = containerEl.clientWidth;
    const containerH = containerEl.clientHeight;

    /* What the image renders as on screen */
    const renderedW = imgNaturalSize.w * zoom;
    const renderedH = imgNaturalSize.h * zoom;

    /* Top-left of rendered image relative to container center */
    const imgLeft = (containerW - renderedW) / 2 + position.x;
    const imgTop  = (containerH - renderedH) / 2 + position.y;

    /* Crop rectangle in image-natural coordinates */
    const cropX = (-imgLeft) / zoom;
    const cropY = (-imgTop)  / zoom;
    const cropW = containerW / zoom;
    const cropH = containerH / zoom;

    /* Clamp to image bounds */
    const clampedX = Math.max(0, cropX);
    const clampedY = Math.max(0, cropY);
    const clampedW = Math.min(imgNaturalSize.w - clampedX, cropW);
    const clampedH = Math.min(imgNaturalSize.h - clampedY, cropH);

    /* Output size: max 800px on longest side */
    const outputW = Math.min(800, Math.round(clampedW));
    const outputH = Math.round(clampedH * (outputW / clampedW));

    const canvas = document.createElement("canvas");
    canvas.width  = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d")!;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, clampedX, clampedY, clampedW, clampedH, 0, 0, outputW, outputH);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          onCrop(croppedFile);
        },
        "image/jpeg",
        0.88
      );
    };
    img.src = imgSrc;
  }, [imgSrc, imgNaturalSize, zoom, position, file.name, onCrop]);

  /* Frame height based on aspect ratio */
  const frameW = 300;
  const frameH = Math.round(frameW / aspectRatio);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform">
          <X size={18} />
        </button>
        <p className="text-white font-bold text-sm">Recadrer l'image</p>
        <button
          onClick={handleCrop}
          className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          data-testid="button-confirm-crop"
        >
          <Check size={15} />
          OK
        </button>
      </div>

      {/* Crop area */}
      <div
        className="relative overflow-hidden rounded-2xl bg-black/50 cursor-grab select-none"
        ref={containerRef}
        style={{
          width: frameW,
          height: frameH,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "60vh",
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        data-testid="crop-area"
      >
        {/* Crosshair grid */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: `${frameW / 3}px ${frameH / 3}px`,
          }} />
          {/* Corner marks */}
          {[
            { top: 0, left: 0, borderTop: "3px solid #dc2626", borderLeft: "3px solid #dc2626", borderRadius: "8px 0 0 0" },
            { top: 0, right: 0, borderTop: "3px solid #dc2626", borderRight: "3px solid #dc2626", borderRadius: "0 8px 0 0" },
            { bottom: 0, left: 0, borderBottom: "3px solid #dc2626", borderLeft: "3px solid #dc2626", borderRadius: "0 0 0 8px" },
            { bottom: 0, right: 0, borderBottom: "3px solid #dc2626", borderRight: "3px solid #dc2626", borderRadius: "0 0 8px 0" },
          ].map((s, i) => (
            <div key={i} className="absolute w-6 h-6" style={s} />
          ))}
        </div>

        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt="crop"
            onLoad={handleImgLoad}
            draggable={false}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
              transformOrigin: "center",
              maxWidth: "none",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        )}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-90"
        >
          <ZoomOut size={16} />
        </button>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.05}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-32 accent-red-500"
          data-testid="input-crop-zoom"
        />
        <button
          onClick={() => setZoom(z => Math.min(5, z + 0.1))}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-90"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); handleImgLoad(); }}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-90"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <p className="text-white/50 text-xs mt-3 text-center px-4">
        Glissez pour repositionner • Molette pour zoomer
      </p>
    </div>
  );
}
