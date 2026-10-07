# Features

Una carpeta por parte del producto. Reúne en un solo lugar lo que se decidió, lo
que se descubrió y la evidencia, de modo que se pueda seguir la historia de cada
parte sin recorrer todo el repositorio.

## Qué lleva cada feature

| Archivo | Contenido |
|---|---|
| `README.md` | Qué es la feature, qué requisitos cubre, diseño y decisiones con su razón, cómo se prueba, **dónde usa IA y por qué**, y su estado |
| `bitacora.md` | Ciclos fechados, de lo más reciente a lo más antiguo, con la plantilla de [PROCESO.md](../PROCESO.md#plantilla-de-entrada) |
| `evidencia/` | **Opcional.** Capturas, si alguien quiere dejar alguna. La evidencia obligatoria es el registro escrito de la prueba (ver [PROCESO.md](../PROCESO.md#evidencia)) |

La carpeta de una feature se crea cuando empieza su trabajo, no antes: no se
dejan carpetas vacías. Quien empieza una feature crea su carpeta con un `README.md`
(copiando la estructura de [acceso](acceso/README.md)) y su `bitacora.md`.

## Lista de features

| Feature | Requisitos que cubre | Carpeta |
|---|---|---|
| `acceso` (sesión, roles y privacidad) | RF-02, RF-03, RF-06 | [acceso/](acceso/README.md) |
| `pwa` (instalación y compartir) | RF-01, RF-05 | [pwa/](pwa/README.md) |
| `plataforma` (hosting, base de datos y costo de infraestructura) | RP-04 | [plataforma/](plataforma/README.md) |
| `ubicacion-y-perfil` (región simulada e intereses) | RF-04, RF-10 | aún no creada |
| `portal-admin` (crear, publicar, validar) | RF-15, RF-16, RT-03, RT-04 | aún no creada |
| `imagenes` | RF-17, RF-18, RT-05 | aún no creada |
| `feed-y-lector` (jerarquía y lectura) | RF-08, RF-09, RF-11, RT-01, RT-02, RT-06 | aún no creada |
| `chat` | RF-07, RF-12, RF-13, RF-14 | aún no creada |
| `costos-ia` (registro, tope y reserva) | RP-01, RP-02, RP-03 | aún no creada |

Si una parte nueva no encaja en ninguna, primero se revisa si responde a un
requisito. Si no, falta el requisito.

## Convenciones

- El nombre de la carpeta va en minúsculas y con guiones.
- Los requisitos se citan por su ID (`RF-08`), nunca copiando el texto: el
  contrato vive solo en [ALCANCE.md](../ALCANCE.md).
- Una feature que usa un modelo de IA lo declara en su `README.md`: qué función,
  qué modelo, para qué, qué alternativa más barata se consideró y cuánto cuesta.
  Con eso se alimenta la presentación de costos.
