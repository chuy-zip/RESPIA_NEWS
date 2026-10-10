# Recomendación

Orden, niveles de prominencia e intereses del feed de cada usuario. El diseño es de IA. El endpoint del feed es
de Backend y llama al recomendador (D-20).

**Requisitos:** `RF-08`, `RF-10`, `RF-11`, `RT-01` · **Bitácora:** [bitacora.md](../docs/features/recomendacion/bitacora.md) ·
**Decisiones:** D-20 · **Investigación (Notion):** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db) ·
**Responsable:** Rodrigo Mansilla (IA). Endpoint: Gerardo Pineda. Pantalla: Sergio Orellana.

## Comportamiento actual

Todavía no existe. El diseño propuesto está en «Cambio en curso».

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

## Dependencias

- Datos: regiones, temas y fecha de cada noticia (`RF-16`), un campo de importancia, una tabla de señales y la
  región del perfil. La cobertura es Centroamérica más noticias internacionales (D-26).
- `portal-admin`: el administrador marca la importancia.
- Backend: `GET /api/feed` devuelve la prominencia y el motivo de cada noticia, y `POST /api/interactions`
  guarda las aperturas. Los contratos los propuso Frontend en `notion-frontend.md`.
- Frontend: las cuatro variantes de tarjeta, el bloque importante y el envío de la señal al abrir una noticia.
- Acceso: las señales son datos del usuario y van en `/privacidad` (`RF-06`).
- `chat`: usa las primeras recomendaciones.

## Uso de IA en el producto

Ninguno: el recomendador no llama a ningún modelo (`RP-03`).

## Done específico

- Cada noticia del feed trae los componentes de su puntaje.

## Tareas

Están en el ticket [TKT-2](https://app.notion.com/p/3f5f573ce6df814ba4fcf0fa30be4906) de la base [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c) de Notion (D-28). El ticket guarda la lista de tareas con su evidencia y de qué áreas depende.

## Cambio en curso

### Incremento 1: puntaje, prominencia y bloque importante (rama `recomendacion`)

Requisitos: `RF-08`, `RF-10`, `RF-11`, `RT-01`, `RP-03`. Decisión: D-20. Ticket: TKT-2. Ciclo: CIC-28.

El incremento se alinea con el contrato que Frontend propuso para `GET /api/feed`: cuatro prominencias, un motivo
por noticia y un bloque `importantItems` que no depende del filtro.

- `src/lib/recomendacion/feed.ts` tiene funciones puras, sin base de datos ni modelos. El servicio del feed las llama.
- **Entrada:** noticias con `id`, `topicIds`, `regionIds`, `publishedAt` e `important`. Perfil con `regionId` y un
  peso de 0 a 1 por tema.
- **Puntaje:** suma de cuatro componentes con nombre.

  | Componente | Peso | Valor |
  |---|---|---|
  | Región | 0.35 | 1 si la noticia es de la región del lector, 0 si no |
  | Interés | 0.30 | El mayor peso del perfil entre los temas de la noticia |
  | Recencia | 0.20 | Se reduce a la mitad cada 24 horas desde la publicación |
  | Importancia | 0.15 | 1 si la redacción la marcó como importante |

- **Prominencia (`RF-08`):** sale de la posición en el orden. La 1.ª es `hero`, la 2.ª y la 3.ª son `large`, de la 4.ª
  a la 9.ª son `standard` y el resto `compact`. Con 10 noticias o más, el feed tiene las cuatro variantes.
- **Motivo (`RT-01`):** una frase con los componentes que más aportaron. Ejemplo: «Destacada porque es de tu región
  y es reciente.» Cada noticia trae además el aporte de cada componente.
- **Lo importante no se oculta (`RF-11`):** `importantItems` lleva hasta 3 noticias importantes que no quedaron
  como `hero` ni `large`. El filtro por tema no las quita.
- **Intereses (`RF-10`):** `topicWeightsFromOpens` convierte las aperturas del lector en pesos de 0 a 1. Cada
  apertura pierde la mitad de su valor cada 7 días.
- **Prueba:** `src/lib/recomendacion/feed.test.mjs`, un test por criterio con noticias ficticias (D-15). Usa el
  runner incluido en Node, sin dependencias:

  ```bash
  node --test src/lib/recomendacion/feed.test.mjs
  ```

### Pendiente

- Guardar las aperturas: tabla de señales (Datos) y `POST /api/interactions` (Backend).
- El campo de importancia en la tabla de noticias (Datos y `portal-admin`).
- Región: hoy solo cuenta si la noticia es de la región del lector. Una región vecina puede sumar cuando
  `ubicacion-y-perfil` defina la lista de regiones (D-26).
- La prueba con dos cuentas reales (`RF-08`), cuando exista el endpoint.
