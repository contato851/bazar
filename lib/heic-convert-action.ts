"use server";

import { convertHeicBufferToJpeg } from "@/lib/heic-server";

export type ConvertHeicForCropResult = { ok: true; dataUrl: string } | { ok: false };

/**
 * Chamada programaticamente (não vinculada a um <form>) assim que o usuário
 * seleciona uma foto HEIC/HEIF, ANTES da tela de recorte — converte pra JPEG
 * no servidor usando a mesma lógica robusta do salvamento final (heic-convert
 * primeiro, sharp com `unlimited: true` como segunda tentativa), pra nunca
 * depender do navegador conseguir decodificar HEIC sozinho. Variantes de
 * HEIC com imagens auxiliares (mapa de profundidade do modo retrato, por
 * exemplo) quebram os decodificadores client-side mesmo em navegadores com
 * algum suporte nativo a HEIC — rodar a conversão aqui elimina esse
 * problema pela raiz.
 *
 * Se as duas tentativas falharem, devolve `{ ok: false }` — quem chamou pula
 * a tela de recorte e segue com o arquivo original (o salvamento final ainda
 * tem sua própria rede de segurança, independente desta).
 *
 * Recebe um FormData (campo "file") em vez do File direto — Server Actions
 * não aceitam instâncias de classe como argumento solto, só tipos simples
 * (objetos planos, primitivos) e alguns built-ins como FormData.
 */
export async function convertHeicForCrop(formData: FormData): Promise<ConvertHeicForCropResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false };

  const buffer = Buffer.from(await file.arrayBuffer());
  const converted = await convertHeicBufferToJpeg(buffer);

  if (!converted) return { ok: false };

  return { ok: true, dataUrl: `data:image/jpeg;base64,${converted.toString("base64")}` };
}
