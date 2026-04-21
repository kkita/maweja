import { useState, useRef } from "react";
import { Loader2, X, GalleryHorizontal } from "lucide-react";
import { authFetch } from "../../../lib/queryClient";
import GalleryPicker from "../../GalleryPicker";
import ImportUrlToGallery from "../../ImportUrlToGallery";
import ImageCropper, { validateImageFile } from "../../ImageCropper";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_VIDEO_SIZE_MB = 10;

interface Props {
  label: string;
  accept: string;
  onUploaded: (url: string) => void;
  current?: string | null;
  icon: any;
  testId: string;
  onError?: (msg: string) => void;
  aspectRatio?: number;
}

export default function MediaUploadButton({ label, accept, onUploaded, current, icon: Icon, testId, onError, aspectRatio = 1 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video");

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const endpoint = isVideo ? "/api/upload-media" : "/api/upload";
      const res = await authFetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onUploaded(data.url);
      else onError?.("Erreur lors de l'upload");
    } catch { onError?.("Erreur lors de l'upload"); }
    setUploading(false);
  };

  const handleRawFile = (file: File) => {
    if (isVideo) {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        onError?.(`Vidéo trop volumineuse (max ${MAX_VIDEO_SIZE_MB}MB)`);
        return;
      }
      uploadFile(file);
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) { onError?.(validationError); return; }
    setCropFile(file);
  };

  const handleCropped = (croppedFile: File) => {
    setCropFile(null);
    uploadFile(croppedFile);
  };

  return (
    <>
      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspectRatio={aspectRatio}
          onCrop={handleCropped}
          onCancel={() => setCropFile(null)}
        />
      )}
      <div>
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">{label}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {current && !isVideo && (
            <img
              src={current}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
              onError={e => { (e.target as HTMLImageElement).src = "/maweja-logo-red.png"; }}
            />
          )}
          {current && isVideo && <video src={current} className="w-16 h-12 rounded-xl object-cover border border-zinc-200" muted />}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            data-testid={testId}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {uploading ? "Upload..." : current ? "Changer" : "Choisir"}
          </button>
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            data-testid={`${testId}-gallery`}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
          >
            <GalleryHorizontal size={14} /> Galerie
          </button>
          {current && <ImportUrlToGallery url={current} onImported={onUploaded} />}
          {current && (
            <button type="button" onClick={() => onUploaded("")} className="text-zinc-400 hover:text-red-500" data-testid={`${testId}-remove`}>
              <X size={14} />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={isVideo ? accept : ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={e => e.target.files?.[0] && handleRawFile(e.target.files[0])}
        />
      </div>
      <GalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={url => { onUploaded(url); }}
        filter={isVideo ? "video" : "image"}
      />
    </>
  );
}
