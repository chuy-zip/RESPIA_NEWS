# Bitácora de imagenes

De lo más reciente a lo más antiguo.

## 2026-10-10 · CIC-27 · El banco pasa por tres descartes y queda en Pixabay

**Requisitos:** `RF-17`, `RF-18`, `RT-05` · **Notion:** [CIC-27](https://app.notion.com/p/3f4f573ce6df81249b7dd2fce334a4ee) ·
**Ticket:** [TKT-4](https://app.notion.com/p/3f5f573ce6df81feb6e3fb92c207a067) · **Decisión:** D-33

- **Comprensión:** D-23 decía «un banco con licencia libre», pero ningún banco estaba elegido. El modelo elige
  leyendo texto, así que el banco tiene que dar texto de cada imagen.
- **Hipótesis:** Pexels sirve, porque trae `alt`, es gratis y no pide aprobación.
- **Construcción:** comparación de Pexels, Unsplash, Pixabay y Openverse con su documentación oficial. Prueba en
  vivo de Openverse sin llave y de Pixabay con la llave de Rodrigo.
- **Prueba:** consultas reales a las APIs. La llave no se imprimió.
- **Observación:**
  - Pexels: «New API key issuance is currently paused».
  - Unsplash: la app necesita aprobación antes de usarse.
  - Openverse: funciona sin llave, con 20 consultas por minuto y 200 por día. Trae resultados que no tienen que ver
    e imágenes generadas con IA.
  - Pixabay: 4 de 4 búsquedas en español con resultados. Solo trae etiquetas. Las ilustraciones generadas con IA
    llevan la etiqueta «ai generado». Buscar solo «ai» da falsos positivos, porque esa etiqueta también marca el
    tema de la imagen.
- **Corrección:** el banco es Pixabay. La búsqueda se guarda en caché 24 horas y la imagen elegida se copia al
  bucket del script 002. El modelo descarta candidatas con «ai generado».
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** Rodrigo pidió investigar las APIs de bancos de imágenes y el costo de generar.
- **Propuesta:** el agente recomendó Pexels y después Unsplash. Ninguna de las dos se podía usar. Las dos
  recomendaciones salían de la documentación, sin probar si se podía obtener una llave. Después recomendó
  Openverse por no tener llave.
- **Decisión:** Rodrigo configuró Pixabay y lo eligió por la calidad de sus imágenes (D-33). Generar sigue
  descartado: cuesta de 100 a más de 4 000 veces más por noticia (CIC-27).
- **Verificación:** prueba en vivo con `node --env-file=.env.local`, sin mostrar la llave.
- **Evidencia:** 2026-10-10, salida de la prueba en CIC-27. La prueba de 10 noticias con trampas sigue pendiente
  (TKT-4).

## 2026-10-09 · CIC-27 · No se generan imágenes: el modelo elige una foto de banco por texto

**Requisitos:** `RF-17`, `RF-18`, `RT-05`, `RP-02` · **Notion:** [CIC-27](https://app.notion.com/p/3f4f573ce6df81249b7dd2fce334a4ee),
reemplaza a [CIC-23](https://app.notion.com/p/3f4f573ce6df81bcafd1e09e19ee86be) · **Decisión:** D-23

- **Comprensión:** CIC-23 proponía generar la imagen con un modelo y mostrar el costo antes de generar.
- **Hipótesis:** buscar candidatas en un banco con licencia libre y que el modelo proponga una leyendo sus
  descripciones cuesta menos y evita imágenes que parezcan el hecho real.
- **Construcción:** ninguna. Es un ciclo de diseño.
- **Prueba:** comparación de costos estimados y de los requisitos. No hubo prueba de código.
- **Observación:** generar sería el gasto de IA más alto del producto. Elegir por texto entre 10 candidatas usa
  unos 1 000 tokens: menos de USD 0.0002 por noticia. Una foto de banco tampoco es del hecho, así que `RF-18`
  sigue aplicando.
- **Corrección:** CIC-23 queda descartada sin prueba. El modelo propone una imagen o ninguna, el administrador
  confirma y la imagen lleva «Imagen ilustrativa».
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** decidir cómo obtener la imagen de una noticia sin imagen.
- **Propuesta:** el agente propuso leer descripciones antes que mirar miniaturas, y criterios de rechazo:
  personas reconocibles, lugares o banderas ajenos y escenas que parezcan el hecho. Antes había dicho que, sin
  generación, las imágenes dejaban de ser parte de IA. El equipo lo corrigió al pedir que el modelo elija la imagen.
- **Decisión:** el equipo eligió un banco por palabras clave, sin generar, y la selección por texto.
- **Verificación:** lectura de `RF-17`, `RF-18` y `RT-05`. El costo es una estimación de tokens, no una medición.
- **Evidencia:** 2026-10-09, conversación de diseño. La prueba queda pendiente: 10 noticias de ejemplo con trampas
  (métrica de CIC-27).
