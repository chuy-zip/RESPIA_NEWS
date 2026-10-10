import { StateNotice } from "@/components/news/StateNotice";

export default function Loading() {
  return <StateNotice state="loading" headingLevel={1} title="Preparando tu edición" description="Estamos abriendo la portada de noticias." />;
}
