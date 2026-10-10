/**
 * Perfil editorial del lector (RF-04, D-32).
 *
 * Sigue la ficha 2 y 3 de notion-frontend.md, más los temas elegidos de D-32.
 * No incluye nombre, correo ni foto: la identidad de Google no se edita aquí.
 */

export interface EditorialProfile {
  /** null mientras el lector no elige región. */
  regionId: string | null;
  /** Temas que eligió el lector. El recomendador les da peso 0.5 al inicio. */
  topicIds: string[];
}

/** Cuerpo de PATCH /api/profile. Al menos uno de los dos campos. */
export interface UpdateProfileInput {
  regionId?: string;
  /** Reemplaza la lista completa. Una lista vacía quita todos los temas. */
  topicIds?: string[];
}

export interface ProfileResponse {
  data: EditorialProfile;
  meta: Record<string, never>;
}
