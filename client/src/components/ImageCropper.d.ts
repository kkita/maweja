interface ImageCropperProps {
    file: File;
    aspectRatio?: number;
    maxSizeKB?: number;
    onCrop: (croppedFile: File) => void;
    onCancel: () => void;
}
export declare function validateImageFile(file: File): string | null;
export default function ImageCropper({ file, aspectRatio, maxSizeKB, onCrop, onCancel, }: ImageCropperProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ImageCropper.d.ts.map