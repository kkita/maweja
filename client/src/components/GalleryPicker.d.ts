interface GalleryPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    filter?: "image" | "video" | "all";
}
export default function GalleryPicker({ open, onClose, onSelect, filter }: GalleryPickerProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=GalleryPicker.d.ts.map