"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface SignInButtonProps {
  label?: string;
  /** "ghost" cuando ya hay un botón de login principal en la misma pantalla. */
  variant?: "primary" | "ghost";
}

/**
 * Inicia el login con Google.
 *
 * `redirectTo` se arma con el origen actual del navegador, así que el mismo
 * código funciona en localhost, en las previews de Vercel y en producción sin
 * configuración por entorno. Eso sí: cada uno de esos orígenes debe estar en la
 * lista de Redirect URLs de Supabase, y por eso están registrados con comodín.
 */
export function SignInButton({
  label = "Continuar con Google",
  variant = "primary",
}: SignInButtonProps) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // Si sale bien, el navegador ya se fue a Google y este código no sigue.
    if (error) {
      setPending(false);
    }
  }

  return (
    <Button onClick={signIn} disabled={pending} variant={variant}>
      {pending ? "Abriendo Google…" : label}
    </Button>
  );
}
