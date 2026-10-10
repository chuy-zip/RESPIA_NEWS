import Link from "next/link";
import { StateNotice } from "@/components/news/StateNotice";

export default function NotFound() {
  return <StateNotice state="empty" headingLevel={1} title="Esta página no está disponible" description="La dirección puede haber cambiado. Vuelve al inicio para seguir explorando.">
    <Link href="/">Volver al inicio</Link>
  </StateNotice>;
}
