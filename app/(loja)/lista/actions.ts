"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type ItemPedido = { id: string; nome: string; preco: number };

/**
 * Sem reserva de estoque, uma peça na lista do cliente pode ser vendida
 * enquanto ela ainda está decidindo — usado tanto pra checar em tempo real
 * na tela "Minha lista" quanto como trava final dentro de fecharListaAction.
 * Só considera `vendido` como indisponível de verdade (item em outra lista
 * pendente é um conflito "soft" que a Bia resolve na conferência do pedido,
 * não bloqueia o cliente aqui).
 */
export async function checkDisponibilidadeAction(ids: string[]) {
  if (ids.length === 0) return [];

  const supabase = createAdminClient();
  const { data: pecas } = await supabase
    .from("pecas")
    .select("id, status")
    .in("id", ids);

  const statusPorId = new Map((pecas ?? []).map((peca) => [peca.id, peca.status]));

  return ids.map((id) => ({
    id,
    disponivel: statusPorId.get(id) !== "vendido",
  }));
}

/**
 * Fecha a lista do cliente: cria o pedido com snapshot dos itens (nome/preço
 * no momento do fechamento, não uma referência viva — se a Bia editar o
 * preço da peça depois, o pedido já fechado não muda) e marca `pedido_id`
 * nas peças, sem alterar `status` — elas continuam `disponivel` pra outros
 * clientes verem; a Bia decide o que fazer se aparecer conflito (ver seção 6
 * da spec: alerta visual na tela de conferência do pedido).
 *
 * Antes de criar o pedido, revalida que nenhum item foi vendido nesse meio-
 * tempo — a checagem em tempo real na tela "Minha lista" cobre o caso comum,
 * mas o tempo entre carregar a tela e clicar em "Fechar lista" ainda dá
 * margem pra uma venda acontecer, então a trava final fica aqui no servidor.
 */
export async function fecharListaAction(itens: ItemPedido[], nomeCliente?: string) {
  if (itens.length === 0) {
    throw new Error("A lista está vazia");
  }

  const supabase = createAdminClient();

  const { data: pecasAtuais } = await supabase
    .from("pecas")
    .select("id, status")
    .in(
      "id",
      itens.map((item) => item.id)
    );

  const vendidas = (pecasAtuais ?? []).filter((peca) => peca.status === "vendido");
  if (vendidas.length > 0) {
    const nomesVendidos = itens
      .filter((item) => vendidas.some((peca) => peca.id === item.id))
      .map((item) => item.nome);
    throw new Error(
      `Estas peças foram vendidas enquanto você decidia: ${nomesVendidos.join(", ")}. Remova-as da lista e tente novamente.`
    );
  }

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
