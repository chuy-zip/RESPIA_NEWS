import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ImagePreviewResult,
  ImageProvenance,
  ImageUploadResult,
  PublishImageInput,
  PublishStockImageInput,
  StockImageCandidate,
} from "@/types/news";

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

// Imágenes de banco (RF-17, D-23, D-33) -----------------------------------------

const PIXABAY_API = "https://pixabay.com/api/";
const PIXABAY_LICENSE = "Pixabay Content License";
const PIXABAY_LICENSE_URL = "https://pixabay.com/service/license-summary/";
const STOCK = "stock";
const CANDIDATES = 12;
const MAX_QUERY = 100;
const DAY_SECONDS = 24 * 60 * 60;
// La copia va al bucket, que admite 5 MB por archivo.
const MAX_STOCK_BYTES = 5 * 1024 * 1024;

/** RT-05: Pixabay marca con esta etiqueta las imágenes generadas con IA (D-33). */
const AI_TAG = /\bai generad[oa]\b|\bai generated\b/i;

interface PixabayHit {
  id: number;
  pageURL: string;
  type: StockImageCandidate["type"];
  tags: string;
  webformatURL: string;
  largeImageURL: string;
  user: string;
}

/** Falta la llave o Pixabay no respondió. La ruta lo traduce a 503. */
export class StockUnavailableError extends Error {
  constructor(cause: unknown) {
    super("No se pudo consultar el banco de imágenes.", { cause });
    this.name = "StockUnavailableError";
  }
}

/** La imagen elegida no existe en Pixabay o no se puede publicar. Al publicar se informa como error del campo. */
export class StockImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockImageError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Pide a Pixabay. Devuelve null si Pixabay responde 400, que es como contesta a un id que no existe. */
async function pixabay(params: Record<string, string>): Promise<PixabayHit[] | null> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    throw new StockUnavailableError(new Error("Falta PIXABAY_API_KEY"));
  }

  const url = `${PIXABAY_API}?${new URLSearchParams({ key, lang: "es", safesearch: "true", ...params })}`;
  let response: Response;
  try {
    // D-33: la misma búsqueda se reutiliza 24 horas. El límite de Pixabay es compartido por todo el equipo.
    response = await fetch(url, { next: { revalidate: DAY_SECONDS } });
  } catch (failure) {
    throw new StockUnavailableError(failure);
  }

  if (response.status === 400) return null;
  if (!response.ok) {
    throw new StockUnavailableError(new Error(`Pixabay respondió ${response.status}`));
  }
  const body = (await response.json()) as { hits?: PixabayHit[] };
  return body.hits ?? [];
}

const tagList = (tags: string) => tags.split(",").map((tag) => tag.trim()).filter(Boolean);

/** Lee el cuerpo de POST /api/admin/images/preview. */
export function validatePreviewInput(raw: unknown): string {
  const query = isRecord(raw) && typeof raw.query === "string" ? raw.query.trim() : "";
  if (query.length < 2 || query.length > MAX_QUERY) {
    throw new ImageValidationError({ query: `Escribe de 2 a ${MAX_QUERY} caracteres para buscar.` });
  }
  return query;
}

/** Candidatas de Pixabay para una noticia sin foto. Ninguna está marcada como generada con IA. */
export async function searchStockImages(query: string): Promise<ImagePreviewResult> {
  const hits = (await pixabay({ q: query, per_page: String(CANDIDATES) })) ?? [];

  const candidates: StockImageCandidate[] = hits
    .filter((hit) => !AI_TAG.test(hit.tags))
    .map((hit) => ({
      id: hit.id,
      type: hit.type,
      tags: tagList(hit.tags),
      previewUrl: hit.webformatURL,
      author: hit.user,
      pageUrl: hit.pageURL,
    }));

  // `elegirImagen` (parte de IA) todavía no existe: el administrador elige sin sugerencia.
  return { source: "Pixabay", license: PIXABAY_LICENSE, licenseUrl: PIXABAY_LICENSE_URL, candidates, suggestedId: null };
}

/**
 * Copia al bucket la imagen de banco elegida y arma su procedencia. Los datos
 * salen de Pixabay, no del cliente, y la copia evita una imagen rota si Pixabay
 * la retira (D-33). Una imagen de banco nunca es foto del hecho (RF-18).
 */
export async function resolveStockImage(input: PublishStockImageInput): Promise<ImageProvenance> {
  const hit = (await pixabay({ id: String(input.pixabayId) }))?.[0];
  if (!hit) {
    throw new StockImageError("La imagen ya no está en Pixabay. Elige otra.");
  }
  if (AI_TAG.test(hit.tags)) {
    throw new StockImageError("La imagen está marcada como generada con IA. Elige otra.");
  }

  let bytes: Uint8Array;
  let contentType: string;
  try {
    const response = await fetch(hit.largeImageURL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Pixabay respondió ${response.status} al descargar`);
    contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    bytes = new Uint8Array(await response.arrayBuffer());
  } catch (failure) {
    throw new StockUnavailableError(failure);
  }

  const type = TYPES[contentType];
  if (!type || !type.matches(bytes) || bytes.length > MAX_STOCK_BYTES) {
    throw new StockImageError("No se pudo usar esta imagen. Elige otra.");
  }

  const path = `${STOCK}/${crypto.randomUUID()}.${type.extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (error) {
    throw new ImageStoreError(error);
  }

  return {
    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    alt: input.alt,
    origin: "stock",
    sourceUrl: hit.pageURL,
    author: hit.user,
    license: PIXABAY_LICENSE,
    label: "Imagen ilustrativa",
  };
}
