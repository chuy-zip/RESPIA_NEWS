# The Meridian Times: investigación y auditoría de frontend

**Fecha del registro:** 2026-10-09, Guatemala. **Responsable de frontend:** Sergio Orellana.
**Estado:** unificación visual y navegación por páginas implementadas en el directorio de trabajo. Pruebas con sesión, integración y verificación móvil pendientes.
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
- Pantalla inicial de chat y edición en rutas independientes, cuatro niveles de tarjeta y lector completo.
- Región simulada, sin GPS, y portal protegido por el rol existente.
- Identidad The Meridian Times, titulares serif, tema automático y movimiento reducido.
- Demostración en memoria, sin persistencia de noticias, preguntas, regiones ni lecturas.
- Respuestas preparadas para cuatro consultas de ejemplo. Una consulta libre explica que el servicio no está conectado.
- La demo solo utiliza su corpus ficticio. No realiza búsqueda externa ni llamadas a modelos.
- En la primera entrega, el usuario reservó las ejecuciones a su cargo. En esta revisión autorizó al agente a ejecutar verificaciones disponibles.
- La fase de implementación quedó sin operaciones de escritura en Git. Después, el usuario autorizó Conventional Commits locales separados y excluir las skills instaladas.
- La preparación de entrega no incluye push, creación de PR, merge ni despliegue. El usuario realizará la publicación conforme al proceso.

El enunciado menciona Firebase. D-03 aprueba Supabase Auth con Google. Se conserva ese acceso.
El enunciado no exige Jira. Este registro utiliza Notion, specs y bitácoras conforme al proceso.

### Diferencias detectadas al actualizar dev

La documentación cambió después de aprobar el plan. Se conservaron las modificaciones de otras áreas.
D-20 asigna el recomendador a IA. El frontend solo representa escenarios fijos y los resultados futuros del servidor.
D-23 establece imágenes de banco para el producto real. Los SVG locales son recursos de demostración, no otra estrategia de obtención.
D-24 y RF-14 ya contemplan fuentes externas. Esta demo interna no acredita ese criterio completo ni modifica la decisión.
D-22 define una política de presupuesto. La pantalla no inventa gasto, saldo ni reserva disponibles.

La primera entrega utilizó la rama de frontend por encargo del usuario. Ese antecedente no autoriza operaciones Git en esta revisión.
El usuario revisará los archivos y decidirá después cómo incorporarlos al repositorio conforme al proceso vigente.

### Auditoría técnica de esta revisión

La base utiliza Next.js 16.3.4 con App Router, React 19.3.0 y TypeScript 5.9.3, según `package.json`.
Supabase Auth con Google conserva la sesión. La instalación utiliza una PWA pura, conforme a D-01.
No hay registro por contraseña ni recuperación de contraseña. El proveedor Email permanece desactivado por D-07.

| Area | Current implementation | Boundary |
|---|---|---|
| Pantallas | `src/app/`, páginas de servidor y CSS Modules | Cada ruta protegida consulta el DAL antes de entregar contenido |
| Composición compartida | `EditorialShell`, `SiteHeader`, pie y enlace para saltar al contenido | Una identidad para páginas públicas, protegidas y app instalada |
| Componentes | `src/components/`, un componente por carpeta con `index.ts` | Reutilizar `ArticleCard`, `ArticleMeta`, `ArticleVisual`, `StateNotice`, `Button` e `InstallPrompt` |
| Estado temporal | `DemoSession` en el layout raíz, reiniciado por identidad | Artículos, región, mensajes y lecturas en memoria. No persistencia editorial |
| Estilos | `src/styles/tokens.css`, `globals.css` y módulos locales | Sin librerías de animación ni dependencias nuevas |
| Datos | Fixtures explícitos en `DemoSession/demo.ts` | No son DTOs aprobados ni resultados de servicios |
| Backend actual | Callback de autenticación, acción de cierre de sesión y prueba técnica `/api/joke` | No hay API operativa de noticias, búsqueda, guardados, perfil editorial ni chat |
| Tipos compartidos | `src/types/joke.ts` | Los futuros tipos de noticias necesitan acuerdo con Backend |

La auditoría no encontró el texto «Sesión iniciada. Ya puedes entrar al contenido protegido» en el código actual.
El subagente de autenticación lo encontró en las referencias locales `origin/dev` y `origin/main`.
Antes de esta revisión, `/contenido` ya redirigía a `/` cuando había sesión. No se identificó el origen que abrió el usuario.
Esto no demuestra un fallo de caché ni de autenticación. La comparación con la URL que abrió el usuario sigue pendiente.

### Identidad editorial que se conserva

La versión de referencia es The Meridian Times presente en los componentes editoriales y sus tokens.
Los referentes conceptuales aportan jerarquía, legibilidad y composición. No se copian marcas ni pantallas de otros medios.

| Token group | Current values | Application |
|---|---|---|
| Superficies claras | Papel `#f7f5f0`, elevada `#ffffff`, hundida `#eeece5` | Contraste editorial sin fondo uniforme |
| Texto y acento claros | Tinta `#242721`, secundaria `#63665e`, acento `#303e35` | Se conserva el acento verde profundo existente |
| Borde funcional claro | `--color-line-strong: #83897e` | Mayor separación visual de campos y controles |
| Tema oscuro | Superficie `#171c19`, tinta `#f0eee6`, acento `#ccd9c9` | Preferencia automática del sistema |
| Tipografías | Georgia para titulares y cuerpo del lector, Inter para interfaz y resúmenes, JetBrains Mono para metadatos | Sin sustitución de familias |
| Escala | Texto base `1rem`, `--text-xs` a `--text-hero`, con `clamp()` para tamaños destacados | Titulares fluidos y cuerpo de artículo independiente |
| Espaciado | `--space-1` a `--space-8`, de `0.25rem` a `4rem` | Ritmo común sin imponer tarjetas idénticas |
| Composición | Ancho máximo `82rem`, lectura `43rem`, breakpoint `40rem` | Edición amplia y columna de lectura contenida |
| Bordes y elevación | Separadores finos, radios existentes de 6, 10 y 16 px, sombras discretas | Los artículos conservan composición editorial |
| Interacción | Área táctil `2.75rem`, foco visible, transiciones de 120 y 220 ms | Feedback breve sin retrasar la navegación |
| Accesibilidad | `prefers-reduced-motion`, áreas seguras y texto de estado | El color y el movimiento no transmiten información por sí solos |

### Mapa de navegación acordado

Estas rutas ya tienen código. La verificación anónima no cierra las tareas que requieren una cuenta, servicios o teléfonos reales.
Los nombres de categorías provendrán del catálogo. Los tres temas actuales siguen siendo fixtures de demostración.

| Route | Access | Purpose | Status |
|---|---|---|---|
| `/` | Público | Portada y acceso Google. Con sesión, redirige a `/chat` | Implementada. HTTP anónimo 200. Redirección con sesión pendiente |
| `/chat` | Sesión | Inicio autenticado, conversación temporal y citas | Implementada. Acceso anónimo comprobado. Recorrido con sesión pendiente |
| `/edicion` | Sesión | Feed editorial separado, con jerarquía y bloque importante | Implementada. Prueba del feed con sesión pendiente |
| `/temas/[slug]` | Sesión | Noticias del tema reconocido por el catálogo | Implementada. Filtros y slug inválido con sesión pendientes |
| `/buscar?q=&topic=&sort=` | Sesión | Consulta, filtros, orden y resultados de demostración | Implementada como demo. Prueba con sesión e ID de ampliación pendientes |
| `/noticias/[id]` | Sesión | Lectura completa, fuentes y procedencia | Lector ampliado. Recorrido y compartir con sesión pendientes |
| `/guardados` | Sesión | Explicar disponibilidad pendiente de artículos guardados | Pantalla implementada, sin persistencia simulada. Prueba con sesión e ID pendientes |
| `/perfil` | Sesión | Cuenta, región temporal, lecturas e instalación | Unificación implementada. Pruebas con sesión pendientes |
| `/admin` | Administrador | Revisión y publicación temporal | Acceso anónimo comprobado. Pruebas de administrador y 404 para cuenta común pendientes |
| `/privacidad` | Público | Datos realmente tratados, URL de búsqueda y límites de la demo | Actualizada. HTTP anónimo 200 |
| `/contenido` | Compatibilidad | Con sesión, dirigir a `/chat`. Sin sesión, ofrecer acceso | Implementada. Acceso anónimo comprobado. Redirección con sesión pendiente |
| `/auth/callback` | Retorno OAuth | Canjear el código y volver a `/` | Sin modificación. HTTP 307 sin código comprobado, OAuth pendiente |

El callback conserva su retorno a `/`. La página decide la llegada a `/chat` después de verificar la sesión.
La navegación enlaza páginas reales y marca la sección activa. Los errores de acceso comparten el lenguaje visual mediante `AccessPrompt`.
La configuración se integra en perfil. No se añaden controles de datos que el producto todavía no puede guardar.

### Cambios implementados y límites

- El layout raíz contiene el marco editorial. Recibe identidad y rol del servidor y conserva la autorización individual de cada página.
- Chat y edición tienen rutas separadas. La conversación se desplaza dentro de su panel y el compositor permanece en el flujo.
- Temas y búsqueda reutilizan el catálogo ficticio. La búsqueda admite orden reciente o antiguo y conserva filtros en la URL.
- La presentación de búsqueda acota `q` a 200 caracteres. Este límite de demo no define un límite de Backend.
- El lector incorpora bloques tipados, firma ficticia, compartir con alternativa para copiar y noticias relacionadas de demostración.
- El perfil agrupa cuenta, región, instalación y acceso a Guardados. Guardados informa que la integración no está disponible.
- `SignInButton` muestra un error accesible si no puede abrir Google. No se cambió el protocolo de autenticación.
- Carga, error y ruta inexistente reutilizan `StateNotice`. Las rutas de carga son `/chat`, `/edicion` y `/buscar`.
- Los formularios del portal conservan el borrador, relacionan errores con campos y trasladan el foco al resumen o paso correspondiente.
- La privacidad explica que `q`, `topic` y `sort` pueden quedar en el historial del navegador y viajar al compartir la URL.

No se conectó ningún endpoint nuevo. Todos los servicios editoriales siguen propuestos.
La revisión retiró el `loading.tsx` de raíz para evitar que un fallback global envíe HTTP 200 antes del `notFound()` administrativo.
La corrección conserva el guard del servidor. La prueba con cuenta común sigue pendiente, por petición expresa del usuario.
Este riesgo se comprobó por lectura del código y de la [documentación de estados HTTP de Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes).

### Aplicación instalada y dependencias de infraestructura

El manifiesto existente define `start_url: "/"`, `scope: "/"` y `display: "standalone"`.
La app instalada carga las mismas rutas y componentes que el navegador. El inicio con sesión debe llegar a `/chat` desde ese punto de entrada.
El service worker excluye `/api/*` y respuestas privadas o `no-store`. Mantiene una pantalla de desconexión y recursos estáticos.
No existe lectura privada sin conexión. Guardar una noticia no autoriza cachear su contenido.

El manifiesto, los iconos, los metadatos de instalación, `offline.html` y el comportamiento del service worker quedan coordinados con Ricardo.
Su nombre instalado todavía es RESPIA. Los colores de tema del layout ya siguen el papel editorial, pero el manifiesto conserva sus valores anteriores.
No se modificaron manifiesto, iconos, offline ni worker. Si cambia el worker, Infra debe revisar `CACHE_VERSION` y su activación.
La continuidad visual de la pantalla offline y de los elementos del sistema permanece como dependencia explícita.

## 2. Ciclos propios de frontend

Las filas son hipótesis propuestas. Notion asignará sus IDs cuando el usuario las traslade.
Estados: Propuesta, Abierta y Cerrada. Una hipótesis refutada puede cerrar un ciclo sin cerrar su tarea de implementación.
Solo se abre un ciclo cuando existe una incertidumbre que investigar. No se fabrican ciclos para alcanzar una cantidad.

| Cycle | Title | Status | Requirements | Hypothesis |
|---|---|---|---|---|
| Por asignar | [Feed y chat como experiencia inicial](#feed-y-chat-como-experiencia-inicial) | Abierta | RF-07, RF-08, RF-12 | Separar conversación y edición permite recorrer consulta, lectura y regreso sin que los mensajes alarguen el feed. La llegada autenticada conserva el chat. |
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
- **Hipótesis:** la primera entrega combinaba feed y chat. La revisión propone rutas independientes, con chat como llegada autenticada.
- **Construcción:** `NewsDesk` y `ChatPanel` ya tienen rutas separadas, con cuatro preguntas preparadas y enlaces al lector. [Spec de chat](specs/chat.md).
- **Prueba prevista:** entrar con sesión, consultar, abrir una cita y regresar. Cambiar a edición y comprobar que la conversación no alarga esa página.
- **Observación:** el usuario reportó que la pantalla parecía extenderse hacia abajo al seleccionar botones. Es un reporte del usuario, no una prueba reproducida por el agente.
- **Corrección:** el usuario pidió varias páginas reales. La navegación separada reemplaza la hipótesis de una sola pantalla, sin cambiar RF-07.
- **Referencias:** tareas del spec. ID, enlace de Notion y PR pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Construir el inicio de frontend | Integrar feed y chat con respuestas identificadas | El usuario aprobó el plan | Lectura estática. Pruebas de las cuatro consultas pendientes |
| Codex, coordinador y subagentes de esta revisión | Conservar identidad y separar recorridos | Chat inicial y edición en rutas propias | El usuario solicitó la separación después de usar la demo | Reporte del usuario y auditoría de código. Validación del nuevo recorrido pendiente |

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
- **Observación:** la primera entrega no renderizó la interfaz. Esta revisión conserva pendientes las pruebas con sesión y teléfonos reales.
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
- **Observación:** se consultó el manifiesto servido en producción local. No hubo cambio del manifiesto ni prueba de instalación nueva.
- **Corrección:** el nombre e iconos instalados siguen pendientes de coordinación con Infra.
- **Referencias:** tareas del spec. ID y Notion pendientes.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Conservar instalación dentro del frontend | Reutilizar los componentes existentes | El usuario aprobó conservar la infraestructura | Lectura del código. Prueba con persona externa pendiente |

## 3. Manejo de agentes

### Encargo y límites

Antes de una intervención, entregar requisito, tarea, spec, bitácora, decisiones, rama, carpetas permitidas y criterio de aceptación.
Indicar dependencias, verificaciones autorizadas y restricciones vigentes. Esta revisión permite verificar código y prohíbe toda operación Git mutante.
El agente debe separar hechos del repositorio, propuestas y resultados pendientes.
Debe escribir Cambio en curso antes del código y trabajar con las skills de documentación del repositorio.

| Role | Responsibility |
|---|---|
| Persona responsable | Decide prioridades, acepta o corrige propuestas, ejecuta pruebas y aporta resultados |
| Agente de implementación | Inspecciona, propone, modifica solo el alcance y registra límites y cambios |
| Agente de revisión, si se solicita | Revisa requisitos y riesgos concretos. Su lectura no sustituye una prueba |

La primera entrega utilizó un agente. En esta revisión, el usuario solicitó subagentes y el coordinador delegó tres auditorías.
Cada encargo tuvo objetivo y límites explícitos. La auditoría precedió a las modificaciones.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex coordinador, modelo exacto no disponible | Conservar el diseño, separar páginas y dirigir la integración | Reutilizar el sistema editorial y delimitar archivos por encargo | El usuario autorizó implementación, subagentes y verificaciones, sin operaciones Git mutantes | Integra las revisiones y registra las pruebas ejecutadas |
| Codex, subagente de diseño y páginas | Leer frontend-design y ui-ux-pro-max, revisar identidad e implementar páginas asignadas | Conservar tokens y separar chat, edición, búsqueda y temas | El coordinador delimitó sus archivos de interfaz | Lectura de componentes, estilos y referencias de las skills. Implementación integrada por el coordinador |
| Codex, subagente de autenticación, PWA y experiencia | Revisar sesión e instalación, y mejorar las interacciones asignadas | Mantener DAL y callback, unificar experiencia y coordinar infraestructura con Ricardo | La infraestructura queda como dependencia separada | Lectura del código, revisión del mensaje antiguo y correcciones de interacción |
| Codex, subagente de integración y documentación | Auditar endpoints, revisar regresiones y cerrar documentos asignados | Distinguir contratos y evidencias, preservar el 404 administrativo y alinear búsqueda | El coordinador asignó documentos en exclusiva y recibió las observaciones de código | Auditoría estática, ejemplos JSON, Markdown y registro de resultados del coordinador |

No se editan simultáneamente los mismos archivos. El coordinador integra los resultados antes de cerrar la revisión.
Las revisiones de agentes no sustituyen las pruebas de autenticación, dispositivos o contratos operativos.
Se leyeron las skills de documentación del repositorio antes de editar este registro.

### Evidencia de intervención

Cada ficha utiliza Agent, Request, Proposal, Decision y Verification.
Añadir fecha real y cambios efectivamente realizados. No atribuir al equipo una propuesta no aceptada.
Registrar errores del agente cuando cambien una decisión. No convertir cada conversación en un ciclo.
No guardar conversaciones completas ni datos personales. No inventar el modelo exacto.
La regla general exige Co-Authored-By en commits asistidos. La entrega posterior autoriza staging explícito y commits locales separados, sin publicar.
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

### Requerimientos para Backend

Esta sección permite coordinar los servicios que necesita la navegación. No activa servicios ni publica contratos definitivos.
La auditoría distingue tres estados:

| State | Meaning |
|---|---|
| Existente | Código operativo en el repositorio. La ficha indica si tiene consumidor actual |
| Requiere modificación | Una integración existente necesita un cambio identificado. No hay un endpoint de noticias en esta categoría |
| Propuesto | Ruta o contrato sin implementación. Los ejemplos describen la propuesta, no respuestas observadas |

Los endpoints anteriores conservan sus rutas propuestas. La búsqueda añade `GET /api/articles`.
Guardados añade una colección privada y dos operaciones sobre una referencia. Estas ampliaciones no tienen ID oficial de alcance.
El usuario las solicitó, pero el equipo debe asignarles requisito y criterio antes de cerrar su integración.
No se crea un requisito ficticio ni se cambia `ALCANCE.md` en silencio.

Los JSON siguientes son ilustrativos y contienen datos ficticios. No se ejecutaron contra un servidor.
Ningún éxito ilustrativo implica que la UI esté conectada. El estado de cada ficha es la fuente de verdad.
Los IDs, fechas, textos y URLs del ejemplo no identifican personas ni publicaciones reales.

#### Reglas comunes del contrato propuesto

- Backend obtiene identidad y permisos con el DAL. La UI no envía un rol ni un identificador de cuenta para autorizar.
- Las respuestas privadas usan `Cache-Control: private, no-store`. No se incorporan al service worker ni a almacenamiento del navegador.
- El patrón de éxito es `{ data, meta }`. El patrón de error es `{ error: { code, message } }`.
- Los errores por campo pueden añadir `error.fields`, pendiente de acuerdo con Gerardo.
- El mensaje de error debe ser seguro para mostrar. No incluye SQL, credenciales, trazas ni detalles del proveedor.
- El servidor valida entradas y estados editoriales. La validación de formularios mejora la experiencia, pero no sustituye ese control.
- Los listados usan cursor opaco y `meta.nextCursor`. El valor `null` indica que no hay otra página.
- Backend fija límites, desempates y filtros admitidos. Este registro no copia límites numéricos de ciclos de otros integrantes.
- No se sustituye un error real por fixtures. La demo conserva su identificación hasta integrar el servicio.
- El frontend no llama al modelo, no calcula recomendaciones y no modifica estados mediante respuestas del chat.

Ejemplo del formato de error común:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Selecciona una región disponible.",
    "fields": {
      "regionId": "La región no está disponible."
    }
  }
}
```

`fields` solo aplica a errores de campos. Un error de sesión usa `UNAUTHORIZED` y un mensaje para volver a iniciar sesión.
La UI conserva el texto de formularios ante error. No reintenta automáticamente operaciones que puedan consumir IA o publicar contenido.

#### Tipos propuestos para coordinar

Estos nombres documentan estructuras JSON. No son archivos nuevos de `src/types/` ni contratos aprobados.
Gerardo coordina los tipos compartidos con Ricardo antes de conectar consumidores.
Los tipos `DemoArticle` y `DemoMessage` permanecen locales a la demostración.

| Type | Fields and meaning |
|---|---|
| `CatalogItem` | `id: string`, `slug: string`, `label: string`. Separar identificador, URL y etiqueta visible |
| `CatalogData` | `regions: CatalogItem[]`, `topics: CatalogItem[]`, estados y tipos editoriales admitidos |
| `EditorialStatus` | confirmed, developing, unconfirmed. El servidor asigna el valor editorial |
| `ContentType` | original, summary, ai_contribution. La UI traduce a etiquetas en español |
| `ArticleSummary` | ID, título, resumen, IDs de temas, fecha ISO 8601, estado, tipo e imagen opcional |
| `ArticleDetail` | Resumen ampliado con bloques de contenido, fuentes, regiones, autor opcional y nota editorial. Relacionados pendientes de acuerdo |
| `ContentBlock` | `type: paragraph` o `heading`, con `text: string`. Texto sin HTML crudo |
| `Source` | `name: string` y `url: string` HTTP(S). Referencia validada por Backend |
| `ImageProvenance` | URL, texto alternativo, origen, URL de procedencia, autor, licencia y etiqueta. Dimensiones pendientes de acuerdo para prevenir saltos |
| `Prominence` | hero, large, standard, compact. Backend acuerda el mapeo de sus niveles a estas variantes existentes |
| `FeedItem` | `article: ArticleSummary`, prominencia y explicación legible. Componentes de relevancia del servidor cuando se acuerden |
| `FeedData` | Lista ordenada `items` y bloque `importantItems` que conserva información fuera de preferencias |
| `EditorialProfile` | `regionId: string` o `null`. No añade edición de nombre, correo ni contraseña |
| `UpdateProfileInput` | `regionId: string`, validado contra catálogo |
| `InteractionInput` | `articleId: string`, `type: open`, identificador del evento. Política de deduplicación pendiente de acuerdo |
| `InteractionResult` | `accepted: boolean`, `duplicate: boolean` |
| `ChatRequest` | Pregunta y mensajes temporales. Formato y límites del contexto se coordinan con IA y Backend |
| `ChatResponse` | Estado answered, no_coverage o unavailable, con segmentos de texto y citas |
| `ChatCitation` | Interna: ID, título, estado y tipo editorial de la noticia. Externa: URL, nombre y etiqueta obligatoria de D-24 |
| `ChatSegment` | Texto y citas que lo respaldan. No entregar texto externo sin procedencia |
| `PublishArticleInput` | Contenido, metadatos editoriales, imagen con origen y confirmación humana. Backend valida todos los campos |
| `PublicationResult` | ID y estado de publicación. Un resultado real no se sustituye por la inserción local de la demo |
| `ImageCandidates` | Candidatas con procedencia, sugerencia opcional, costo estimado y disponibilidad |
| `AiUsageSummary` | Moneda, gasto, saldo, reserva, tope, desglose por función y disponibilidad. `null` expresa dato no disponible |
| `ArticleSearchResult` | Artículos y filtros aplicados. No confundir ranking de búsqueda con recomendación personal |
| `SavedArticle` | Resumen del artículo y fecha de guardado. Política de artículos retirados pendiente |
| `BookmarkResult` | `articleId: string` y `saved: boolean` |
| `PageMeta` | `nextCursor: string` o `null`. Límite y total, si existen, deben reflejar la consulta real |

D-23 regula las imágenes de banco. Una foto ilustrativa no se etiqueta como fotografía del acontecimiento.
D-24 permite fuentes externas únicamente bajo el control del servidor. La etiqueta externa será «Fuente externa, no verificada por la redacción».
La demo actual conserva solo citas internas y no acredita toda la integración de D-24.

#### Fichas de servicios propuestos

Cada ficha contiene los dieciséis campos de referencia solicitados, además de validación y responsable.
`Body` identifica campos obligatorios y opcionales cuando están acordados en esta propuesta.
Los límites todavía no acordados se indican como pendientes, sin presentar una cifra inventada.

##### 1. Catálogo editorial

| Field | Contract |
|---|---|
| Name | Catálogo editorial |
| Method | GET |
| Route | /api/catalogs |
| Purpose | Obtener regiones, temas y valores admitidos sin fijarlos en las páginas. |
| Path parameters | Ninguno. |
| Query parameters | Ninguna. |
| Body | No aplica. |
| Response JSON | `{"data":{"regions":[{"id":"region-demo","slug":"guatemala","label":"Guatemala"}],"topics":[{"id":"topic-demo","slug":"tecnologia","label":"Tecnología"}],"statuses":["confirmed","developing","unconfirmed"],"contentTypes":["original","summary","ai_contribution"]},"meta":{}}` |
| Types | `CatalogData`, `CatalogItem`, `EditorialStatus`, `ContentType`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Lector y administrador. |
| HTTP status | 200, 401, 503. |
| Errors | UNAUTHORIZED, SERVICE_UNAVAILABLE. |
| Pagination / filters | Sin paginación para catálogos de selección. No inventar opciones si falla. |
| Consumer | Navegación de temas, búsqueda, perfil, selector de región y portal. |
| Implementation status | Propuesto. Sin endpoint ni consumidor HTTP actual. |
| Validation | IDs y slugs únicos. El servidor define las opciones válidas. |
| Owner | Gerardo. Ricardo coordina la representación en datos. |

##### 2. Consultar perfil editorial

| Field | Contract |
|---|---|
| Name | Consultar perfil editorial |
| Method | GET |
| Route | /api/profile |
| Purpose | Mostrar región guardada y opciones de perfil realmente disponibles. |
| Path parameters | Ninguno. La identidad sale de la sesión. |
| Query parameters | Ninguna. |
| Body | No aplica. |
| Response JSON | `{"data":{"regionId":"region-demo"},"meta":{}}` |
| Types | `EditorialProfile` con `regionId: string` o `null`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Cada cuenta consulta su propio perfil. |
| HTTP status | 200, 401, 503. |
| Errors | UNAUTHORIZED, SERVICE_UNAVAILABLE. |
| Pagination / filters | No aplica. |
| Consumer | `/perfil`, edición, chat y selector compartido. |
| Implementation status | Propuesto. La región actual solo vive en `DemoSession`. |
| Validation | Resolver ausencia de elección como `null`. No devolver datos de otras cuentas. |
| Owner | Gerardo, con esquema de Ricardo. |

##### 3. Actualizar región

| Field | Contract |
|---|---|
| Name | Actualizar región |
| Method | PATCH |
| Route | /api/profile |
| Purpose | Guardar la ubicación simulada elegida por el lector. |
| Path parameters | Ninguno. No recibir `userId`. |
| Query parameters | Ninguna. |
| Body | Obligatorio: `{"regionId":"region-demo"}`. No añadir GPS ni identidad editable. |
| Response JSON | `{"data":{"regionId":"region-demo"},"meta":{}}` |
| Types | `UpdateProfileInput`, `EditorialProfile`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Cada cuenta modifica su propio perfil. |
| HTTP status | 200, 400, 401, 422, 503. |
| Errors | INVALID_BODY, UNAUTHORIZED, VALIDATION_ERROR, SERVICE_UNAVAILABLE. |
| Pagination / filters | No aplica. |
| Consumer | Selector en `/perfil` y edición. |
| Implementation status | Propuesto. No hay persistencia real. |
| Validation | Región existente y campos permitidos. Devolver error de campo sin perder la selección previa. |
| Owner | Gerardo. Ricardo define políticas de datos. Actualizar privacidad al integrar. |

##### 4. Edición personalizada

| Field | Contract |
|---|---|
| Name | Edición personalizada |
| Method | GET |
| Route | /api/feed |
| Purpose | Recibir orden, prominencia y explicación del recomendador, con noticias importantes fuera de preferencias. |
| Path parameters | Ninguno. |
| Query parameters | Opcionales: `topic` como slug, `cursor` opaco y `limit` entero. La región se obtiene del perfil. |
| Body | No aplica. |
| Response JSON | `{"data":{"items":[{"article":{"id":"article-demo","title":"Titular ficticio","summary":"Resumen ficticio","topicIds":["topic-demo"],"publishedAt":"2026-10-09T12:00:00Z","status":"developing","contentType":"original","image":null},"prominence":"hero","reason":"Ejemplo de explicación entregada por el servidor"}],"importantItems":[]},"meta":{"nextCursor":null}}` |
| Types | `FeedData`, `FeedItem`, `ArticleSummary`, `Prominence`, `PageMeta`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Lector y administrador. |
| HTTP status | 200, 400, 401, 503. |
| Errors | INVALID_FILTER, INVALID_CURSOR, UNAUTHORIZED, SERVICE_UNAVAILABLE. |
| Pagination / filters | Cursor estable. El servidor documenta límite por defecto y máximo. `importantItems` no desaparece por el filtro. |
| Consumer | `/edicion` y acceso resumido a recomendaciones desde chat. |
| Implementation status | Propuesto. La demo utiliza escenarios preparados. |
| Validation | Validar tema y cursor. Backend traduce los niveles del recomendador a variantes visuales acordadas. |
| Owner | Gerardo sirve la API. Rodrigo determina orden, relevancia y prominencia por D-20. |

##### 5. Leer noticia

| Field | Contract |
|---|---|
| Name | Leer noticia |
| Method | GET |
| Route | /api/articles/[id] |
| Purpose | Entregar una noticia publicada con su contenido y procedencia. |
| Path parameters | `id` de noticia, obligatorio. |
| Query parameters | Ninguna. |
| Body | No aplica. |
| Response JSON | `{"data":{"id":"article-demo","title":"Titular ficticio","summary":"Resumen ficticio","topicIds":["topic-demo"],"publishedAt":"2026-10-09T12:00:00Z","status":"developing","contentType":"original","image":null,"author":null,"regionIds":["region-demo"],"body":[{"type":"paragraph","text":"Contenido ficticio."}],"sources":[{"name":"Fuente de ejemplo","url":"https://example.org/"}],"reviewNote":"Estado asignado por la redacción.","relatedArticles":[]},"meta":{}}` |
| Types | `ArticleDetail`, `ContentBlock`, `Source`, `ImageProvenance`. |
| Authentication | Sesión mediante DAL antes de entregar el contenido. |
| Roles / permissions | Lector y administrador. Solo artículos publicados. |
| HTTP status | 200, 401, 404, 503. |
| Errors | UNAUTHORIZED, ARTICLE_NOT_FOUND, SERVICE_UNAVAILABLE. |
| Pagination / filters | Sin paginación del cuerpo. `relatedArticles` es una lista opcional acordada con Backend. |
| Consumer | `/noticias/[id]`, enlaces de citas y contenido compartido. |
| Implementation status | Propuesto. El lector obtiene hoy un `DemoArticle`. |
| Validation | No entregar borradores. Texto plano o bloques tipados, sin HTML crudo. Fuentes e imágenes con URL HTTP(S) válida. |
| Owner | Gerardo, con modelo editorial de Ricardo. Autor, bloques y relacionados pendientes de acuerdo. |

##### 6. Registrar apertura

| Field | Contract |
|---|---|
| Name | Registrar apertura |
| Method | POST |
| Route | /api/interactions |
| Purpose | Registrar la señal aprobada de lectura para personalización. |
| Path parameters | Ninguno. La identidad proviene del DAL. |
| Query parameters | Ninguna. |
| Body | Obligatorio: `{"articleId":"article-demo","type":"open","eventId":"event-demo"}`. `eventId` identifica el intento lógico. |
| Response JSON | `{"data":{"accepted":true,"duplicate":false},"meta":{}}` |
| Types | `InteractionInput`, `InteractionResult`. Ambos son propuestas. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Lector y administrador sobre noticias publicadas. |
| HTTP status | 200, 400, 401, 404, 422, 503. |
| Errors | INVALID_BODY, UNAUTHORIZED, ARTICLE_NOT_FOUND, VALIDATION_ERROR, SERVICE_UNAVAILABLE. |
| Pagination / filters | No aplica. |
| Consumer | Lector al abrir una noticia. |
| Implementation status | Propuesto. Actualmente `markRead` solo deduplica IDs en memoria. |
| Validation | Acordar ventana y clave de deduplicación. Repetir un evento no debe sumar otra señal. No aceptar peso calculado por el cliente. |
| Owner | Gerardo y Rodrigo. Ricardo define persistencia. Actualizar privacidad antes de guardar señales. |

##### 7. Preguntar sobre noticias

| Field | Contract |
|---|---|
| Name | Preguntar sobre noticias |
| Method | POST |
| Route | /api/chat |
| Purpose | Responder con citas verificadas por servidor y límites explícitos de disponibilidad. |
| Path parameters | Ninguno. |
| Query parameters | Ninguna. |
| Body | Obligatorio `question: string`. `messages` contiene solo el contexto temporal permitido por el contrato. Ejemplo: `{"question":"¿Qué novedades hay?","messages":[]}`. |
| Response JSON | `{"data":{"status":"answered","segments":[{"text":"Resumen ficticio del acontecimiento.","citations":[{"kind":"article","articleId":"article-demo","title":"Titular ficticio","status":"developing","contentType":"original"}]}]},"meta":{}}` |
| Types | `ChatRequest`, `ChatResponse`, `ChatSegment`, `ChatCitation`. Estados: answered, no_coverage, unavailable. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Lector y administrador. |
| HTTP status | 200, 400, 401, 422, 429, 503. |
| Errors | INVALID_BODY, UNAUTHORIZED, VALIDATION_ERROR, AI_LIMIT_REACHED, SERVICE_UNAVAILABLE. |
| Pagination / filters | Sin paginación. Longitud de entrada, contexto y salida se acuerdan con Backend e IA. Esta ficha no fija cantidades. |
| Consumer | `/chat` y `ChatPanel`. |
| Implementation status | Propuesto. La demo muestra respuestas preparadas y no procesa preguntas libres. |
| Validation | Servidor valida IDs y URLs. El estado editorial sale de datos. Fuentes externas solo según D-24, separadas y etiquetadas. Sin persistencia de conversación. |
| Owner | Gerardo y Rodrigo. El frontend no llama directamente a modelos ni decide veracidad. |

##### 8. Listar noticias administrativas

| Field | Contract |
|---|---|
| Name | Listar noticias administrativas |
| Method | GET |
| Route | /api/admin/articles |
| Purpose | Consultar las publicaciones gestionadas desde el portal. |
| Path parameters | Ninguno. |
| Query parameters | Opcionales: `q`, `topic`, `status`, `cursor`, `limit`. Valores admitidos desde catálogo. |
| Body | No aplica. |
| Response JSON | `{"data":{"items":[{"id":"article-demo","title":"Titular ficticio","summary":"Resumen ficticio","topicIds":["topic-demo"],"publishedAt":"2026-10-09T12:00:00Z","status":"developing","contentType":"original","image":null}]},"meta":{"nextCursor":null}}` |
| Types | `ArticleSummary[]`, `PageMeta`. |
| Authentication | Sesión y rol mediante DAL. |
| Roles / permissions | Solo administrador. |
| HTTP status | 200, 400, 401, 403, 503. |
| Errors | INVALID_FILTER, INVALID_CURSOR, UNAUTHORIZED, FORBIDDEN, SERVICE_UNAVAILABLE. |
| Pagination / filters | Cursor opaco. Orden estable definido por Backend. |
| Consumer | `/admin`, listado del portal. |
| Implementation status | Propuesto. El portal usa el contexto temporal. |
| Validation | No confiar en un rol enviado por el cliente. Validar filtros. |
| Owner | Gerardo. |

##### 9. Publicar noticia revisada

| Field | Contract |
|---|---|
| Name | Publicar noticia revisada |
| Method | POST |
| Route | /api/admin/articles |
| Purpose | Publicar contenido revisado por una persona para que aparezca en otros dispositivos. |
| Path parameters | Ninguno. |
| Query parameters | Ninguna. |
| Body | `PublishArticleInput`: título, resumen, bloques, fuentes, fecha, temas, regiones, estado, tipo, imagen con origen y confirmación humana. Ejemplo: `{"title":"Titular ficticio","summary":"Resumen ficticio","body":[{"type":"paragraph","text":"Contenido ficticio."}],"sources":[{"name":"Fuente de ejemplo","url":"https://example.org/"}],"publishedAt":"2026-10-09T12:00:00Z","topicIds":["topic-demo"],"regionIds":["region-demo"],"status":"developing","contentType":"original","imageCandidateId":"image-demo","reviewConfirmed":true}`. |
| Response JSON | `{"data":{"id":"article-demo","publicationState":"published"},"meta":{}}` |
| Types | `PublishArticleInput`, `PublicationResult`. Importancia editorial requiere coordinación con recomendación. |
| Authentication | Sesión y rol mediante DAL. |
| Roles / permissions | Solo administrador. La persona decide publicación y estado. |
| HTTP status | 201, 400, 401, 403, 409, 422, 503. |
| Errors | INVALID_BODY, UNAUTHORIZED, FORBIDDEN, PUBLICATION_CONFLICT, VALIDATION_ERROR, SERVICE_UNAVAILABLE. |
| Pagination / filters | No aplica. |
| Consumer | Revisión final de `/admin`. |
| Implementation status | Propuesto. La publicación actual solo inserta en memoria. |
| Validation | Aplicar reglas editoriales también en servidor. Rechazar origen de imagen ausente, fuentes inválidas y confirmación humana ausente. Acordar reintentos sin duplicar publicación. |
| Owner | Gerardo y Ricardo. La política editorial se acuerda con el equipo. |

##### 10. Previsualizar candidatas de imagen

| Field | Contract |
|---|---|
| Name | Previsualizar candidatas de imagen |
| Method | POST |
| Route | /api/admin/images/preview |
| Purpose | Ofrecer candidatas de un banco y sus condiciones de uso antes de confirmar. |
| Path parameters | Ninguno. |
| Query parameters | Ninguna. |
| Body | Obligatorios `title`, `summary` y `topicIds`. Ejemplo: `{"title":"Titular ficticio","summary":"Resumen ficticio","topicIds":["topic-demo"]}`. |
| Response JSON | `{"data":{"candidates":[{"id":"image-demo","url":"https://example.org/illustration.jpg","alt":"Ilustración de ejemplo","origin":"stock","sourceUrl":"https://example.org/","author":"Autor de ejemplo","license":"Licencia de ejemplo pendiente de validar","label":"Imagen ilustrativa"}],"suggestedId":null,"estimatedCostUsd":null,"availability":"unavailable"},"meta":{}}` |
| Types | `ImageCandidates`, `ImageProvenance`, costo decimal o `null` cuando no está disponible. |
| Authentication | Sesión y rol mediante DAL. |
| Roles / permissions | Solo administrador. |
| HTTP status | 200, 400, 401, 403, 422, 429, 503. |
| Errors | INVALID_BODY, UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR, AI_LIMIT_REACHED, SERVICE_UNAVAILABLE. |
| Pagination / filters | Sin contrato de paginación acordado. Lista de candidatas con cantidad definida por Backend. |
| Consumer | Paso de imagen en `/admin`. |
| Implementation status | Propuesto. Los SVG actuales son ilustraciones de demo asistidas por IA. |
| Validation | D-23: banco, sin generación. Conservar origen, autor y licencia. La sugerencia puede ser nula y no publica. La persona confirma. |
| Owner | Gerardo y Rodrigo. Ricardo coordina almacenamiento y procedencia. |

##### 11. Consultar disponibilidad y consumo de IA

| Field | Contract |
|---|---|
| Name | Consultar disponibilidad y consumo de IA |
| Method | GET |
| Route | /api/admin/ai-usage |
| Purpose | Mostrar gasto, saldo, reserva y disponibilidad medidos en servidor. |
| Path parameters | Ninguno. |
| Query parameters | Ninguna inicialmente. Periodos futuros requieren acuerdo. |
| Body | No aplica. |
| Response JSON | `{"data":{"currency":"USD","spent":null,"remaining":null,"reserved":null,"applicationLimit":null,"byFunction":[],"availability":"unavailable"},"meta":{}}` |
| Types | `AiUsageSummary`. Importes decimales o `null`, nunca ceros de sustitución. |
| Authentication | Sesión y rol mediante DAL. |
| Roles / permissions | Solo administrador. |
| HTTP status | 200, 401, 403, 503. |
| Errors | UNAUTHORIZED, FORBIDDEN, SERVICE_UNAVAILABLE. |
| Pagination / filters | No aplica al resumen. |
| Consumer | Estado de consumo en `/admin`. |
| Implementation status | Propuesto. La interfaz informa que el dato no está disponible. |
| Validation | D-22 define presupuesto y reserva. El servidor entrega el estado vigente. Fallo de lectura no equivale a saldo disponible. |
| Owner | Gerardo y Rodrigo. No se codifica gasto ni disponibilidad en frontend. |

##### 12. Buscar y explorar noticias

| Field | Contract |
|---|---|
| Name | Buscar y explorar noticias |
| Method | GET |
| Route | /api/articles |
| Purpose | Buscar texto y navegar por temas sin convertir la búsqueda en un recomendador. |
| Path parameters | Ninguno. |
| Query parameters | Opcionales: `q: string`, `topic: slug`, `sort: recent` o `oldest`, `cursor`, `limit`. El orden corresponde a la fecha de publicación. |
| Body | No aplica. |
| Response JSON | `{"data":{"items":[],"query":"energía","topic":null,"sort":"recent"},"meta":{"nextCursor":null}}` |
| Types | `ArticleSearchResult`, `ArticleSummary`, `PageMeta`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Lector y administrador. |
| HTTP status | 200, 400, 401, 422, 503. |
| Errors | INVALID_FILTER, INVALID_CURSOR, UNAUTHORIZED, VALIDATION_ERROR, SERVICE_UNAVAILABLE. |
| Pagination / filters | Cursor opaco, orden estable y filtros conservados. Backend acuerda límites y semántica de búsqueda. Una consulta vacía sirve para explorar el tema. |
| Consumer | `/buscar?q=&topic=&sort=` y `/temas/[slug]`. |
| Implementation status | Propuesto nuevo. Ampliación solicitada por el usuario, ID de alcance pendiente. La interfaz usa demo aislada. |
| Validation | Validar slug y orden. Buscar solo noticias publicadas. Cero resultados es una respuesta válida, no un error ni contenido inventado. |
| Owner | Gerardo. Ricardo coordina consulta e índices. Sin llamadas a modelos por RP-03. |

##### 13. Consultar guardados

| Field | Contract |
|---|---|
| Name | Consultar guardados |
| Method | GET |
| Route | /api/bookmarks |
| Purpose | Consultar los artículos guardados de la cuenta cuando exista persistencia. |
| Path parameters | Ninguno. La identidad sale de la sesión. |
| Query parameters | Opcionales: `cursor`, `limit`. |
| Body | No aplica. |
| Response JSON | `{"data":{"items":[]},"meta":{"nextCursor":null}}` |
| Types | `SavedArticle` con `article: ArticleSummary` y `savedAt: string` ISO 8601. `PageMeta`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Cada cuenta consulta sus propios guardados. |
| HTTP status | 200, 400, 401, 503. |
| Errors | INVALID_CURSOR, UNAUTHORIZED, SERVICE_UNAVAILABLE. |
| Pagination / filters | Orden por fecha de guardado, cursor opaco. Acordar tratamiento de noticias retiradas. |
| Consumer | `/guardados`. |
| Implementation status | Propuesto nuevo. Ampliación solicitada, ID pendiente. La página informa integración pendiente y no simula una lista persistente. |
| Validation | Aislar cuentas. Un servicio ausente no se representa como una lista real vacía. |
| Owner | Gerardo y Ricardo. Requiere esquema, RLS y actualización de privacidad antes de guardar. |

##### 14. Guardar noticia

| Field | Contract |
|---|---|
| Name | Guardar noticia |
| Method | PUT |
| Route | /api/bookmarks/[articleId] |
| Purpose | Guardar una referencia a una noticia de manera idempotente. |
| Path parameters | `articleId`, obligatorio. |
| Query parameters | Ninguna. |
| Body | Sin cuerpo. No recibir `userId`. |
| Response JSON | `{"data":{"articleId":"article-demo","saved":true},"meta":{}}` |
| Types | `BookmarkResult`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Cada cuenta modifica sus propios guardados. |
| HTTP status | 200, 401, 404, 503. |
| Errors | UNAUTHORIZED, ARTICLE_NOT_FOUND, SERVICE_UNAVAILABLE. |
| Pagination / filters | No aplica. |
| Consumer | Acción de guardar en lector, pendiente de integración. |
| Implementation status | Propuesto nuevo. Sin escritura real ni mensaje de guardado exitoso en esta entrega. |
| Validation | Artículo publicado y accesible. Repetir PUT conserva una sola referencia. |
| Owner | Gerardo y Ricardo. Requiere decisión de alcance y privacidad. |

##### 15. Quitar noticia de guardados

| Field | Contract |
|---|---|
| Name | Quitar noticia de guardados |
| Method | DELETE |
| Route | /api/bookmarks/[articleId] |
| Purpose | Retirar una referencia guardada por la cuenta. |
| Path parameters | `articleId`, obligatorio. |
| Query parameters | Ninguna. |
| Body | Sin cuerpo. No recibir `userId`. |
| Response JSON | `{"data":{"articleId":"article-demo","saved":false},"meta":{}}` |
| Types | `BookmarkResult`. |
| Authentication | Sesión mediante DAL. |
| Roles / permissions | Cada cuenta modifica sus propios guardados. |
| HTTP status | 200, 401, 503. |
| Errors | UNAUTHORIZED, SERVICE_UNAVAILABLE. |
| Pagination / filters | No aplica. |
| Consumer | `/guardados` y lector, pendientes de integración. |
| Implementation status | Propuesto nuevo. No implementado. |
| Validation | Operación idempotente. Una referencia ya ausente devuelve el mismo estado sin afectar la noticia. |
| Owner | Gerardo y Ricardo. Requiere persistencia aprobada. |

#### Integraciones existentes

La autenticación conserva sus mecanismos actuales. No se crean rutas REST ficticias para documentar acciones del SDK o de Next.js.
El ejemplo de `/api/joke` es ilustrativo. La auditoría comprobó su forma en el código, no ejecutó la petición.

##### 1. Prueba técnica de proveedor externo

| Field | Current contract |
|---|---|
| Name | Prueba técnica de proveedor externo |
| Method | GET |
| Route | /api/joke |
| Purpose | Comprobar la cadena servidor y proveedor. No proporciona noticias. |
| Path parameters | Ninguno. |
| Query parameters | Ninguna. |
| Body | No aplica. |
| Response JSON | `{"data":{"id":1,"text":"Texto ficticio para ilustrar el contrato.","category":"Programming","language":"en","safe":true,"flags":{"nsfw":false,"religious":false,"political":false,"racist":false,"sexist":false,"explicit":false}},"meta":{"source":"JokeAPI v2","fetchedAt":"2026-10-09T12:00:00Z","durationMs":10}}` |
| Types | `JokeResponse`, `Joke`, `ContentFlags`, `ApiErrorResponse` de `src/types/joke.ts`. |
| Authentication | Sesión comprobada con `getCurrentUser()` antes de consultar al proveedor. |
| Roles / permissions | Cualquier cuenta con sesión. |
| HTTP status | 200, 401, 500, 502, 504, según código de la ruta. |
| Errors | UNAUTHORIZED, TIMEOUT, UPSTREAM_ERROR, INVALID_RESPONSE, NETWORK, UNKNOWN. |
| Pagination / filters | No aplica. |
| Consumer | Sin consumidor actual en el frontend. Su servicio usa `fetchJson` en servidor. |
| Implementation status | Existente, sin consumidor actual. No se elimina ni se reconecta durante esta revisión. |
| Validation | Normaliza texto y campos del proveedor. Respuesta privada sin caché. No se usa para sustituir noticias. |
| Owner | Gerardo. Fuente: `src/app/api/joke/route.ts` y `src/lib/services/jokes.ts`. |

##### 2. Inicio de sesión con Google

| Field | Current contract |
|---|---|
| Name | Inicio de sesión con Google |
| Method | SDK Supabase: `auth.signInWithOAuth`. No es una ruta REST propia. |
| Route | No hay `/api/login`. El SDK usa el proyecto Supabase configurado. |
| Purpose | Abrir Google y regresar al callback del mismo origen. |
| Path parameters | Proveedor `google`, fijado por el componente. |
| Query parameters | `redirectTo` se construye con el origen actual y `/auth/callback`. |
| Body | Opciones del SDK. Sin contraseña ni rol enviado por la UI. |
| Response JSON | No aplica como respuesta JSON del backend propio. El SDK devuelve error o inicia la redirección. |
| Types | Tipos del SDK Supabase. El componente no define un DTO de login. |
| Authentication | No exige una sesión previa. |
| Roles / permissions | Alta o acceso de la cuenta de Google. No concede rol administrativo. |
| HTTP status | Los códigos del proveedor no constituyen contrato de una API propia. |
| Errors | El SDK puede devolver `error`. El componente ya muestra una explicación accesible y permite reintentar. |
| Pagination / filters | No aplica. |
| Consumer | `SignInButton` en portada y pantallas de acceso. |
| Implementation status | Existente y utilizado. Error visual implementado, sin cambiar protocolo. OAuth real pendiente de prueba. |
| Validation | El origen debe figurar en Redirect URLs de Supabase. No se cambia esa configuración desde el frontend. |
| Owner | Ricardo para integración OAuth. Sergio para el componente visual. |

##### 3. Retorno de autenticación

| Field | Current contract |
|---|---|
| Name | Retorno de autenticación |
| Method | GET |
| Route | /auth/callback |
| Purpose | Intercambiar un código OAuth por la sesión y volver a la portada. |
| Path parameters | Ninguno. |
| Query parameters | `code` de un uso en éxito. `error_description` o `error` en fallo del proveedor. |
| Body | No aplica. |
| Response JSON | No devuelve JSON. Redirige a `/` en éxito o a `/?auth_error=…` en fallo. |
| Types | `Request`, `NextResponse` y tipos del SDK. |
| Authentication | No exige sesión previa. Valida el canje del código mediante Supabase. |
| Roles / permissions | No asigna privilegios de administrador. |
| HTTP status | Redirección HTTP de `NextResponse.redirect`, sin contrato REST de datos. |
| Errors | Código ausente, rechazo del proveedor o fallo en `exchangeCodeForSession`. |
| Pagination / filters | No aplica. |
| Consumer | Retorno de Google vía Supabase y portada. |
| Implementation status | Existente y utilizado. Sin cambio en esta revisión. |
| Validation | Mantener resolución del origen y cookies existentes. `/` decide la nueva llegada autenticada a `/chat`. |
| Owner | Ricardo. Fuente: `src/app/auth/callback/route.ts`. |

##### 4. Cerrar sesión

| Field | Current contract |
|---|---|
| Name | Cerrar sesión |
| Method | Server Action invocada mediante POST por un formulario. |
| Route | No existe una ruta pública estable `/api/logout`. |
| Purpose | Cerrar sesión, invalidar el layout y regresar a `/`. |
| Path parameters | Ninguno. |
| Query parameters | Ninguna. |
| Body | Formulario de la acción, sin campos de cuenta. |
| Response JSON | No devuelve un contrato JSON. Revalida el layout y redirige a `/`. |
| Types | Tipos de Server Actions y SDK Supabase. |
| Authentication | Opera sobre la sesión de las cookies actuales. |
| Roles / permissions | Cualquier cuenta con sesión. |
| HTTP status | Protocolo de Server Actions y redirección. No exponer sus detalles como API REST estable. |
| Errors | La acción actual no publica un DTO de error propio. |
| Pagination / filters | No aplica. |
| Consumer | Formulario de `UserBadge`, presente en perfil. |
| Implementation status | Existente y utilizado. Sin modificación prevista. |
| Validation | Conservar POST. No convertir el cierre de sesión en un enlace GET. |
| Owner | Ricardo. Fuente: `src/app/actions/auth.ts`. |

Ejemplo de error existente en la API técnica:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Inicia sesión para usar esta función."
  }
}
```

#### Configuración y coordinación pendientes

La auditoría solo leyó nombres referenciados por código. No leyó `.env.local` ni sus valores.
Los clientes Supabase usan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
`getSiteUrl` contempla `NEXT_PUBLIC_SITE_URL` y `VERCEL_PROJECT_PRODUCTION_URL` para metadatos.
El servicio técnico admite `JOKES_LANG` como opción. Ninguna de estas lecturas añade una variable requerida a esta revisión.
Los secretos de futuros modelos serán de servidor y se coordinan con Infra. Nunca llevarán el prefijo `NEXT_PUBLIC_`.

| Work | Owner | Required agreement | Frontend dependency |
|---|---|---|---|
| Catálogos y DTOs compartidos | Gerardo y Ricardo | IDs, slugs, etiquetas, fechas, bloques de contenido e imagen | Temas, búsqueda, perfil, portal y lector |
| Feed y señales | Gerardo y Rodrigo | Prominencia, explicación, bloque importante y deduplicación | Edición y personalización observable |
| Búsqueda editorial | Gerardo | Semántica de q/topic/sort, cursor y errores | Búsqueda y páginas de temas |
| Perfil persistente | Gerardo y Ricardo | Región válida, RLS y datos realmente guardados | Perfil y privacidad |
| Guardados | Gerardo y Ricardo | Requisito propio, referencia por cuenta, idempotencia y artículos retirados | Guardados y acción del lector |
| Chat | Gerardo y Rodrigo | Contexto temporal, citas internas/externas, disponibilidad y errores | Chat sin inventar respuestas ni estados |
| Publicación | Gerardo y Ricardo | Validación humana, imagen, importancia y reintentos | Publicación visible en otro dispositivo |
| Imágenes y consumo | Gerardo y Rodrigo | Banco, licencia, sugerencia, costo y política D-22/D-23 | Portal sin costos ni procedencia inventados |
| Instalación y actualización | Ricardo | Marca, colores, offline, iconos y versión del worker | Coherencia completa en instalación anterior y nueva |

No se modifica ningún endpoint existente por razones visuales.
Antes de conectar un endpoint, Backend confirma el contrato y Frontend registra qué consumidor deja de usar fixtures.
La comprobación exige respuestas reales, errores reales y roles. Un mock solo prueba presentación.

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
| Separar chat inicial y edición con navegación activa | [feed y lector](specs/feed-y-lector.md), [chat](specs/chat.md) | En curso | URLs directas, historial y regreso desde lector |
| Añadir exploración temática y búsqueda de demo | [feed y lector](specs/feed-y-lector.md) | En curso. Búsqueda: ampliación con ID pendiente | Query parameters, filtros, vacío y error |
| Preparar guardados sin persistencia ficticia | [feed y lector](specs/feed-y-lector.md) | En curso. Ampliación con ID pendiente | Dependencia visible y ausencia de confirmación falsa |
| Unificar acceso, carga, error y 404 | [acceso](specs/acceso.md), [PWA](specs/pwa.md) | En curso | Teclado, foco, error de Google y ruta inexistente |

## 5. Verificación y presentación

### Registro honesto

La primera entrega solo tuvo revisión estática. La nueva instrucción autoriza verificaciones técnicas del agente.
Nada está marcado como Done por escribir código o superar únicamente una revisión estática.
El registro siguiente corresponde a la implementación, que terminó sin staging ni commits. La preparación posterior registra los cambios en commits locales autorizados.
El usuario decidirá después cómo publicar y probar una preview. La revisión local no acredita despliegue ni teléfonos reales.
Las pruebas del usuario deben registrar fecha, entorno, dispositivo, acción, observación y resultado.
La demo no acredita personalización, publicación, fuentes externas, presupuesto ni respuestas de IA reales.

| Date | Environment | Check | Result | Limit |
|---|---|---|---|---|
| 2026-10-09 | Repositorio local, antes de modificar esta revisión | `npm run typecheck` | Pasó, reportado por el coordinador | No valida UI ni servicios |
| 2026-10-09 | Repositorio local, antes de modificar esta revisión | `npm run lint` | Falló: 15 errores y 1 advertencia en scripts de `.agents` | No se modifican skills para ocultar el resultado |
| 2026-10-09 | Repositorio local, antes de modificar esta revisión | Lint con `--ignore-pattern .agents/**` | Pasó, reportado por el coordinador | Evidencia inicial. Después se delimitó el alcance de ESLint para excluir scripts de skills |
| 2026-10-09 | Repositorio local, cierre documental | Validador de Markdown de developer-documentation con `--check-fragments` | Pasó para los siete documentos del cierre, ejecutado por el subagente de documentación | No valida los endpoints propuestos ni la interfaz |
| 2026-10-09 | Repositorio local, índice de documentación | El mismo validador sobre `docs/README.md` | Pasó, ejecutado por el coordinador | Comprueba estructura y enlaces locales |
| 2026-10-09 | Repositorio local, ejemplos del documento | Parseo JSON de las 16 respuestas ilustrativas | Pasó, ejecutado por el subagente de documentación | Comprueba sintaxis, no respuestas de servicios reales |
| 2026-10-09 | Windows local, implementación actualizada | `npm run typecheck` y `npm run lint` | Ambos terminaron con código 0, ejecutados por el coordinador | No validan recorridos con sesión |
| 2026-10-09 | Windows local, primer intento de build en sandbox | `npm run build` | Falló al crear un proceso: `spawn EPERM` | Fallo de permisos del entorno. No se presentó como error funcional del producto |
| 2026-10-09 | Windows local, build repetido con permiso | `npm run build`, Next.js 16.3.4 | Build completo, código 0, ejecutado por el coordinador | No acredita OAuth, contenido autenticado ni instalación real |
| 2026-10-09 | Servidor de producción local `127.0.0.1:3000`, sin sesión | Abrir `/` y `/privacidad` por HTTP | Ambas respondieron 200 | Solo rutas públicas |
| 2026-10-09 | Mismo servidor, sin sesión | Abrir `/chat`, `/edicion`, `/buscar`, `/temas/tecnologia`, una noticia de fixture, `/guardados`, `/perfil`, `/admin` y `/contenido` | HTTP 200 con acceso Google, sin contenido privado. Cabecera `private, no-cache, no-store, max-age=0, must-revalidate` | No prueba el recorrido autenticado ni el rol administrativo |
| 2026-10-09 | Mismo servidor, sin sesión | Abrir una ruta inexistente | HTTP 404 | No sustituye la prueba de `/admin` con cuenta común |
| 2026-10-09 | Mismo servidor, sin sesión | Consultar `/api/joke` | HTTP 401 y `private, no-store` | No se consultó el proveedor con una cuenta |
| 2026-10-09 | Mismo servidor, sin código OAuth | Abrir `/auth/callback` | HTTP 307 | Solo se comprobó el retorno de error. No prueba login con Google |
| 2026-10-09 | Mismo servidor, manifiesto servido | Consultar `/manifest.webmanifest` | RESPIA News, `standalone`, inicio `/` y tres iconos | No acredita instalación, actualización ni funcionamiento offline |
| 2026-10-09 | Mismo servidor, recursos públicos | Consultar `/sw.js`, `/offline.html`, `/icons/icon-192.png`, `/icons/icon-512.png` y `/icons/icon-maskable-512.png` | Todos respondieron 200 con MIME correcto, según el coordinador | Solo entrega HTTP. No prueba instalación, caché ni desconexión |
| 2026-10-09 | Navegador integrado, sin sesión, tema oscuro | Revisar portada a 1440 × 900 y 375 × 812, privacidad a 375 × 812 y 768 × 1024, acceso de `/chat` y 404 a 320 × 812 | Capturas y DOM sin desbordamiento horizontal, según el coordinador | Son viewports de escritorio, no teléfonos reales. No se inspeccionó contenido privado |
| 2026-10-09 | Mismo navegador, pantalla de acceso | Inspeccionar estructura y controles | Un `h1`, un `main`, botón Google de 44 px y texto base de 16 px | Comprobación de esa pantalla. No acredita toda la accesibilidad del producto |
| 2026-10-09 | Mismo navegador, teclado | Activar «Saltar al contenido» con Enter | El foco quedó en `#principal` | No prueba teclado virtual móvil |
| 2026-10-09 | Mismo navegador, primera secuencia desde `#principal` | Revisar navegación y correspondencia de URL y DOM | Se observó una diferencia entre URL y DOM. No se confirmó la causa | El historial con anclas queda sin validar |
| 2026-10-09 | Mismo navegador, nueva secuencia iniciada en `/` sin ancla | Abrir privacidad con Enter, volver, avanzar y recargar | Los encabezados visibles confirmaron portada, privacidad y recarga correctas | Solo navegación pública y sin anclas |
| 2026-10-09 | Mismo navegador, ruta inexistente | Activar el regreso desde 404 | Volvió a la portada | No prueba un 404 por rol |
| 2026-10-09 | Mismo navegador, recorridos públicos revisados | Consultar consola | No se capturaron errores ni advertencias | Limitado a las páginas y acciones observadas |
| 2026-10-09 | Cálculo de luminancia sRGB de tokens claros | Comparar borde `#83897e` con blanco, papel y superficie hundida | 3.59:1 sobre `#ffffff`, 3.30:1 sobre `#f7f5f0` y 3.04:1 sobre `#eeece5` | Cálculo confirmado por documentación. No hubo revisión visual del tema claro |
| 2026-10-09 | Repositorio local, comprobaciones de solo lectura | `git diff --check` y `git diff --cached --stat` | El primero terminó con código 0. El segundo no mostró archivos | Reportado por el coordinador. No se añadieron archivos a staging ni se modificó el historial |
| Pendiente por decisión del usuario | Cualquier cuenta con sesión | Login, redirección, chat, feed, búsqueda, lector, perfil y portal | No ejecutadas en esta revisión | El usuario pidió mantener todas las pruebas con sesión pendientes |
| Pendiente | iPhone y Android reales, app instalada | Sesión, navegación, teclado y reapertura | Pendiente | No sustituir con tamaños de viewport de escritorio |

El coordinador proporcionó los resultados de ejecución anteriores al subagente de documentación.
Las tareas funcionales permanecen en curso. No se marca Done porque faltan sesión, dispositivos, preview e integración según cada requisito.
Después del build solo se retiró un token de navegación sin uso. No se atribuye otra compilación a ese ajuste.
La revisión estática confirmó la exclusión de API y respuestas privadas o `no-store` en el worker.
No se probó desconexión real, Cache Storage, instalación o actualización. Tampoco tema claro en navegador, zoom, movimiento reducido ni teclado móvil.
No cambiaron las rutas de autenticación, acciones, API, bibliotecas de servidor, tipos compartidos, recursos públicos, lockfile ni `.env.example`.
No se leyó `.env.local`. La verificación utilizó la app configurada sin inspeccionar sus valores.
Al terminar, el coordinador detuvo su servidor y comprobó que el puerto 3000 ya no tenía listener.
La revisión final del subagente de diseño no encontró hallazgos accionables. Fue una revisión estática, no una prueba con sesión.

### Verificación técnica y pruebas pendientes

1. Conservar los resultados técnicos anteriores. Repetir tipos, lint y build solo si cambia el código después de esta verificación.
2. Mantener pendientes las pruebas con sesión, conforme a la instrucción del usuario.
3. Cuando el usuario las retome, probar con una cuenta común y una administradora.
4. Probar chat, edición, temas, búsqueda, lector, región y portal en iPhone y Android reales, con la PWA instalada.
5. Revisar orientación, teclado virtual, texto ampliado, foco, tema oscuro y movimiento reducido.
6. Usar Probar estados para revisar carga, vacío, error, sin conexión y límite de IA.
7. Comprobar desconexión real por separado. Una simulación visual no prueba el service worker.
8. Publicar un ejemplo y abrirlo en el lector de la misma pestaña. Recargar y comprobar que desaparece.
9. Abrir directamente las rutas nuevas y comprobar regreso, avance, foco y estado activo de navegación.
10. Comprobar que guardados informa su dependencia y no muestra persistencia exitosa.
11. Registrar los fallos sin ocultarlos. Abrir ciclos solo cuando la evidencia cambie una decisión.

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
6. Mantener las hipótesis completas en Notion. Conforme a D-27 en `origin/dev`, trasladar tareas y evidencia a la base Tickets y enlazarlas desde los specs.
7. Conservar en este archivo la fecha y referencia de traslado. No mantener otra lista independiente de estados.

El conector no pudo leer la página del proyecto durante la planificación. No se publicaron cambios en Notion.
No se copian ni se modifican los ciclos de otros integrantes. No se inventan enlaces, IDs ni resultados.

### Entrega local y publicación en Vercel

2026-10-09: el usuario autorizó varios Conventional Commits y la exclusión de skills locales.
Esta autorización sustituye la prohibición de commits de la fase anterior. No autoriza publicar ni fusionar automáticamente.
Se conserva la rama `front/experiencia-editorial-meridian`, sin reescribir los siete commits anteriores.
Los archivos locales `instructions.md`, `FRONTEND.md` y `brief.md` permanecen fuera de estos commits, como fuentes aportadas por el usuario.
`.agents/` y `skills-lock.json` quedan ignorados. Las dos skills compartidas de `.claude/skills/` siguen versionadas por D-18.

Al consultar `origin/dev`, se encontraron cuatro commits de documentación posteriores a la base local.
Incluyen D-25, D-26 y D-27. No se sobrescriben con los documentos de esta rama.
D-27 mueve tareas y evidencia a [Tickets](https://app.notion.com/p/49bcd1575a0543399a87a1db2f1c341f) y exige citar `TKT-NN`.
El conector devolvió `object_not_found` para esa base. Los IDs quedan pendientes de asignación, sin inventar números.
El usuario confirmó que todavía no existen sus tickets de frontend y que serán los primeros que documentará.
Las tablas anteriores son material de traslado. No constituyen un tablero alternativo a Tickets.

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex, modelo exacto no disponible | Separar los cambios en Conventional Commits y explicar la publicación en el dominio estable | Commits locales por comportamiento, documentación separada y exclusión de skills locales | El usuario autorizó los commits y confirmó que los tickets aún no tienen ID. Publicación y merges quedan a cargo del usuario | Typecheck y lint terminaron con código 0. El validador aceptó los ocho documentos. `git check-ignore` confirmó las exclusiones y `git diff --check` no encontró errores |

La verificación de esta preparación ocurrió el 2026-10-09 en Windows local.
No se ejecutó otro build por estos cambios de empaquetado. Se conserva el resultado del build de la implementación y sus límites.
Las pruebas con sesión siguen pendientes por decisión del usuario. No se creó, cerró ni publicó ningún ticket o ciclo en Notion.
Cuando haya evidencia para una hipótesis, el usuario registrará Confirmada o Descartada en la base de investigación que compartió.

#### Orden de integración

La decisión D-21 y [PROCESO.md, sección 8](docs/PROCESO.md#8-git-y-propiedad-de-carpetas) regulan la entrega.
La documentación va directamente a `dev`. El código llega a `dev` por PR. El release lleva `dev` a `main`.
Los dos PR usan **Create a merge commit**, no squash ni rebase.

1. Revisar los commits locales y los archivos que contienen. Confirmar que no incluyen skills locales ni variables de entorno.
2. Actualizar las referencias con `git fetch origin`.
3. Cambiar a `dev` y actualizarla con `git pull --ff-only origin dev`.
4. Trasladar únicamente los commits de documentación mediante `git cherry-pick`, en su orden original. Incluyen los anteriores `79c5cea` y `c495ddb`, más los nuevos commits documentales.
5. Si hay conflictos, conservar los cambios de ambas áreas. En `specs/chat.md`, conservar la implementación RSS del compañero y aplicar solo las secciones de frontend.
6. Adaptar los enlaces de tareas a Tickets conforme a D-27. Asignar los IDs reales y enlazar esta evidencia, sin marcar pruebas pendientes como Hecho.
7. Validar los documentos y subir solo esa documentación con `git push origin dev`.
8. Volver a `front/experiencia-editorial-meridian`. Integrar `origin/dev` con `git merge origin/dev` y resolver cualquier conflicto antes de continuar.
9. Ejecutar `npm run typecheck`, `npm run lint` y `npm run build` sobre el resultado integrado.
10. Subir explícitamente la feature con `git push -u origin front/experiencia-editorial-meridian`. Evitar un `git push` sin destino mientras siga asociada a `origin/dev`.
11. Abrir el PR de frontend hacia `dev`. Probar la preview y registrar los resultados antes de fusionar.
12. Probar la preview integrada de `dev`. Abrir después el PR de release hacia `main`.

Los comandos anteriores son el procedimiento que realizará el usuario. Esta preparación no los ejecuta, salvo la consulta de referencias con `git fetch`.
No usar `reset --hard`, force push ni reemplazar un archivo completo para resolver conflictos.

#### PRs que debe abrir el equipo

| Order | Base | Compare | Suggested title | Required evidence |
|---|---|---|---|---|
| 1 | `dev` | `front/experiencia-editorial-meridian` | `feat(frontend): integrar la experiencia editorial Meridian [RF-01, RF-07, RF-08, RF-09]` | URL de preview, tipos, lint, build y recorridos con sesión. Añadir IDs reales de Tickets |
| 2 | `main` | `dev` | `chore(release): publicar la experiencia editorial en Vercel [RF-05]` | Preview de dev validada, revisión del alcance completo del release y comprobaciones en teléfonos. Añadir ticket de release |

El PR 1 incluye la primera entrega editorial y su evolución, todavía no integradas. No abrir un PR por cada commit de esta misma rama.
La descripción debe declarar las noticias y publicaciones temporales y los endpoints pendientes. Debe mantener abiertas las pruebas aún no ejecutadas.
Solicitar revisión a Ricardo por `.gitignore`, conforme a CODEOWNERS. Los archivos de sesión, el worker y el manifiesto no cambiaron.

Texto para explicar el tamaño del PR 1:

> Esta primera integración supera 400 líneas porque entrega el marco editorial compartido, sus rutas y los consumidores del contenido tipado como un conjunto navegable. Se conserva el historial local solicitado, sin reescribirlo ni crear ramas artificiales. Los commits separan configuración, composición común, conversación, lectura y edición, exploración, perfil y documentación para revisar cada comportamiento. La documentación se traslada antes a dev. Esta excepción de tamaño no sustituye las pruebas de preview ni las revisiones por propiedad.

#### Actualizar el dominio estable

El proyecto existente `respia-news` publica `main` en [respia-news.vercel.app](https://respia-news.vercel.app).
Al fusionar el release, Vercel debe generar un despliegue Production y marcarlo Ready. No se usa `vercel --prod` ni se crea otro proyecto.
Este flujo está descrito en [INFRA_HANDOFF.md, sección 6.1](docs/INFRA_HANDOFF.md#61-vercel) y en [la documentación oficial de Vercel](https://vercel.com/docs/git).

Antes del release, Ricardo confirma estos ajustes existentes, sin compartir valores secretos:

- Rama de Production: `main`. Dominio asignado al proyecto: `respia-news.vercel.app`.
- Variables de Supabase disponibles en Production: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Site URL de Supabase: `https://respia-news.vercel.app`. Redirect URLs: conservar `https://respia-news.vercel.app/**`.
- Si existe una variable opcional `NEXT_PUBLIC_SITE_URL`, no debe apuntar al túnel de Cloudflare. Solo controla metadatos, no sustituye la configuración OAuth.
- Si Vercel bloquea el despliegue por el autor en Hobby, el dueño revisa el bloqueo y realiza el merge del release según el handoff.

Abrir directamente el dominio estable después de que el despliegue esté Ready. Google debe regresar a ese mismo origen.
La app instalada desde Vercel sigue apuntando a Vercel. Cerrarla y abrirla permite comprobar la nueva versión.
Una instalación creada desde Cloudflare conserva ese origen. Para usar producción, abrir el dominio de Vercel e instalar desde allí.
No hace falta mantener localhost ni el túnel encendidos para utilizar Vercel.

El deploy publica el frontend disponible. No crea los endpoints propuestos ni vuelve persistentes los datos de demostración.
La actualización de nombre, iconos y pantalla offline permanece coordinada con Ricardo. No se promete otra marca instalada con este release.
