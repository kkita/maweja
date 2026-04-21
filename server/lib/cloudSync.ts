import path from "path";
import fs from "fs";
import { objectStorageClient } from "../replit_integrations/object_storage";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function normalizeUploadUrls(): Promise<void> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const uploadsPattern = '%/uploads/%';
    const cloudPattern = '%/cloud/%';
    const queries = [
      `UPDATE service_categories SET image_url = '/uploads/' || substring(image_url from '.*/uploads/(.*)$') WHERE image_url LIKE '${uploadsPattern}' AND image_url NOT LIKE '/uploads/%' AND image_url NOT LIKE '/cloud/%'`,
      `UPDATE service_catalog_items SET image_url = '/uploads/' || substring(image_url from '.*/uploads/(.*)$') WHERE image_url LIKE '${uploadsPattern}' AND image_url NOT LIKE '/uploads/%' AND image_url NOT LIKE '/cloud/%'`,
      `UPDATE restaurants SET image = '/uploads/' || substring(image from '.*/uploads/(.*)$') WHERE image LIKE '${uploadsPattern}' AND image NOT LIKE '/uploads/%' AND image NOT LIKE '/cloud/%'`,
      `UPDATE menu_items SET image = '/uploads/' || substring(image from '.*/uploads/(.*)$') WHERE image LIKE '${uploadsPattern}' AND image NOT LIKE '/uploads/%' AND image NOT LIKE '/cloud/%'`,
      `UPDATE users SET profile_photo_url = '/uploads/' || substring(profile_photo_url from '.*/uploads/(.*)$') WHERE profile_photo_url LIKE '${uploadsPattern}' AND profile_photo_url NOT LIKE '/uploads/%' AND profile_photo_url NOT LIKE '/cloud/%'`,
      `UPDATE users SET id_photo_url = '/uploads/' || substring(id_photo_url from '.*/uploads/(.*)$') WHERE id_photo_url LIKE '${uploadsPattern}' AND id_photo_url NOT LIKE '/uploads/%' AND id_photo_url NOT LIKE '/cloud/%'`,
      `UPDATE advertisements SET media_url = '/uploads/' || substring(media_url from '.*/uploads/(.*)$') WHERE media_url LIKE '${uploadsPattern}' AND media_url NOT LIKE '/uploads/%' AND media_url NOT LIKE '/cloud/%'`,
      `UPDATE service_categories SET image_url = '/cloud/' || substring(image_url from '.*/cloud/(.*)$') WHERE image_url LIKE '${cloudPattern}' AND image_url NOT LIKE '/cloud/%'`,
      `UPDATE restaurants SET image = '/cloud/' || substring(image from '.*/cloud/(.*)$') WHERE image LIKE '${cloudPattern}' AND image NOT LIKE '/cloud/%'`,
      `UPDATE menu_items SET image = '/cloud/' || substring(image from '.*/cloud/(.*)$') WHERE image LIKE '${cloudPattern}' AND image NOT LIKE '/cloud/%'`,
      `UPDATE users SET profile_photo_url = '/cloud/' || substring(profile_photo_url from '.*/cloud/(.*)$') WHERE profile_photo_url LIKE '${cloudPattern}' AND profile_photo_url NOT LIKE '/cloud/%'`,
      `UPDATE users SET id_photo_url = '/cloud/' || substring(id_photo_url from '.*/cloud/(.*)$') WHERE id_photo_url LIKE '${cloudPattern}' AND id_photo_url NOT LIKE '/cloud/%'`,
      `UPDATE advertisements SET media_url = '/cloud/' || substring(media_url from '.*/cloud/(.*)$') WHERE media_url LIKE '${cloudPattern}' AND media_url NOT LIKE '/cloud/%'`,
    ];
    let fixed = 0;
    for (const q of queries) {
      const r = await pool.query(q);
      fixed += r.rowCount || 0;
    }
    await pool.end();
    if (fixed > 0) console.log(`🔧 Normalized ${fixed} absolute upload URLs → relative paths`);
  } catch (err) {
    console.error("URL normalization error:", err);
  }
}

export async function syncLocalUploadsToCloud(): Promise<void> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    console.log("⚠️ Object Storage non configuré, images locales uniquement");
    return;
  }
  try {
    if (!fs.existsSync(uploadsDir)) return;
    const files = fs.readdirSync(uploadsDir).filter(f => /\.(png|jpg|jpeg|webp|mp4|webm|mov)$/i.test(f));
    if (files.length === 0) return;

    const bucket = objectStorageClient.bucket(bucketId);
    let uploaded = 0;

    for (const filename of files) {
      const destPath = `public/uploads/${filename}`;
      try {
        const [exists] = await bucket.file(destPath).exists();
        if (exists) continue;
        const filePath = path.join(uploadsDir, filename);
        const ext = path.extname(filename).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
          '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
        };
        await bucket.upload(filePath, { destination: destPath, metadata: { contentType: mimeMap[ext] || 'application/octet-stream' } });
        uploaded++;
      } catch (err) {
        console.error(`❌ Sync failed for ${filename}:`, err);
      }
    }

    if (uploaded > 0) console.log(`☁️ ${uploaded} images synchronisées vers le cloud`);

    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const [cloudFiles] = await bucket.getFiles({ prefix: 'public/uploads/' });
    const cloudFileNames = new Set(cloudFiles.map((f: any) => f.name.replace('public/uploads/', '')));

    const tables = [
      { table: 'service_categories', col: 'image_url' },
      { table: 'service_catalog_items', col: 'image_url' },
      { table: 'restaurants', col: 'image' },
      { table: 'menu_items', col: 'image' },
      { table: 'advertisements', col: 'media_url' },
      { table: 'users', col: 'profile_photo_url' },
      { table: 'users', col: 'id_photo_url' },
    ];
    let updated = 0;
    for (const { table, col } of tables) {
      const rows = await pool.query(`SELECT id, ${col} as url FROM ${table} WHERE ${col} LIKE '/uploads/%'`);
      for (const row of rows.rows) {
        const filename = row.url.replace('/uploads/', '');
        if (cloudFileNames.has(filename)) {
          await pool.query(`UPDATE ${table} SET ${col} = $1 WHERE id = $2`, [`/cloud/public/uploads/${filename}`, row.id]);
          updated++;
        }
      }
    }
    await pool.end();
    if (updated > 0) console.log(`🔗 ${updated} URLs mises à jour vers le cloud`);
  } catch (err) {
    console.error("❌ Cloud sync error:", err);
  }
}
