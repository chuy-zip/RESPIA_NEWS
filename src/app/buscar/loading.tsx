import { StateNotice } from "@/components/news/StateNotice";

export default function Loading() {
  return <StateNotice state="loading" headingLevel={1} title="Preparando el archivo" description="Estamos abriendo la búsqueda de noticias." />;
}
