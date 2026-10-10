# Portal administrativo

**Requisitos:** RF-03, RF-15, RF-16, RT-03, RT-04, RP-02.
**Responsable:** Sergio Orellana (pantalla). Publicación y validación: Gerardo Pineda.
**Bitácora:** [registro](../docs/features/portal-admin/bitacora.md).
**Investigación:** [traslado](../notion-frontend.md).

## Comportamiento actual

La puerta del portal verifica sesión y rol. El editor por pasos publica únicamente noticias ficticias en memoria.
Comparte el marco editorial y relaciona errores con campos. El foco pasa al resumen de errores o al paso correspondiente.
El contenido publicado usa bloques tipados para el lector. No hay publicación remota implementada.

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
| En curso | Editor por pasos, revisión y publicación temporal | RF-15, RF-16, RT-03, RT-04 | Código actualizado. [Verificación local](../notion-frontend.md#registro-honesto). Pruebas con administrador pendientes |
| En curso | Mostrar consumo no disponible y dependencia del servidor | RP-02 | Código conservado. Prueba con sesión pendiente |
| Pendiente | Integración y validación editorial en servidor | RF-03, RF-15, RT-03 | Contratos pendientes |

## Cambio en curso

2026-10-09: construir una demo protegida sin operaciones remotas.
La regla demostrativa impide Confirmado mientras el editor declare fuente insuficiente o contradicción sin resolver.
Esta regla de interfaz es una propuesta. Backend debe acordarla y aplicarla en servidor antes de publicar de verdad.
El portal requiere una fuente con URL HTTP(S), revisión humana y origen de imagen declarado.
La noticia simulada aparece en el contexto de la pestaña. Una recarga la elimina.

2026-10-09: unificar acceso, formularios y mensajes con el layout editorial compartido.
Conservar la comprobación de rol en servidor, la revisión humana y todas las validaciones actuales.
Adaptar el contenido de la demo a bloques tipados para el lector. Mantener errores por campo y el texto escrito.
El usuario autoriza verificaciones locales. No se conectan servicios nuevos ni se hacen commits.
Se retiró la carga global de la raíz para evitar que el streaming anticipe HTTP 200 antes de `notFound()`.
La carga de ruta se limita a chat, edición y búsqueda. El control administrativo sigue en servidor.
El acceso anónimo se comprobó. La respuesta 404 con cuenta común y la publicación con administrador siguen pendientes por petición del usuario.
La evidencia está en [el registro local](../notion-frontend.md#registro-honesto). La inspección estática no demuestra esas pruebas de roles.
