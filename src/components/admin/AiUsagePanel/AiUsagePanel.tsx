"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { apiRequest, asApiError, isAbortError, type ApiError } from "@/components/news/ReaderSession/api";
import { Button } from "@/components/ui/Button";
import type { AiUsageSummary } from "@/lib/ia/cost";
import styles from "./AiUsagePanel.module.css";

type Days = 7 | 30 | 90;
type Daily = NonNullable<AiUsageSummary["daily"]>;

const money = new Intl.NumberFormat("es-GT", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", minimumFractionDigits: 6, maximumFractionDigits: 8 });
const number = new Intl.NumberFormat("es-GT");
const functionNames: Record<string, string> = { responderChat: "Conversación de noticias", elegirImagen: "Selección de imágenes", buscarExterno: "Búsqueda externa · Tavily" };
const availabilityLabels = {
  available: "Hay margen hasta el tope de la app",
  limit_reached: "Se alcanzó el tope de la app",
  unavailable: "No se pudo determinar el margen disponible",
};

function usd(value: number | null) {
  return value === null ? "No disponible" : money.format(value);
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function DailyCostChart({ daily }: { daily: Daily }) {
  const id = useId();
  const maximum = Math.max(0, ...daily.items.map((item) => item.costUsd));
  if (maximum === 0) return <p className={styles.note}>No hay gasto registrado en este período. Las llamadas gratuitas también aparecen en el detalle diario.</p>;
  const points = daily.items.map((item, index) => `${daily.items.length === 1 ? 300 : index * 600 / (daily.items.length - 1)},${172 - item.costUsd / maximum * 160}`).join(" ");
  const middle = daily.items[Math.floor((daily.items.length - 1) / 2)]?.date;
  return <div className={styles.chart}>
    <div className={styles.axis} aria-hidden="true"><span>{usd(maximum)}</span><span>{usd(0)}</span></div>
    <div className={styles.plot}>
      <svg viewBox="0 0 600 184" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-title ${id}-description`}>
        <title id={`${id}-title`}>Costo registrado por día en USD</title>
        <desc id={`${id}-description`}>Del {dateLabel(daily.from)} al {dateLabel(daily.to)}, con corte en Guatemala. Máximo diario: {usd(maximum)}. Los valores completos están en el detalle diario.</desc>
        <path d="M0 12H600 M0 92H600 M0 172H600 M0 12V172" className={styles.chartGrid} vectorEffect="non-scaling-stroke" />
        <polyline points={points} className={styles.chartLine} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className={styles.dates} aria-hidden="true"><span>{dateLabel(daily.from)}</span>{middle && <span>{dateLabel(middle)}</span>}<span>{dateLabel(daily.to)}</span></div>
    </div>
  </div>;
}

export function AiUsagePanel() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<Days>(30);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<AiUsageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    request.current = controller;
    apiRequest<{ data: AiUsageSummary }>(`/api/admin/ai-usage?days=${days}`, { signal: controller.signal })
      .then((response) => { if (!controller.signal.aborted) setData(response.data); })
      .catch((failure: unknown) => { if (!controller.signal.aborted && !isAbortError(failure)) setError(asApiError(failure)); })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
        if (request.current === controller) request.current = null;
      });
    return () => controller.abort();
  }, [open, days, revision]);

  function prepareRequest() {
    request.current?.abort();
    setData(null);
    setError(null);
    setLoading(true);
  }

  function refresh() {
    if (loading) return;
    prepareRequest();
    setRevision((current) => current + 1);
  }

  const daily = data?.daily;
  const period = daily?.items.reduce((sum, item) => ({ costUsd: sum.costUsd + item.costUsd, calls: sum.calls + item.calls }), { costUsd: 0, calls: 0 });
  const lastDay = daily?.items.find((item) => item.date === daily.to);
  const updatedDate = data ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(data.updatedAt)) : null;
  const todayLabel = daily && daily.to !== updatedDate ? "Último día del reporte" : "Hoy en Guatemala";
  const calls = data?.byFunctionAvailable ? data.byFunction.reduce((sum, item) => sum + item.calls, 0) : null;
  const greatestFunctionCost = data ? Math.max(0, ...data.byFunction.map((item) => item.costUsd)) : 0;

  return <details id="consumo-ia" className={styles.panel} onToggle={(event) => {
    const next = event.currentTarget.open;
    if (next === open) return;
    setOpen(next);
    if (next) prepareRequest();
    else { request.current?.abort(); setLoading(false); }
  }}>
    <summary className={styles.heading}><span><span className={styles.title}>Consumo de IA</span><span className={styles.subtitle}>Gasto registrado, presupuesto y actividad diaria</span></span></summary>
    <div className={styles.content}>
      <div className={styles.toolbar}>
        <label>Período del gráfico<select value={days} onChange={(event) => {
          const next = Number(event.target.value);
          if ((next !== 7 && next !== 30 && next !== 90) || next === days) return;
          prepareRequest();
          setDays(next);
        }}><option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option></select></label>
        <Button variant="ghost" onClick={refresh} disabled={loading}>{loading ? "Consultando…" : "Actualizar registros"}</Button>
      </div>
      <p className={styles.note}>Estos registros reúnen local, preview y producción. Son el consumo anotado por la app, no el saldo de Anthropic ni de una llave.</p>
      {loading && <p className={styles.loading} role="status">Consultando los registros de consumo…</p>}
      {error && <ApiErrorNotice error={error} retry={refresh} />}
      {data && <>
        <p className={styles.updated}>Consultado el <time dateTime={data.updatedAt}>{new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guatemala" }).format(new Date(data.updatedAt))}</time> · hora de Guatemala</p>
        <dl className={styles.metrics}>
          <div><dt>Gasto acumulado · USD</dt><dd>{usd(data.spent)}</dd></div>
          <div><dt>{todayLabel} · USD</dt><dd>{usd(lastDay?.costUsd ?? null)}{daily && <span>{dateLabel(daily.to)}</span>}</dd></div>
          <div><dt>Disponible hasta el tope · USD</dt><dd>{usd(data.remaining)}</dd></div>
          <div><dt>Tope de la app · USD</dt><dd>{usd(data.applicationLimit)}</dd></div>
          <div><dt>Reserva informada · USD</dt><dd>{usd(data.reserved)}</dd></div>
          <div><dt>Llamadas acumuladas</dt><dd>{calls === null ? "No disponible" : number.format(calls)}<span>Incluye búsquedas en Tavily.</span></dd></div>
        </dl>
        <div className={styles.availability} data-state={data.availability}><strong>{availabilityLabels[data.availability]}</strong><p>Este estado describe el presupuesto registrado. No confirma que el modelo esté disponible.</p></div>
        <section className={styles.section} aria-labelledby="daily-usage-title">
          <div className={styles.sectionHeading}><h2 id="daily-usage-title">Actividad diaria</h2>{daily && <p>{dateLabel(daily.from)} – {dateLabel(daily.to)} · America/Guatemala</p>}</div>
          {daily ? <>
            {period && <p className={styles.note}>En este período: {usd(period.costUsd)} USD y {number.format(period.calls)} llamadas registradas.</p>}
            <DailyCostChart daily={daily} />
            <details className={styles.dailyDetails}><summary>Ver detalle diario</summary>
              <p className={styles.note}>Entrada, salida y caché se expresan en tokens. Los créditos externos corresponden a las búsquedas registradas.</p>
              <div className={styles.tableWrap} role="region" aria-label="Consumo diario, tabla desplazable" tabIndex={0}>
                <table><caption>Consumo registrado por día, con corte en Guatemala</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Costo · USD</th><th scope="col">Llamadas</th><th scope="col">Entrada</th><th scope="col">Salida</th><th scope="col">Lectura de caché</th><th scope="col">Escritura de caché</th><th scope="col">Créditos externos</th></tr></thead>
                  <tbody>{daily.items.map((item) => <tr key={item.date}><th scope="row"><time dateTime={item.date}>{item.date}</time></th><td>{usd(item.costUsd)}</td><td>{number.format(item.calls)}</td><td>{number.format(item.inputTokens)}</td><td>{number.format(item.outputTokens)}</td><td>{number.format(item.cacheReadTokens)}</td><td>{number.format(item.cacheWriteTokens)}</td><td>{number.format(item.externalCredits)}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </> : <p className={styles.unavailable}>El historial diario no está disponible. Los acumulados que sí respondió el servidor se muestran arriba.</p>}
        </section>
        <section className={styles.section} aria-labelledby="function-usage-title">
          <div className={styles.sectionHeading}><h2 id="function-usage-title">Acumulado por función</h2><p>Todo el historial, independiente del período del gráfico.</p></div>
          {!data.byFunctionAvailable ? <p className={styles.unavailable}>El desglose por función no está disponible.</p>
            : !data.byFunction.length ? <p className={styles.note}>Todavía no hay llamadas registradas.</p>
              : <ul className={styles.functions}>{data.byFunction.map((item) => <li key={item.functionName}>
                <div className={styles.functionHeading}><h3>{functionNames[item.functionName] ?? item.functionName}</h3><span>{usd(item.costUsd)} USD</span></div>
                <div className={styles.bar} aria-hidden="true"><span style={{ width: `${greatestFunctionCost > 0 ? item.costUsd / greatestFunctionCost * 100 : 0}%` }} /></div>
                <p>{number.format(item.calls)} llamadas registradas · {number.format(item.externalCredits)} créditos externos</p>
              </li>)}</ul>}
        </section>
      </>}
    </div>
  </details>;
}
