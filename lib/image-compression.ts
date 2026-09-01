"use client";

import { convertHeicForCrop } from "@/lib/heic-convert-action";

const MAX_DIMENSION = 1800;
const JPEG_QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * Fotos escolhidas da galeria de um iPhone costumam vir em HEIC/HEIF, formato
 * que nenhum navegador além do Safari consegue decodificar em <img>/canvas —
 * e o `file.type` do input nem sempre vem preenchido como "image/heic" nesse
 * caso, por isso também olhamos a extensão do arquivo.
 */
export function isHeicFile(file: File) {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  return /\.hei[cf]$/i.test(file.name);
}

/**
 * Prepara a foto pra ser mostrada na tela de recorte. Formatos comuns (JPEG,
 * PNG, WebP) já são decodificáveis nativamente pelo navegador e voltam como
 * estão, sem round-trip nenhum. HEIC/HEIF vai pro servidor pra virar JPEG,
 * usando a mesma lógica robusta do salvamento final (heic-convert + sharp) —
 * o navegador nunca precisa decodificar HEIC diretamente, o que elimina os
 * casos em que variantes com imagens auxiliares (mapa de profundidade do
 * modo retrato, por exemplo) quebravam a prévia mesmo em navegadores com
 * algum suporte nativo a HEIC.
 *
 * Se a conversão no servidor falhar, devolve null — quem chamou pula o
 * recorte e segue com o arquivo original (o salvamento final ainda tem sua
 * própria rede de segurança, independente desta, antes do fallback "Sem
 * foto").
 */
export async function decodeForCrop(file: File): Promise<File | null> {
  if (!isHeicFile(file)) return file;

  const formData = new FormData();
  formData.set("file", file);
  const result = await convertHeicForCrop(formData);
  if (!result.ok) return null;

  const blob = await (await fetch(result.dataUrl)).blob();
  const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg", lastModified: file.lastModified });
}

/**
 * Redimensiona (máx. 1800px no lado maior, sem ampliar) e comprime (JPEG 85%)
 * uma imagem no navegador antes do upload, para reduzir o tamanho enviado ao
 * Supabase Storage. A esta altura o arquivo já passou por decodeForCrop (ou
 * nunca precisou, se não era HEIC), então na prática só recebe formatos que
 * o navegador decodifica nativamente. Se mesmo assim algo falhar (ex: um
 * HEIC que decodeForCrop não conseguiu converter e seguiu sem recorte),
 * devolve o arquivo original em vez de bloquear o upload.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && !isHeicFile(file)) return file;

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Fundo branco antes de desenhar — evita preto no lugar de transparência
    // (ex: prints em PNG) já que o resultado é sempre JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImageFile));
}
