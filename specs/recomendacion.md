# Recomendación

Orden, niveles de prominencia e intereses del feed de cada usuario. El diseño es de IA. El endpoint del feed es
de Backend y llama al recomendador (D-20).

**Requisitos:** `RF-08`, `RF-10`, `RF-11`, `RT-01` · **Bitácora:** se crea con el primer ciclo que cambie una decisión ·
**Decisiones:** D-20 · **Investigación (Notion):** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db) ·
**Responsable:** Rodrigo Mansilla (IA). Endpoint: Gerardo Pineda. Pantalla: Sergio Orellana.

## Comportamiento actual

Todavía no existe. El diseño propuesto está en «Cambio en curso».

## Criterios de aceptación

- **`RF-08`**: dos cuentas con región o intereses distintos ven las mismas noticias. La misma noticia queda en
  niveles distintos. El feed muestra al menos 3 niveles.
- **`RF-10`**: una cuenta nueva abre 5 noticias de un tema. Las noticias de ese tema suben en el feed.
- **`RF-11`**: una cuenta con intereses estrechos sigue viendo una noticia importante fuera de ellos.
- **`RT-01`**: para cualquier noticia del feed se puede mostrar por qué quedó en su nivel.
- **`RP-03`**: `src/lib/recomendacion/` no llama a ningún modelo.

## No incluido

- Embeddings, filtrado colaborativo o un modelo que ordene el feed (`RP-03`, `RT-01`).
- GPS: la región es la simulada (`RF-04`).

## Dependencias

- Datos: regiones, temas y fecha de cada noticia (`RF-16`), un campo de importancia, una tabla de señales y la
  región del perfil. La cobertura es Centroamérica más noticias internacionales (D-26).
- `portal-admin`: el administrador marca la importancia.
- Backend: el endpoint del feed devuelve el nivel y la explicación de cada noticia.
- Frontend: los niveles visuales y el registro de la señal al abrir una noticia.
- Acceso: las señales son datos del usuario y van en `/privacidad` (`RF-06`).
- `chat`: usa las primeras recomendaciones.

## Uso de IA en el producto

Ninguno: el recomendador no llama a ningún modelo (`RP-03`).

## Done específico

- Cada noticia del feed trae los componentes de su puntaje.

## Tareas

Están en la base [Tickets](https://app.notion.com/p/49bcd1575a0543399a87a1db2f1c341f) de Notion, feature `recomendacion` (D-27). Cada ticket tiene responsable, estado, bloqueos y evidencia.

## Cambio en curso

Propuesta del 2026-10-09 (CIC-28). Todavía no hay código.

### Puntaje

Cada noticia recibe un puntaje con cuatro componentes con nombre:

| Componente | Valor | De dónde sale |
|---|---|---|
| Región | Alto si la noticia es de la región simulada del usuario. Menor si es nacional o internacional | Región del perfil (`RF-04`) y regiones de la noticia |
| Interés | Peso de los temas de la noticia en el perfil, de 0 a 1 | Señales del usuario (`RF-10`) |
| Recencia | Baja con las horas desde la publicación | Fecha de la noticia |
| Importancia | Marcada por una persona en el portal | Portal administrativo |

Los pesos de cada componente se fijan en el código y se ajustan con la prueba de dos cuentas.

### Reglas

1. **Niveles (`RF-08`):** las franjas del puntaje dan el nivel 1 (destacada), el 2 (mediana) y el 3 (lista).
2. **Lo importante no se oculta (`RF-11`):** el feed reserva un lugar en el nivel 1 o 2 para la noticia
   importante más reciente de cada ámbito (local, nacional e internacional), aunque no coincida con la región
   ni con los intereses.
3. **Intereses (`RF-10`):** abrir una noticia suma al peso de sus temas. Los pesos bajan con el tiempo para que
   un interés viejo no domine.
4. **Explicación (`RT-01`):** cada noticia trae sus componentes. Ejemplo: «Destacada: es de tu región y es importante».
