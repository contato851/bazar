import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeBackgroundOnWhite } from "@/lib/poof";
import { convertHeicBufferToJpeg, isHeicFile } from "@/lib/heic-server";

export const PECAS_BUCKET = "pecas-fotos";

async function ensureBucket(bucketName: string) {
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((bucket) => bucket.name === bucketName);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
    });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error(`Erro ao criar bucket "${bucketName}": ${error.message}`);
    }
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Lê o arquivo enviado e, se ainda estiver em HEIC/HEIF (a conversão no
 * navegador não rodou ou falhou), converte pra JPEG via heic-convert/sharp —
 * rede de segurança final antes de qualquer upload de foto, pra nenhum HEIC
 * não exibível chegar ao Storage.
 *
 * Devolve null se o arquivo continuar em HEIC mesmo depois dessa tentativa —
 * quem chamou decide o que fazer (nunca deve salvar esses bytes como estão,
 * já que nenhum navegador fora o Safari consegue exibir).
 */
async function resolveUploadableBuffer(
  file: File
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/jpeg";

  if (!isHeicFile(file)) {
    return { buffer, contentType };
  }

  const converted = await convertHeicBufferToJpeg(buffer);
  if (converted) {
    return { buffer: converted, contentType: "image/jpeg" };
  }

  // eslint-disable-next-line no-console
  console.error(
    `Não foi possível converter a foto HEIC "${file.name}" em nenhuma camada (navegador nem servidor) — ignorada.`
  );
  return null;
}

/**
 * Upload das fotos de uma peça — mesmo pipeline do bia-app pras fotos de
 * peça do guarda-roupa: converte HEIC se precisar e padroniza o fundo em
 * branco via Poof (opcional, se POOF_API_KEY estiver configurada; se a
 * chamada falhar por qualquer motivo, segue com a foto original).
 */
export async function uploadPecaFotos(pecaId: string, files: File[]) {
  if (files.length === 0) return [];

  await ensureBucket(PECAS_BUCKET);
  const supabase = createAdminClient();
  const urls: string[] = [];

  for (const file of files) {
    const resolved = await resolveUploadableBuffer(file);
    // HEIC que não converteu em nenhuma camada — pula essa foto em vez de
    // travar o cadastro ou salvar um arquivo que ninguém consegue ver.
    if (!resolved) continue;

    const { buffer, contentType } = await removeBackgroundOnWhite(
      resolved.buffer,
      resolved.contentType
    );

    const baseName = sanitizeFileName(file.name.replace(/\.[^./\\]+$/, "")) || "foto";
    const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1] || "jpg";
    const path = `${pecaId}/${randomUUID()}-${baseName}.${extension}`;

    const { error } = await supabase.storage
      .from(PECAS_BUCKET)
      .upload(path, buffer, { contentType });

    if (error) {
      throw new Error(`Erro ao enviar foto "${file.name}": ${error.message}`);
    }

    const { data } = supabase.storage.from(PECAS_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

export async function deletePecaFotosFolder(pecaId: string) {
  const supabase = createAdminClient();
  const { data: files } = await supabase.storage.from(PECAS_BUCKET).list(pecaId);

  if (!files || files.length === 0) return;

  const paths = files.map((file) => `${pecaId}/${file.name}`);
  await supabase.storage.from(PECAS_BUCKET).remove(paths);
}

export async function deletePecaFotosByUrl(urls: string[]) {
  if (urls.length === 0) return;

  const marker = `/object/public/${PECAS_BUCKET}/`;
  const paths = urls
    .map((url) => {
      const index = url.indexOf(marker);
      return index === -1 ? null : url.slice(index + marker.length);
    })
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) return;

  const supabase = createAdminClient();
  await supabase.storage.from(PECAS_BUCKET).remove(paths);
}
