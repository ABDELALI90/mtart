export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MIN_UPLOAD_EDGE = 300;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export type UploadErrorCode = 'too-large' | 'too-small' | 'bad-type' | 'invalid';

export interface UploadMeta {
  size: number;
  type: string;
  name: string;
  width?: number;
  height?: number;
}

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

export function validateUploadMeta(meta: UploadMeta): { ok: true } | { ok: false; code: UploadErrorCode } {
  const ext = fileExtension(meta.name);
  const mime = (meta.type || '').toLowerCase();
  const typeOk = ALLOWED_MIME.has(mime) || ALLOWED_EXT.has(ext);
  if (!typeOk) {
    return { ok: false, code: 'bad-type' };
  }
  if (meta.size > MAX_UPLOAD_BYTES) {
    return { ok: false, code: 'too-large' };
  }
  if (meta.width != null && meta.height != null && Math.min(meta.width, meta.height) < MIN_UPLOAD_EDGE) {
    return { ok: false, code: 'too-small' };
  }
  return { ok: true };
}

export function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('invalid'));
    };
    image.src = url;
  });
}

export async function validateUploadFile(file: File): Promise<{ ok: true } | { ok: false; code: UploadErrorCode }> {
  const typeCheck = validateUploadMeta({ size: file.size, type: file.type, name: file.name });
  if (!typeCheck.ok) {
    return typeCheck;
  }
  try {
    const size = await readImageSize(file);
    return validateUploadMeta({ size: file.size, type: file.type, name: file.name, ...size });
  } catch {
    return { ok: false, code: 'invalid' };
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? '');
      const comma = value.indexOf(',');
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error('invalid'));
    reader.readAsDataURL(file);
  });
}
