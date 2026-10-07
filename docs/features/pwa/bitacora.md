# Bitácora de la PWA

De lo más reciente a lo más antiguo. Las entradas de esta página se **reconstruyeron
el 7-oct-2026** a partir del historial de Git y de la conversación de trabajo con el
asistente de IA; las fechas son hora local (Guatemala).

## 2026-09-23 · La prueba "sin conexión" pasó, pero estaba mal hecha

**Requisitos:** `RF-01`, `RF-02`

- **Comprensión:** había que comprobar de verdad que, sin red, ninguna página privada
  se servía desde el caché.
- **Hipótesis:** emular una red desconectada desde las herramientas del navegador basta.
- **Prueba:** emulación de red desconectada contra el servidor local.
- **Observación:** dio un **falso positivo**. La emulación no bloquea `localhost`, así
  que la página seguía cargando desde el servidor y la prueba "pasaba". El siguiente
  intento mató el proceso equivocado: se detuvo el intermediario `cmd.exe` y el
  proceso real de Node seguía vivo, como mostró el registro.
- **Corrección:** se detuvo el proceso real por el puerto. Entonces se comprobó que
  `/contenido` no estaba en caché y que la navegación caía en `offline.html`.
- **Uso de IA:** el asistente detectó que su propia prueba no demostraba lo que decía,
  encontró la causa y la repitió. Es un ejemplo de por qué una prueba que pasa no basta:
  hay que comprobar que **podía fallar**.
- **Evidencia:** sección de pruebas sin conexión de [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md).

## 2026-09-23 · El service worker guardaba páginas privadas

**Requisitos:** `RF-02` · **Commit:** `3df4657`

- **Comprensión:** `/contenido` ya mostraba la identidad real del usuario, así que
  guardarla en el dispositivo dejó de ser un riesgo teórico.
- **Hipótesis:** Next.js ya marca esas páginas como `private, no-store`, así que no
  deberían guardarse.
- **Prueba:** leer el service worker y comparar con las cabeceras de la respuesta.
- **Observación:** Next.js sí marca `/` y `/contenido` como `private, no-store`, pero
  el service worker guardaba **cualquier respuesta 200 sin mirar las cabeceras**.
- **Corrección:** el service worker ya no guarda respuestas `no-store` ni `private`,
  ni nada de `/api/*`, y se subió `CACHE_VERSION` a `respia-v2` para invalidar lo
  que hubiera quedado guardado.
- **Uso de IA:** el asistente encontró el fallo mientras confirmaba el estado del
  service worker para dar por cerrada otra tarea. Lo corrigió y lo comprobó.
- **Evidencia:** commit `3df4657`.

## 2026-09-10 · Un iPhone nunca veía el botón de instalar

**Requisitos:** `RF-05` · **Commit:** `e3567fd`

- **Comprensión:** en iPhone no hay aviso ni botón de instalación; cae en texto.
- **Hipótesis:** nada está roto, pero un párrafo de texto frente al botón claro de
  Android es una experiencia pobre, y no hay un truco técnico que lo evite.
- **Prueba:** investigación de la documentación y de las capacidades de iOS.
- **Observación:** dos hallazgos. (1) Apple no expone ninguna API de instalación, así
  que las instrucciones son el único mecanismo. (2) Nuestro texto decía que Safari era
  el único navegador de iOS que permite instalar, y desde iOS 16.4 también se puede
  desde Chrome, Edge, Firefox y Orion: estábamos mandando a la gente a cambiar de
  navegador sin necesidad.
- **Corrección:** pasos ilustrados con los símbolos reales de Compartir y Añadir, y
  el texto corregido.
- **Uso de IA:** el asistente había afirmado algo desactualizado en el propio
  componente; la investigación lo corrigió.

## 2026-09-10 · Android instala desde el menú pero no muestra aviso propio

**Requisitos:** `RF-05` · **Commit:** `84ce854`

- **Comprensión:** en Android la app se instaló desde los tres puntos de Chrome, pero
  no apareció ningún aviso. La duda era si el fallo era nuestro.
- **Hipótesis:** que se pudiera instalar desde el menú es prueba de que el manifiesto,
  los iconos y el service worker cumplen los criterios; el aviso automático lo decide
  el navegador por heurísticas.
- **Construcción:** botón propio "Instalar app" que captura el evento
  `beforeinstallprompt` y lo dispara al tocarlo.
- **Prueba:** en el teléfono el botón no aparecía. Se confirmó desde fuera que el
  código nuevo estaba desplegado: el texto del componente anterior ya no venía en el
  HTML del servidor.
- **Observación:** lo que se veía era la rama de respaldo del componente. La causa
  casi segura es que la app ya estaba instalada en ese teléfono, y entonces Chrome no
  emite el evento. Es lo esperado: el botón solo aparece donde se puede instalar.
- **Corrección:** ninguna en el código; se documentó el comportamiento y se propuso
  desinstalar y recargar como prueba definitiva.
- **Uso de IA:** el asistente verificó la versión desplegada en producción en vez de
  suponer que el teléfono tenía caché vieja.
