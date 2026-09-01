"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createCategoriaAction(formData: FormData) {
  const nome = formData.get("nome")?.toString().trim();
  const ordem = Number(formData.get("ordem")) || 0;
  if (!nome) {
    throw new Error("Nome é obrigatório");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("categorias").insert({ nome, ordem });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function updateCategoriaAction(id: string, formData: FormData) {
  const nome = formData.get("nome")?.toString().trim();
  const ordem = Number(formData.get("ordem")) || 0;
  if (!nome) {
    throw new Error("Nome é obrigatório");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("categorias").update({ nome, ordem }).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function deleteCategoriaAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;

  const supabase = createAdminClient();
  // Peças dessa categoria não são apagadas — só ficam sem categoria
  // (categoria_id vira null, via ON DELETE SET NULL no schema).
  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}
