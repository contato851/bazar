import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service_role key — ignora RLS.
 * Uso exclusivo em Server Components / Server Actions da área (admin).
 * Nunca importar este módulo em componentes client ("use client").
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Variáveis de ambiente do Supabase ausentes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      // Next.js patches the global fetch and caches responses by default;
      // admin queries must always hit Supabase fresh, never a stale cache.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
