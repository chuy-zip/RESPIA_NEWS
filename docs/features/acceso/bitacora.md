# Bitácora de acceso

De lo más reciente a lo más antiguo. Las entradas de esta página se **reconstruyeron
el 7-oct-2026** a partir del historial de Git y de la conversación de trabajo con el
asistente de IA; las fechas son hora local (Guatemala).

## 2026-10-04 · Icono y pantalla de administración

**Requisitos:** `RF-03` · **Commit:** `766ddf0`

- **Comprensión:** ya existía el rol de administrador en la base, pero ninguna
  pantalla lo usaba: un administrador veía lo mismo que cualquiera.
- **Hipótesis:** esconder el icono no protege nada; el control debe estar en la
  propia página, de modo que quien escriba la dirección a mano también sea rechazado.
- **Construcción:** la barra superior es un componente de servidor que escribe el
  icono solo si `isAdmin()` es verdadero. `/admin` comprueba el rol por su cuenta y
  responde 404 a quien no es administrador.
- **Prueba:** compilación y servidor de producción local, sin sesión. `/admin` pide
  iniciar sesión, trae `noindex` y `Cache-Control: private, no-store`. El HTML de la
  portada no contiene ningún enlace a `/admin`.
- **Observación:** sin sesión todo se comporta como se esperaba. La prueba con una
  cuenta administradora y una común requiere cuentas reales.
- **Corrección:** ninguna todavía; queda la tarea de registrar esa prueba.
- **Uso de IA:** Claude Code propuso y escribió el código. El equipo pidió que el
  icono fuera solo para administradores y que se siguieran buenas prácticas de
  seguridad; la decisión de responder 404 en lugar de 403 fue del asistente y se aceptó.
- **Evidencia:** compilación y consultas descritas arriba. Falta registrar la prueba con cuentas reales.

## 2026-10-04 · Administradores por `user_id` y proveedor Email desactivado

**Requisitos:** `RF-03` · **Commit:** `8b26007`

- **Comprensión:** cualquier cuenta de Google obtiene sesión, así que "tener sesión"
  no distingue a un administrador.
- **Hipótesis:** una tabla de administradores con RLS, que cada usuario solo pueda
  leer su propia fila, más una comprobación en el servidor, basta sin exponer a nadie.
- **Construcción:** script SQL `001_admins.sql` (tabla, política y función
  `private.is_admin()`) y `isAdmin()` / `requireAdmin()` en el servidor. A petición
  del equipo se agregó una columna `email` como copia legible, dejando claro que
  **no** autoriza.
- **Prueba:** consultas de solo lectura desde fuera, como visitante sin sesión. El
  equipo ejecutó los scripts en el SQL Editor y comprobó con una consulta de usuarios
  contra administradores que quedaron cargados quienes debían, y solo ellos.
- **Observación:**
  1. El endpoint público de ajustes de Auth mostraba el proveedor Email **activo**:
     cualquiera podía crear una cuenta con correo y contraseña por la API, sin pasar por Google.
  2. Ante una consulta a `public.admins` sin sesión, la base respondió
     `permission denied` y sugirió un `GRANT … TO anon`. Es un consejo genérico que
     abriría la tabla a cualquiera.
  3. El esquema `private`, donde vive `is_admin()`, no es accesible por la API.
- **Corrección:** se desactivó el proveedor Email y se volvió a consultar el endpoint:
  quedó solo Google. El `GRANT` sugerido **no** se aplicó.
- **Uso de IA:** Claude Code propuso el diseño y los scripts. El equipo decidió
  cargar los administradores a mano desde el SQL Editor y que el repositorio no
  contuviera correos reales. La verificación de los scripts se hizo con el analizador
  real de PostgreSQL y con consultas contra el proyecto.
- **Evidencia:** sección de verificaciones de [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md).

## 2026-09-23 · Un correo fuera de la lista de prueba pudo iniciar sesión

**Requisitos:** `RF-02`

- **Comprensión:** el equipo había configurado una lista de usuarios de prueba en
  la pantalla de consentimiento de Google.
- **Hipótesis:** el asistente propuso, de más a menos probable, (1) que fuera la
  misma cuenta escrita de otra forma (Gmail ignora los puntos y los sufijos `+`),
  (2) que la cuenta tuviera un rol en el proyecto de Google Cloud, y (3) otra causa.
  Advirtió que no pudo reconfirmar la segunda con una fuente autoritativa.
- **Prueba:** comparar el correo exacto contra la lista.
- **Observación:** la causa **no se determinó**. Lo que sí quedó claro es que quien
  decide quién puede iniciar sesión con Google es Google, no nuestro código, y que
  la lista de prueba no es un control de seguridad nuestro.
- **Corrección:** el permiso de administración no depende de esa lista: se decide en
  la base (ver la entrada del 4-oct).
- **Uso de IA:** el asistente separó lo comprobado de lo supuesto y lo declaró.

## 2026-09-23 · Primer inicio de sesión de punta a punta y riesgo de iOS

**Requisitos:** `RF-02` · **Commit:** `3df4657`

- **Comprensión:** las guías públicas advertían que una PWA instalada en iOS puede
  perder la sesión al salir a Google y volver. Era el mayor riesgo de la
  autenticación.
- **Hipótesis:** la sesión sobrevive si el flujo usa el canje de código de Supabase
  con cookies en el servidor. Plan B, si fallaba: Google One Tap o un código por correo.
- **Construcción:** inicio de sesión con Google, ruta de callback, refresco de
  sesión en el proxy y rutas protegidas con 401.
- **Prueba:** en el navegador, al usar la API protegida primero se pidió iniciar
  sesión; después, con la PWA ya instalada en un iPhone, abierta desde el icono.
- **Observación:** la sesión volvió activa en el iPhone. En la pantalla de Google
  aparece el dominio de Supabase en lugar del nombre de la app, un detalle cosmético.
- **Corrección:** no hizo falta el plan B.
- **Uso de IA:** Claude Code implementó las fases; la prueba con una cuenta real de
  Google la hizo el equipo, porque el asistente no puede hacerla.
- **Evidencia:** sección de pruebas de [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md).

## 2026-09-22 · Supabase Auth en lugar de Firebase

**Requisitos:** `RF-02`

- **Comprensión:** el enunciado nombra Firebase Authentication; el equipo quería
  usar Supabase y tenía que sustentarlo.
- **Hipótesis:** la primera valoración del asistente fue que Supabase encajaba
  mejor. Se pidió investigar con fuentes públicas antes de decidir.
- **Prueba:** comparación de ambos flujos, con documentación oficial y guías.
- **Observación:** la investigación matizó la primera valoración y descartó un
  argumento muy repetido en internet: que Firebase no sirve en el proxy de Next.js
  por el entorno Edge. Con Next.js 16 el proxy corre en Node, así que ese argumento
  quedó obsoleto. Conectar Google es más sencillo con Firebase; la sesión en el
  servidor es más sencilla con Supabase.
- **Corrección:** se mantuvo Supabase, ahora con la comparación honesta de qué se
  gana y qué se pierde, y el catedrático lo aprobó ese mismo día con la condición
  de investigar bien.
- **Uso de IA:** el asistente comparó y encontró el dato que cambió su propia
  valoración inicial; la decisión y la consulta al catedrático fueron del equipo.
- **Evidencia:** justificación en [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md).
