import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice, shortOrderCode } from "@/lib/format";
import { limparItensVendidosDoPedido, type ItemPedido } from "@/lib/pedidos";
import { cancelarPedidoAction, confirmarPedidoAction, removerItemPedidoAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-green-100 text-green-700",
  cancelado: "bg-neutral-200 text-neutral-600",
};

export default async function AdminPedidoPage({ params }: { params: { id: string } }) {
  // Antes de mostrar qualquer coisa, tira do pedido os itens cuja peça já
  // foi vendida em outro lugar enquanto este pedido esperava confirmação.
  const pedido = await limparItensVendidosDoPedido(params.id);
  if (!pedido) notFound();

  const supabase = createAdminClient();
  const itens = pedido.itens as ItemPedido[];
  const itensRemovidos = (pedido.itens_removidos as ItemPedido[]) ?? [];
  const pecaIds = itens.map((item) => item.id);

  const { data: pecasAtuais } = await supabase
    .from("pecas")
    .select("id, status, pedido_id")
    .in("id", pecaIds);

  const pecasPorId = new Map((pecasAtuais ?? []).map((peca) => [peca.id, peca]));

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pedido {shortOrderCode(pedido.id)}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {pedido.nome_cliente ? `${pedido.nome_cliente} · ` : ""}
          {new Date(pedido.created_at).toLocaleString("pt-BR")}
        </p>
        <span
          className={`mt-2 inline-block px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[pedido.status]}`}
        >
          {STATUS_LABELS[pedido.status]}
        </span>
      </div>

      <div className="divide-y border border-neutral-200">
        {itens.length === 0 && (
          <p className="p-3 text-sm text-neutral-500">Nenhum item disponível neste pedido.</p>
        )}
        {itens.map((item) => {
          const pecaAtual = pecasPorId.get(item.id);
          // Peça já vendida some sozinha antes de chegar aqui (ver
          // limparItensVendidosDoPedido) — o único conflito que ainda
          // aparece pra decisão da Bia é a peça estar numa lista pendente
          // mais recente de outro cliente.
          const emOutroPedido =
            pedido.status === "pendente" &&
            Boolean(pecaAtual?.pedido_id) &&
            pecaAtual?.pedido_id !== pedido.id;

          return (
            <div key={item.id} className="p-3">
              <div className="flex justify-between gap-2 text-sm">
                <span>{item.nome}</span>
                <span>{formatPrice(item.preco)}</span>
              </div>
              {emOutroPedido && (
                <div className="mt-1 flex items-center justify-between gap-2 bg-yellow-50 px-2 py-1 text-xs text-yellow-800">
                  <span>⚠ Essa peça também está numa lista pendente de outro cliente.</span>
                  <form action={removerItemPedidoAction}>
                    <input type="hidden" name="pedidoId" value={pedido.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="shrink-0 whitespace-nowrap underline hover:no-underline">
                      Excluir da lista
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        <div className="flex justify-between p-3 text-sm font-medium">
          <span>Total</span>
          <span>{formatPrice(pedido.valor_total)}</span>
        </div>
      </div>

      {pedido.status === "pendente" && (
        <div className="flex gap-3">
          <form action={confirmarPedidoAction} className="flex-1">
            <input type="hidden" name="id" value={pedido.id} />
            <button
              type="submit"
              className="w-full bg-accent px-4 py-3 text-sm font-medium text-bold-text hover:opacity-90"
            >
              Confirmar venda
            </button>
          </form>
          <form action={cancelarPedidoAction}>
            <input type="hidden" name="id" value={pedido.id} />
            <button
              type="submit"
              className="border border-neutral-300 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
            >
              Cancelar pedido
            </button>
          </form>
        </div>
      )}

      {itensRemovidos.length > 0 && (
        <div className="space-y-1 pt-2 text-xs text-neutral-400">
          <p>Itens indisponíveis:</p>
          {itensRemovidos.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex justify-between gap-2">
              <span>{item.nome}</span>
              <span>{formatPrice(item.preco)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
