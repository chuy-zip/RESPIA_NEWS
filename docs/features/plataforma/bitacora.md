# Bitácora de la plataforma

De lo más reciente a lo más antiguo. Las entradas de esta página se **reconstruyeron
el 7-oct-2026** a partir del historial de Git y de la conversación de trabajo con el
asistente de IA; las fechas son hora local (Guatemala).

## 2026-10-04 · El equipo recortó lo que el asistente proponía agregar

**Requisitos:** `RP-04`

- **Comprensión:** al preparar el traspaso de infraestructura, el asistente propuso
  como pendientes varias cosas: Supabase CLI y carpeta `supabase/`, cabeceras de
  seguridad y CSP, pruebas automatizadas, fijar la versión de Node, y una tarea
  programada para evitar que la base se pause por inactividad.
- **Hipótesis:** el asistente creía que mejoraban la solidez del proyecto.
- **Observación:** el equipo preguntó para qué servía cada una y no encontró una
  consecuencia concreta que justificara el trabajo, o la descartó por alcance.
  Ninguna se implementó. La tarea programada llegó a escribirse (ruta, `vercel.json`
  y script SQL) y se **borró** por completo.
- **Corrección:** el traspaso solo conserva lo que tiene una consecuencia clara. La
  pausa de Supabase por inactividad quedó documentada como riesgo conocido, sin
  mecanismo automático.
- **Uso de IA:** ejemplo de criterio humano sobre la propuesta del asistente: se
  aceptó solo lo que el equipo pudo justificar.
- **Evidencia:** riesgos y decisiones en [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md).

## 2026-09-10 · La instalación de dependencias falló y ESLint 10 no era compatible

**Requisitos:** `RP-04`

- **Comprensión:** primera instalación del proyecto base.
- **Hipótesis:** las versiones de las dependencias que el asistente escribió eran las correctas.
- **Prueba:** `npm install`.
- **Observación:** falló por conflicto de dependencias: el asistente había escrito
  versiones que no existían. Una vez corregidas, ESLint 10 resultó incompatible con
  el plugin de React que trae `eslint-config-next` de Next.js 16 y rompía el puente
  de configuración.
- **Corrección:** se usaron versiones reales y se fijó ESLint en la línea 9.x. La
  aplicación compiló y la API de prueba devolvió un chiste real.
- **Uso de IA:** error del asistente detectado por la herramienta, no por revisión
  humana: por eso la prueba (instalar y compilar) es la que da el criterio de "listo".

## 2026-09-09 · El límite de las funciones de Vercel era 300 s, no 10 s

**Requisitos:** `RP-04`

- **Comprensión:** evaluar si el plan gratuito alcanza para llamar a modelos de IA.
- **Hipótesis:** el asistente afirmó que el límite en Hobby eran 10 s.
- **Prueba:** el equipo dudó y pidió revalidar.
- **Observación:** en la documentación oficial, con la ejecución fluida activada por
  defecto, el máximo en Hobby es de **300 s**. El dato de 10 s correspondía a la
  etapa anterior.
- **Corrección:** se corrigió la evaluación. Con 300 s, el plan gratuito sí es viable
  para las llamadas a modelos, que era una preocupación importante.
- **Uso de IA:** el equipo detectó un dato desactualizado del asistente; este lo
  verificó en la fuente oficial y lo reconoció.
