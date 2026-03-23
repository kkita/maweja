interface ImportUrlToGalleryProps {
    url: string;
    onImported: (newUrl: string) => void;
    size?: "sm" | "md";
}
/**
 * Button that downloads an external image/video URL to the server gallery.
 * Shows only when the URL is not already on the local server (not /uploads/ and not same-origin).
 */
export default function ImportUrlToGallery({ url, onImported, size }: ImportUrlToGalleryProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ImportUrlToGallery.d.ts.map