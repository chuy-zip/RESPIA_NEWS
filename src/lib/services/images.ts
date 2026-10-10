import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ImageProvenance, ImageUploadResult, PublishImageInput } from "@/types/news";

/**
 * Fotos que sube el administrador desde el portal (RF-17).
 *
 * Se guardan en el bucket público `article-images`
 * (supabase/migrations/002_storage_article_images.sql). Solo un administrador
 * puede escribir en él: la política del bucket lo vuelve a comprobar.
 */

const BUCKET = "article-images";
const UPLOADS = "uploads";

/**
 * Vercel rechaza peticiones de más de 4.5 MB antes de llegar a la ruta, aunque el
 * bucket acepte 5 MB. Con 4 MB el límite es el mismo en local y en producción.
 */
const MAX_BYTES = 4 * 1024 * 1024;

const ascii = (bytes: Uint8Array, start: number, end: number) => new TextDecoder("latin1").decode(bytes.subarray(start, end));

const TYPES: Record<string, { extension: string; matches: (bytes: Uint8Array) => boolean }> = {
  "image/png": { extension: "png", matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/jpeg": { extension: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/webp": {
    extension: "webp",
    matches: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
  },
};

export class ImageValidationError extends Error {
  constructor(readonly fields: Record<string, string>) {
    super("Revisa la imagen.");
    this.name = "ImageValidationError";
  }
}

/** El bucket no respondió. La ruta lo traduce a 503 sin mostrar el detalle. */
export class ImageStoreError extends Error {
  constructor(cause: unknown) {
    super("No se pudo guardar la imagen.", { cause });
    this.name = "ImageStoreError";
  }
}

/**
 * Guarda la foto con un nombre nuevo y devuelve su referencia. El nombre original
 * del archivo no se usa: puede traer datos personales o caracteres no válidos.
 */
export async function uploadImage(file: unknown): Promise<ImageUploadResult> {
  if (!(file instanceof File)) {
    throw new ImageValidationError({ file: "Selecciona una imagen." });
  }

  const type = TYPES[file.type];
  if (!type) {
    throw new ImageValidationError({ file: "La imagen debe ser PNG, JPEG o WebP." });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    throw new ImageValidationError({ file: "La imagen debe pesar 4 MB como máximo." });
  }

  // El tipo lo declara el navegador. Los primeros bytes confirman que el archivo es de verdad esa imagen.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!type.matches(bytes)) {
    throw new ImageValidationError({ file: "El archivo no es una imagen válida." });
  }

  const uploadId = `${crypto.randomUUID()}.${type.extension}`;
  const path = `${UPLOADS}/${uploadId}`;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    throw new ImageStoreError(error);
  }

  return { uploadId, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Forma de un `uploadId` que devolvió `uploadImage`: un UUID y una extensión admitida. */
const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

export const isUploadId = (value: string) => UPLOAD_ID.test(value);

/** La foto no está en el bucket. Al publicar se informa como error del campo. */
export class UploadNotFoundError extends Error {
  constructor() {
    super("La imagen no existe. Súbela de nuevo.");
    this.name = "UploadNotFoundError";
  }
}

/**
 * Convierte la foto subida en la procedencia que se guarda en la noticia. La URL
 * sale del `uploadId`, nunca del cliente: así nadie apunta a una imagen de otro
 * sitio. Solo una foto del hecho se presenta como tal (RF-18).
 */
export async function resolveUploadedImage(input: PublishImageInput): Promise<ImageProvenance> {
  const supabase = await createClient();
  const url = supabase.storage.from(BUCKET).getPublicUrl(`${UPLOADS}/${input.uploadId}`).data.publicUrl;

  // El bucket es público y no permite listar: pedir el archivo es la forma de saber si existe.
  const response = await fetch(url, { method: "HEAD", cache: "no-store" });
  if (response.status === 400 || response.status === 404) {
    throw new UploadNotFoundError();
  }
  if (!response.ok) {
    throw new ImageStoreError(new Error(`El bucket respondió ${response.status}`));
  }

  return {
    url,
    alt: input.alt,
    origin: input.origin,
    sourceUrl: null,
    author: input.author,
    license: input.license,
    label: input.origin === "event_photo" ? "Fotografía del hecho" : "Imagen ilustrativa",
  };
}
