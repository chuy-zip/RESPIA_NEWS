import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { EditorialDesk } from "@/components/admin/EditorialDesk";
import { getCurrentUser, isAdmin } from "@/lib/auth/dal";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Administración",
  // Que ningún buscador la indexe, por si algún día se filtra el enlace.
  robots: { index: false, follow: false },
};

/**
 * El portal conserva la autorización en servidor incluso durante la demo.
 *
 * El control está aquí, en el servidor, y no en el icono de la barra superior:
 *
 * - Sin sesión: se pide iniciar sesión (igual que /contenido).
 * - Con sesión pero sin rol: `notFound()`. Se responde 404 y no 403 a propósito,
 *   para no confirmar a un usuario común que esta ruta existe.
 * - Administrador: se renderiza.
 *
 * Cada página y cada ruta de API administrativa que se agregue debe repetir esta
 * comprobación (`isAdmin()` en páginas, `requireAdmin()` en rutas y acciones). La
 * seguridad de fondo la dan además las políticas RLS con `private.is_admin()`:
 * ver docs/INFRA_HANDOFF.md.
 */
export default async function AdminPage() {
  const user = await getCurrentUser();

  if (user && !(await isAdmin())) {
    notFound();
  }

  return (
    <>
      {user ? (
        <EditorialDesk />
      ) : (
        <AccessPrompt title="La mesa de edición." description="Inicia sesión con una cuenta administradora para preparar y revisar noticias." />
      )}

      <Link href="/edicion" className={styles.back}>
        Volver a la edición
      </Link>
    </>
  );
}
