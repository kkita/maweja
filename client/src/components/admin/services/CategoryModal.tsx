import { useState, useRef, useEffect } from "react";
import {
  X, Plus, Check, Loader2, ImageIcon, GalleryHorizontal, Upload,
  GripVertical, FileText,
} from "lucide-react";
import type { ServiceCategory } from "@shared/schema";
import { useToast } from "../../../hooks/use-toast";
import GalleryPicker from "../../GalleryPicker";
import ImportUrlToGallery from "../../ImportUrlToGallery";
import { palette } from "../../../design-system/tokens";
import { SERVICE_ICONS, LOGOS, type CustomField } from "./constants";
import { uploadServiceImage } from "./uploadHelpers";
import type { Translations } from "../../../lib/i18n";

const EMOJIS = ["💼","🏨","🚗","✨","📦","🎉","🔧","🚴","❓","✂️","💅","💆","🧹","🍽️","🛒","🏠","🌟","💡"];

export type CategoryFormData = {
  name: string;
  icon: string;
  imageUrl: string | null;
  description: string;
  serviceTypes: string[];
  customFields: CustomField[];
  showBudget: boolean;
};

type CategoryExtras = { customFields?: CustomField[] | null; showBudget?: boolean | null };

export default function CategoryModal({
  open, editingCat, t, onClose, onSubmit,
}: {
  open: boolean;
  editingCat: ServiceCategory | null;
  t: Translations;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Briefcase");
  const [imageUrl, setImageUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showBudget, setShowBudget] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragFieldIdx, setDragFieldIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editingCat) {
      setName(editingCat.name);
      setIcon(editingCat.icon);
      setImageUrl(editingCat.imageUrl || "");
      setDesc(editingCat.description);
      setServiceTypes(editingCat.serviceTypes || []);
      const extras = editingCat as ServiceCategory & CategoryExtras;
      setCustomFields(extras.customFields || []);
      setShowBudget(!!extras.showBudget);
    } else {
      setName(""); setIcon("Briefcase"); setImageUrl(""); setDesc("");
      setServiceTypes([]); setCustomFields([]); setShowBudget(false);
    }
    setNewTypeInput(""); setShowImagePicker(false);
  }, [open, editingCat?.id]);

  if (!open) return null;

  const addServiceType = () => {
    const v = newTypeInput.trim();
    if (v && !serviceTypes.includes(v)) setServiceTypes([...serviceTypes, v]);
    setNewTypeInput("");
  };
  const removeServiceType = (idx: number) => setServiceTypes(serviceTypes.filter((_, i) => i !== idx));

  const submit = () => {
    if (!name.trim()) {
      toast({ title: "Champ requis", description: "Le nom de la catégorie est obligatoire", variant: "destructive" });
      return;
    }
    onSubmit({ name, icon, imageUrl: imageUrl || null, description: desc, serviceTypes, customFields, showBudget });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]" data-testid="modal-category">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{editingCat ? t.admin.editCategory : t.admin.newCategory}</h3>
          <button onClick={() => { onClose(); setShowImagePicker(false); }} className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.categoryName}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              data-testid="input-cat-name"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Image de la catégorie</label>

            <button
              type="button"
              onClick={() => setShowImagePicker(v => !v)}
              data-testid="button-pick-image"
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-left transition-all hover:border-red-300 hover:bg-red-50 dark:hover:bg-zinc-700 active:scale-[0.98]"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="aperçu" className="w-10 h-10 object-contain rounded-lg bg-white border border-zinc-100 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={18} className="text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {imageUrl ? "Image sélectionnée" : "Choisir une image"}
                </p>
                {imageUrl && <p className="text-[10px] text-zinc-400 truncate font-mono">{imageUrl}</p>}
              </div>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                {showImagePicker ? "Fermer" : "Changer"}
              </span>
            </button>

            {showImagePicker && (
              <div className="mt-2 p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-lg">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Icônes de services</p>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {SERVICE_ICONS.map(item => (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => { setImageUrl(item.url); setShowImagePicker(false); }}
                      data-testid={`pick-img-${item.name.toLowerCase()}`}
                      title={item.name}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-zinc-50 dark:bg-zinc-700"
                      style={{
                        borderColor: imageUrl === item.url ? palette.chart.primary : "transparent",
                        boxShadow: imageUrl === item.url ? `0 0 0 1px ${palette.chart.primary}` : "none",
                      }}
                    >
                      <img src={item.url} alt={item.name} className="w-8 h-8 object-contain" />
                      {imageUrl === item.url && (
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center">
                          <Check size={8} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Logos MAWEJA</p>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {LOGOS.map(item => (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => { setImageUrl(item.url); setShowImagePicker(false); }}
                      data-testid={`pick-img-${item.name.replace(/\s+/g, "-").toLowerCase()}`}
                      title={item.name}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-zinc-50 dark:bg-zinc-700"
                      style={{
                        borderColor: imageUrl === item.url ? palette.chart.primary : "transparent",
                        boxShadow: imageUrl === item.url ? `0 0 0 1px ${palette.chart.primary}` : "none",
                      }}
                    >
                      <img src={item.url} alt={item.name} className="w-8 h-8 object-contain" />
                      {imageUrl === item.url && (
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center">
                          <Check size={8} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-700 pt-2 mt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowImagePicker(false); setGalleryOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                      data-testid="button-cat-gallery"
                    >
                      <GalleryHorizontal size={13} /> Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      data-testid="button-cat-upload-file"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                    >
                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {uploading ? "Upload..." : "Depuis l'appareil"}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) uploadServiceImage({ file: f, setUrl: setImageUrl, setLoading: setUploading, toast });
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => { setImageUrl(""); setShowImagePicker(false); }}
                      className="w-full py-1.5 text-[11px] font-bold text-zinc-500 hover:text-red-600 transition-colors border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    >
                      Supprimer l'image
                    </button>
                  )}
                </div>
              </div>
            )}
            <GalleryPicker
              open={galleryOpen}
              onClose={() => setGalleryOpen(false)}
              onSelect={url => setImageUrl(url)}
              filter="image"
            />

            {imageUrl && (
              <div className="mt-1">
                <ImportUrlToGallery url={imageUrl} onImported={url => setImageUrl(url)} size="sm" />
              </div>
            )}

            <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
              <ImageIcon size={10} /> Laissez sans image pour utiliser l'emoji ci-dessous
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.categoryIcon} (emoji si pas d'image)</label>
            <select value={icon} onChange={e => setIcon(e.target.value)}
              data-testid="select-cat-icon"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white">
              {EMOJIS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">{t.admin.categoryDesc}</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              data-testid="input-cat-desc"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white h-20 resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Types de service</label>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2">
              Ces types s'afficheront dans le formulaire client pour cette catégorie (ex: "Suite VIP", "Chambre double"...)
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTypeInput}
                onChange={e => setNewTypeInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addServiceType(); } }}
                placeholder="Ajouter un type..."
                data-testid="input-new-type"
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
              />
              <button
                type="button"
                onClick={addServiceType}
                disabled={!newTypeInput.trim()}
                data-testid="button-add-type"
                className="px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
            {serviceTypes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {serviceTypes.map((st, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold text-red-700 dark:text-red-300"
                  >
                    {st}
                    <button
                      type="button"
                      onClick={() => removeServiceType(idx)}
                      className="w-4 h-4 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center hover:bg-red-300 dark:hover:bg-red-700"
                      data-testid={`remove-type-${idx}`}
                    >
                      <X size={10} className="text-red-700 dark:text-red-300" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic">Aucun type ajouté — le client verra un champ texte libre</p>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl">
            <div>
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Afficher le champ "Budget estimatif"</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Le client pourra indiquer son budget lors de la demande</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
              <input
                type="checkbox"
                checked={showBudget}
                onChange={e => setShowBudget(e.target.checked)}
                data-testid="toggle-show-budget"
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-2 block flex items-center gap-2">
              <FileText size={14} />
              Champs personnalisés du formulaire
            </label>
            <p className="text-[10px] text-zinc-400 mb-3">Ces champs apparaîtront dans le formulaire de demande côté client</p>

            {customFields.map((field, idx) => (
              <div key={field.id} className="flex items-start gap-2 mb-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700"
                draggable
                onDragStart={() => setDragFieldIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragFieldIdx === null || dragFieldIdx === idx) return;
                  const copy = [...customFields];
                  const [moved] = copy.splice(dragFieldIdx, 1);
                  copy.splice(idx, 0, moved);
                  setCustomFields(copy);
                  setDragFieldIdx(null);
                }}
              >
                <div className="cursor-grab text-zinc-300 mt-1"><GripVertical size={14} /></div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={field.label}
                      onChange={e => {
                        const copy = [...customFields];
                        copy[idx] = { ...copy[idx], label: e.target.value };
                        setCustomFields(copy);
                      }}
                      placeholder="Nom du champ"
                      className="flex-1 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      data-testid={`field-label-${idx}`}
                    />
                    <select
                      value={field.type}
                      onChange={e => {
                        const copy = [...customFields];
                        copy[idx] = { ...copy[idx], type: e.target.value as CustomField["type"] };
                        setCustomFields(copy);
                      }}
                      className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      data-testid={`field-type-${idx}`}
                    >
                      <option value="text">Texte</option>
                      <option value="number">Nombre</option>
                      <option value="textarea">Zone de texte</option>
                      <option value="select">Liste déroulante</option>
                      <option value="date">Date</option>
                      <option value="photo">Photo</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      value={field.placeholder || ""}
                      onChange={e => {
                        const copy = [...customFields];
                        copy[idx] = { ...copy[idx], placeholder: e.target.value };
                        setCustomFields(copy);
                      }}
                      placeholder="Placeholder (optionnel)"
                      className="flex-1 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px]"
                    />
                    <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={e => {
                          const copy = [...customFields];
                          copy[idx] = { ...copy[idx], required: e.target.checked };
                          setCustomFields(copy);
                        }}
                        className="accent-red-600 w-3.5 h-3.5"
                      />
                      Requis
                    </label>
                  </div>
                  {field.type === "select" && (
                    <div>
                      <p className="text-[10px] text-zinc-400 mb-1">Options (séparées par virgule)</p>
                      <input
                        value={(field.options || []).join(", ")}
                        onChange={e => {
                          const copy = [...customFields];
                          copy[idx] = { ...copy[idx], options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                          setCustomFields(copy);
                        }}
                        placeholder="Option 1, Option 2, Option 3"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px]"
                        data-testid={`field-options-${idx}`}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                  className="w-6 h-6 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-800/40 mt-1"
                  data-testid={`remove-field-${idx}`}
                >
                  <X size={12} className="text-red-500" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setCustomFields([...customFields, { id: `f_${Date.now()}`, label: "", type: "text", required: false }])}
              className="w-full py-2 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-400 hover:border-red-300 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5"
              data-testid="button-add-custom-field"
            >
              <Plus size={14} /> Ajouter un champ
            </button>
          </div>

          <button onClick={submit} data-testid="button-save-category"
            className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700">
            {editingCat ? t.common.edit : t.common.create}
          </button>
        </div>
      </div>
    </div>
  );
}
