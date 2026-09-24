import { signOut } from "@/app/actions/auth";
import type { AuthenticatedUser } from "@/lib/auth/dal";

import styles from "./UserBadge.module.css";

interface UserBadgeProps {
  user: AuthenticatedUser;
}

/**
 * Identidad del usuario y salida de sesión.
 *
 * Deliberadamente mínimo para el POC: nombre y un botón. Sin avatar ni menú
 * desplegable, que es trabajo de interfaz que no responde ninguna pregunta del
 * POC.
 *
 * El botón vive dentro de un `<form>` porque cerrar sesión es una Server Action
 * por POST. Así también funciona sin JavaScript.
 */
export function UserBadge({ user }: UserBadgeProps) {
  return (
    <div className={styles.badge}>
      <span className={styles.name}>{user.displayName ?? user.email}</span>
      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
