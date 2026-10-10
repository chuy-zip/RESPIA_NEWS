"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./SiteHeader.module.css";

interface SiteHeaderProps {
  signedIn: boolean;
  admin: boolean;
}

// El layout obtiene estos permisos en servidor. Cada página vuelve a autorizar el acceso.
export function SiteHeader({ signedIn, admin }: SiteHeaderProps) {
  const pathname = usePathname();
  const compact = pathname !== "/" && pathname !== "/edicion" && !pathname.startsWith("/temas/");
  const links = signedIn
    ? [{ href: "/chat", label: "Preguntar" }, { href: "/edicion", label: "Edición" }, { href: "/buscar", label: "Buscar" }, { href: "/perfil", label: "Perfil" }]
    : [{ href: "/", label: "Inicio" }, { href: "/#acceso", label: "Iniciar sesión" }, { href: "/#instalar", label: "Instalar" }];
  function isActive(href: string) {
    if (href === "/edicion") return pathname === href || pathname.startsWith("/temas/") || pathname.startsWith("/noticias/");
    if (href === "/perfil") return pathname === href || pathname === "/guardados";
    return pathname === href;
  }

  return (
    <header className={styles.header} data-compact={compact}>
      <div className={styles.utility}>
        <span>Tecnología · Economía · Finanzas</span>
        <span>Una perspectiva más amplia</span>
      </div>
      <Link href="/" className={styles.brand} aria-label="The Meridian Times, inicio">
        <svg
          className={styles.mark}
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" />
          <path d="M8 17V7l4 6 4-6v10M17 1 7 23" fill="none" stroke="currentColor" />
        </svg>
        <span className={styles.wordmark}>
          The Meridian Times
          <span className={styles.tagline}>El mundo cambia. Entiende lo que significa para ti.</span>
        </span>
      </Link>

      <nav className={styles.actions} aria-label="Navegación principal">
        {links.map(({ href, label }) => <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>{label}</Link>)}

        {admin ? (
          <Link
            href="/admin"
            className={styles.adminLink}
            aria-current={pathname === "/admin" ? "page" : undefined}
            aria-label="Panel de administración"
            title="Panel de administración"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6L12 3Z" />
              <path d="m9 12 2.2 2.2L15.2 10" />
            </svg>
            Redacción
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
