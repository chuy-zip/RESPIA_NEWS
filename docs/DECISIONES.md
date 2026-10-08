# Decisiones

Registro único de decisiones (ADR). Una fila por decisión **difícil de revertir o
que afecta a dos partes o más**. Las decisiones menores viven en el spec de su feature.

## Reglas

1. Una fila no se edita. Si la decisión cambia, agregue una fila nueva y cambie el
   estado de la anterior a «Reemplazada por D-NN». Es lo único que se modifica.
2. La razón dice qué evidencia o restricción llevó a la decisión. Si hubo un ciclo,
   enlace la entrada de la bitácora.
3. Partes: `Front`, `Back`, `Datos`, `IA`, `Infra`, `Proceso`.

| ID | Fecha | Decisión | Razón y evidencia | Partes | Estado |
|---|---|---|---|---|---|
| D-01 | 2026-09-10 | PWA pura, sin aplicación nativa | El enunciado excluye las tiendas. Un solo código sirve a iPhone y Android | Front, Infra | Vigente |
| D-02 | 2026-09-10 | Vercel Hobby y Supabase Free | El enunciado pide niveles gratuitos cuando sea viable (`RP-04`). Los USD 20 quedan para la IA | Infra | Vigente |
| D-03 | 2026-09-22 | Supabase Auth con Google en lugar de Firebase Auth | Datos relacionales, RLS y sesión en servidor con Next.js. Aprobado por el catedrático el 22-sep-2026. Justificación en [INFRA_HANDOFF.md](INFRA_HANDOFF.md) | Back, Datos, Infra | Vigente |
| D-04 | 2026-09-23 | La identidad se verifica en el servidor con `getClaims()`. El proxy solo refresca la sesión; cada página y ruta decide el acceso | `getSession()` no valida la firma. Un guardián global único es fácil de saltar con una ruta nueva | Front, Back | Vigente |
| D-05 | 2026-09-23 | El service worker no guarda páginas privadas, respuestas `no-store` ni `/api/*`. Sin conexión solo se muestra `offline.html` | Una página con datos del usuario no debe quedar en el dispositivo. No se promete un modo sin conexión que no existe. [Bitácora pwa](features/pwa/bitacora.md) | Front, Back | Vigente |
| D-06 | 2026-10-04 | El administrador se identifica por `user_id` en `public.admins`. La app solo lee su propia fila; la tabla se modifica desde el SQL Editor. La comprobación falla cerrado | El correo puede cambiar y `user_metadata` lo edita el usuario. Nadie se da permisos desde el navegador. [Bitácora acceso](features/acceso/bitacora.md) | Back, Datos | Vigente |
| D-07 | 2026-10-04 | Proveedor Email de Supabase desactivado | Permitía crear cuentas por la API sin Google. [Bitácora acceso](features/acceso/bitacora.md) | Back, Infra | Vigente |
| D-08 | 2026-10-04 | Solo dos variables de entorno, ambas públicas por diseño | La seguridad la dan RLS y la verificación en el servidor, no el secreto de la llave | Infra | Vigente |
| D-09 | 2026-10-04 | Esquema con scripts SQL numerados en `docs/sql/`, sin Supabase CLI ni carpeta `supabase/` | Una base, un responsable del esquema: la CLI cuesta más de lo que aporta. [Bitácora plataforma](features/plataforma/bitacora.md) | Datos | Reemplazada por D-14 |
| D-10 | 2026-10-04 | Sin pruebas automatizadas | El equipo no encontró una consecuencia concreta que las justificara. [Bitácora plataforma](features/plataforma/bitacora.md) | Proceso | Reemplazada por D-15 |
| D-11 | 2026-10-04 | Sin cabeceras de seguridad adicionales ni CSP, sin fijar la versión de Node y sin tarea programada para mantener activa la base | Sin consecuencia concreta que lo justifique. La pausa de Supabase por inactividad queda como riesgo conocido. [Bitácora plataforma](features/plataforma/bitacora.md) | Infra | Vigente |
| D-12 | 2026-10-07 | La pantalla de consentimiento de Google se queda en *Testing* y no se agregan permisos | Con solo nombre, correo y perfil, Testing no restringe quién entra. Un permiso adicional sí lo haría. [Bitácora acceso](features/acceso/bitacora.md) | Back, Infra | Vigente |
| D-13 | 2026-10-08 | Proceso v0.2: Notion guarda el porqué; el repositorio guarda el qué, el cómo, el resultado y las pruebas. Un spec por feature y un solo archivo de decisiones | Demostrar el uso de agentes sin multiplicar archivos. Ver [PROCESO.md](PROCESO.md) | Proceso | Vigente |
| D-14 | 2026-10-08 | Los scripts SQL pasan a `supabase/migrations/`. Se mantiene la decisión de no usar la Supabase CLI | La carpeta agrupa la parte de datos en la raíz del repositorio. El procedimiento manual de D-09 no cambia | Datos | Vigente |
| D-15 | 2026-10-08 | Tests automáticos limitados: un archivo por módulo de lógica con riesgo y como máximo 5 tests e2e con Playwright | Los flujos críticos (login, publicar, feed, chat, tope de costo) se repiten en cada cambio. Los límites evitan que las pruebas crezcan sin control | Front, Back, IA | Vigente |
| D-16 | 2026-10-08 | Flujo de Git: nadie sube directo a `main`; una rama por cambio (`<parte>/<feature>-<descripcion>`), PR con Squash and merge, y un dueño por carpeta (`.github/CODEOWNERS`). Un PR que toca carpetas de otra parte necesita la aprobación del dueño | Cuatro partes trabajan en el mismo repositorio y `main` se publica en producción. Sin ramas ni dueños, un cambio pisa el de otra parte. Reemplaza la regla del 7-oct-2026 de no imponer control de versiones (registro de cambios de [ALCANCE.md](ALCANCE.md)) | Front, Back, Datos, IA, Infra | Vigente |
