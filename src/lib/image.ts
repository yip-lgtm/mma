/**
 * Client-side image helpers for the upload-and-extract flow.
 *
 *  - Resize so the largest side is at most `maxSide` (default 1280px). Body
 *    composition screenshots and food photos don't need more than that for
 *    LLM extraction, and a smaller payload keeps the request fast.
 *  - Re-encode as JPEG at 0.85 quality — strips EXIF, fixes orientation, and
 *    base64 shrinks ~3x compared to a raw PNG screenshot.
 *  - Return a base64 string (no `data:` prefix) plus the mime type, ready to
 *    hand to a server function.
 */

export type CompressedImage = {
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  bytes: number;
};

const DEFAULT_MAX_SIDE = 1280;
const DEFAULT_QUALITY = 0.85;

export async function compressImageFile(
  file: File,
  opts: { maxSide?: number; quality?: number } = {},
): Promise<CompressedImage> {
  const maxSide = opts.maxSide ?? DEFAULT_MAX_SIDE;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  // createImageBitmap respects EXIF orientation flags, so the resulting
  // bitmap is already rotated correctly. Older browsers don't expose it,
  // fall back to <img>.
  let bitmap: ImageBitmap | HTMLImageElement;
  if (typeof createImageBitmap === "function") {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      bitmap = await loadViaImg(file);
    }
  } else {
    bitmap = await loadViaImg(file);
  }

  const srcW = "width" in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth;
  const srcH = "height" in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight;

  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx < 0) throw new Error("canvas produced unexpected data url");
  const base64 = dataUrl.slice(commaIdx + 1);

  // Rough byte size: 4 chars = 3 bytes in base64.
  const bytes = Math.floor((base64.length * 3) / 4);
  return { base64, mimeType: "image/jpeg", width: w, height: h, bytes };
}

function loadViaImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err instanceof Event ? new Error("image decode failed") : err);
    };
    img.src = url;
  });
}
