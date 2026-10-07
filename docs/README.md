# Documentación

Punto de entrada de la carpeta `docs/`. Cada documento responde una pregunta.

| Documento | Pregunta que responde |
|---|---|
| [ALCANCE.md](ALCANCE.md) | ¿Qué debe cumplir y probar el sistema? (los requisitos, fijados a partir del enunciado) |
| [PROCESO.md](PROCESO.md) | ¿Cómo trabajamos y cómo dejamos evidencia? (ciclos, uso de IA, definición de Done) |
| [features/](features/README.md) | ¿Qué se hizo en cada parte del producto, qué se descubrió y con qué evidencia? |
| [INFRA_HANDOFF.md](INFRA_HANDOFF.md) | ¿Cómo está montada la infraestructura y cómo se opera? |
| [sql/](sql/) | ¿Cómo se crea la base? Scripts numerados que se ejecutan a mano en Supabase |
| [Enunciado del curso](Proyecto%202%20AI%20Assisted%20News%20App.pdf) | ¿Qué pide el curso? |

## Estructura

```
docs/
├─ README.md              este índice
├─ ALCANCE.md             requisitos y criterios de aceptación (el contrato)
├─ PROCESO.md             flujo de trabajo, registro de uso de IA, Done
├─ INFRA_HANDOFF.md       infraestructura y operación
├─ sql/                   scripts de base de datos, numerados
└─ features/              una carpeta por parte del producto
   ├─ README.md           convención y lista de features
   └─ <feature>/
      ├─ README.md        qué es, requisitos que cubre, diseño, pruebas, uso de IA
      ├─ bitacora.md      ciclos fechados: hipótesis, observación, corrección
      └─ evidencia/       opcional: capturas (la evidencia es el registro escrito)
```

## Cómo se relacionan

Un **requisito** de `ALCANCE.md` se construye en una **feature**. La feature
tiene una **tabla de tareas** que citan el ID del requisito, y cada tarea hecha
apunta a su **evidencia** (un registro escrito de la prueba) y, si enseñó algo,
a un **ciclo** en la bitácora.

---

## Instrucciones para agentes de IA

Si eres un asistente de IA (Claude, Codex, Copilot u otro) que trabaja en este
repositorio, estas reglas son el proceso de trabajo que exige el curso. Aplican a
todo lo que hagas, y la persona del equipo que te lo pidió es quien responde por
el resultado.

### Antes de empezar

1. Lee [ALCANCE.md](ALCANCE.md): los requisitos y sus criterios de aceptación.
2. Lee [PROCESO.md](PROCESO.md): el ciclo, el registro de uso de IA, la definición de
   Done y qué cuenta como evidencia.
3. Lee el `README.md` y la `bitacora.md` de la feature que vas a tocar
   ([lista de features](features/README.md)). Si la feature aún no existe, créala
   copiando la estructura de [acceso](features/acceso/README.md).

### Reglas

1. **Todo trabajo responde a un requisito** (`RF-08`, `RT-03`…). La persona no tiene por
   qué darte el ID: **búscalo tú** en [ALCANCE.md](ALCANCE.md) (los IDs están en las
   tablas de las secciones 1 a 4) o a partir de la feature en
   [features/README.md](features/README.md). Si ninguno corresponde, dilo y propón
   agregarlo a `ALCANCE.md`; no lo inventes.
2. **No cambies requisitos ni criterios de aceptación en silencio.** Si hay que
   cambiarlos, propón el cambio a la persona y, si lo aprueba, regístralo en el
   registro de cambios de `ALCANCE.md`. La matriz de estado sí la actualizas tú.
3. **Trabaja por ciclos** (comprensión, hipótesis, construcción, prueba,
   observación, corrección). **Escribe una entrada en la bitácora** de la feature solo
   cuando lo que observaste **cambió una decisión o una implementación**, o descartó una
   hipótesis importante. No registres cada paso ni cada error menor. Usa la plantilla de
   [PROCESO.md](PROCESO.md#plantilla-de-entrada), la fecha real, y no inventes fechas ni
   resultados.
4. **Registra tu propio uso de IA** en cada entrada: qué herramienta y modelo eres, qué
   se te pidió, qué propusiste, qué aceptó o rechazó el equipo y cómo se verificó. Si
   cometiste un error **significativo** (uno que llevó a una nueva decisión), anótalo:
   es evidencia, no algo que esconder. Los errores menores que corregiste sobre la
   marcha no se registran.
5. **Nunca marques una tarea como hecha sin haber ejecutado su prueba** y dejado el
   registro (fecha, dónde, qué se vio, resultado). Si no puedes probarla tú (requiere
   una cuenta real, un teléfono, un acceso que no tienes), dilo y déjala pendiente:
   no declares ✅ lo que no verificaste.
6. **Cumple la [definición de Done](PROCESO.md#definición-de-done)** y, al terminar,
   actualiza la tabla de tareas de la feature (estado y evidencia) y la matriz de
   estado de `ALCANCE.md`.
7. **El repositorio es público.** No escribas secretos, llaves, tokens, correos
   reales ni datos de personas, ni en el código ni en los documentos. No leas ni
   muestres los valores de `.env.local`: si necesitas una credencial, pídela.
8. **No agregues herramientas, dependencias ni tareas sin una consecuencia concreta que
   las justifique.** El equipo ya decidió no usar la CLI de Supabase, fijar la versión de Node ni tareas
   programadas (CRON jobs); ver [plataforma](features/plataforma/README.md). No las vuelvas a proponer.
9. **Los documentos de este repositorio son autocontenidos:** no referencian archivos
   que estén fuera de él.

### Al terminar

Resume a la persona qué cambiaste, qué probaste y qué **no** pudiste probar, y dónde
quedó el registro.
