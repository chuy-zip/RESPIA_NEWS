# Alcance verificable

Este documento fija **qué debe cumplir y probar el sistema**. Sale únicamente del
enunciado del curso ([Proyecto 2 AI Assisted News App](Proyecto%202%20AI%20Assisted%20News%20App.pdf)),
más las restricciones que el equipo adoptó. No describe cómo se construye cada
cosa: eso vive en el spec de cada feature (`specs/`).

## Reglas de este documento

1. **Los requisitos y sus criterios de aceptación no se editan en silencio.** Si
   hay que cambiarlos, se agrega una fila al [registro de cambios](#registro-de-cambios-al-alcance)
   con la fecha y la razón, y se corrige el requisito. Así queda a la vista qué
   cambió y por qué, que es justo lo que pide el proceso del curso.
2. **Lo único que cambia sin registro es la matriz de [estado](#estado)**.
3. Cada requisito tiene un ID (`RF-` funcional, `RT-` transparencia, `RP-`
   presupuesto, `RPR-` proceso). Las tareas y la evidencia citan esos IDs.
4. Una columna "Prueba" describe una prueba **manual y repetible**: qué se hace y
   qué debe verse. Las pruebas automatizadas son limitadas (D-15 en
   [DECISIONES.md](DECISIONES.md)). Cada
   prueba que se ejecute deja evidencia (ver [PROCESO.md](PROCESO.md)).
5. Los umbrales numéricos de los criterios (por ejemplo "al menos 3 niveles") los
   eligió el equipo, porque el enunciado deja los criterios a cada equipo.

---

## 1. Requisitos funcionales

### 1.1 Acceso y plataforma

| ID | Requisito | Criterio de aceptación | Prueba |
|---|---|---|---|
| RF-01 | Aplicación móvil funcional y visualmente cuidada en iPhone y Android, sin publicarla en tiendas | La app se instala desde el navegador (Safari en iPhone, Chrome en Android) y abre a pantalla completa. Las pantallas principales no se desbordan ni se cortan en ancho de teléfono | Instalar en un iPhone y un Android reales y recorrer cada pantalla; anotar dispositivo, fecha y resultado |
| RF-02 | Inicio de sesión con Google en la app | Una cuenta de Google inicia sesión y la sesión se conserva al cerrar y abrir la app instalada. Sin sesión, el contenido protegido no se entrega | Iniciar sesión en iPhone y Android instalados; abrir la ruta protegida sin sesión y comprobar que el servidor la rechaza |
| RF-03 | Portal web administrativo con autenticación | Solo una cuenta registrada como administradora entra al portal. Una cuenta común no ve el acceso y, si escribe la dirección a mano, recibe "no encontrado" | Entrar con una cuenta administradora y con una común |
| RF-04 | Ubicación simulada elegida por el usuario; la personalización depende de ella y no del GPS | El usuario elige una región de una lista y su elección se guarda. La app nunca pide permiso de geolocalización del dispositivo. Con el mismo contenido, dos usuarios con regiones distintas ven resultados distintos | Dos cuentas con regiones distintas sobre las mismas noticias: comparar qué aparece, dónde y con qué prominencia; comprobar que no sale ningún aviso de ubicación |
| RF-05 | Forma práctica de compartir y probar la app durante la clase | Un compañero abre el enlace público, inicia sesión con Google y ve las instrucciones de instalación en la propia app, sin ayuda del equipo | Que alguien ajeno al equipo lo haga desde su teléfono |
| RF-06 | Página de privacidad y acceso para cuentas ajenas al equipo | `/privacidad` es pública, está en español, enlazada desde la portada y describe los datos que **realmente** se guardan (se contrasta con el esquema de la base). Una cuenta de Google que no pertenece al equipo puede iniciar sesión sin estar registrada en Google Cloud | Iniciar sesión con una cuenta de Google ajena al equipo; revisar la página contra las tablas |

### 1.2 Experiencia móvil

| ID | Requisito | Criterio de aceptación | Prueba |
|---|---|---|---|
| RF-07 | El chat de noticias es la pantalla inicial y es temporal | Al abrir la app con sesión se llega al chat. No se guarda el historial entre sesiones | Abrir la app, escribir, cerrar y reabrir: el chat empieza vacío |
| RF-08 | Feed personalizado con jerarquía visual, no una lista indiferenciada | El feed muestra al menos 3 niveles distintos de prominencia (tamaño, posición u otro recurso). La misma noticia cambia de nivel entre dos usuarios con región o intereses distintos | Dos cuentas, mismas noticias: anotar en qué posición y nivel quedó cada noticia para cada cuenta |
| RF-09 | Vista para leer cada noticia | Al abrir una noticia se ve el contenido completo, su procedencia y su estado | Abrir noticias de distinto estado |
| RF-10 | El sistema infiere intereses del comportamiento del usuario | Las señales usadas (cuáles son lo decide el equipo y se documentan) modifican el perfil y cambian el feed de forma observable | Con una cuenta nueva, repetir una conducta (por ejemplo abrir noticias de un tema) y mostrar el cambio del feed antes y después |
| RF-11 | La personalización no oculta información local, nacional o internacional que la persona debería conocer | Existe un mecanismo documentado, y una noticia importante que no coincide con la región ni los intereses del usuario sigue apareciendo en su feed | Cuenta con intereses muy estrechos y una noticia importante fuera de ellos: debe aparecer |

### 1.3 Chat de noticias

| ID | Requisito | Criterio de aceptación | Prueba |
|---|---|---|---|
| RF-12 | El chat atiende las cuatro consultas del enunciado | Responde (a) resumir acontecimientos recientes, (b) noticias relevantes para la región simulada, (c) explicar una noticia importante de otro país o región, (d) novedades sobre un tema presente en las noticias publicadas | Una pregunta de cada tipo, con respuesta correcta respecto al contenido publicado |
| RF-13 | Las respuestas muestran fuentes y distinguen lo confirmado de lo incierto | Cada respuesta enlaza las noticias de las que sale. El estado de cada una (confirmado, en desarrollo, no confirmado) sale de los datos de la noticia, no del modelo, y se distingue visualmente | Preguntar por noticias de cada estado y verificar enlaces y etiquetas |
| RF-14 | El chat se basa en las noticias de la app y no inventa | Responde con las noticias publicadas. Si no hay noticias publicadas sobre la pregunta, lo dice. Puede citar fuentes externas solo de una lista de sitios permitidos, separadas de las noticias de la app, con enlace y la etiqueta «Fuente externa, no verificada por la redacción». Nada se afirma sin fuente | Preguntar por un tema sin cobertura en la app: la respuesta dice que no hay noticias publicadas, y cada fuente externa enlaza a un sitio de la lista y lleva su etiqueta. Preguntar por un tema sin cobertura en ningún sitio: lo dice sin inventar |

### 1.4 Publicación administrativa e imágenes

| ID | Requisito | Criterio de aceptación | Prueba |
|---|---|---|---|
| RF-15 | El administrador crea y publica noticias que aparecen en la app móvil | Una noticia publicada desde el portal aparece en la app sin desplegar código | Publicar en vivo y verla en un teléfono |
| RF-16 | Cada noticia registra lo necesario para leerla, conocer su procedencia y determinar su relevancia para distintos usuarios | La noticia guarda: título, contenido, fuente o fuentes con enlace, fecha, tipo de contenido (original, resumen o aporte de IA), estado de verificación, regiones de relevancia y temas | Revisar un registro publicado y comprobar que cada dato se muestra o se usa |
| RF-17 | Una noticia sin imagen recibe una imagen adecuada desde el flujo administrativo | Al guardar sin imagen, el portal ofrece una opción para obtenerla o generarla y muestra el costo y las condiciones de uso. Nunca se publica una imagen rota | Publicar una noticia sin imagen en vivo |
| RF-18 | Una imagen generada o alterada con IA no se confunde con evidencia fotográfica | Toda imagen que no sea una fotografía real del hecho lleva una etiqueta visible en el feed y en el lector, y su origen se guarda como dato. No se puede publicar una imagen sin origen declarado | Publicar una imagen generada y una real; comprobar etiquetas en feed y lector |

---

## 2. Transparencia y responsabilidad

El enunciado exige que cada respuesta **se refleje en el flujo administrativo, el
feed, el chat y las pruebas**, no solo en una política escrita. Por eso cada
criterio señala dónde se demuestra.

| ID | Pregunta del enunciado | Criterio de aceptación | Dónde se demuestra |
|---|---|---|---|
| RT-01 | **Importancia y relevancia**: ¿cómo decide qué mostrar, en qué orden y con qué prominencia? ¿Cómo evita que una preferencia o la ubicación oculte algo importante? | El criterio de orden y prominencia está documentado y es explicable para una noticia concreta (por qué quedó donde quedó). Cubre RF-11 | Feed, chat, prueba de RF-08 y RF-11 |
| RT-02 | **Fuentes**: ¿qué procedencia se conserva y se muestra? ¿Cómo se distingue contenido original, resumen y aporte de IA? | La procedencia y el tipo de contenido se guardan (RF-16) y se muestran en el lector, el feed y las respuestas del chat | Portal, lector, chat |
| RT-03 | **Validación**: ¿qué proceso reduce la publicación de noticias falsas? ¿Qué pasa si una fuente no basta, dos se contradicen o la noticia no está confirmada? | Hay una regla aplicada en el portal (no solo escrita) para asignar el estado. Se documenta y se prueba un caso de cada situación: fuente insuficiente, contradicción y no confirmada | Portal; un caso de prueba por situación |
| RT-04 | **Límites de la IA**: ¿qué decisiones requieren criterio humano? ¿Cómo se evita tratar la respuesta del modelo como prueba? | Publicar y asignar el estado lo hace solo una persona. El modelo no cambia estado ni publica. El chat no presenta su salida como verificación | Portal; intentar que el chat "confirme" una noticia no confirmada: debe seguir como no confirmada |
| RT-05 | **Imágenes**: ¿cómo se identifica el contenido visual generado o alterado? | Cumple RF-18 | Portal, feed, lector |
| RT-06 | Cuando el sistema no puede confirmar algo, lo comunica con claridad | La incertidumbre se ve en el feed, el lector y el chat con una etiqueta o un texto explícito, no con un tono ambiguo | Noticias en desarrollo y no confirmadas en las tres pantallas |

---

## 3. Presupuesto y uso de IA

| ID | Requisito | Criterio de aceptación | Prueba |
|---|---|---|---|
| RP-01 | Máximo USD 20 en créditos de API de IA, incluyendo desarrollo, pruebas y presentación | El gasto acumulado nunca supera USD 20 | Consultar el gasto acumulado en la consola del proveedor y en el registro propio |
| RP-02 | Reservar saldo para la presentación y conocer gasto, saldo, costo por función y decisiones de ahorro | Cada llamada a un modelo queda registrada (función, modelo, consumo, costo estimado). Se puede consultar el gasto acumulado, el saldo y el costo por función. Existe un tope que impide llamar si se excede. La reserva para la demo está definida por escrito | Ejecutar cada función de IA y verificar que aparece en el registro; forzar el tope y comprobar que no llama |
| RP-03 | Evitar llamadas costosas cuando ordenar, recuperar o presentar se resuelve más barato | Ordenar, filtrar y recuperar noticias no llama a ningún modelo. Cada función que sí lo usa está documentada con la razón | Revisar el código de ordenar y recuperar: sin llamadas a modelos; lista de funciones con IA y su justificación |
| RP-04 | Infraestructura adicional en niveles gratuitos cuando sea viable | Vercel Hobby y Supabase Free, sin costo fijo | Revisar las cuentas |

---

## 4. Proceso de trabajo

| ID | Requisito | Criterio de aceptación | Prueba |
|---|---|---|---|
| RPR-01 | Desarrollo asistido por IA observable, con ciclos de comprensión, hipótesis, construcción, prueba, observación y corrección | Hay al menos 5 ciclos documentados donde la evidencia cambió una decisión o implementación, cada uno con fecha, evidencia y registro del uso de IA | Revisar las bitácoras de `docs/features/` |
| RPR-02 | Requisitos propios, criterios de aceptación, tareas y definición de Done | Este documento, la base [Tickets](https://app.notion.com/p/49bcd1575a0543399a87a1db2f1c341f) de Notion (cada ticket cita un ID de requisito y tiene responsable) y la [definición de Done](PROCESO.md#6-definición-de-done) | Revisar que cada tarea marcada como hecha cite un ID |
| RPR-03 | Flujo de trabajo documentado y evidencia de por qué cada tarea concreta se consideró terminada | [PROCESO.md](PROCESO.md) describe el flujo. Cada tarea hecha tiene su evidencia o la referencia a dónde está | Tomar 3 tareas al azar y seguir su evidencia |

---

## 5. Restricciones adoptadas por el equipo

- **Autenticación:** el enunciado nombra Firebase Authentication; el equipo usa
  **Supabase Auth con Google**, aprobado por el catedrático el 22-sep-2026 con la
  condición de sustentarlo. La justificación está en
  [INFRA_HANDOFF.md](INFRA_HANDOFF.md).
- **Distribución:** PWA instalable desde el navegador. No hay tiendas.
- **Seguridad de acceso:** nada protegido se entrega sin sesión válida y el
  portal solo a administradores, siempre comprobado en el servidor.
- **Repositorio público:** nunca se guardan secretos ni correos reales.

---

## 6. De la presentación a los requisitos

El enunciado fija el orden de la demostración. Esta tabla dice qué requisitos
tienen que estar probados y con evidencia lista para cada parte.

| # | Parte de la presentación | Requisitos |
|---|---|---|
| 1 | Producto y alcance | Este documento |
| 2 | Aplicación móvil: Google, iPhone y Android, chat, feed, lectura, cambio de ubicación | RF-01, RF-02, RF-04, RF-07, RF-08, RF-09 |
| 3 | Publicación en vivo, con noticias de distinta relevancia geográfica y una sin imagen | RF-15, RF-16, RF-17, RF-18 |
| 4 | Validación con compañeros en varias ubicaciones | RF-04, RF-06, RF-08, RF-11 |
| 5 | Chat: recientes, regionales, otros países, fuentes e incertidumbre | RF-12, RF-13, RF-14, RT-06 |
| 6 | Arquitectura y decisiones | RP-03, RT-01 |
| 7 | Transparencia y Responsible AI | RT-01 a RT-06 |
| 8 | Engineering loops y gestión | RPR-01, RPR-02, RPR-03 |
| 9 | Costos | RP-01, RP-02 |
| 10 | Lecciones aprendidas | Bitácoras de `docs/features/` y [DECISIONES.md](DECISIONES.md) |

---

## Estado

Estado a 7-oct-2026. Las filas de IA se actualizaron el 9-oct-2026. Es lo único de este documento que se actualiza sin pasar
por el registro de cambios.

| ID | Estado | Nota |
|---|---|---|
| RF-01 | En curso | Instalación verificada en iPhone y Android; falta la experiencia final |
| RF-02 | Hecho | Verificado en iPhone y Android instalados |
| RF-03 | En curso | Acceso y rol listos; faltan las funciones del portal |
| RF-04 | Pendiente | |
| RF-05 | Hecho | Enlace público e instrucciones de instalación en la app |
| RF-06 | En curso | `/privacidad` creada y cuenta ajena probada; falta probar la página desplegada |
| RF-07 | En curso | Diseño del chat en `specs/chat.md` (D-24, D-25). Sin código |
| RF-08 a RF-11 | Pendiente | Diseño propuesto del recomendador en `specs/recomendacion.md` (D-20) |
| RF-12 a RF-14 | En curso | Diseño del chat en `specs/chat.md` (D-24, D-25). Sin código |
| RF-15 a RF-18 | Pendiente | Imágenes de banco elegidas por el modelo (D-23). Sin código |
| RT-01 a RT-06 | Pendiente | |
| RP-01 a RP-03 | En curso | Modelos y reserva del 30 % decididos (D-22). Faltan el registro y el tope |
| RP-04 | Hecho | |
| RPR-01 a RPR-03 | En curso | Hay bitácora reconstruida de las features de infraestructura; faltan las demás |

## Registro de cambios al alcance

| Fecha | Cambio | Razón |
|---|---|---|
| 7-oct-2026 | Versión inicial | Fijar el alcance a partir del enunciado |
| 7-oct-2026 | `RPR-01` a `RPR-03`: se quitan los issues y los pull requests como unidad de trabajo; las tareas viven en la lista de cada feature | El equipo no impondrá reglas de control de versiones porque no se cumplirían, y exigirlas daría evidencia falsa |
| 7-oct-2026 | `RF-06`: se quita el criterio de que la pantalla de consentimiento de Google esté en producción; queda el de que una cuenta ajena pueda iniciar sesión | La documentación de Google exceptúa del modo Testing a las apps que solo piden nombre, correo y perfil, así que publicar no es necesario. Ver la bitácora de [acceso](features/acceso/bitacora.md) |
| 7-oct-2026 | La evidencia pasa a ser un registro escrito de la prueba (fecha, dónde, qué se vio, resultado); las capturas son opcionales. Se ajustan las pruebas de `RF-01` y `RF-08` | Tomar capturas cuesta tiempo y se desactualizan |
| 8-oct-2026 | `RPR-02`: las tareas pasan de la tabla del README de cada feature a la tabla del spec (`specs/<feature>.md`). La regla 4 admite pruebas automatizadas limitadas | Proceso v0.2 (D-13, D-15 en [DECISIONES.md](DECISIONES.md)) |
| 8-oct-2026 | Se adopta un flujo de Git: ramas por cambio, PR hacia `main` y dueño por carpeta. Reemplaza la fila del 7-oct-2026 sobre no imponer control de versiones. Las tareas siguen en los specs, no en issues | Cuatro partes comparten el repositorio y `main` se publica en producción (D-16) |
| 9-oct-2026 | Flujo de Git por feature: la documentación sube directo a `dev` y el código va en una rama por feature mayor. Reemplaza las ramas por cambio de la fila anterior | Una rama y un PR por cada cambio pequeño multiplicaban ramas y merges (D-21) |
| 9-oct-2026 | `RF-14`: si la app no tiene noticias sobre la pregunta, el chat puede citar fuentes externas de sitios permitidos, separadas y con etiqueta. Antes se limitaba a las noticias de la app | Responder solo «no hay noticias» deja sin respuesta preguntas legítimas. Se mantiene la regla de no inventar: cada frase lleva su fuente (D-24) |
| 9-oct-2026 | `RPR-02`: las tareas pasan de las tablas de los specs a la base Tickets de Notion, con responsable, estado, bloqueos y evidencia | Con las tareas repartidas en los specs no se veía qué hace cada persona ni qué bloquea a qué área (D-27) |
