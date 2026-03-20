import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetchJson, apiRequest } from "../../lib/queryClient";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../hooks/use-toast";
import {
  Images, Video, Trash2, Copy, Check, Search, ImagePlus,
  AlertTriangle, Wrench, ExternalLink, RefreshCw
} from "lucide-react";

interface GalleryFile {
  filename: string;
  url: string;
  type: "image" | "video";
  size: number;
  createdAt: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

type ViewMode = "grid" | "list";
type TabFilter = "all" | "image" | "video";

export default function AdminGallery() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);

  const { data: files = [], isLoading, refetch } = useQuery<GalleryFile[]>({
    queryKey: ["/api/admin/gallery"],
    queryFn: () => authFetchJson("/api/admin/gallery"),
  });

  const deleteMutation = useMutation({
    mutationFn: (filename: string) => apiRequest(`/api/admin/gallery/${encodeURIComponent(filename)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Fichier supprimé avec succès" });
    },
    onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
  });

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast({ title: "Lien copié !" });
    setTimeout(() => setCopiedUrl(null), 3000);
  };

  const handleFixUrls = async () => {
    setFixing(true);
    try {
      await apiRequest("/api/admin/gallery/fix-urls", { method: "POST" });
      toast({ title: "URLs restaurées avec succès", description: "Tous les chemins relatifs ont été convertis en URLs absolues." });
    } catch {
      toast({ title: "Erreur lors de la restauration", variant: "destructive" });
    } finally {
      setFixing(false);
    }
  };

  const displayed = files.filter(f => {
    const matchTab = activeTab === "all" || f.type === activeTab;
    const matchSearch = !search || f.filename.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const imageCount = files.filter(f => f.type === "image").length;
  const videoCount = files.filter(f => f.type === "video").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Images size={24} className="text-red-600" />
              Galerie Médias
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tous les fichiers uploadés sur le serveur MAWEJA
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              data-testid="gallery-refresh"
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
              Actualiser
            </button>
            <button
              onClick={handleFixUrls}
              disabled={fixing}
              data-testid="gallery-fix-urls"
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              <Wrench size={14} />
              {fixing ? "Restauration..." : "Restaurer les URLs cassées"}
            </button>
          </div>
        </div>

        {/* Fix URLs Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-200">Images cassées en production ?</p>
            <p className="text-amber-700 dark:text-amber-300 mt-0.5">
              Cliquez sur <strong>Restaurer les URLs cassées</strong> pour convertir tous les chemins relatifs{" "}
              (<code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">/uploads/…</code>) en URLs absolues{" "}
              (<code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">https://maweja.net/uploads/…</code>) dans la base de données.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total fichiers", value: files.length, sub: formatBytes(totalSize), color: "text-blue-600" },
            { label: "Images", value: imageCount, sub: "photos & logos", color: "text-green-600" },
            { label: "Vidéos", value: videoCount, sub: "fichiers mp4/webm", color: "text-purple-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {(["all", "image", "video"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                data-testid={`gallery-tab-${tab}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab === "all" ? "Tous" : tab === "image" ? "Images" : "Vidéos"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un fichier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white"
              data-testid="gallery-search"
            />
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
            {displayed.length} résultat{displayed.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-red-100 dark:bg-red-950 text-red-600" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              data-testid="gallery-view-grid"
              title="Vue grille"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-red-100 dark:bg-red-950 text-red-600" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              data-testid="gallery-view-list"
              title="Vue liste"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="14" height="2" rx="1"/>
                <rect x="1" y="12" width="14" height="2" rx="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
            <ImagePlus size={48} strokeWidth={1} />
            <div className="text-center">
              <p className="text-base font-medium">Aucun fichier trouvé</p>
              <p className="text-sm mt-1">Uploadez des images ou vidéos via les sections Publicités, Restaurants ou Services</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayed.map(file => (
              <div
                key={file.filename}
                className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                data-testid={`gallery-item-${file.filename}`}
              >
                {file.type === "image" ? (
                  <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-900">
                    <Video size={28} className="text-purple-400" />
                    <span className="text-white text-[10px] font-medium px-2 text-center leading-tight">{file.filename.slice(0, 30)}</span>
                    <span className="text-gray-400 text-[9px]">{formatBytes(file.size)}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
                    <p className="text-white text-[9px] font-medium text-center">{formatBytes(file.size)} · {formatDate(file.createdAt)}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCopy(file.url)}
                        className="flex-1 flex items-center justify-center gap-1 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[9px] font-bold rounded-lg"
                        data-testid={`gallery-copy-${file.filename}`}
                        title="Copier l'URL"
                      >
                        {copiedUrl === file.url ? <Check size={9} /> : <Copy size={9} />}
                        {copiedUrl === file.url ? "Copié!" : "Copier URL"}
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center p-1 bg-blue-500/70 hover:bg-blue-600 backdrop-blur-sm text-white rounded-lg"
                        title="Ouvrir"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink size={9} />
                      </a>
                      <button
                        onClick={() => { if (confirm("Supprimer ce fichier définitivement?")) deleteMutation.mutate(file.filename); }}
                        className="flex items-center justify-center p-1 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm text-white rounded-lg"
                        data-testid={`gallery-delete-${file.filename}`}
                        title="Supprimer"
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1.5 left-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow ${file.type === "video" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`}>
                    {file.type === "video" ? "VID" : "IMG"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {displayed.map(file => (
              <div
                key={file.filename}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                data-testid={`gallery-list-${file.filename}`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                  {file.type === "image" ? (
                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Video size={16} className="text-purple-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.filename}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{file.url}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatBytes(file.size)}</p>
                  <p className="text-xs text-gray-400">{formatDate(file.createdAt)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(file.url)}
                    data-testid={`gallery-list-copy-${file.filename}`}
                    className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {copiedUrl === file.url ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUrl === file.url ? "Copié" : "Copier"}
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => { if (confirm("Supprimer ce fichier définitivement?")) deleteMutation.mutate(file.filename); }}
                    data-testid={`gallery-list-delete-${file.filename}`}
                    className="flex items-center justify-center p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
