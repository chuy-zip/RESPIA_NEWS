# Ubicación y perfil

**Requisitos:** RF-04, RF-06. Señales de RF-10: dependencia de recomendación (D-20).
**Responsable:** Sergio Orellana (interfaz).
**Bitácora:** [registro](../docs/features/ubicacion-y-perfil/bitacora.md).
**Investigación:** [traslado a Notion](../notion-frontend.md).

## Comportamiento actual

Existe un selector de región y un perfil de demostración en memoria. No hay persistencia de perfil de noticias.
La pantalla comparte el marco editorial y agrupa cuenta, región, instalación y enlace a Guardados.
No permite editar la identidad de Google. El tema sigue la configuración del dispositivo.

## Criterios de aceptación

Cambiar entre escenarios de región sin solicitar GPS. Mantener la selección al navegar dentro de la demo.
Explicar que se pierde al recargar. Mostrar lecturas de ejemplo sin presentarlas como intereses inferidos.
La integración real debe guardar la región y actualizar privacidad conforme al esquema aprobado.

## No incluido

Persistencia, GPS, edición de identidad y cálculo de intereses.

## Dependencias

GET `/api/catalogs`, GET/PATCH `/api/profile` y POST `/api/interactions`, propuestos a Backend.

## Uso de IA en el producto

Ninguno.

## Done específico

Comprobar cambio de región con dos cuentas y datos reales después de integrar Backend.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Selector, perfil y explicación de datos temporales | RF-04, RF-06 | Código unificado. [Verificación local](../notion-frontend.md#registro-honesto). Pruebas con sesión pendientes |
| Pendiente | Guardar región y enviar señales según contrato aprobado | RF-04, RF-10 | Backend y recomendación pendientes |

## Cambio en curso

2026-10-09: añadir perfil protegido y selector compartido mediante estado en memoria.
Las lecturas se deduplican por ID durante la demo. No se envían eventos ni preguntas a un servicio.
La privacidad distingue esta memoria temporal de la futura persistencia y explica los parámetros de búsqueda en la URL.

2026-10-09: integrar perfil y acceso requerido en el marco editorial compartido.
Agrupar cuenta, región, instalación y enlace a Guardados. No crear edición de identidad ni preferencias sin servicio.
Los formularios conservan etiquetas, foco y estados accesibles. El usuario autoriza verificaciones locales.
No se guarda ningún dato nuevo en el servidor ni se modifica la autenticación. La implementación quedó sin commits. La entrega posterior autoriza commits locales separados.
El acceso anónimo se comprobó en producción local. La región, la cuenta y la instalación con sesión quedan pendientes por petición del usuario.
La evidencia de esta revisión se conserva en [el registro local](../notion-frontend.md#registro-honesto).
