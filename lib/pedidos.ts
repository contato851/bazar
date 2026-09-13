import { createAdminClient } from "@/lib/supabase/admin";

export type ItemPedido = { id: string; nome: string; preco: number };

export type Pedido = {
  id: string;
  itens: ItemPedido[];
  itens_removidos: ItemPedido[];
  valor_total: number;
  nome_cliente: string | null;
  status: string;
  created_at: string;
};

/**
 * Some do pedido pendente qualquer item cuja peça já foi marcada como
 * vendida (por outro pedido confirmado antes deste, ou manualmente no
 * admin) — sem isso, a Bia podia confirmar uma venda que já não existe mais
 * no estoque. Roda toda vez que a tela do pedido é aberta; o item some da
 * lista e do total sozinho e vai parar em "Itens indisponíveis".
 */
export async function limparItensVendidosDoPedido(pedidoId: string) {
  const supabase = createAdminClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, itens, itens_removidos, valor_total, nome_cliente, status, created_at")
    .eq("id", pedidoId)
    .single();

  if (!pedido || pedido.status !== "pendente") {
    return pedido as Pedido | null;
  }

  const itens = pedido.itens as ItemPedido[];
  const pecaIds = itens.map((item) => item.id);

  const { data: pecasAtuais } = await supabase
    .from("pecas")
    .select("id, status")
    .in("id", pecaIds);

  const statusPorId = new Map((pecasAtuais ?? []).map((peca) => [peca.id, peca.status]));
  const vendidos = itens.filter((item) => statusPorId.get(item.id) === "vendido");

  if (vendidos.length === 0) {
    return pedido as Pedido;
  }

  const restantes = itens.filter((item) => statusPorId.get(item.id) !== "vendido");
  const novoTotal = restantes.reduce((soma, item) => soma + item.preco, 0);
  const removidosAnteriores = (pedido.itens_removidos as ItemPedido[]) ?? [];
  const novosRemovidos = [...removidosAnteriores, ...vendidos];

  const { data: atualizado } = await supabase
    .from("pedidos")
    .update({ itens: restantes, valor_total: novoTotal, itens_removidos: novosRemovidos })
    .eq("id", pedidoId)
    .select("id, itens, itens_removidos, valor_total, nome_cliente, status, created_at")
    .single();

  return (atualizado as Pedido | null) ?? (pedido as Pedido);
}
