// Datos ficticios de presentación. No representan contratos ni resultados del backend.
export type Topic = "Tecnología" | "Economía" | "Finanzas";
export type Region = "Guatemala" | "México" | "Estados Unidos";
export type EditorialStatus = "confirmed" | "developing" | "unconfirmed";
export type Prominence = "hero" | "large" | "standard" | "compact";
export type Visual = "network" | "trade" | "orbit";
export type PreviewState = "ready" | "loading" | "empty" | "error" | "offline" | "limit";

export type ArticleBlock = { type: "paragraph" | "heading"; text: string };

export interface DemoArticle {
  id: string;
  title: string;
  summary: string;
  body: ArticleBlock[];
  byline: string;
  topic: Topic;
  regions: Region[];
  status: EditorialStatus;
  date: string;
  contentType: "Original" | "Resumen" | "Aporte de IA";
  sources: { name: string; url: string }[];
  visual: Visual;
  important: boolean;
  reviewNote: string;
}

export interface DemoMessage {
  id: string;
  role: "reader" | "assistant";
  text: string;
  articleIds: string[];
}

export const REGIONS: Region[] = ["Guatemala", "México", "Estados Unidos"];
export const DEMO_TOPICS: { slug: string; label: Topic; description: string }[] = [
  { slug: "tecnologia", label: "Tecnología", description: "Las ideas, las redes y las personas que transforman nuestra forma de vivir." },
  { slug: "economia", label: "Economía", description: "Las conexiones entre los grandes cambios y la vida de nuestras regiones." },
  { slug: "finanzas", label: "Finanzas", description: "El capital, sus decisiones y el contexto necesario para entenderlas." },
];
export const TOPICS: Topic[] = DEMO_TOPICS.map((topic) => topic.label);
export const STATUS_LABELS: Record<EditorialStatus, string> = {
  confirmed: "Confirmado",
  developing: "En desarrollo",
  unconfirmed: "No confirmado",
};
export const PREVIEW_LABELS: Record<PreviewState, string> = {
  ready: "Contenido", loading: "Carga", empty: "Vacío",
  error: "Error", offline: "Sin conexión", limit: "Límite de IA",
};

const source = { name: "Redacción de ejemplo · fuente ficticia", url: "https://example.org/" };
const note = "Caso editorial ficticio para revisar la interfaz. No describe acontecimientos reales.";

const ARTICLE_FIXTURES: (Omit<DemoArticle, "body" | "byline"> & { body: string[] })[] = [
  {
    id: "infraestructura-ia", title: "La próxima frontera de la IA también se construye fuera de las pantallas",
    summary: "Energía, redes y talento: tres piezas de una infraestructura que conecta la tecnología global con las economías locales.",
    body: ["En este escenario ficticio, una empresa de tecnología estudia ampliar su infraestructura regional. El caso permite explorar cómo una noticia internacional puede tener relevancia local.", "La propuesta todavía está en revisión. El estado «En desarrollo» describe el escenario de ejemplo, no una evaluación de un hecho real.", "El lector puede consultar la procedencia, identificar el tipo de contenido y volver a la edición. Estas funciones no requieren una respuesta de inteligencia artificial."],
    topic: "Tecnología", regions: ["Guatemala", "Estados Unidos"], status: "developing",
    date: "2026-10-09", contentType: "Original", sources: [source], visual: "network", important: false, reviewNote: note,
  },
  {
    id: "comercio-regional", title: "Las rutas del comercio dibujan un nuevo mapa regional",
    summary: "Un escenario sobre logística y pequeñas empresas ayuda a entender la conexión entre México y Centroamérica.",
    body: ["Este ejemplo plantea una reorganización de rutas comerciales. Los lugares sirven para probar el selector de región y no describen un anuncio real.", "El escenario se marca como confirmado dentro de la demo para comparar su etiqueta con noticias en desarrollo. La fuente sigue siendo ficticia.", "El cambio de región modifica un orden preparado de antemano. No hay una fórmula de recomendación ni un perfil persistente."],
    topic: "Economía", regions: ["México", "Guatemala"], status: "confirmed",
    date: "2026-10-09", contentType: "Resumen", sources: [source], visual: "trade", important: false, reviewNote: note,
  },
  {
    id: "capital-paciente", title: "El capital paciente vuelve al centro de la conversación",
    summary: "Qué mirar en una noticia sobre inversión productiva: horizonte, fuentes y supuestos.",
    body: ["El fondo Horizonte, una organización ficticia, evalúa un proyecto de infraestructura. No se presenta una oportunidad de inversión real.", "Este caso distingue una propuesta de una decisión anunciada. Por eso conserva la etiqueta «No confirmado» en cada pantalla.", "La aplicación muestra noticias y contexto. No ofrece recomendaciones de inversión."],
    topic: "Finanzas", regions: ["Estados Unidos", "México"], status: "unconfirmed",
    date: "2026-10-08", contentType: "Original", sources: [source], visual: "orbit", important: false, reviewNote: note,
  },
  {
    id: "talento-local", title: "El talento local busca su lugar en la cadena tecnológica",
    summary: "Formación y empleo conectan una transformación global con decisiones cotidianas.",
    body: ["Un programa formativo ficticio reúne a empresas y estudiantes. Este caso permite revisar la lectura de una noticia local.", "No hay personas, instituciones ni cifras reales en este ejemplo. La ilustración es una composición vectorial y no una fotografía."],
    topic: "Tecnología", regions: ["Guatemala"], status: "confirmed",
    date: "2026-10-08", contentType: "Resumen", sources: [source], visual: "network", important: false, reviewNote: note,
  },
  {
    id: "cadenas-productivas", title: "Producir más cerca cambia las preguntas sobre competitividad",
    summary: "Un caso de manufactura para explorar costos, empleo y vínculos entre regiones.",
    body: ["El fabricante ficticio Litoral considera acercar parte de su producción a sus compradores. El caso no representa un anuncio empresarial real.", "La noticia permanece en desarrollo. El lector debe poder reconocer ese estado sin depender únicamente del color."],
    topic: "Economía", regions: ["México"], status: "developing",
    date: "2026-10-08", contentType: "Original", sources: [source], visual: "trade", important: false, reviewNote: note,
  },
  {
    id: "costo-del-dinero", title: "El costo del dinero cruza fronteras antes que los titulares",
    summary: "Un ejercicio sobre tasas y financiamiento, sin cotizaciones ni recomendaciones reales.",
    body: ["Este escenario propone un cambio hipotético en condiciones de financiamiento. No contiene una tasa real ni una predicción del mercado.", "El objetivo es revisar cómo se presenta contexto financiero con fecha y procedencia explícitas."],
    topic: "Finanzas", regions: ["Estados Unidos"], status: "developing",
    date: "2026-10-07", contentType: "Resumen", sources: [source], visual: "orbit", important: false, reviewNote: note,
  },
  {
    id: "energia-compartida", title: "La energía que sostiene la economía digital nos conecta a todos",
    summary: "Una perspectiva que permanece en tu edición, aunque no coincida con el tema que elegiste.",
    body: ["Este caso ficticio trata la relación entre redes eléctricas y servicios digitales. Se conserva fuera de los filtros para representar información de interés amplio.", "En la integración real, el backend determinará qué noticias deben permanecer visibles. La interfaz no asigna esa importancia ni consulta un modelo."],
    topic: "Economía", regions: ["Guatemala", "México", "Estados Unidos"], status: "confirmed",
    date: "2026-10-07", contentType: "Original", sources: [source], visual: "trade", important: true, reviewNote: note,
  },
];

export const DEMO_ARTICLES: DemoArticle[] = ARTICLE_FIXTURES.map(({ body, ...article }) => ({
  ...article,
  byline: "Redacción de demostración",
  body: body.flatMap<ArticleBlock>((text, index) => index === 1
    ? [{ type: "heading", text: "El contexto de este escenario" }, { type: "paragraph", text }]
    : [{ type: "paragraph", text }]),
}));

// Escenarios de UI explícitos. El orden real lo entregará el recomendador del servidor.
export const DEMO_ORDER: Record<Region, string[]> = {
  Guatemala: ["infraestructura-ia", "comercio-regional", "talento-local", "capital-paciente", "cadenas-productivas", "costo-del-dinero"],
  México: ["comercio-regional", "cadenas-productivas", "capital-paciente", "infraestructura-ia", "costo-del-dinero", "talento-local"],
  "Estados Unidos": ["capital-paciente", "infraestructura-ia", "costo-del-dinero", "comercio-regional", "talento-local", "cadenas-productivas"],
};

export function formatArticleDate(date: string) {
  return new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
}
