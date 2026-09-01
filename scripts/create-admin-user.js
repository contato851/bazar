#!/usr/bin/env node

/**
 * Cria um usuário no Supabase Auth (auto-confirmado, sem e-mail de
 * verificação) e o registra em `admin_users`, dando acesso ao painel
 * administrativo (app/(admin)).
 *
 * Uso:
 *   node scripts/create-admin-user.js "email@dominio.com" "senha123"
 *   npm run create-admin-user -- "email@dominio.com" "senha123"
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(`Arquivo .env.local não encontrado em ${envPath}`);
    process.exit(1);
  }

  const vars = {};
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) vars[match[1]] = match[2];
    });
  return vars;
}

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error('Uso: node scripts/create-admin-user.js "email@dominio.com" "senha123"');
    process.exit(1);
  }

  const env = loadEnvLocal();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Criando usuário de autenticação "${email}"...`);
  const { data: userRes, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    console.error("Erro ao criar usuário:", userError.message);
    process.exit(1);
  }

  const authUserId = userRes.user.id;

  console.log(`Registrando "${email}" em admin_users...`);
  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ auth_user_id: authUserId });

  if (insertError) {
    console.error("Erro ao registrar admin:", insertError.message);
    process.exit(1);
  }

  console.log("\n✅ Usuário admin criado com sucesso!\n");
  console.log(`  E-mail:       ${email}`);
  console.log(`  Senha:        ${password}`);
  console.log(`  auth_user_id: ${authUserId}`);
  console.log("\nFaça login em /admin/login com essas credenciais.\n");
}

main().catch((error) => {
  console.error("Erro inesperado:", error);
  process.exit(1);
});
