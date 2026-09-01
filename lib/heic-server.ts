import sharp from "sharp";
import heicConvert from "heic-convert";

/**
 * Mesma detecção de HEIC/HEIF do lado do servidor — o `file.type` do upload
 * nem sempre vem preenchido corretamente, por isso também olha a extensão.
 */
export function isHeicFile(file: { type: string; name: string }) {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  return /\.hei[cf]$/i.test(file.name);
}

/**
 * Converte HEIC/HEIF pra JPEG no servidor — rede de segurança final que roda
 * sempre que o arquivo que chegou ainda está em HEIC (a conversão no
 * navegador não aconteceu ou falhou).
 *
 * Tenta primeiro heic-convert (libheif-js, um build WASM independente do
 * sharp): fotos reais de iPhone recentes costumam empacotar imagens
 * auxiliares no contêiner HEIC (mapa de profundidade do modo retrato, por
 * exemplo), e o libheif nativo embutido no sharp falha ao decodificar essas
 * fotos ("Decoder plugin generated an error") mesmo com os limites de
 * segurança relaxados — heic-convert lida bem com esse caso. Se heic-convert
 * falhar por outro motivo, cai pro sharp com `unlimited: true` como segunda
 * tentativa (builds de libheif diferentes, falhas independentes).
 *
 * Se as duas falharem, devolve null — quem chamou decide o que fazer (o
 * padrão do resto do pipeline é seguir sem essa foto em vez de travar o
 * cadastro).
 */
export async function convertHeicBufferToJpeg(buffer: Buffer): Promise<Buffer | null> {
  try {
    const converted = await heicConvert({ buffer, format: "JPEG", quality: 0.9 });
    return Buffer.from(converted);
  } catch {
    try {
      return await sharp(buffer, { unlimited: true })
        .rotate()
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch {
      return null;
    }
  }
}
