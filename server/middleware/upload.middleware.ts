import multer from "multer";
import path from "path";
import fs from "fs";
import { objectStorageClient } from "../replit_integrations/object_storage";
import { logger } from "../lib/logger";

export const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

export const chatUploadsDir = path.join(process.cwd(), "uploads", "chat");
if (!fs.existsSync(chatUploadsDir)) fs.mkdirSync(chatUploadsDir, { recursive: true });

const chatFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chatUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `chat-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const chatUpload = multer({
  storage: chatFileStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Format non supporté. PDF ou image uniquement."));
  },
});

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});

export const upload = multer({
  storage: mediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    const allowed = /\.(jpeg|jpg|png|webp|heic|heif)$/i;
    cb(null, allowed.test(file.originalname));
  },
});

export const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const imageExts = /jpeg|jpg|png|webp/;
    const videoExts = /mp4|webm|mov/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const isImage = imageExts.test(ext) && file.mimetype.startsWith("image/");
    const isVideo = videoExts.test(ext) && file.mimetype.startsWith("video/");
    cb(null, isImage || isVideo);
  },
});

export function buildUploadUrl(req: any, filename: string): string {
  const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0].trim() || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string)?.split(",")[0].trim() || req.get("host") || "localhost:5000";
  return `${proto}://${host}/uploads/${filename}`;
}

export async function uploadToCloudStorage(localFilePath: string, filename: string, contentType: string): Promise<string> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    logger.warn("Object Storage non configuré, fallback vers /uploads/");
    return `/uploads/${filename}`;
  }
  try {
    const bucket = objectStorageClient.bucket(bucketId);
    const destPath = `public/uploads/${filename}`;
    await bucket.upload(localFilePath, {
      destination: destPath,
      metadata: { contentType },
    });
    try { fs.unlinkSync(localFilePath); } catch {}
    return `/cloud/${destPath}`;
  } catch (err) {
    logger.error("Cloud upload failed, keeping local", err);
    return `/uploads/${filename}`;
  }
}

export function cleanupChatFiles(): void {
  try {
    if (!fs.existsSync(chatUploadsDir)) return;
    const files = fs.readdirSync(chatUploadsDir);
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let deleted = 0;
    for (const f of files) {
      const fp = path.join(chatUploadsDir, f);
      try {
        const stat = fs.statSync(fp);
        if (now - stat.mtimeMs > fiveDaysMs) {
          fs.unlinkSync(fp);
          deleted++;
        }
      } catch {}
    }
    if (deleted > 0) logger.info(`🗑️ Chat cleanup: ${deleted} fichier(s) supprimé(s)`);
  } catch (e) {
    logger.warn("Chat cleanup error", e);
  }
}
