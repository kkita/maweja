import { useState, useRef, useEffect } from "react";
import { X, GalleryHorizontal, Upload, Loader2 } from "lucide-react";
import type { ServiceCategory, ServiceCatalogItem } from "@shared/schema";
import { useToast } from "../../../hooks/use-toast";
import GalleryPicker from "../../GalleryPicker";
import ImportUrlToGallery from "../../ImportUrlToGallery";
import { uploadServiceImage } from "./uploadHelpers";
import type { Translations } from "../../../lib/i18n";

export type CatalogItemFormData = {
  name: string;
  description: string;
  imageUrl: string | null;
  price: string | null;
  categoryId: number;
  isActive: boolean;
};

export default function ItemModal({
  open, editingItem, categories, t, onClose, onSubmit,
}: {
  open: boolean;
  editingItem: ServiceCatalogItem | null;
  categories: ServiceCategory[];
  t: Translations;
  onClose: () => void;
  onSubmit: (data: CatalogItemFormData) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setName(editingItem.name);
      setDesc(editingItem.description);
      setImage(editingItem.imageUrl);
      setPrice(editingItem.price || "");
      setCategoryId(editingItem.categoryId);
    } else {
      setName(""); setDesc(""); setImage(""); setPrice("");
      setCategoryId(categories.length > 0 ? categories[0].id : 0);
    }
  }, [open, editingItem?.id]);

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) {
      toast({ title: "Champ requis", description: "Le nom de l'article est obligatoire", variant: "destructive" });
      return;
    }
    if (!categoryId) {
      toast({ title: "Champ requis", description: "Sélectionnez une catégorie", variant: "destructive" });
      return;
    }
    onSubmit({
      name, description: desc, imageUrl: image || null, price: price || null,
      categoryId, isActive: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6" data-testid="modal-catalog-item">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{editingItem ? t.admin.editCatalogItem : t.admin.addCatalogItem}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.catalogCategory}</label>
            <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))}
              data-testid="select-item-category"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.catalogItemName}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              data-testid="input-item-name"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.catalogItemDesc}</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              data-testid="input-item-desc"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white h-16 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.catalogItemImage}</label>
            <div className="flex gap-2">
              <input type="url" value={image} onChange={e => setImage(e.target.value)}
                data-testid="input-item-image" placeholder="https://..."
                className="flex-1 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white" />
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                data-testid="button-item-gallery"
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors whitespace-nowrap"
              >
                <GalleryHorizontal size={14} /> Galerie
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                data-testid="button-item-upload-file"
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "..." : "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) uploadServiceImage({ file: f, setUrl: setImage, setLoading: setUploading, toast });
                  e.target.value = "";
                }}
              />
            </div>
            {image && (
              <div className="mt-2 space-y-1.5">
                <ImportUrlToGallery url={image} onImported={url => setImage(url)} size="md" />
                <img src={image} alt="preview" className="w-full h-32 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700" />
              </div>
            )}
            <GalleryPicker
              open={galleryOpen}
              onClose={() => setGalleryOpen(false)}
              onSelect={url => setImage(url)}
              filter="image"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.catalogItemPrice}</label>
            <input type="text" value={price} onChange={e => setPrice(e.target.value)}
              data-testid="input-item-price" placeholder="$25 - $50"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white" />
          </div>
          <button onClick={submit} data-testid="button-save-catalog-item"
            className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700">
            {editingItem ? t.common.edit : t.common.create}
          </button>
        </div>
      </div>
    </div>
  );
}
