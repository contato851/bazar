import sharp from "sharp";

const POOF_API_URL = "https://api.poof.bg/v1/remove";
const POOF_TIMEOUT_MS = 15000;

type ProcessedImage = { buffer: Buffer; contentType: string };

/**
 * Remove o fundo de uma foto de peça via API da Poof e compõe o resultado
 * sobre um fundo branco sólido, para manter consistência visual com o resto
 * do app. Se a chave não estiver configurada, a chamada falhar, expirar ou o
 * resultado não puder ser processado, devolve a imagem original sem
 * alteração — isso é um enriquecimento visual, nunca pode travar o cadastro.
 */
export async function removeBackgroundOnWhite(
  originalBuffer: Buffer,
  originalContentType: string
): Promise<ProcessedImage> {
  const original = { buffer: originalBuffer, contentType: originalContentType };

  const apiKey = process.env.POOF_API_KEY;
  if (!apiKey) return original;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POOF_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append(
      "image_file",
      new Blob([Uint8Array.from(originalBuffer)], {
        type: originalContentType || "image/jpeg",
      }),
      "photo"
    );

    const response = await fetch(POOF_API_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) return original;

    const transparentBuffer = Buffer.from(await response.arrayBuffer());

    const whiteBuffer = await sharp(transparentBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90 })
      .toBuffer();

    return { buffer: whiteBuffer, contentType: "image/jpeg" };
  } catch {
    return original;
  } finally {
    clearTimeout(timeout);
  }
}
