# Bitácora de feed y lector

## 2026-10-09 · Demostración independiente antes de integrar servicios

**Requisitos:** RF-01, RF-08, RF-09, RPR-01, RPR-03.
**Notion:** pendiente de traslado e ID. [Registro propio](../../../specs/front/notion-frontend.md).

- **Comprensión:** la interfaz aún es una prueba técnica. No existen endpoints de noticias.
- **Hipótesis:** una demo identificada permite revisar navegación y jerarquía antes de integrar datos.
- **Construcción:** el spec precedió al código. Se escribieron portada, feed, lector, chat de ejemplo, perfil y portal con una sesión de demo compartida. Se sustituyó la interfaz técnica de chistes. Las tareas siguen en curso hasta probarlas.
- **Prueba:** lectura del repositorio y revisión del plan con el usuario. Ninguna ejecución de la app.
- **Observación:** el usuario eligió The Meridian Times y una demo temporal. Pidió independencia respecto al ejemplo de ciclos compartido.
- **Corrección:** se separan los tipos de presentación de los contratos futuros. Los ciclos del ejemplo no se copian.
- **Agente:** Codex. Identificador exacto del modelo no disponible.
- **Pedido:** construir únicamente frontend, documentar endpoints y auditar el trabajo sin ejecutar pruebas.
- **Propuesta:** identidad editorial, cuatro niveles, datos ficticios en memoria y controles de sesión existentes.
- **Decisión:** el usuario aceptó el plan y conservó la ejecución y verificación funcional a su cargo.
- **Verificación:** lectura estática del código, requisitos y decisiones. La prueba funcional queda pendiente.
- **Evidencia:** conversación del 2026-10-09 y spec. No hay resultados de navegador ni dispositivo.

Al iniciar la implementación se encontró documentación nueva en dev. El cambio conserva las decisiones de otras áreas.
La ilustración local solo prueba presentación. La obtención real de imágenes seguirá D-23.
Se conserva el flujo de rama y PR a dev solicitado explícitamente por el usuario, sin publicación directa de documentos.

Durante la revisión estática, el agente corrigió su primera descripción de las ilustraciones.
Negar toda asistencia de IA era incorrecto: Codex escribió el SVG.
Las etiquetas, el lector y el portal ahora declaran esa asistencia. No se llamó a un servicio de imágenes.
Es una corrección de procedencia, no un resultado de prueba ni una aprobación humana nueva.

## 2026-10-09 · Separar conversación y edición sin perder la identidad

**Requisitos:** RF-01, RF-02, RF-07, RF-08, RF-09, RPR-01, RPR-03.
**Notion:** ID pendiente. [Registro de traslado](../../../specs/front/notion-frontend.md).

- **Comprensión:** el usuario reportó que el chat y sus botones prolongaban una sola página. También vio una pantalla antigua después de entrar con Google.
- **Hipótesis:** páginas separadas, conectadas por una navegación común, permiten leer y conversar sin desplazar el feed con cada respuesta.
- **Construcción:** se implementaron rutas separadas de chat, edición, temas y búsqueda. Guardados presenta la integración pendiente. El layout, el acceso y los estados comparten identidad editorial. El lector incluye bloques tipados, compartir y relacionados de demo.
- **Prueba:** auditoría estática, verificaciones técnicas, HTTP anónimo y revisión de navegador público. Los resultados y sus límites están en [el registro de evidencia](../../../specs/front/notion-frontend.md#registro-honesto).
- **Observación:** el mensaje antiguo no existe en la rama actual. Sí está en las referencias locales de main y dev. El usuario cree que el login terminó en Vercel, pero no se verificó ese retorno.
- **Corrección:** la raíz con sesión dirige al chat en el código. La edición completa está en otra ruta. No se modifica OAuth para corregir una pantalla de una versión distinta. La revisión retiró una carga global que podía anticipar HTTP 200 antes del rechazo administrativo.
- **Agente:** Codex, con subagentes de páginas, experiencia e integración. Identificador exacto del modelo no disponible.
- **Pedido:** evolucionar la identidad existente, documentar contratos y ejecutar verificaciones, sin commits ni staging.
- **Propuesta:** reutilizar componentes, separar rutas y conservar la demo explícita hasta que existan servicios.
- **Decisión:** el usuario aprobó chat y edición separados, Guardados sin persistencia y dependencia de Infra para la marca instalada y offline.
- **Verificación:** el coordinador ejecutó tipos, lint, build y recorridos públicos. El subagente contrastó contratos, revisó errores y validó los documentos. El usuario pidió mantener todas las pruebas con sesión pendientes. No se marcó ninguna tarea funcional como Done.
- **Evidencia:** 2026-10-09, Windows y navegador integrado sobre producción local. [Resultados y limitaciones](../../../specs/front/notion-frontend.md#registro-honesto). El reporte inicial proviene del usuario. Los viewports públicos no constituyen pruebas en teléfonos reales.

La primera implementación de esta revisión añadió `loading.tsx` en la raíz.
La revisión del agente detectó que el fallback podía fijar HTTP 200 antes de `notFound()` en el portal.
El coordinador retiró ese archivo y limitó la carga a chat, edición y búsqueda. El control de acceso no cambió.
La conclusión se basó en inspección y documentación oficial. La respuesta administrativa con cuenta común sigue pendiente de prueba.

Los resultados iniciales de lint señalaron scripts de las skills. La configuración final excluye esos scripts del alcance de la app.
No se editaron las skills para ocultar sus errores. El registro conserva tanto el fallo inicial como la verificación final.
La revisión pública detectó una primera secuencia con URL y DOM distintos después de un ancla, sin causa confirmada.
La nueva secuencia sin ancla pasó. El historial con anclas permanece sin validar.
