"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type ItemPedido = { id: string };

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
