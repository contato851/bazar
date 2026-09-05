#!/usr/bin/env node

/**
 * Importação em lote das peças do bazar físico (fotos organizadas manualmente
 * em subpastas dentro de ~/Downloads/BAZAR, uma subpasta por peça).
 *
 * Para cada subpasta: cria uma linha em `pecas` (nome = descrição visual
 * levantada na revisão manual, preço = 0, categoria já definida) e sobe as
 * fotos originais para o bucket `pecas-fotos` SEM passar pelo Poof (remoção
 * de fundo) — pedido explícito do usuário pra este lote, que fará o recorte
 * manualmente depois se quiser.
 *
 * Uso:
 *   node scripts/import-bazar-batch.js
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local,
 * e o arquivo de itens gerado na revisão manual (ITEMS_JSON abaixo).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const BAZAR_DIR = "/Users/johnnybotelho/Downloads/BAZAR";
const ITEMS_JSON =
  "/private/tmp/claude-501/-Users-johnnybotelho-Downloads-bia-app/5786da86-ceb1-4fd5-b386-85946cf1b778/scratchpad/bazar_items.json";
const BUCKET = "pecas-fotos";

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

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function ensureBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((bucket) => bucket.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error(`Erro ao criar bucket "${BUCKET}": ${error.message}`);
    }
  }
}

async function uploadFotoSemPoof(supabase, pecaId, pasta, fileName) {
  const filePath = path.join(BAZAR_DIR, pasta, fileName);
  const buffer = fs.readFileSync(filePath);
  const contentType = "image/jpeg";
  const baseName = sanitizeFileName(fileName.replace(/\.[^./\\]+$/, "")) || "foto";
  const storagePath = `${pecaId}/${crypto.randomUUID()}-${baseName}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType });

  if (error) {
    throw new Error(`Erro ao enviar foto "${fileName}" (${pasta}): ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
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

  const items = JSON.parse(fs.readFileSync(ITEMS_JSON, "utf8"));
  console.log(`Carregadas ${items.length} peças de ${ITEMS_JSON}`);

  const { data: categorias, error: catError } = await supabase
    .from("categorias")
    .select("id, nome");
  if (catError) {
    console.error("Erro ao buscar categorias:", catError.message);
    process.exit(1);
  }
  const categoriaIdPorNome = new Map(categorias.map((c) => [c.nome, c.id]));

  await ensureBucket(supabase);

  const falhas = [];
  let ok = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progresso = `[${i + 1}/${items.length}]`;
    const categoriaId = categoriaIdPorNome.get(item.categoria);

    if (!categoriaId) {
      console.error(`${progresso} categoria desconhecida "${item.categoria}" (pasta ${item.pasta}) — pulando`);
      falhas.push({ pasta: item.pasta, motivo: `categoria desconhecida: ${item.categoria}` });
      continue;
    }

    try {
      const { data: peca, error: insertError } = await supabase
        .from("pecas")
        .insert({
          nome: item.descricao,
          descricao: null,
          preco: 0,
          categoria_id: categoriaId,
        })
        .select("id")
        .single();

      if (insertError || !peca) {
        throw new Error(insertError?.message ?? "insert sem retorno de id");
      }

      const urls = [];
      for (const fileName of item.fotos) {
        const url = await uploadFotoSemPoof(supabase, peca.id, item.pasta, fileName);
        urls.push(url);
      }

      const { error: updateError } = await supabase
        .from("pecas")
        .update({ fotos: urls })
        .eq("id", peca.id);

      if (updateError) {
        throw new Error(`fotos enviadas mas update falhou: ${updateError.message}`);
      }

      ok++;
      console.log(`${progresso} OK — ${item.categoria} — "${item.descricao}" (${urls.length} fotos)`);
    } catch (err) {
      console.error(`${progresso} FALHOU (pasta ${item.pasta}):`, err.message);
      falhas.push({ pasta: item.pasta, motivo: err.message });
    }
  }

  console.log("\n=== Resumo ===");
  console.log(`Sucesso: ${ok}/${items.length}`);
  if (falhas.length > 0) {
    console.log(`Falhas: ${falhas.length}`);
    falhas.forEach((f) => console.log(`  - ${f.pasta}: ${f.motivo}`));
  }
}

main().catch((error) => {
  console.error("Erro inesperado:", error);
  process.exit(1);
});
