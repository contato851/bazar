"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { deletePecaFotosByUrl, deletePecaFotosFolder, uploadPecaFotos } from "@/lib/supabase/storage";

function getPhotoFiles(formData: FormData) {
  return formData
    .getAll("fotos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function buildFields(formData: FormData) {
  const preco = Number(formData.get("preco"));
  return {
    nome: formData.get("nome")?.toString().trim() || "",
    descricao: formData.get("descricao")?.toString().trim() || null,
    preco: Number.isFinite(preco) ? preco : 0,
    categoria_id: formData.get("categoria_id")?.toString() || null,
  };
}

export async function createPecaAction(formData: FormData) {
  const fields = buildFields(formData);
  if (!fields.nome) throw new Error("Nome é obrigatório");
  if (!fields.categoria_id) throw new Error("Categoria é obrigatória");

  const supabase = createAdminClient();
  const { data: peca, error } = await supabase
    .from("pecas")
    .insert(fields)
    .select("id")
    .single();

  if (error || !peca) {
    throw new Error(error?.message ?? "Erro ao criar peça");
  }

  const files = getPhotoFiles(formData);
  if (files.length > 0) {
    const urls = await uploadPecaFotos(peca.id, files);
    await supabase.from("pecas").update({ fotos: urls }).eq("id", peca.id);
  }

  revalidatePath("/admin/pecas");
  revalidatePath("/");
  redirect("/admin/pecas");
}

export async function updatePecaAction(id: string, formData: FormData) {
  const fields = buildFields(formData);
  if (!fields.nome) throw new Error("Nome é obrigatório");
  if (!fields.categoria_id) throw new Error("Categoria é obrigatória");

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("pecas")
    .select("fotos")
    .eq("id", id)
    .single();

  const removedUrls = formData.getAll("remove_fotos").map((value) => value.toString());
  const keptUrls = ((current?.fotos as string[] | null) ?? []).filter(
    (url) => !removedUrls.includes(url)
  );

  const files = getPhotoFiles(formData);
  const newUrls = files.length > 0 ? await uploadPecaFotos(id, files) : [];

  const { error } = await supabase
    .from("pecas")
    .update({ ...fields, fotos: [...keptUrls, ...newUrls] })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (removedUrls.length > 0) {
    await deletePecaFotosByUrl(removedUrls);
  }

  revalidatePath("/admin/pecas");
  revalidatePath("/");
  redirect("/admin/pecas");
}

/** Marcar/desmarcar como vendida manualmente, fora do fluxo de pedido. */
export async function toggleStatusPecaAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("pecas").update({ status }).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pecas");
  revalidatePath("/");
}

export async function deletePecaAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("pecas").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await deletePecaFotosFolder(id);

  revalidatePath("/admin/pecas");
  revalidatePath("/");
}
