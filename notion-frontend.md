# The Meridian Times: investigación y auditoría de frontend

**Fecha del registro:** 2026-10-09, Guatemala. **Responsable de frontend:** Sergio Orellana.
**Estado:** código de demostración escrito. Verificación funcional pendiente del usuario.
**Rama:** `front/experiencia-editorial-meridian`, creada desde `origin/dev`.
**Destino:** Notion del proyecto. Este archivo es una copia de traslado, no otro tablero permanente.

## 1. Objetivo y restricciones

Construir la interfaz de lector y portal administrativo de The Meridian Times.
El usuario eligió diseño editorial híbrido, datos ficticios identificados y ciclos de investigación propios.
El ejemplo de otro integrante solo orientó las columnas. No se copian sus ciclos, numeración ni hipótesis.

### Fuentes de verdad

- [Alcance](docs/ALCANCE.md): requisitos y criterios oficiales del equipo.
- [Proceso](docs/PROCESO.md): evidencia, uso de agentes y definición de Done.
- [Decisiones](docs/DECISIONES.md): decisiones vigentes de todas las áreas.
- [Enunciado del curso](docs/Proyecto%202%20AI%20Assisted%20News%20App.pdf): fuente versionada del contenido de `instructions.md`.
- `instructions.md`, `FRONTEND.md` y `brief.md`: archivos locales aportados por el usuario y leídos durante la planificación. No se modifican ni se incorporan automáticamente al PR.

### Acuerdos de esta entrega

- Portada pública, acceso con Google, instalación y privacidad.
- Pantalla inicial con feed y chat, cuatro niveles de tarjeta y lector completo.
- Región simulada, sin GPS, y portal protegido por el rol existente.
- Identidad The Meridian Times, titulares serif, tema automático y movimiento reducido.
- Demostración en memoria, sin persistencia de noticias, preguntas, regiones ni lecturas.
- Respuestas preparadas para cuatro consultas de ejemplo. Una consulta libre explica que el servicio no está conectado.
- La demo solo utiliza su corpus ficticio. No realiza búsqueda externa ni llamadas a modelos.
- El usuario ejecuta la app, compilaciones, validadores y pruebas. El agente no los ejecuta.

El enunciado menciona Firebase. D-03 aprueba Supabase Auth con Google. Se conserva ese acceso.
El enunciado no exige Jira. Este registro utiliza Notion, specs y bitácoras conforme al proceso.

### Diferencias detectadas al actualizar dev

La documentación cambió después de aprobar el plan. Se conservaron las modificaciones de otras áreas.
D-20 asigna el recomendador a IA. El frontend solo representa escenarios fijos y los resultados futuros del servidor.
D-23 establece imágenes de banco para el producto real. Los SVG locales son recursos de demostración, no otra estrategia de obtención.
D-24 y RF-14 ya contemplan fuentes externas. Esta demo interna no acredita ese criterio completo ni modifica la decisión.
D-22 define una política de presupuesto. La pantalla no inventa gasto, saldo ni reserva disponibles.

El usuario pidió explícitamente una rama de frontend con PR y squash hacia dev, también para los documentos de este cambio.
Ese encargo se conserva para esta entrega aunque D-21 describe otro flujo general.
No se modifica la política del resto del equipo. No se fusiona sin pruebas.

## 2. Ciclos propios de frontend

Las filas son hipótesis propuestas. Notion asignará sus IDs cuando el usuario las traslade.
Estados: Propuesta, Abierta y Cerrada. Una hipótesis refutada puede cerrar un ciclo sin cerrar su tarea de implementación.
Solo se abre un ciclo cuando existe una incertidumbre que investigar. No se fabrican ciclos para alcanzar una cantidad.

| Cycle | Title | Status | Requirements | Hypothesis |
|---|---|---|---|---|
| Por asignar | [Feed y chat como experiencia inicial](#feed-y-chat-como-experiencia-inicial) | Propuesta | RF-07, RF-08, RF-12 | Mostrar noticias jerarquizadas antes de la primera consulta permite explorar y preguntar desde una sola pantalla. Se comprobará consulta, lectura y regreso al inicio. |
| Por asignar | [Prominencia editorial que comunica relevancia](#prominencia-editorial-que-comunica-relevancia) | Propuesta | RF-08, RF-11, RT-01 | Cuatro variantes distinguen el nivel recibido del servidor. El bloque de información importante conserva noticias fuera del filtro elegido. |
| Por asignar | [Fuentes y estados consistentes](#fuentes-y-estados-consistentes) | Propuesta | RF-09, RF-13, RT-02, RT-04, RT-06 | Compartir los metadatos de presentación conserva estado y procedencia en feed, lector y citas. El chat no asigna ni cambia estados. |
| Por asignar | [Conversación temporal sin almacenamiento persistente](#conversación-temporal-sin-almacenamiento-persistente) | Propuesta | RF-06, RF-07 | El estado en memoria permite iniciar otra sesión con el chat vacío. La verificación comprobará almacenamiento y comportamiento al cerrar y reabrir. |
| Por asignar | [Lectura y chat utilizables en teléfonos reales](#lectura-y-chat-utilizables-en-teléfonos-reales) | Propuesta | RF-01, RF-07, RF-09 | Las áreas seguras y el ajuste al teclado mantienen accesibles lectura y envío. Reducir las animaciones no elimina información ni acciones. |
| Por asignar | [Personalización observable desde la interfaz](#personalización-observable-desde-la-interfaz) | Propuesta | RF-04, RF-06, RF-10 | Mostrar la región y registrar aperturas sin duplicarlas permite observar cambios antes y después de una conducta. La conclusión requiere datos reales. |
| Por asignar | [Revisión humana antes de publicar](#revisión-humana-antes-de-publicar) | Propuesta | RF-03, RF-15, RF-16, RT-03, RT-04 | Separar contenido, fuentes y revisión permite detectar datos incompletos antes de publicar. Se probarán fuente insuficiente, contradicción y noticia no confirmada. |
| Por asignar | [Imagen alternativa con origen comprensible](#imagen-alternativa-con-origen-comprensible) | Propuesta | RF-17, RF-18, RT-05 | Una alternativa identificada permite completar la vista previa sin aparentar una fotografía del hecho. La etiqueta permanece en feed y lector. |
| Por asignar | [Límites de IA sin bloquear la lectura](#límites-de-ia-sin-bloquear-la-lectura) | Propuesta | RP-01, RP-02, RP-03 | Mostrar indisponibilidad permite entender por qué una consulta no se completa. La lectura continúa y no hay reintentos automáticos que consuman presupuesto. |
| Por asignar | [Instalación sin asistencia del equipo](#instalación-sin-asistencia-del-equipo) | Propuesta | RF-01, RF-05 | Las instrucciones dentro de la app permiten instalarla y abrirla sin asistencia. Se comprobará con una persona ajena al equipo. |

### Feed y chat como experiencia inicial

- **Comprensión:** `instructions.md`, Experiencia móvil y Chat de noticias, exige comenzar en el chat.
- **Hipótesis:** la tabla principal define la propuesta. Alternativa: pantallas independientes con navegación adicional.
- **Construcción:** `NewsDesk` y `ChatPanel`, con cuatro preguntas preparadas y enlace al lector. [Spec de chat](specs/chat.md).
- **Prueba prevista:** entrar con sesión, elegir cada consulta de ejemplo, abrir una cita y regresar. Confirmar fuentes y conversación temporal.
- **Observación:** sin prueba de ejecución. El servicio real sigue pendiente.
- **Corrección:** pendiente de evidencia funcional.
- **Referencias:** tareas del spec. ID, enlace de Notion y PR pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Construir el inicio de frontend | Integrar feed y chat con respuestas identificadas | El usuario aprobó el plan | Lectura estática. Pruebas de las cuatro consultas pendientes |

### Prominencia editorial que comunica relevancia

- **Comprensión:** `instructions.md`, Experiencia móvil y Transparencia, exige jerarquía y evitar una burbuja de preferencias.
- **Hipótesis:** cuatro variantes y un bloque fuera del filtro comunican relevancia. Alternativa: lista uniforme.
- **Construcción:** `ArticleCard`, escenarios fijos y bloque «La otra perspectiva». [Spec de feed y lector](specs/feed-y-lector.md).
- **Prueba prevista:** alternar regiones y temas. Anotar posición y variante de una misma noticia. Comprobar que el bloque importante permanece.
- **Observación:** los escenarios son datos de ejemplo. No prueban el recomendador.
- **Corrección:** pendiente de comparar el frontend con el contrato real.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Mostrar relevancia sin implementar Backend | Cuatro niveles y explicación visible del escenario | El usuario aprobó la demo | Revisión del código. Comparación en dos cuentas pendiente |

### Fuentes y estados consistentes

- **Comprensión:** `instructions.md`, Fuentes y Límites de la IA, requiere procedencia e incertidumbre visibles.
- **Hipótesis:** reutilizar metadatos evita divergencias. Alternativa: redactar las etiquetas por separado en cada pantalla.
- **Construcción:** `ArticleMeta` en tarjetas, lector, citas y portal. Etiquetas con texto e icono. [Spec](specs/feed-y-lector.md).
- **Prueba prevista:** abrir noticias de los tres estados. Seguir sus citas y comparar etiquetas. Preguntar si una noticia no confirmada está confirmada.
- **Observación:** la demo no consulta un modelo. La resistencia del servidor a cambios de estado no está probada.
- **Corrección:** pendiente de prueba e integración.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Mostrar procedencia y estado | Un componente de metadatos basado en datos editoriales | El usuario aprobó el enfoque | Lectura estática. Contraste y consistencia visual pendientes |

### Conversación temporal sin almacenamiento persistente

- **Comprensión:** `instructions.md`, Chat de noticias, no exige historial entre sesiones.
- **Hipótesis:** memoria de React suficiente. Alternativa descartada del alcance: guardar historial en navegador o base.
- **Construcción:** conversación en `DemoSession`, reiniciada por identidad y sin escrituras remotas. [Spec](specs/chat.md).
- **Prueba prevista:** conversar, navegar al lector y volver. Recargar y cerrar/reabrir la PWA. Revisar que no hay escrituras en almacenamiento del navegador.
- **Observación:** el comportamiento de cierre real de iOS y Android no se probó.
- **Corrección:** pendiente de dispositivos reales.
- **Referencias:** tareas del spec y página pública de privacidad. ID de ciclo pendiente.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Mantener conversación temporal | Contexto en memoria, sin persistencia | El usuario aprobó el plan | Lectura de código. Cierre y reapertura pendientes |

### Lectura y chat utilizables en teléfonos reales

- **Comprensión:** `instructions.md`, Alcance del producto, exige iPhone y Android visualmente cuidados.
- **Hipótesis:** retícula fluida, áreas seguras y control del teclado conservan acciones. Alternativa: dimensiones fijas de escritorio.
- **Construcción:** tokens, CSS Modules, breakpoint de 40rem y compositor sensible al viewport visual. [Spec PWA](specs/pwa.md).
- **Prueba prevista:** teléfono vertical y horizontal, teclado abierto, texto ampliado, navegación por teclado, tema oscuro y movimiento reducido.
- **Observación:** no se renderizó la interfaz. Ninguna afirmación de compatibilidad probada.
- **Corrección:** pendiente de revisión visual del usuario.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Adaptar la experiencia a teléfonos | Diseño editorial fluido y movimiento opcional | El usuario eligió el estilo editorial híbrido | Revisión de estilos. Pruebas móviles pendientes |

### Personalización observable desde la interfaz

- **Comprensión:** `instructions.md`, Acceso y ubicación, requiere regiones simuladas y señales de comportamiento.
- **Hipótesis:** región visible y lecturas deduplicadas permiten comparar cambios. Alternativa: ocultar el contexto de personalización.
- **Construcción:** `ProfilePanel`, selector y conjunto de IDs abiertos durante la demo. [Spec de perfil](specs/ubicacion-y-perfil.md).
- **Prueba prevista:** abrir la misma noticia varias veces, revisar la lista y cambiar región. Después de integrar, comparar dos cuentas y repetir la conducta aprobada.
- **Observación:** no se envían señales y no se calculan intereses. Los escenarios no prueban RF-10.
- **Corrección:** pendiente del servicio y el recomendador.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Preparar región y perfil sin base de datos | Selección y lecturas en memoria con explicación visible | El usuario aceptó datos temporales | Revisión estática. Persistencia y personalización reales pendientes |

### Revisión humana antes de publicar

- **Comprensión:** `instructions.md`, Publicación administrativa y Validación, exige criterio humano y manejo de incertidumbre.
- **Hipótesis:** pasos de contenido, fuentes y vista previa detectan omisiones. Alternativa: un botón que publica sin revisión.
- **Construcción:** `EditorialDesk`, errores por campo y confirmación de publicación simulada. [Spec del portal](specs/portal-admin.md).
- **Prueba prevista:** omitir una fuente, introducir URL no HTTP(S), declarar contradicción e intentar Confirmado. Revisar una noticia no confirmada y publicarla en la demo.
- **Observación:** la regla editorial de interfaz es propuesta. No demuestra validación ni autorización del backend.
- **Corrección:** pendiente de acuerdo y prueba real con roles.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Construir publicación administrativa | Editor por pasos y confirmación humana explícita | El usuario aprobó el portal de demo | Lectura del guard de servidor. Pruebas con cuentas pendientes |

### Imagen alternativa con origen comprensible

- **Comprensión:** `instructions.md`, Imágenes, exige alternativa, procedencia y condiciones de uso.
- **Hipótesis:** una etiqueta persistente distingue ilustración de fotografía. Alternativa: imagen sin explicación de origen.
- **Construcción:** SVG locales y selector de ejemplos. [Spec de imágenes](specs/imagenes.md).
- **Prueba prevista:** elegir cada ilustración, publicar la demo y revisar origen en tarjeta y lector. Probar candidatas reales cuando exista el servicio.
- **Observación:** el agente escribió las ilustraciones SVG y su etiqueta declara esa asistencia. No se consultó un banco ni un servicio de generación de imágenes. D-23 sigue vigente para el producto real.
- **Corrección:** la primera redacción negaba de forma demasiado amplia la generación con IA. Se corrigieron la etiqueta y la procedencia para reconocer la asistencia de Codex al escribir los SVG. No son candidatas de banco ni evidencia del hecho.
- **Referencias:** tareas del spec. ID propio y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Preparar el flujo sin servicio de imágenes | Ilustraciones locales identificadas solo para la demo | El usuario autorizó la demostración | Inspección de SVG y etiquetas. Prueba visual pendiente |

### Límites de IA sin bloquear la lectura

- **Comprensión:** `instructions.md`, Presupuesto y uso de IA, fija USD 20 y exige reserva, gasto y ahorro.
- **Hipótesis:** explicar indisponibilidad conserva la lectura y evita reintentos costosos. Alternativa: reintentar sin control.
- **Construcción:** estado de límite en la demo y consumo no disponible en el portal. [Spec del portal](specs/portal-admin.md).
- **Prueba prevista:** seleccionar Límite de IA, comprobar que el envío se desactiva y seguir leyendo. Luego comprobar el bloqueo real del servidor.
- **Observación:** no hay gasto medido ni llamadas a IA en esta entrega.
- **Corrección:** el panel usa «no disponible», no cifras inventadas ni un saldo supuesto.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Mostrar límites de la función | Pausar consultas conservando el feed | El usuario aprobó una demo sin consumo de IA | Revisión de llamadas. Tope real pendiente de Backend e IA |

### Instalación sin asistencia del equipo

- **Comprensión:** `instructions.md`, Alcance y Presentación, exige compartir la app sin tiendas y probarla con compañeros.
- **Hipótesis:** los pasos existentes bastan dentro de la nueva navegación. Alternativa: explicar la instalación fuera de la app.
- **Construcción:** reutilizar `InstallPrompt` en portada y perfil. [Spec PWA](specs/pwa.md).
- **Prueba prevista:** una persona ajena abre el enlace, entra con Google, instala en cada plataforma y recorre las pantallas sin ayuda.
- **Observación:** no hubo prueba nueva ni cambio del manifiesto.
- **Corrección:** el nombre e iconos instalados siguen pendientes de coordinación con Infra.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Conservar instalación dentro del frontend | Reutilizar los componentes existentes | El usuario aprobó conservar la infraestructura | Lectura del código. Prueba con persona externa pendiente |

## 3. Manejo de agentes

### Encargo y límites

Antes de una intervención, entregar requisito, tarea, spec, bitácora, decisiones, rama, carpetas permitidas y criterio de aceptación.
Indicar dependencias y prohibición vigente de ejecutar app, compilación, pruebas o validadores.
El agente debe separar hechos del repositorio, propuestas y resultados pendientes.
Debe escribir Cambio en curso antes del código y trabajar con las skills de documentación del repositorio.

| Role | Responsibility |
|---|---|
| Persona responsable | Decide prioridades, acepta o corrige propuestas, ejecuta pruebas y aporta resultados |
| Agente de implementación | Inspecciona, propone, modifica solo el alcance y registra límites y cambios |
| Agente de revisión, si se solicita | Revisa requisitos y riesgos concretos. Su lectura no sustituye una prueba |

Se usó un agente. No se delegaron tareas a otros agentes.
Si se solicita colaboración después, asignar objetivos y archivos separados. Evitar ediciones simultáneas del mismo archivo.

### Evidencia de intervención

Cada ficha utiliza Agent, Request, Proposal, Decision y Verification.
Añadir fecha real y cambios efectivamente realizados. No atribuir al equipo una propuesta no aceptada.
Registrar errores del agente cuando cambien una decisión. No convertir cada conversación en un ciclo.
No guardar conversaciones completas ni datos personales. No inventar el modelo exacto.
Los commits asistidos llevan Co-Authored-By. Antes del commit se revisa git diff --stat.
Cada entrega informa cambios, verificación realizada y pendientes.

La IA que ayuda a programar no es la IA del producto. Este frontend de demostración no llama a un modelo.

## 4. Dependencias y tareas de integración

Ninguno de estos endpoints de noticias existe en la base revisada. Son propuestas, no servicios disponibles.
Los nombres y tipos deben acordarse con sus responsables antes de conectar la UI y retirar los ejemplos.

| Method | Endpoint | Frontend needs | Owner |
|---|---|---|---|
| GET | `/api/catalogs` | Regiones, temas y valores editoriales admitidos | Gerardo |
| GET / PATCH | `/api/profile` | Perfil y región simulada persistente | Gerardo |
| GET | `/api/feed` | Noticias ordenadas, nivel visual, motivo e importancia transversal | Gerardo, con recomendación de Rodrigo |
| GET | `/api/articles/[id]` | Cuerpo, resumen, fuentes, fechas, estado, tipo e imagen con procedencia | Gerardo |
| POST | `/api/interactions` | Apertura aceptada o rechazada y política de deduplicación acordada | Gerardo, con recomendación de Rodrigo |
| POST | `/api/chat` | Texto, citas validadas, estados y falta de cobertura o indisponibilidad | Gerardo y Rodrigo |
| GET / POST | `/api/admin/articles` | Lista y publicación humana con errores de campos | Gerardo |
| POST | `/api/admin/images/preview` | Candidatas y su origen, autor, licencia, condiciones y costo | Gerardo y Rodrigo |
| GET | `/api/admin/ai-usage` | Gasto, saldo, reserva, costo por función y disponibilidad | Gerardo y Rodrigo |

Patrones propuestos: éxito `{ data, meta }` y error `{ error: { code, message } }`.
La identidad se obtiene de la sesión del servidor, nunca de un user_id enviado por la UI.
Las respuestas privadas usan `private, no-store`. Cada endpoint comprueba sesión y rol cuando corresponda.
Una API devuelve 401 sin sesión y 403 sin permiso. Las páginas administrativas conservan 404 para cuentas comunes.
El contenido se representa como texto, no como HTML recibido. Las URLs de fuente se validan antes de mostrarlas.
El tipo definitivo se incorpora a `src/types/` mediante el PR de Backend. Los tipos de demo no lo sustituyen.

### Tareas útiles y ubicación del registro

| Task | Spec | Status | Acceptance evidence |
|---|---|---|---|
| Revisar identidad, cuatro niveles y lectura | [feed y lector](specs/feed-y-lector.md) | Código escrito, pendiente de prueba | Dispositivo, estados, navegación y resultado |
| Revisar chat, citas y memoria temporal | [chat](specs/chat.md) | Código escrito, pendiente de prueba | Cuatro consultas, reapertura y resultados |
| Conectar región y señales reales | [perfil](specs/ubicacion-y-perfil.md) | Dependencia pendiente | Dos cuentas y cambio observable |
| Revisar publicación y controles editoriales | [portal](specs/portal-admin.md) | Código escrito, pendiente de prueba | Roles, casos de validación y publicación temporal |
| Integrar candidatas con licencia y procedencia | [imágenes](specs/imagenes.md) | Dependencia pendiente | Fuente real, licencia y etiqueta en dos pantallas |
| Coordinar marca instalada y verificar teléfonos | [PWA](specs/pwa.md) | Dependencia y pruebas pendientes | iPhone, Android y persona ajena |
| Retirar ejemplos al conectar servicios | Specs de cada feature | Pendiente | Datos reales y ausencia de sustitución silenciosa por demo |

## 5. Verificación y presentación

### Registro honesto

El agente leyó archivos y revisó el diff. No inició un servidor, navegador local, compilador, linter ni pruebas.
No hay resultados de ejecución. Nada está marcado como Done por haber escrito código.
La entrega local queda en la rama de frontend. El PR y la fusión siguen pendientes.
Subir la rama puede activar una compilación de Vercel. El usuario decidirá cuándo hacerlo, porque reservó las ejecuciones a su cargo.
Las pruebas del usuario deben registrar fecha, entorno, dispositivo, acción, observación y resultado.
La demo no acredita personalización, publicación, fuentes externas, presupuesto ni respuestas de IA reales.

### Pruebas que ejecutará el usuario

1. Ejecutar `npm run typecheck` y `npm run lint`.
2. Compilar y abrir la app según el procedimiento vigente del repositorio.
3. Probar sin sesión, con cuenta común y con administrador.
4. Probar feed, chat, lector, región y portal en iPhone y Android reales, con la PWA instalada.
5. Revisar orientación, teclado virtual, texto ampliado, foco, tema oscuro y movimiento reducido.
6. Usar Probar estados para revisar carga, vacío, error, sin conexión y límite de IA.
7. Comprobar desconexión real por separado. Una simulación visual no prueba el service worker.
8. Publicar un ejemplo y abrirlo en el lector de la misma pestaña. Recargar y comprobar que desaparece.
9. Registrar los fallos sin ocultarlos. Abrir ciclos solo cuando la evidencia cambie una decisión.

### Orden obligatorio de la presentación

| Order | Topic | Frontend demonstration | Requirements | Evidence / dependency |
|---|---|---|---|---|
| 1 | Producto y alcance | Explicar dominio, audiencia y diferencia entre demo e integración | RF-01, RPR-02 | Alcance y specs. Validación pendiente |
| 2 | Aplicación móvil | Google, instalación, chat, feed, lector y región | RF-01, RF-02, RF-04, RF-07, RF-08, RF-09 | iPhone y Android reales pendientes |
| 3 | Publicación en vivo | Editor, revisión e imagen alternativa | RF-15, RF-16, RF-17, RF-18 | Publicación real depende de Backend |
| 4 | Validación con compañeros | Comparar cuentas, regiones, posición y prominencia | RF-04, RF-06, RF-08, RF-11 | Personalización real pendiente |
| 5 | Chat | Cuatro consultas, citas y falta de cobertura | RF-12, RF-13, RF-14, RT-06 | IA e integración pendientes |
| 6 | Arquitectura y decisiones | Mostrar flujo UI, API y servicios, con límites claros | RT-01, RP-03 | Contratos pendientes de acuerdo |
| 7 | Transparencia y responsabilidad | Estados, procedencia, imágenes y decisión humana | RT-01 a RT-06 | Pruebas editoriales pendientes |
| 8 | Ciclos y gestión | Seguir requisito, hipótesis, cambio, prueba y decisión | RPR-01 a RPR-03 | Solo ciclos reales con evidencia |
| 9 | Costos | Panel alimentado por el servidor | RP-01, RP-02 | Registro y tope de IA pendientes |
| 10 | Lecciones aprendidas | Explicar hipótesis respaldadas, refutadas y límites | RPR-01, RPR-03 | No redactar conclusiones antes de probar |

### Traslado a Notion

1. Importar este archivo como Text & Markdown desde Notion en escritorio o navegador.
2. Crear las filas propias de frontend en la base de ciclos del proyecto.
3. Usar Title como título, Status como estado, Requirements e Hypothesis como texto y Cycle como ID de la base.
4. Colocar cada ficha en la página de su fila. Una importación de Markdown no crea por sí sola el tablero.
5. Reemplazar Por asignar con los IDs generados por Notion y copiar los enlaces a los specs.
6. Mantener las hipótesis completas en Notion. Mantener tareas y evidencia en los specs.
7. Conservar en este archivo la fecha y referencia de traslado. No mantener otra lista independiente de estados.

El conector no pudo leer la página del proyecto durante la planificación. No se publicaron cambios en Notion.
No se copian ni se modifican los ciclos de otros integrantes. No se inventan enlaces, IDs ni resultados.
