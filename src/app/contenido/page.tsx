import { redirect } from "next/navigation";

import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { getCurrentUser } from "@/lib/auth/dal";

// Conserva el acceso de enlaces anteriores sin entregar contenido antes de verificar la sesión.
export default async function ContenidoPage() {
  const user = await getCurrentUser();
  if (user) redirect("/chat");

  return (
    <AccessPrompt />
  );
}
