#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const BAZAR_DIR = "/Users/johnnybotelho/Downloads/BAZAR";
const BUCKET = "pecas-fotos";
const PECA_ID = "c05d7120-adde-491f-8bb5-c028b01c5bda";
const PASTA = "Nova Pasta Com Itens 87";
const FOTOS = ["IMG_4196.jpg", "IMG_4197.jpg", "IMG_4198.jpg"];

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
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

async function main() {
  const env = loadEnvLocal();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const urls = [];
  for (const fileName of FOTOS) {
    const buffer = fs.readFileSync(path.join(BAZAR_DIR, PASTA, fileName));
    const baseName = sanitizeFileName(fileName.replace(/\.[^./\\]+$/, "")) || "foto";
    const storagePath = `${PECA_ID}/${crypto.randomUUID()}-${baseName}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: "image/jpeg" });
    if (error) throw new Error(`Erro ao enviar "${fileName}": ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    urls.push(data.publicUrl);
    console.log(`Enviada ${fileName}`);
  }

  const { error: updateError } = await supabase
    .from("pecas")
    .update({ fotos: urls })
    .eq("id", PECA_ID);
  if (updateError) throw new Error(updateError.message);

  console.log("Peça 87 corrigida com sucesso:", urls);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
