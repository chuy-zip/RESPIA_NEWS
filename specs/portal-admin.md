# Portal administrativo

**Requisitos:** RF-03, RF-15, RF-16, RT-03, RT-04, RP-02.
**Responsable:** Sergio Orellana (pantalla). Publicación y validación: Gerardo Pineda.
**Bitácora:** [registro](../docs/features/portal-admin/bitacora.md).
**Investigación:** [traslado](../notion-frontend.md).

## Comportamiento actual

La puerta del portal verifica sesión y rol. No hay publicación implementada.

## Criterios de aceptación

- Mantener 404 para cuentas sin rol administrativo y pedir sesión a visitantes.
- Preparar contenido, fuentes, fecha, temas, regiones, estado y procedencia antes de revisar.
- Mostrar vista previa y exigir confirmación humana para la publicación simulada.
- Mostrar errores por campo sin descartar el texto escrito.
- Identificar la simulación. No prometer escritura en Supabase ni consumo medido.

## No incluido

Endpoints, permisos nuevos, roles, archivos SQL, validación editorial del servidor y consumo de modelos.

## Dependencias

GET/POST `/api/admin/articles` y GET `/api/admin/ai-usage`, propuestos a Gerardo y Rodrigo.
Los límites se consultarán al servidor. La demo no presenta ceros como gasto real.

## Uso de IA en el producto

Ninguno en esta entrega.

## Done específico

Verificar con administrador y usuario común. Publicar y comprobar la noticia en otro teléfono cuando exista Backend.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Editor por pasos, revisión y publicación temporal | RF-15, RF-16, RT-03, RT-04 | Pruebas pendientes |
| En curso | Mostrar consumo no disponible y dependencia del servidor | RP-02 | Prueba pendiente |
| Pendiente | Integración y validación editorial en servidor | RF-03, RF-15, RT-03 | Contratos pendientes |

## Cambio en curso

2026-10-09: construir una demo protegida sin operaciones remotas.
La regla demostrativa impide Confirmado mientras el editor declare fuente insuficiente o contradicción sin resolver.
Esta regla de interfaz es una propuesta. Backend debe acordarla y aplicarla en servidor antes de publicar de verdad.
El portal requiere una fuente con URL HTTP(S), revisión humana y origen de imagen declarado.
La noticia simulada aparece en el contexto de la pestaña. Una recarga la elimina.
