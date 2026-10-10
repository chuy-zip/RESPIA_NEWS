/**
 * Tipos de una noticia (RF-16) y del catálogo editorial.
 *
 * Siguen el contrato que propuso Frontend en notion-frontend.md («Tipos
 * propuestos para coordinar»), para que el portal y el lector cambien la demo
 * por el servicio sin traducir nombres. La UI traduce los valores a etiquetas
 * en español.
 */

/** Cuánto se sabe que la noticia es cierta. Lo asigna solo una persona (RT-04). */
export type EditorialStatus = "confirmed" | "developing" | "unconfirmed";

/** Quién produjo el texto (RT-02). */
export type ContentType = "original" | "summary" | "ai_contribution";

/**
 * De dónde sale la imagen (RF-18).
 * - event_photo: foto real del hecho, subida por el administrador.
 * - illustrative: foto propia que no es del hecho, por ejemplo de archivo.
 * - stock: foto de un banco, recomendada para una noticia sin imagen (D-23).
 * Solo event_photo se muestra como fotografía del hecho. Las otras llevan la
 * etiqueta «Imagen ilustrativa».
 */
export type ImageOrigin = "event_photo" | "illustrative" | "stock";

/** Región o tema. El id se guarda, el slug va en la URL y el label se muestra. */
export interface CatalogItem {
  id: string;
  slug: string;
  label: string;
}

/** Respuesta de GET /api/catalogs: las opciones válidas las define el servidor. */
export interface CatalogData {
  regions: CatalogItem[];
  topics: CatalogItem[];
  statuses: EditorialStatus[];
  contentTypes: ContentType[];
}

export interface CatalogResponse {
  data: CatalogData;
  meta: Record<string, never>;
}

/** Texto plano: el lector nunca recibe HTML. */
export interface ContentBlock {
  type: "paragraph" | "heading";
  text: string;
}

export interface Source {
  name: string;
  /** HTTP(S). El servidor la valida antes de guardarla. */
  url: string;
}

export interface ImageProvenance {
  url: string;
  alt: string;
  origin: ImageOrigin;
  /** Página de la foto en el banco. null en una foto subida. */
  sourceUrl: string | null;
  author: string;
  license: string;
  /** Texto visible, por ejemplo «Imagen ilustrativa». */
  label: string;
}

/** Respuesta de POST /api/admin/images: una foto subida que todavía no está en una noticia. */
export interface ImageUploadResult {
  /** Referencia para publicar la noticia con esta foto. */
  uploadId: string;
  /** URL pública, para la vista previa del portal. */
  url: string;
}

export interface ImageUploadResponse {
  data: ImageUploadResult;
  meta: Record<string, never>;
}

/** Lo que muestran las listas: portal, feed y búsqueda. */
export interface ArticleSummary {
  id: string;
  title: string;
  summary: string;
  topicIds: string[];
  /** ISO 8601. */
  publishedAt: string;
  status: EditorialStatus;
  contentType: ContentType;
  image: ImageProvenance | null;
}

/** Respuesta de GET /api/articles/[id]. Solo noticias publicadas. */
export interface ArticleDetail extends ArticleSummary {
  author: string | null;
  regionIds: string[];
  body: ContentBlock[];
  sources: Source[];
  /** Explica por qué la noticia tiene su estado (RT-03). */
  reviewNote: string;
  /** El recomendador la usa para no ocultar lo importante (RF-11, D-31). */
  important: boolean;
}

/**
 * Foto subida por el administrador, con la procedencia que solo él conoce. La
 * URL no viaja: el servidor la arma con `uploadId`.
 */
export interface PublishImageInput {
  uploadId: string;
  /** Descripción para lectores de pantalla. */
  alt: string;
  author: string;
  license: string;
  origin: "event_photo" | "illustrative";
}

/** Cuerpo de POST /api/admin/articles. El servidor valida cada campo. */
export interface PublishArticleInput {
  title: string;
  summary: string;
  body: ContentBlock[];
  sources: Source[];
  publishedAt: string;
  topicIds: string[];
  regionIds: string[];
  status: EditorialStatus;
  contentType: ContentType;
  reviewNote: string;
  important: boolean;
  /** Foto subida con POST /api/admin/images, o null si la noticia va sin imagen. */
  image: PublishImageInput | null;
  /** Una persona revisó la noticia antes de publicar (RT-04). */
  reviewConfirmed: true;
}

/** Respuesta de POST /api/admin/articles. */
export interface PublicationResult {
  id: string;
  publicationState: "published";
}

/** Respuesta de GET /api/articles/[id]. */
export interface ArticleDetailResponse {
  data: ArticleDetail;
  meta: Record<string, never>;
}

/** Respuesta de GET /api/admin/articles. */
export interface ArticleListResponse {
  data: { items: ArticleSummary[] };
  meta: PageMeta;
}

export interface PublicationResponse {
  data: PublicationResult;
  meta: Record<string, never>;
}

/** Paginación de los listados. null indica que no hay otra página. */
export interface PageMeta {
  nextCursor: string | null;
}
