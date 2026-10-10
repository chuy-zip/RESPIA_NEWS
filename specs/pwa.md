# PWA

Instalación en iPhone y Android sin tiendas, y la forma de compartir la app para probarla.

**Requisitos:** `RF-01`, `RF-05` · **Bitácora:** [bitacora.md](../docs/features/pwa/bitacora.md) ·
**Decisiones:** D-01, D-05 · **Investigación:** [Notion](https://app.notion.com/p/bcf3b3eb862b4a0fa01d068850f4d198) ·
**Detalle técnico:** [INFRA_HANDOFF.md](../docs/INFRA_HANDOFF.md)

## Comportamiento actual

Aplicación web progresiva: se instala desde el navegador y abre a pantalla completa (D-01).
Las rutas nuevas comparten el mismo layout en navegador y modo instalado.
El manifiesto sigue declarando RESPIA News, inicio `/` y tres iconos. No se modificó la infraestructura de instalación.

| Regla menor | Razón |
|---|---|
| Botón propio «Instalar app» en Android, que captura el evento de instalación del navegador | El aviso automático del navegador es poco confiable |
| Pasos ilustrados para iPhone | Apple no ofrece una API para instalar: en iOS las instrucciones son el mecanismo |
| El service worker no guarda contenido privado; sin conexión solo se muestra `offline.html` | D-05 |
| Nunca hay que reinstalar para actualizar | El icono apunta al dominio y el contenido se pide siempre al servidor |
| Se cambia `CACHE_VERSION` en `public/sw.js` cuando cambia su comportamiento | Invalida lo guardado por versiones anteriores |

## Criterios de aceptación

- **`RF-01`**: instalar en un iPhone (Safari) y un Android (Chrome), abrir desde el icono a
  pantalla completa y recorrer cada pantalla verificando que nada se corta ni se desborda.
- **`RF-05`**: una persona ajena al equipo abre el enlace público, inicia sesión y sigue
  las instrucciones de instalación sin ayuda.

## No incluido

- Modo sin conexión con contenido.

## Dependencias

- Acceso: el service worker no debe guardar páginas con sesión.

## Uso de IA en el producto

Ninguno.

## Done específico

Toda pantalla nueva se probó en un iPhone y un Android reales, ya instalada.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ✅ | Manifiesto, iconos y service worker | `RF-01` | Commit `1fdcb81`; ver [INFRA_HANDOFF.md](../docs/INFRA_HANDOFF.md) |
| ✅ | Instalación y apertura a pantalla completa en Android e iOS | `RF-01` | Tabla de pruebas de [INFRA_HANDOFF.md](../docs/INFRA_HANDOFF.md) |
| ✅ | Botón de instalación en Android | `RF-05` | Bitácora 2026-09-10, commit `84ce854` |
| ✅ | Instrucciones de instalación para iPhone | `RF-05` | Bitácora 2026-09-10, commit `e3567fd` |
| ✅ | Pantalla de aviso sin conexión | `RF-01` | Bitácora 2026-09-23 (prueba con el servidor detenido): `/contenido` cae en `offline.html` |
| ✅ | El service worker no guarda contenido privado | `RF-02` | Bitácora 2026-09-23, commit `3df4657` |
| ⏳ | Revisar que las pantallas definitivas se vean bien en teléfono (las construye frontend) | `RF-01` | Código actualizado. [Verificación local](../notion-frontend.md#registro-honesto). Teléfonos reales pendientes |
| ⏳ | Probar `RF-05` con una persona ajena al equipo | `RF-05` | |

## Cambio en curso

2026-10-09: adaptar las pantallas a The Meridian Times, con tema automático, áreas seguras y movimiento reducido.
Se reutilizan las instrucciones de instalación. No se modifica el service worker, el manifiesto ni los iconos.
El nombre de la PWA instalada sigue pendiente de coordinación con Ricardo.
La instrucción del 2026-10-09 autoriza verificaciones locales. La instalación y cada pantalla final requieren verificación real.
La entrada `/` con sesión dirige a `/chat` en el código, sin cambiar `start_url`, callback, manifiesto o service worker.
El usuario confirmó que la marca instalada, los iconos, la pantalla offline y la renovación de caché quedan como dependencia de Ricardo.
El frontend conserva las áreas seguras, controles táctiles, movimiento reducido y navegación compartida con el navegador.
Los colores de tema del layout coinciden con el papel claro y oscuro. El manifiesto conserva sus colores anteriores.
No se añade almacenamiento de respuestas privadas ni noticias para leer sin conexión.
La fase de implementación no escribió en Git. La entrega posterior autoriza commits locales, sin publicación automática. Las pruebas en teléfonos y preview siguen pendientes.
La consulta del manifiesto y las cabeceras HTTP anónimas se registran en [la evidencia local](../notion-frontend.md#registro-honesto).
No hubo prueba nueva de instalación, actualización ni desconexión real. El usuario pidió dejar pendientes todas las pruebas con sesión.
