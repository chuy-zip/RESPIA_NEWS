import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SignInButton } from "@/components/auth/SignInButton";
import { EditorialShell } from "@/components/layout/EditorialShell";
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
    <EditorialShell demo={!!user}>
      {user ? (
        <EditorialDesk />
      ) : (
        <section className={styles.locked}>
          <p className={styles.eyebrow}>Acceso restringido</p>
          <h1 className={styles.headline}>Necesitas iniciar sesión.</h1>
          <p className={styles.lead}>
            Esta sección es solo para administradores.
          </p>
          <SignInButton />
        </section>
      )}

      <Link href="/" className={styles.back}>
        ← Volver al inicio
      </Link>
    </EditorialShell>
  );
}
