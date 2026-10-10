import "server-only";

import { getCatalog } from "@/lib/services/catalogs";
import { createClient } from "@/lib/supabase/server";
import type { EditorialProfile, UpdateProfileInput } from "@/types/profile";

/**
 * Perfil editorial del lector: región simulada (RF-04) y temas elegidos (D-32).
 *
 * Recibe el id del usuario de la sesión, nunca de la petición. RLS además
 * limita cada consulta a las filas de quien llama.
 */

export class ProfileValidationError extends Error {
  constructor(readonly fields: Record<string, string>) {
    super("Revisa los campos marcados.");
    this.name = "ProfileValidationError";
  }
}

/** La base no respondió. La ruta lo traduce a 503 sin mostrar el detalle. */
export class ProfileStoreError extends Error {
  constructor(cause: unknown) {
    super("No se pudo leer o guardar el perfil.", { cause });
    this.name = "ProfileStoreError";
  }
}

export async function getProfile(userId: string): Promise<EditorialProfile> {
  const supabase = await createClient();

  const [profile, topics] = await Promise.all([
    supabase.from("profiles").select("region_id").eq("user_id", userId).maybeSingle(),
    supabase.from("reader_topics").select("topic_id").eq("user_id", userId),
  ]);

  if (profile.error || topics.error) {
    throw new ProfileStoreError(profile.error ?? topics.error);
  }

  return {
    regionId: profile.data?.region_id ?? null,
    topicIds: topics.data.map((row) => row.topic_id as string),
  };
}

/** Revisa la forma del cuerpo sin consultar la base. */
export function validateProfileInput(raw: unknown): UpdateProfileInput {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ProfileValidationError({ body: "El cuerpo de la petición no es válido." });
  }

  const { regionId, topicIds } = raw as Record<string, unknown>;
  const fields: Record<string, string> = {};

  if (regionId === undefined && topicIds === undefined) {
    fields.body = "Envía la región, los temas o ambos.";
  }
  if (regionId !== undefined && (typeof regionId !== "string" || !regionId)) {
    fields.regionId = "Selecciona una región disponible.";
  }
  if (topicIds !== undefined && (!Array.isArray(topicIds) || !topicIds.every((id) => typeof id === "string"))) {
    fields.topicIds = "Selecciona temas disponibles.";
  }

  if (Object.keys(fields).length > 0) {
    throw new ProfileValidationError(fields);
  }

  return {
    ...(regionId !== undefined && { regionId: regionId as string }),
    ...(topicIds !== undefined && { topicIds: [...new Set(topicIds as string[])] }),
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<EditorialProfile> {
  const catalog = await getCatalog();
  const fields: Record<string, string> = {};

  if (input.regionId !== undefined && !catalog.regions.some((region) => region.id === input.regionId)) {
    fields.regionId = "La región no está disponible.";
  }
  const validTopics = new Set(catalog.topics.map((topic) => topic.id));
  if (input.topicIds && !input.topicIds.every((id) => validTopics.has(id))) {
    fields.topicIds = "Un tema seleccionado no está disponible.";
  }
  if (Object.keys(fields).length > 0) {
    throw new ProfileValidationError(fields);
  }

  const supabase = await createClient();

  if (input.regionId !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, region_id: input.regionId, updated_at: new Date().toISOString() });
    if (error) throw new ProfileStoreError(error);
  }

  if (input.topicIds !== undefined) {
    // Primero agrega y después quita: si falla a la mitad, el lector conserva sus temas anteriores.
    if (input.topicIds.length > 0) {
      const { error } = await supabase
        .from("reader_topics")
        .upsert(
          input.topicIds.map((topic_id) => ({ user_id: userId, topic_id })),
          { onConflict: "user_id,topic_id", ignoreDuplicates: true },
        );
      if (error) throw new ProfileStoreError(error);
    }

    let removal = supabase.from("reader_topics").delete().eq("user_id", userId);
    if (input.topicIds.length > 0) {
      // Los IDs ya se validaron contra el catálogo: son UUID.
      removal = removal.not("topic_id", "in", `(${input.topicIds.join(",")})`);
    }
    const { error } = await removal;
    if (error) throw new ProfileStoreError(error);
  }

  return getProfile(userId);
}
