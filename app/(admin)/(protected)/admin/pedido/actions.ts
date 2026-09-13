"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type ItemPedido = { id: string };
type ItemPedidoCompleto = { id: string; nome: string; preco: number };

/**
 * Nome do cliente virou obrigatório ao fechar a lista, mas pedidos antigos
 * podem ter ficado sem (ou a Bia quer corrigir um erro de digitação) — esta
 * ação deixa ela editar o nome depois, direto na tela do pedido.
 */
export async function atualizarNomeClienteAction(formData: FormData) {
  const pedidoId = formData.get("pedidoId")?.toString();
  const nomeCliente = formData.get("nomeCliente")?.toString().trim();
  if (!pedidoId || !nomeCliente) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ nome_cliente: nomeCliente })
    .eq("id", pedidoId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/pedido/${pedidoId}`);
  revalidatePath("/admin/relatorios");
}

export async function confirmarPedidoAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;

  const supabase = createAdminClient();
  const { data: pedido } = await supabase.from("pedidos").select("itens").eq("id", id).single();
  if (!pedido) throw new Error("Pedido não encontrado");

  const pecaIds = (pedido.itens as ItemPedido[]).map((item) => item.id);

  const { error: pecasError } = await supabase
    .from("pecas")
    .update({ status: "vendido" })
    .in("id", pecaIds);
  if (pecasError) throw new Error(pecasError.message);

  const { error: pedidoError } = await supabase
    .from("pedidos")
    .update({ status: "confirmado", confirmado_em: new Date().toISOString() })
    .eq("id", id);
  if (pedidoError) throw new Error(pedidoError.message);

  revalidatePath(`/admin/pedido/${id}`);
  revalidatePath("/admin/pecas");
  revalidatePath("/");
}

export async function cancelarPedidoAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;

  const supabase = createAdminClient();
  const { data: pedido } = await supabase.from("pedidos").select("itens").eq("id", id).single();
  if (!pedido) throw new Error("Pedido não encontrado");

  const pecaIds = (pedido.itens as ItemPedido[]).map((item) => item.id);

  // Só desmarca peças que ainda apontam pra ESTE pedido — se nesse meio
  // tempo outra lista fechou por cima da mesma peça (conflito), essa
  // referência mais recente não deve ser apagada por engano.
  await supabase
    .from("pecas")
    .update({ pedido_id: null })
    .eq("pedido_id", id)
    .in("id", pecaIds);

  const { error } = await supabase.from("pedidos").update({ status: "cancelado" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/pedido/${id}`);
  revalidatePath("/admin/pecas");
  revalidatePath("/");
}

/**
 * Tira manualmente um item de um pedido pendente — usado quando a peça está
 * "em outra lista" (pedido_id aponta pra um pedido pendente mais recente) e
 * a Bia decide não disputar por ela. Não mexe em `pecas`: essa peça já não
 * pertence mais a este pedido de verdade (o pedido_id dela já é o do outro),
 * então não há nada aqui pra desfazer do lado da peça.
 */
export async function removerItemPedidoAction(formData: FormData) {
  const pedidoId = formData.get("pedidoId")?.toString();
  const itemId = formData.get("itemId")?.toString();
  if (!pedidoId || !itemId) return;

  const supabase = createAdminClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("itens, itens_removidos")
    .eq("id", pedidoId)
    .single();
  if (!pedido) throw new Error("Pedido não encontrado");

  const itens = pedido.itens as ItemPedidoCompleto[];
  const removido = itens.find((item) => item.id === itemId);
  if (!removido) {
    revalidatePath(`/admin/pedido/${pedidoId}`);
    return;
  }

  const restantes = itens.filter((item) => item.id !== itemId);
  const novoTotal = restantes.reduce((soma, item) => soma + item.preco, 0);
  const removidosAnteriores = (pedido.itens_removidos as ItemPedidoCompleto[]) ?? [];

  const { error } = await supabase
    .from("pedidos")
    .update({
      itens: restantes,
      valor_total: novoTotal,
      itens_removidos: [...removidosAnteriores, removido],
    })
    .eq("id", pedidoId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/pedido/${pedidoId}`);
  revalidatePath("/admin/pecas");
}
