# Bitácora del portal administrativo

## 2026-10-14 · Del acumulado al historial diario

**Requisitos:** RF-03, RP-01 y RP-02. ID de ciclo pendiente de asignación en Notion.

- **Comprensión:** el endpoint solo entregaba acumulados. El usuario necesita consultar días y usos desde Administración.
- **Hipótesis:** un resumen con historial diario y desglose por función permite revisar el gasto sin consultar SQL.
- **Construcción:** panel editorial, ampliación del endpoint y una RPC administrativa en una migración nueva.
- **Prueba:** verificación local con dependencias simuladas. Datos reales y comparación con el proveedor pendientes.
- **Observación:** la inspección encontró fechas y tokens ya guardados, pero no expuestos por el resumen.
- **Corrección:** el usuario autoriza ampliar Backend e IA. El historial deja de estar fuera del alcance de esta entrega.
- **Agente:** Codex y subagentes de implementación y revisión. No se registra un modelo exacto no confirmado.
- **Pedido:** mostrar acumulados, gasto diario y uso de la API sin leer `.env.local`.
- **Propuesta:** conservar los acumulados y consultar 7, 30 o 90 días con corte en Guatemala. No consultar la llave ni el proveedor.
- **Decisión:** el usuario acepta incorporar el cambio de Backend y pide documentarlo. No se cambian precios, reserva ni tope.
- **Verificación:** [registro y pendientes del portal](../../../specs/backend/portal-admin.md#consumo-de-ia-en-el-portal--2026-10-14).

La migración no se ejecuta en esta tarea. La revisión de los responsables, las pruebas reales y la conciliación siguen pendientes.
