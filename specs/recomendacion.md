# Recomendación

Orden, niveles de prominencia e intereses del feed de cada usuario. El diseño es de IA. El endpoint del feed es
de Backend y llama al recomendador (D-20).

**Requisitos:** `RF-08`, `RF-10`, `RF-11`, `RT-01` · **Bitácora:** [bitacora.md](../docs/features/recomendacion/bitacora.md) ·
**Decisiones:** D-20, D-31, D-32 · **Investigación (Notion):** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db) ·
**Teoría y fuentes:** [Recomendación de noticias](https://app.notion.com/p/3f5f573ce6df81e4b04aca2eebe95d10) ·
**Responsable:** Rodrigo Mansilla (IA). Endpoint: Gerardo Pineda. Pantalla: Sergio Orellana.

## Comportamiento actual

`src/lib/recomendacion/feed.ts` ordena el feed con funciones puras ([PR #5](https://github.com/chuy-zip/RESPIA_NEWS/pull/5)):
puntaje, prominencia por posición, motivo y bloque importante por ámbito. También calcula los intereses a partir de
las señales y los temas elegidos ([PR #8](https://github.com/chuy-zip/RESPIA_NEWS/pull/8)). Ningún endpoint llama
todavía al recomendador: falta `GET /api/feed` (Backend).

## Criterios de aceptación

- **`RF-08`**: dos cuentas con región o intereses distintos ven las mismas noticias. La misma noticia queda en
  niveles distintos. El feed muestra al menos 3 niveles.
- **`RF-10`**: una cuenta nueva abre 5 noticias de un tema. Las noticias de ese tema suben en el feed.
- **`RF-11`**: una cuenta con intereses estrechos sigue viendo una noticia importante fuera de ellos.
- **`RT-01`**: para cualquier noticia del feed se puede mostrar por qué quedó en su nivel.
- **`RP-03`**: `src/lib/recomendacion/` no llama a ningún modelo.

## No incluido

- Embeddings, filtrado colaborativo o un modelo que ordene el feed (`RP-03`, `RT-01`).
- GPS: la región es la simulada (`RF-04`).
- Un campo con el lugar del hecho. Las regiones de la noticia son sus regiones de relevancia (`RF-16`, D-31).
- Reordenar por diversidad de temas (D-31). La prueba mide los temas de las 10 primeras.

## Dependencias

- Datos: regiones de relevancia, temas y fecha de cada noticia (`RF-16`), un campo de importancia y la región del
  perfil. La región es un país de Centroamérica (D-26). La tabla de señales guarda usuario, noticia, tipo (`open` o
  `chat`) y fecha, con una restricción única por usuario, noticia y tipo (D-31). Los temas elegidos en el
  onboarding van en el perfil (D-32).
- `portal-admin`: el administrador marca la importancia, las regiones de relevancia y de 1 a 3 temas.
- Backend: `GET /api/feed` devuelve la prominencia y el motivo de cada noticia. `POST /api/interactions` guarda
  las aperturas y responde `duplicate: true` si se repiten. Los contratos los propuso Frontend en `notion-frontend.md`.
- Frontend: las cuatro variantes de tarjeta, el bloque importante, el envío de la señal al abrir una noticia, el
  onboarding con temas (D-32) y la sección «Cómo se ordena tu feed» en `/privacidad`.
- Acceso: las señales y los temas elegidos son datos del usuario y van en `/privacidad` (`RF-06`).
- `chat`: usa las primeras recomendaciones. Cuando exista, envía la señal `chat` si el lector pregunta desde una
  noticia. No guarda el texto de la pregunta (`RF-07`).

## Uso de IA en el producto

Ninguno: el recomendador no llama a ningún modelo (`RP-03`).

## Done específico

- Cada noticia del feed trae los componentes de su puntaje.
- La sección «Cómo se ordena tu feed» de `/privacidad` tiene los mismos pesos y vidas medias que el código.

## Tareas

Están en el ticket [TKT-2](https://app.notion.com/p/3f5f573ce6df814ba4fcf0fa30be4906) de la base [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c) de Notion (D-28). El ticket guarda la lista de tareas con su evidencia y de qué áreas depende.

## Cambio en curso

### Incremento 1: puntaje, prominencia y bloque importante (rama `recomendacion`)

Requisitos: `RF-08`, `RF-10`, `RF-11`, `RT-01`, `RP-03`. Decisiones: D-20, D-31, D-32. Ticket: TKT-2. Ciclo: CIC-28.

El incremento se alinea con el contrato que Frontend propuso para `GET /api/feed`: cuatro prominencias, un motivo
por noticia y un bloque `importantItems` que no depende del filtro.

- `src/lib/recomendacion/feed.ts` tiene funciones puras, sin base de datos ni modelos. El servicio del feed las llama.
- **Entrada:** noticias con `id`, `topicIds`, `regionIds` (regiones de relevancia), `publishedAt` e `important`.
  Perfil con `regionId` y un peso de 0 a 1 por tema. El servicio pasa los IDs de los países de Centroamérica del
  catálogo para calcular el ámbito.
- **Puntaje:** suma de cuatro componentes con nombre.

  | Componente | Peso | Valor |
  |---|---|---|
  | Región | 0.35 | 1 si las regiones de relevancia incluyen el país del lector, 0 si no |
  | Interés | 0.30 | El mayor peso del perfil entre los temas de la noticia |
  | Recencia | 0.20 | Se reduce a la mitad cada 24 horas desde la publicación |
  | Importancia | 0.15 | 1 si la redacción la marcó como importante |

- **Prominencia (`RF-08`):** sale de la posición en el orden. La 1.ª es `hero`, la 2.ª y la 3.ª son `large`, de la 4.ª
  a la 9.ª son `standard` y el resto `compact`. Con 10 noticias o más, el feed tiene las cuatro variantes.
- **Motivo (`RT-01`):** una frase con los componentes que más aportaron. Ejemplo: «Destacada porque es relevante
  para tu país y es reciente.» Cada noticia trae además el aporte de cada componente.
- **Lo importante no se oculta (`RF-11`):** la importancia suma al puntaje. Además, `importantItems` lleva la
  noticia importante más reciente de cada ámbito. Si una importante de un ámbito ya quedó como `hero` o `large`,
  ese ámbito no se repite. Los ámbitos son: país del lector, resto de Centroamérica e internacional (ninguna región
  de Centroamérica). El filtro por tema no las quita.
- **Intereses (`RF-10`):** las señales se convierten en pesos de 0 a 1 por tema. Abrir una noticia vale 1.
  Preguntar al chat desde una noticia vale 1 más. Cada tipo cuenta una vez por noticia y por lector. Cada señal
  pierde la mitad de su valor cada 7 días. Un tema elegido en el onboarding empieza en 0.5 (D-32).
- **Explicación pública (`RT-01`):** la sección «Cómo se ordena tu feed» de `/privacidad` lista los componentes y
  sus pesos, las vidas medias, las señales guardadas, el bloque importante y cómo cambiar la región y los temas.
  IA escribe el texto. Frontend lo muestra. Borrador:

  > **Cómo se ordena tu feed**
  >
  > La app no usa inteligencia artificial para ordenar tu feed. Cada noticia recibe un puntaje con cuatro partes:
  >
  > - **Tu país (35 %):** suma si la noticia es relevante para el país que elegiste. No usamos tu ubicación real.
  > - **Tus temas (30 %):** suma si la noticia trata temas que elegiste o que lees.
  > - **Recencia (20 %):** este valor baja a la mitad cada 24 horas.
  > - **Importancia (15 %):** suma si la redacción marcó la noticia como importante.
  >
  > Las noticias con más puntaje van más arriba y más grandes. Cada noticia dice por qué quedó en su lugar.
  >
  > **Lo importante no se oculta.** Un bloque aparte muestra una noticia importante de tu país, una del resto de
  > Centroamérica y una internacional, aunque no coincidan con tus temas.
  >
  > **Qué guardamos para conocer tus temas:**
  >
  > - Los temas que elegiste.
  > - Las noticias que abres. Cada noticia cuenta una vez.
  > - Las noticias sobre las que preguntas al chat. Guardamos cuál noticia fue, no tu pregunta.
  >
  > Cada una pierde la mitad de su valor cada 7 días. En Perfil puedes cambiar tu país y tus temas.

  La línea del chat y la de los temas elegidos se publican cuando la base guarde esos datos (`RF-06`).
- **Prueba:** `src/lib/recomendacion/feed.test.mjs`, con unas 30 noticias ficticias (D-15) y cuatro lectores:

  | Lector | Perfil |
  |---|---|
  | L1 | Nuevo, Guatemala, sin temas ni señales |
  | L2 | Guatemala, eligió Deportes |
  | L3 | Costa Rica, eligió Economía |
  | L4 | Guatemala, abrió 10 noticias de Deportes. Hay una noticia importante internacional de Política |

  | Métrica | Lector | Umbral | Requisito |
  |---|---|---|---|
  | Niveles distintos en el feed | Todos | 3 o más | `RF-08` |
  | Noticias que cambian de nivel | L2 y L3 | Al menos 1. Se reporta el % | `RF-08`, `RF-04` |
  | Posición media de un tema antes y después de 5 aperturas | L1 | Sube | `RF-10` |
  | Ámbitos con noticia importante que quedan visibles | L4 | 100 % | `RF-11` |
  | Noticias con motivo y componentes que suman el puntaje | Todos | 100 % | `RT-01` |
  | Mismas entradas, mismo orden | Todos | Siempre | `RT-01` |
  | Temas distintos entre las 10 primeras | L4 | Se reporta | Diversidad |
  | Noticias del país del lector entre las 10 primeras | Todos | Se reporta | `RF-04` |
  | Imports de un SDK de modelo en `src/lib/recomendacion/` | Código | 0 | `RP-03` |

  Usa el runner incluido en Node, sin dependencias:

  ```bash
  node --test src/lib/recomendacion/feed.test.mjs
  ```

### Incremento 2: noticias relacionadas (rama `recomendacion`)

Requisitos: `RF-11`, `RT-01`, `RP-03`. Decisión: D-31. Ticket: TKT-2. Ciclo: CIC-28.

El lector muestra noticias que comparten temas con la noticia abierta. Primero van las de otro alcance: así se ve el
cruce entre lo internacional y lo local. Cada relacionada dice el tema en común. No afirma causas.

- `src/lib/recomendacion/related.ts` tiene la función pura `relatedArticles`, sin base de datos ni modelos.
- **Candidatas:** noticias que comparten al menos un tema con la noticia abierta. La noticia abierta no entra.
- **Alcance de una noticia:** `local` si es relevante para un país de Centroamérica, `regional` si es relevante para
  dos o más e `international` si no es relevante para ninguno. El alcance no depende del lector. El ámbito del feed
  sí depende del lector y no sirve aquí: para un lector de Guatemala, un informe relevante para toda Centroamérica y
  una noticia de Guatemala tienen el mismo ámbito.
- **Orden:** primero las de otro alcance que la noticia abierta. Después, las que tienen más temas en común. Después,
  las más recientes. El ID desempata.
- **Salida:** hasta 3 relacionadas, cada una con `articleId`, `sharedTopicIds` y `reach`. La pantalla muestra «Tema
  en común: <etiqueta>» con el catálogo.
- **Integración (Backend):** `getArticle` llama a `relatedArticles` y llena `relatedArticles` en `ArticleDetail`. Los
  países de Centroamérica son las regiones del catálogo menos `internacional`.
- **Prueba:** `src/lib/recomendacion/related.test.mjs`. Un caso por regla, con noticias ficticias (D-15):

  | Caso | Resultado esperado |
  |---|---|
  | Noticia local de remesas. Hay otra local más reciente y un informe regional sobre IA y economía | El informe regional va primero |
  | Una candidata comparte dos temas y otra comparte uno, con el mismo alcance | Primero la de dos temas |
  | Candidatas sin temas en común y la propia noticia | No aparecen |
  | Más de 3 candidatas | Solo 3 |
  | Mismas entradas en otro orden | Mismo resultado |

  Las pruebas de las dos funciones corren juntas:

  ```bash
  node --test "src/lib/recomendacion/*.test.mjs"
  ```

### Pendiente

- Guardar las señales: tabla de señales (Datos) y `POST /api/interactions` (Backend).
- El campo de importancia ya está en `supabase/migrations/003_articles.sql`. Se ejecuta cuando llegue a `main`.
- El catálogo de temas tiene 3: tecnología, economía y finanzas. Con tan pocos, casi todas las noticias comparten
  economía y las relacionadas se ordenan sobre todo por alcance y fecha. El cruce mejora con temas transversales,
  por ejemplo empleo, migración y remesas, e IA (Datos).
- `relatedArticles` en `ArticleDetail` y en `getArticle` (Backend).
- Los temas elegidos en el perfil y la pantalla de onboarding (D-32).
- La señal `chat`, cuando exista el chat.
- La prueba con dos cuentas reales (`RF-08`), cuando exista el endpoint.
