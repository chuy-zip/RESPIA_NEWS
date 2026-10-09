# Feed y lector

**Requisitos:** RF-01, RF-08, RF-09, RF-11, RF-18, RT-01, RT-02, RT-06.
**Responsable:** Sergio Orellana (interfaz). Datos: Backend. Recomendación: IA (D-20).
**Bitácora:** [registro](../docs/features/feed-y-lector/bitacora.md).
**Investigación:** [documento de traslado](../notion-frontend.md). ID de Notion pendiente.

## Comportamiento actual

La base contiene acceso con Google y una pantalla técnica. No hay endpoints de noticias.

## Criterios de aceptación

- Mostrar cuatro niveles de tarjeta y conservar el bloque de información importante al filtrar.
- Mostrar contenido completo, fuentes, fecha, estado, tipo y origen de imagen al abrir una noticia.
- Verificar la sesión en el servidor antes de entregar la pantalla.
- Probar carga, vacío, error, desconexión y navegación con teclado en teléfono y escritorio.
- La demo debe identificarse y no acreditar personalización ni publicación reales.

## No incluido

Recomendador, base de datos, llamadas a modelos, caché privada y cambios de infraestructura.

## Dependencias

GET `/api/feed` y GET `/api/articles/[id]`: contratos propuestos a Gerardo.
El backend entregará el nivel y el motivo. El frontend no calcula el score.
Los tipos locales de demostración no son contratos publicados en `src/types/`.

## Uso de IA en el producto

Ninguno en esta entrega. La demo no llama a modelos.

## Done específico

Probar con iPhone y Android instalados. Integrar el contrato aprobado y retirar los ejemplos antes del cierre funcional.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Identidad editorial, navegación y cuatro variantes de tarjeta | RF-01, RF-08 | Pruebas pendientes del usuario |
| En curso | Lector, fuentes, estados e ilustraciones identificadas | RF-09, RF-18, RT-02, RT-06 | Pruebas pendientes del usuario |
| Pendiente | Conectar feed y lector a Backend | RF-08, RF-09, RF-11, RT-01 | Endpoints pendientes |

## Cambio en curso

2026-10-09: implementar The Meridian Times en `front/experiencia-editorial-meridian`.
Usar Georgia para titulares e Inter para controles. Mantener CSS Modules, tokens y el breakpoint de 40rem.
La demostración usa escenarios fijos de región, nunca un recomendador presentado como real.
El contexto React conserva datos solo durante la vida de la pestaña y reinicia al cambiar la identidad.
La portada pública no muestra datos de cuentas ni noticias privadas.
El compositor reserva su altura real al final de la página para no tapar el pie cuando aumenta el texto.
El usuario pidió no ejecutar app, pruebas, compilaciones ni validadores.

El conjunto constituye una primera demo navegable con sesión compartida entre lector, perfil y portal.
Si el PR supera 400 líneas, su descripción justificará esta unidad de revisión y señalará los módulos por recorrido.
No se fusionará sin las pruebas exigidas.
