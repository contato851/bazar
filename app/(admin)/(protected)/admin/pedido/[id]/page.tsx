import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice, shortOrderCode } from "@/lib/format";
import { cancelarPedidoAction, confirmarPedidoAction } from "../actions";

export const dynamic = "force-dynamic";

type ItemPedido = { id: string; nome: string; preco: number };

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
  const supabase = createAdminClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, itens, valor_total, nome_cliente, status, created_at")
    .eq("id", params.id)
    .single();

  if (!pedido) notFound();

  const itens = pedido.itens as ItemPedido[];
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
        {itens.map((item) => {
          const pecaAtual = pecasPorId.get(item.id);
          // Os alertas de conflito só fazem sentido enquanto o pedido ainda
          // está pendente — servem pra Bia decidir antes de confirmar. Depois
          // de confirmado, a própria peça está "vendida" por causa DESTE
          // pedido, então reexibir o aviso ficaria descrevendo a ação que
          // acabou de acontecer como se fosse um problema.
          const jaVendida = pedido.status === "pendente" && pecaAtual?.status === "vendido";
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
              {jaVendida && (
                <p className="mt-1 bg-yellow-50 px-2 py-1 text-xs text-yellow-800">
                  ⚠ Essa peça já foi vendida em outro pedido confirmado.
                </p>
              )}
              {!jaVendida && emOutroPedido && (
                <p className="mt-1 bg-yellow-50 px-2 py-1 text-xs text-yellow-800">
                  ⚠ Essa peça também está numa lista pendente de outro cliente.
                </p>
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
    </div>
  );
}
