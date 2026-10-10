"use client";

import Link from "next/link";
import { StateNotice } from "@/components/news/StateNotice";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StateNotice state="error" headingLevel={1} title="Esta página no pudo abrirse" description="Vuelve a intentarlo o regresa al inicio." action={{ label: "Volver a intentar", onClick: reset }}>
    <Link href="/">Volver al inicio</Link>
  </StateNotice>;
}
