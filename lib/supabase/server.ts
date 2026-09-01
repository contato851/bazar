import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente Supabase autenticado via cookies de sessão (anon key) — sujeito à RLS.
 * Uso em Server Components / Server Actions / middleware que dependem da sessão
 * de login (portal do cliente em app/(client), e a verificação de login/logout
 * do admin em app/(admin)). Para acessar DADOS na área admin, sempre use
 * lib/supabase/admin.ts (service role, bypassa RLS) — nunca este client.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — o refresh de sessão
            // é feito pelo middleware.
          }
        },
      },
    }
  );
}
