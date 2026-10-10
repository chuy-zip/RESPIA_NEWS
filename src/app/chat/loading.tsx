import { StateNotice } from "@/components/news/StateNotice";

export default function Loading() {
  return <StateNotice state="loading" headingLevel={1} title="Abriendo la conversación" description="Estamos preparando tu espacio para preguntar." />;
}
