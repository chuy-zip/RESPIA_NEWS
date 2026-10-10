# Imágenes: interfaz

**Requisitos:** RF-17, RF-18, RT-05. **Responsable de interfaz:** Sergio Orellana.
**Bitácora existente:** [imágenes](../docs/features/imagenes/bitacora.md).
**Investigación de frontend:** [traslado](../notion-frontend.md).

## Comportamiento actual

No hay servicio de imágenes. D-23 establece imágenes de banco confirmadas por una persona para la integración real.

## Criterios de aceptación

Ofrecer una alternativa visual sin imagen rota. Mostrar origen, autor, licencia y costo cuando los entregue Backend.
Mantener la etiqueta de procedencia en feed y lector.

## No incluido

Generación de imágenes, búsqueda remota, subida de archivos y cambios de Storage.

## Dependencias

POST `/api/admin/images/preview`: nombre propuesto para solicitar candidatas y sus condiciones.
La forma definitiva debe acordarse con Backend. No reemplaza D-23.

## Uso de IA en el producto

La app no consulta un modelo. Las ilustraciones son SVG locales escritos con asistencia de Codex.
Su etiqueta declara esa asistencia. No se utilizó un servicio de generación de imágenes.

## Done específico

Integrar candidatas reales y verificar etiquetas con la política editorial del equipo.

## Tareas

La parte de IA (el modelo propone la imagen) está en el ticket [TKT-4](https://app.notion.com/p/3f5f573ce6df81feb6e3fb92c207a067) (D-28).

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Previsualizar ilustraciones locales identificadas como demo | RF-17, RF-18, RT-05 | Pruebas pendientes |
| Pendiente | Conectar candidatas, autor, licencia y costo reales | RF-17, RF-18 | Backend pendiente |

## Cambio en curso

2026-10-09: usar ilustraciones locales para revisar la interfaz sin consultar bancos ni modelos.
Las ilustraciones se etiquetan como recursos de demo con asistencia de IA. No son fotografías del hecho.
