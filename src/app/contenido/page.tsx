import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInButton } from "@/components/auth/SignInButton";
import { EditorialShell } from "@/components/layout/EditorialShell";
import { getCurrentUser } from "@/lib/auth/dal";

import styles from "./page.module.css";

// Conserva el acceso de enlaces anteriores sin entregar contenido antes de verificar la sesión.
export default async function ContenidoPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <EditorialShell>
      <section className={styles.locked}>
        <p className={styles.eyebrow}>Acceso restringido</p>
        <h1 className={styles.headline}>Necesitas iniciar sesión.</h1>
        <p className={styles.lead}>
          Entra con Google para explorar tu edición de noticias.
        </p>
        <SignInButton />
      </section>

      <Link href="/" className={styles.back}>
        ← Volver al inicio
      </Link>
    </EditorialShell>
  );
}
