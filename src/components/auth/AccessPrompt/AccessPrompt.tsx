import Link from "next/link";
import { SignInButton } from "@/components/auth/SignInButton";
import styles from "./AccessPrompt.module.css";

interface AccessPromptProps {
  title?: string;
  description?: string;
}

export function AccessPrompt({ title = "Tu próxima perspectiva empieza aquí.", description = "Entra con Google para preguntar, explorar tu edición y leer las noticias completas." }: AccessPromptProps) {
  return <section className={styles.prompt} aria-labelledby="access-title">
    <p className={styles.kicker}>The Meridian Times</p>
    <h1 id="access-title">{title}</h1>
    <p className={styles.description}>{description}</p>
    <SignInButton label="Continuar con Google" />
    <p className={styles.note}>Tu acceso es con Google. La edición utiliza noticias ficticias para probar la experiencia.</p>
    <div className={styles.links}><Link href="/">Volver a la portada</Link><Link href="/privacidad">Cómo tratamos tus datos</Link></div>
  </section>;
}
