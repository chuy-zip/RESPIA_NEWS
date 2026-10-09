# Ubicación y perfil

**Requisitos:** RF-04, RF-06. Señales de RF-10: dependencia de recomendación (D-20).
**Responsable:** Sergio Orellana (interfaz).
**Bitácora:** [registro](../docs/features/ubicacion-y-perfil/bitacora.md).
**Investigación:** [traslado a Notion](../notion-frontend.md).

## Comportamiento actual

No hay selector de región ni persistencia de perfil de noticias.

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
| En curso | Selector, perfil y explicación de datos temporales | RF-04, RF-06 | Pruebas pendientes |
| Pendiente | Guardar región y enviar señales según contrato aprobado | RF-04, RF-10 | Backend y recomendación pendientes |

## Cambio en curso

2026-10-09: añadir perfil protegido y selector compartido mediante estado en memoria.
Las lecturas se deduplican por ID durante la demo. No se envían eventos ni preguntas a un servicio.
La privacidad distinguirá esta memoria temporal de la futura persistencia.
