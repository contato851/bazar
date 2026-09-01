import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Sessão de quem está logado na área admin: usuário autenticado (Supabase
 * Auth) e se ele está registrado em `admin_users` — só essa conta (a da Bia)
 * tem `isAdmin: true`, não qualquer usuário logado (ex: um cliente do portal).
 */
export async function getAdminSession() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { supabase, user, isAdmin: Boolean(adminRow) };
}
