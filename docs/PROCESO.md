# Proceso de trabajo

El enunciado pide que el desarrollo asistido por IA sea **observable**: ciclos
reales de comprensión, hipótesis, construcción, prueba, observación y corrección,
con ejemplos de cómo la evidencia cambió una decisión, y evidencia de por qué cada
tarea se dio por terminada. Este documento fija cómo lo hacemos. Los requisitos
que cubre son `RPR-01` a `RPR-03` de [ALCANCE.md](ALCANCE.md).

El equipo **no impone reglas de control de versiones**: no se exigen ramas, pull
requests ni revisiones. Cada quien trabaja como le resulte práctico. Lo único que
se pide es lo que hace falta para tener evidencia, y vive en la documentación, no
en el flujo de Git.

## Unidades de trabajo

| Qué | Dónde vive | Para qué sirve como evidencia |
|---|---|---|
| **Requisito** | [ALCANCE.md](ALCANCE.md) | Qué debe cumplirse y cómo se prueba |
| **Tarea** | Tabla de tareas en el `README.md` de la feature, con el ID del requisito y su evidencia | Qué se planeó y qué quedó terminado |
| **Ciclo** | Una entrada en `features/<feature>/bitacora.md` | Cómo cambió una decisión por la evidencia |
| **Evidencia** | Un **registro escrito** de la prueba (ver [Evidencia](#evidencia)) | Por qué se dio por terminada la tarea |

Una tarea sin ID de requisito no se agrega: si no responde a ninguno, o falta el
requisito (se agrega al alcance con registro de cambio) o la tarea sobra.

Los commits ayudan, pero son opcionales: si se puede, el mensaje cita el ID
(`RF-08: feed con tres niveles`) y la bitácora anota el hash. Si no, no pasa nada;
las fechas de la bitácora y del historial de Git dan igualmente la secuencia.

## El ciclo

Cada vez que se construye algo no trivial se recorre, y lo que valga la pena se
anota en la bitácora de la feature:

1. **Comprensión.** Qué problema se resuelve y qué se sabe de él.
2. **Hipótesis.** Qué se cree que funcionará y qué se espera ver.
3. **Construcción.** Qué se hizo.
4. **Prueba.** Qué se ejecutó para comprobarlo.
5. **Observación.** Qué pasó en realidad. Aquí van los descubrimientos.
6. **Corrección.** Qué cambió por lo observado: código, decisión o requisito.

No todo cambio es un ciclo. Se anotan los que **cambiaron algo** por la evidencia
o los que descartaron una hipótesis. Un ciclo donde todo salió como se esperaba,
sin sorpresa, rara vez enseña algo.

Las entradas llevan la **fecha en que ocurrió** el hecho. Si una entrada se
escribe después, se marca como *reconstruida* y se toma la fecha del historial de
Git o de la conversación de trabajo.

### Plantilla de entrada

```markdown
## 2026-10-08 · Título corto de lo que pasó

**Requisitos:** RF-08 · **Commit:** abc1234 (opcional)

- **Comprensión:** …
- **Hipótesis:** …
- **Construcción:** …
- **Prueba:** … (cómo se probó)
- **Observación:** … (lo que se vio, aunque contradiga la hipótesis)
- **Corrección:** … (qué cambió por eso)
- **Uso de IA:** …
- **Evidencia:** … (cuándo, dónde y qué resultado; una captura es opcional)
```

## Registro del uso de IA en el desarrollo

El enunciado pide que el uso de IA al desarrollar se pueda observar. En cada
entrada de bitácora donde se trabajó con un asistente de IA se anota:

- **Herramienta y modelo** usados.
- **Qué se le pidió**, resumido (no se pega el prompt completo si contiene datos
  sensibles).
- **Qué propuso** y **qué decidió el equipo**: qué se aceptó, qué se rechazó y qué
  se corrigió. Esta parte es la más importante: muestra el criterio humano.
- **Cómo se verificó** que lo propuesto era correcto (prueba, lectura del código,
  documentación oficial).

Si la IA propuso algo incorrecto y el error fue **significativo** (llevó a una nueva
decisión o cambió una implementación), **se anota**. Es evidencia valiosa del
proceso, no un fallo que esconder. Los errores menores que se corrigen sobre la marcha
no se registran: la bitácora es para lo que enseñó algo.

Esto es distinto del **uso de IA dentro del producto** (qué funciones llaman a un
modelo, cuánto cuestan y por qué). Eso se documenta en la feature de costos y en
cada feature que use un modelo, y se mide con el registro de llamadas (`RP-02`).

## Definición de Done

Una tarea está terminada cuando **todo** esto es cierto:

1. Cumple el criterio de aceptación del requisito que cita.
2. La prueba del requisito se **ejecutó** y su resultado quedó registrado por
   escrito (ver [Evidencia](#evidencia)).
3. El cambio está desplegado en Vercel y se probó ahí, no solo en local. Si el
   requisito exige un dispositivo (iPhone, Android), se probó en uno real.
4. `tsc` y `eslint` pasan.
5. No hay secretos, llaves ni correos reales en el cambio.
6. La documentación de la feature está al día: su tabla de tareas, con la
   evidencia de la tarea, y, si hubo un descubrimiento, su entrada en la bitácora.
7. La matriz de estado de [ALCANCE.md](ALCANCE.md) se actualiza.

La prueba la ejecuta quien hizo el cambio. Si otra persona del equipo puede
repetirla en su teléfono, mejor, pero no es requisito. Cada feature puede agregar
un **Done específico** en su README si necesita algo más.

## Evidencia

La evidencia es un **registro escrito de la prueba**, no una captura. Las capturas
se desactualizan y cuestan tiempo; un registro con fecha y resultado no. Para que
valga como evidencia debe decir:

- **Cuándo** se probó (fecha).
- **Dónde:** el entorno y, si aplica, el dispositivo (por ejemplo "iPhone real, app
  instalada" o "producción en Vercel").
- **Qué se hizo y qué se vio.** Lo observado, no solo "funciona".
- **Resultado:** pasó o falló.

Se anota donde corresponda, y la tabla de tareas apunta ahí:

- La **entrada de la bitácora** de la feature, si la prueba enseñó algo.
- Una fila en el README de la feature, si fue una prueba sin sorpresas.
- Una **verificación ya documentada**, como una sección de
  [INFRA_HANDOFF.md](INFRA_HANDOFF.md), sin copiarla.
- El **commit**, si se quiere citar el cambio probado.

Las capturas son **opcionales**: sirven si alguien quiere dejar una, pero ninguna
tarea las exige. Si se sube una, va pequeña a `features/<feature>/evidencia/`, con el
nombre `AAAA-MM-DD-descripción.ext`, y **nunca** muestra llaves, tokens, cookies,
correos reales ni datos de compañeros: el repositorio es público.

Una tarea no se da por hecha sin su registro.

## Cómo se organiza la documentación

Ver [README.md](README.md) y [features/README.md](features/README.md).
