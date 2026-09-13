import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice, shortOrderCode } from "@/lib/format";

export const dynamic = "force-dynamic";

type ItemPedido = { id: string; nome: string; preco: number };

export default async function RelatoriosPage() {
  const supabase = createAdminClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, itens, valor_total, nome_cliente, confirmado_em")
    .eq("status", "confirmado")
    .order("confirmado_em", { ascending: false });

  const totalVendido = (pedidos ?? []).reduce((soma, pedido) => soma + pedido.valor_total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="mt-1 text-sm text-neutral-500">Todas as vendas confirmadas.</p>
      </div>

      {!pedidos || pedidos.length === 0 ? (
        <p className="border border-dashed p-8 text-center text-sm text-neutral-500">
          Nenhuma venda confirmada ainda.
        </p>
      ) : (
        <div className="divide-y border border-neutral-200 bg-white">
          {pedidos.map((pedido) => {
            const itens = pedido.itens as ItemPedido[];
            return (
              <Link
                key={pedido.id}
                href={`/admin/pedido/${pedido.id}`}
                className="block p-4 hover:bg-neutral-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{pedido.nome_cliente || "Cliente não identificado"}</p>
                    <p className="text-xs text-neutral-500">
                      Pedido {shortOrderCode(pedido.id)}
                      {pedido.confirmado_em &&
                        ` · ${new Date(pedido.confirmado_em).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(pedido.valor_total)}</p>
                </div>
                <ul className="mt-2 space-y-0.5 text-sm text-neutral-600">
                  {itens.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span>{item.nome}</span>
                      <span>{formatPrice(item.preco)}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      )}

      {pedidos && pedidos.length > 0 && (
        <div className="flex justify-between border border-neutral-200 bg-white p-4 text-base font-semibold">
          <span>Total vendido</span>
          <span>{formatPrice(totalVendido)}</span>
        </div>
      )}
    </div>
  );
}
