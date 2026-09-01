import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice, shortOrderCode } from "@/lib/format";

export const dynamic = "force-dynamic";

type ItemPedido = { id: string; nome: string; preco: number };

export default async function PedidoConfirmacaoPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, itens, valor_total")
    .eq("id", params.id)
    .single();

  if (!pedido) notFound();

  const itens = pedido.itens as ItemPedido[];
  const codigo = shortOrderCode(pedido.id);
  const numero = process.env.WHATSAPP_NUMBER;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // O pulo do gato (ver seção 5.8 da spec): o link do pedido vai embutido na
  // própria mensagem, então a Bia clica e cai direto na tela de conferência
  // dela sem precisar digitar nada.
  const linhas = itens.map((item) => `- ${item.nome} — ${formatPrice(item.preco)}`).join("\n");
  const linkPedido = `${siteUrl}/admin/pedido/${pedido.id}`;
  const mensagem = `Oi Bia! Fechei minha lista no bazar 🛍️\n\nPedido ${codigo}\n${linhas}\n\nTotal: ${formatPrice(
    pedido.valor_total
  )}\n\nLink do pedido: ${linkPedido}\n\nVou fazer o pix e te aviso!`;

  const whatsappUrl = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
    : null;

  return (
    <div className="space-y-6 py-6 text-center">
      <div>
        <h2 className="text-xl font-semibold">Pedido enviado!</h2>
        <p className="mt-1 text-sm text-neutral-500">Código: {codigo}</p>
      </div>

      <div className="space-y-1 border border-neutral-200 p-4 text-left text-sm">
        {itens.map((item) => (
          <div key={item.id} className="flex justify-between gap-2">
            <span className="truncate">{item.nome}</span>
            <span className="shrink-0">{formatPrice(item.preco)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-medium">
          <span>Total</span>
          <span>{formatPrice(pedido.valor_total)}</span>
        </div>
      </div>

      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-accent px-4 py-3 text-sm font-medium text-bold-text hover:opacity-90"
        >
          Enviar no WhatsApp
        </a>
      ) : (
        <p className="text-xs text-red-600">
          Número de WhatsApp da Bia não configurado (variável WHATSAPP_NUMBER).
        </p>
      )}
    </div>
  );
}
