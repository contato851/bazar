"use client";

import { useState } from "react";

type Item = { id: string; nome: string; preco: number };

type Props = {
  codigo: string;
  nomeCliente: string | null;
  itens: Item[];
  itensRemovidos: Item[];
  valorTotal: number;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const LARGURA = 720;
const PADDING_X = 40;
const ALTURA_LINHA_ITEM = 30;
const ESCALA = 2;
const LOGO_SRC = "/logo/bazar-fashionista.png";
const LOGO_LARGURA = 160;
const LOGO_ALTURA = LOGO_LARGURA / (1630 / 192);

function carregarLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = LOGO_SRC;
  });
}

/**
 * Desenha o resumo do pedido confirmado num canvas (logo, título, itens
 * confirmados, total e itens indisponíveis — sem o motivo de cada um, só
 * nome e preço) e devolve como PNG. Tudo client-side, sem depender de uma
 * lib de screenshot de DOM nem de uma rota de imagem no servidor.
 */
async function desenharImagemPedido({ codigo, nomeCliente, itens, itensRemovidos, valorTotal }: Props) {
  const logo = await carregarLogo();

  let altura = 60 + LOGO_ALTURA + 30 + 70 + itens.length * ALTURA_LINHA_ITEM + 70;
  if (itensRemovidos.length > 0) {
    altura += 40 + itensRemovidos.length * ALTURA_LINHA_ITEM;
  }

  const canvas = document.createElement("canvas");
  canvas.width = LARGURA * ESCALA;
  canvas.height = altura * ESCALA;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(ESCALA, ESCALA);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LARGURA, altura);

  let y = 40;
  if (logo) {
    ctx.drawImage(logo, PADDING_X, y, LOGO_LARGURA, LOGO_ALTURA);
  }
  y += LOGO_ALTURA + 34;

  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(`Pedido ${codigo}`, PADDING_X, y);

  y += 26;
  ctx.font = "14px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#737373";
  ctx.fillText(nomeCliente ? nomeCliente : "Bazar da Bia", PADDING_X, y);

  y += 26;
  ctx.strokeStyle = "#e5e5e5";
  ctx.beginPath();
  ctx.moveTo(PADDING_X, y);
  ctx.lineTo(LARGURA - PADDING_X, y);
  ctx.stroke();

  y += 32;
  ctx.font = "15px system-ui, -apple-system, sans-serif";
  for (const item of itens) {
    ctx.fillStyle = "#111111";
    ctx.textAlign = "left";
    ctx.fillText(item.nome, PADDING_X, y);
    ctx.textAlign = "right";
    ctx.fillText(formatPrice(item.preco), LARGURA - PADDING_X, y);
    y += ALTURA_LINHA_ITEM;
  }

  y += 4;
  ctx.strokeStyle = "#e5e5e5";
  ctx.beginPath();
  ctx.moveTo(PADDING_X, y);
  ctx.lineTo(LARGURA - PADDING_X, y);
  ctx.stroke();

  y += 32;
  ctx.font = "bold 17px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.fillText("Total", PADDING_X, y);
  ctx.textAlign = "right";
  ctx.fillText(formatPrice(valorTotal), LARGURA - PADDING_X, y);

  if (itensRemovidos.length > 0) {
    y += 40;
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a3a3a3";
    ctx.textAlign = "left";
    ctx.fillText("Itens indisponíveis:", PADDING_X, y);
    y += ALTURA_LINHA_ITEM;
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    for (const item of itensRemovidos) {
      ctx.fillStyle = "#a3a3a3";
      ctx.textAlign = "left";
      ctx.fillText(item.nome, PADDING_X, y);
      ctx.textAlign = "right";
      ctx.fillText(formatPrice(item.preco), LARGURA - PADDING_X, y);
      y += ALTURA_LINHA_ITEM;
    }
  }

  return canvas;
}

export function CompartilharPedidoButton(props: Props) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleClick() {
    setGerando(true);
    setErro(null);
    try {
      const canvas = await desenharImagemPedido(props);
      if (!canvas) throw new Error("Não foi possível gerar a imagem");

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("Não foi possível gerar a imagem");

      const nomeArquivo = `pedido-${props.codigo.replace("#", "")}.png`;
      const file = new File([blob], nomeArquivo, { type: "image/png" });

      const podeCompartilharArquivo =
        typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

      if (podeCompartilharArquivo) {
        await navigator.share({ files: [file], title: `Pedido ${props.codigo}` });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nomeArquivo;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      // AbortError acontece quando a pessoa cancela o menu de compartilhar
      // do próprio celular — não é uma falha real, não precisa de aviso.
      if (error instanceof Error && error.name === "AbortError") return;
      setErro("Não foi possível gerar a imagem. Tenta de novo?");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={gerando}
        className="w-full border border-neutral-300 px-4 py-3 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
      >
        {gerando ? "Gerando imagem..." : "Compartilhar com cliente"}
      </button>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
