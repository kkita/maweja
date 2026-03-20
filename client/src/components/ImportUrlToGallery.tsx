import { useState } from "react";
import { apiRequest } from "../lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Download, Loader2, Check } from "lucide-react";

interface ImportUrlToGalleryProps {
  url: string;
  onImported: (newUrl: string) => void;
  size?: "sm" | "md";
}

/**
 * Button that downloads an external image/video URL to the server gallery.
 * Shows only when the URL is not already on the local server (not /uploads/ and not same-origin).
 */
export default function ImportUrlToGallery({ url, onImported, size = "sm" }: ImportUrlToGalleryProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Only show if URL is an external URL (not already stored on this server)
  const isLocalUpload = url.includes("/uploads/");
  if (!url || isLocalUpload) return null;

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/admin/gallery/import-url", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as { url: string; filename: string };

      qc.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      onImported(data.url);
      setDone(true);
      toast({ title: "Image sauvegardée dans la galerie !" });
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      toast({ title: "Erreur d'importation", description: err?.message || "Impossible de télécharger cette image", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const btnClass = size === "sm"
    ? "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
    : "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors";

  if (done) {
    return (
      <span className={`${btnClass} bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400`}>
        <Check size={size === "sm" ? 10 : 13} /> Sauvegardé
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleImport}
      disabled={loading}
      title="Télécharger cette image sur le serveur MAWEJA pour ne pas la perdre"
      className={`${btnClass} bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-50`}
    >
      {loading
        ? <Loader2 size={size === "sm" ? 10 : 13} className="animate-spin" />
        : <Download size={size === "sm" ? 10 : 13} />
      }
      {loading ? "Sauvegarde..." : "Stocker sur serveur"}
    </button>
  );
}
