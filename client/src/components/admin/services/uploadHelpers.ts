import { authFetch, queryClient } from "../../../lib/queryClient";
import type { ToastFn } from "../../../hooks/use-toast";

export async function uploadServiceImage({
  file, setUrl, setLoading, toast,
}: {
  file: File;
  setUrl: (url: string) => void;
  setLoading: (v: boolean) => void;
  toast: ToastFn;
}) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    toast({ title: "Format non supporté", description: "Utilisez JPG, PNG ou WEBP", variant: "destructive" });
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast({ title: "Fichier trop volumineux", description: "Max 5 MB", variant: "destructive" });
    return;
  }
  setLoading(true);
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await authFetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || `Erreur serveur (${res.status})`);
    }
    const data = await res.json();
    if (data.url) {
      setUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Image uploadée avec succès" });
    } else {
      toast({ title: "Erreur", description: "Upload échoué", variant: "destructive" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Impossible d'uploader le fichier";
    toast({ title: "Erreur", description: msg, variant: "destructive" });
  }
  setLoading(false);
}
