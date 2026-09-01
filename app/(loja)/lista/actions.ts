"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type ItemPedido = { id: string; nome: string; preco: number };

/**
 * Fecha a lista do cliente: cria o pedido com snapshot dos itens (nome/preço
 * no momento do fechamento, não uma referência viva — se a Bia editar o
 * preço da peça depois, o pedido já fechado não muda) e marca `pedido_id`
 * nas peças, sem alterar `status` — elas continuam `disponivel` pra outros
 * clientes verem; a Bia decide o que fazer se aparecer conflito (ver seção 6
 * da spec: alerta visual na tela de conferência do pedido).
 */
export async function fecharListaAction(itens: ItemPedido[], nomeCliente?: string) {
  if (itens.length === 0) {
    throw new Error("A lista está vazia");
  }

  const supabase = createAdminClient();
  const valorTotal = itens.reduce((sum, item) => sum + item.preco, 0);

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .insert({
      itens,
      valor_total: valorTotal,
      nome_cliente: nomeCliente?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !pedido) {
    throw new Error(error?.message ?? "Erro ao fechar a lista");
  }

  await supabase
    .from("pecas")
    .update({ pedido_id: pedido.id })
    .in(
      "id",
      itens.map((item) => item.id)
    );

  return { pedidoId: pedido.id as string };
}
