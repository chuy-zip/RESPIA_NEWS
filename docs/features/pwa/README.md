# PWA

Instalación en iPhone y Android sin tiendas, y la forma de compartir la app para probarla.

**Requisitos:** `RF-01`, `RF-05` · **Contrato:** [ALCANCE.md](../../ALCANCE.md) ·
**Ciclos:** [bitacora.md](bitacora.md) · **Detalle técnico:** [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md)

## Qué es

Una aplicación web progresiva: se instala desde el navegador y abre a pantalla
completa. El enunciado descarta las tiendas, así que es exactamente lo pedido.

## Decisiones y su razón

| Decisión | Razón |
|---|---|
| **PWA pura**, sin aplicación nativa | El enunciado excluye las tiendas y un solo código sirve a iPhone y Android |
| Botón propio "Instalar app" en Android, que captura el evento de instalación del navegador | El aviso automático del navegador es una decisión suya y poco confiable |
| Pasos ilustrados para iPhone | Apple no ofrece ninguna API para instalar: en iOS las instrucciones **son** el mecanismo |
| El service worker no guarda páginas privadas, ni `no-store`, ni `/api/*` | Una página con datos del usuario no debe quedar en el dispositivo |
| Sin conexión solo se ofrece una pantalla de aviso (`offline.html`), no un modo sin conexión | No se promete lo que no se construyó |
| Nunca hay que reinstalar para actualizar | El icono apunta al dominio y el contenido se pide siempre al servidor |
| Se cambia `CACHE_VERSION` del service worker cuando cambia su comportamiento | Invalida lo guardado por versiones anteriores |

## Cómo se prueba

- **`RF-01`**: instalar en un iPhone (Safari) y un Android (Chrome), abrir desde el icono a
  pantalla completa y recorrer cada pantalla verificando que nada se corta ni se desborda.
- **`RF-05`**: que una persona ajena al equipo abra el enlace público, inicie sesión y siga
  las instrucciones de instalación sin ayuda.

## Uso de IA

Ninguno dentro del producto. En el desarrollo, ver la [bitácora](bitacora.md).

## Done

Aplica la [definición de Done](../../PROCESO.md#definición-de-done). **Done específico:**
toda pantalla nueva se probó en un iPhone y un Android reales, ya instalada.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ✅ | Manifiesto, iconos y service worker | `RF-01` | Commit `1fdcb81`; ver [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| ✅ | Instalación y apertura a pantalla completa en Android e iOS | `RF-01` | Tabla de pruebas de [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| ✅ | Botón de instalación en Android | `RF-05` | Bitácora 2026-09-10, commit `84ce854` |
| ✅ | Instrucciones de instalación para iPhone | `RF-05` | Bitácora 2026-09-10, commit `e3567fd` |
| ✅ | Pantalla de aviso sin conexión | `RF-01` | Bitácora 2026-09-23 (prueba con el servidor detenido): `/contenido` cae en `offline.html` |
| ✅ | El service worker no guarda contenido privado | `RF-02` | Bitácora 2026-09-23, commit `3df4657` |
| ⏳ | Revisar que las pantallas definitivas se vean bien en teléfono (las construye frontend) | `RF-01` | |
| ⏳ | Probar `RF-05` con una persona ajena al equipo | `RF-05` | |
