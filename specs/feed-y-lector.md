# Feed y lector

**Requisitos:** RF-01, RF-08, RF-09, RF-11, RF-18, RT-01, RT-02, RT-06.
**Responsable:** Sergio Orellana (interfaz). Datos: Backend. Recomendación: IA (D-20).
**Bitácora:** [registro](../docs/features/feed-y-lector/bitacora.md).
**Investigación:** [documento de traslado](../notion-frontend.md). ID de Notion pendiente.

## Comportamiento actual

La interfaz contiene una portada pública, edición con cuatro prominencias y lector de noticias ficticias.
El chat y la edición tienen rutas separadas. La raíz con sesión dirige a `/chat`.
Hay rutas de temas, búsqueda y Guardados. Guardados informa integración pendiente, sin simular persistencia.
El lector incluye bloques tipados, firma ficticia, compartir y relacionados de demo. No hay endpoints de noticias conectados.

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
GET `/api/articles` cubre la búsqueda propuesta. Los contratos de Guardados también permanecen pendientes.
El backend entregará el nivel y el motivo. El frontend no calcula el score.
Los tipos locales de demostración no son contratos publicados en `src/types/`.

## Uso de IA en el producto

Ninguno en esta entrega. La demo no llama a modelos.

## Done específico

Probar con iPhone y Android instalados. Integrar el contrato aprobado y retirar los ejemplos antes del cierre funcional.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Identidad editorial, navegación y cuatro variantes de tarjeta | RF-01, RF-08 | Código escrito. [Verificación local](../notion-frontend.md#registro-honesto). Pruebas con sesión y móviles pendientes |
| En curso | Lector, fuentes, estados e ilustraciones identificadas | RF-09, RF-18, RT-02, RT-06 | Código escrito. Acceso anónimo comprobado. Lectura con sesión pendiente |
| Pendiente | Conectar feed y lector a Backend | RF-08, RF-09, RF-11, RT-01 | Endpoints pendientes |
| En curso | Separar edición, temas y chat con navegación común | RF-01, RF-07, RF-08 | Rutas implementadas. [Evidencia local](../notion-frontend.md#registro-honesto). Navegación con sesión pendiente |
| En curso | Ampliar lectura, compartir y estados de ruta accesibles | RF-09, RF-05 | Código implementado. Compartir y recorrer con sesión pendientes |
| En curso | Búsqueda de demo y pantalla de Guardados sin persistencia | Ampliación solicitada, ID pendiente | Código implementado. Pruebas con sesión y requisito formal pendientes |

## Cambio en curso

2026-10-09: implementar The Meridian Times en `front/experiencia-editorial-meridian`.
Usar Georgia para titulares e Inter para controles. Mantener CSS Modules, tokens y el breakpoint de 40rem.
La demostración usa escenarios fijos de región, nunca un recomendador presentado como real.
El contexto React conserva datos solo durante la vida de la pestaña y reinicia al cambiar la identidad.
La portada pública no muestra datos de cuentas ni noticias privadas.
El compositor permanece en el panel de chat. La conversación tiene desplazamiento propio y ya no prolonga la edición.
La instrucción inicial de no ejecutar fue reemplazada el 2026-10-09: el usuario autoriza tipos, lint, build y revisión local.

El conjunto constituye una primera demo navegable con sesión compartida entre lector, perfil y portal.
Si el PR supera 400 líneas, su descripción justificará esta unidad de revisión y señalará los módulos por recorrido.
No se fusionará sin las pruebas exigidas.

### Evolución editorial aprobada

2026-10-09: mantener la identidad existente y separar `/chat`, `/edicion`, `/temas/[slug]`, `/buscar` y `/guardados`.
La raíz autenticada dirige al chat para conservar RF-07. Todas las rutas privadas comprueban sesión en servidor.
El layout compartido presenta cabecera, navegación activa, pie y estados de ruta. No se modifica el DAL.
La búsqueda usa fixtures identificados. Su URL conserva `q`, `topic` y `sort`. Los temas salen del catálogo de demo.
Guardados muestra integración pendiente y nunca confirma una escritura. Búsqueda y Guardados son ampliaciones solicitadas, pendientes de requisito formal del equipo.
El lector utiliza bloques de texto tipados, firma ficticia, compartir y relacionados de demo. No representa HTML arbitrario.
La búsqueda acota el texto presentado a 200 caracteres y admite orden reciente o antiguo.
La privacidad explica que sus parámetros pueden quedar en el historial del navegador y en los enlaces compartidos.
El frontend no calcula recomendaciones reales ni llama a endpoints inexistentes.
Cada subagente recibe archivos exclusivos. La documentación de contratos vive en `notion-frontend.md`.
La fase de implementación quedó sin staging ni commits. La entrega posterior autoriza commits locales separados, sin push ni merge automático.
El código y los resultados técnicos se registran en [Verificación y presentación](../notion-frontend.md#registro-honesto).
El usuario pidió dejar todas las pruebas con sesión pendientes. Ninguna tarea funcional se marca Done.

### Preparación de entrega local

2026-10-09, RPR-03 y RF-05: el usuario solicita Conventional Commits separados y una guía para publicar mediante `dev` y `main`.
Antes de modificar `.gitignore`, se define excluir `.agents/` y `skills-lock.json`, que son instalaciones locales.
Las skills de documentación ya versionadas en `.claude/skills/` se conservan conforme a D-18.
Se revisarán los archivos de cada commit, las exclusiones y el estado final de Git. No se incluirán archivos de entorno.
La documentación quedará en commits separados para trasladarla directamente a `dev` antes del PR de código, conforme a D-21.
La referencia remota incorpora D-27 y exige tickets de Notion. Sus IDs no se inventarán si la base no es accesible.
La guía y los límites de publicación se registran en `notion-frontend.md`. Esta preparación no acredita Done ni despliegue.
