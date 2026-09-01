"use client";

import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * Recorta a região indicada (em pixels da imagem original) via canvas e
 * devolve o resultado sempre como File JPEG — a partir daqui o resto do
 * pipeline (compressão, remoção de fundo via Poof, upload) nunca mais vê o
 * arquivo bruto selecionado pelo usuário.
 */
export async function cropImageToFile(
  file: File,
  cropAreaPixels: Area,
  fileName: string
): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(cropAreaPixels.width));
    canvas.height = Math.max(1, Math.round(cropAreaPixels.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context indisponível");

    // Fundo branco antes de desenhar — sem isso, áreas transparentes de PNGs
    // (ex: exportados do Canva) viram PRETO ao converter pra JPEG (canvas
    // parte de pixels (0,0,0,0) e o alfa é descartado na exportação JPEG,
    // sobrando o RGB preto por trás da transparência).
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      cropAreaPixels.x,
      cropAreaPixels.y,
      cropAreaPixels.width,
      cropAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) throw new Error("Falha ao gerar imagem recortada");

    const newName = fileName.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
