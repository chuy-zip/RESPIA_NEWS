"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión.
 *
 * Es una Server Action, así que solo se puede invocar por POST desde un
 * formulario. Cerrar sesión con un GET sería un error: cualquier imagen o
 * enlace en una página ajena podría desloguear al usuario sin que lo pida.
 *
 * `revalidatePath` es necesario para que las páginas ya renderizadas no sigan
 * mostrando al usuario como si tuviera sesión.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}
