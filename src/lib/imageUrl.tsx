// src/lib/imageUrl.ts
//
// Server layout at oms.seerweberp.com (cPanel hosting):
//
//   oms.seerweberp.com/          ← actual web document root
//     backend/
//       public/                  ← CodeIgniter public folder (NOT the web root)
//         uploads/
//           exalogic-consulting/
//           filename.jpg
//     api/
//       uploads/                 ← old flat uploads
//
// The web document root is oms.seerweberp.com/ itself, so:
//
//   File at:   backend/public/uploads/exalogic-consulting/photo.jpg
//   Browser:   https://oms.seerweberp.com/backend/public/uploads/exalogic-consulting/photo.jpg
//
// We use a rewrite-free approach — just prefix with /backend/public/
// No .htaccess changes needed.

import { apiUrl } from "@/url";

const BASE_URL = apiUrl.replace(/\/api\/?$/, "");
// "https://oms.seerweberp.com/api" → "https://oms.seerweberp.com"

/**
 * Prefix added between BASE_URL and the DB-stored path.
 * Set to "/backend/public" because backend/public/ is NOT the web root
 * on this cPanel server — it's a subfolder of the domain root.
 */
const UPLOAD_PREFIX = "/backend/public";

/**
 * Build a browser-accessible image URL.
 *
 * DB stores:   "uploads/exalogic-consulting/photo.jpg"
 * Returns:     "https://oms.seerweberp.com/backend/public/uploads/exalogic-consulting/photo.jpg"
 *
 * Legacy flat paths also work:
 * DB stores:   "uploads/oldphoto.jpg"
 * Returns:     "https://oms.seerweberp.com/backend/public/uploads/oldphoto.jpg"
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const cleanPath = imagePath.replace(/^\/+/, "");
  return `${BASE_URL}${UPLOAD_PREFIX}/${cleanPath}`;
}
