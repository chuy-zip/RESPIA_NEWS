# Bitácora de imagenes

De lo más reciente a lo más antiguo.

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
