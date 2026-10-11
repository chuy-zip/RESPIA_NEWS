"use client";

import { StateNotice } from "@/components/news/StateNotice";
import type { ApiError } from "@/components/news/ReaderSession/api";

export function ApiErrorNotice({ error, retry }: { error: ApiError; retry?: () => void }) {
  const canRetry = error.status === 0 || error.status === 401 || error.status >= 500;
  return <StateNotice state={error.status === 0 ? "offline" : "error"}
    title={error.status === 401 ? "Vuelve a iniciar sesión" : error.status === 403 ? "Esta cuenta no tiene permiso" : error.status === 429 ? "Consultas pausadas" : "No se pudo completar la operación"}
    description={error.status === 429 ? "El servicio limitó las consultas. Espera antes de volver a enviar. Puedes seguir leyendo la edición." : error.message} action={canRetry && retry ? { label: error.status === 401 ? "Volver a consultar" : "Reintentar", onClick: retry } : undefined}>
    {error.status === 401 && <p><a href="/#acceso" target="_blank" rel="noopener noreferrer">Iniciar sesión en otra pestaña</a>. Vuelve aquí después de entrar. Conservamos lo escrito mientras esta pantalla siga abierta.</p>}
  </StateNotice>;
}
