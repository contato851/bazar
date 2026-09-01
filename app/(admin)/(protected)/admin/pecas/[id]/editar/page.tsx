import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PecaForm } from "@/components/peca-form";
import { updatePecaAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarPecaPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: peca } = await supabase
    .from("pecas")
    .select("id, nome, descricao, preco, categoria_id, fotos")
    .eq("id", params.id)
    .single();

  if (!peca) notFound();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome")
    .order("ordem", { ascending: true });

  const updateWithId = updatePecaAction.bind(null, peca.id);

  return (
    <div className="space-y-6">
      <Link href="/admin/pecas" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Peças
      </Link>
      <h1 className="text-2xl font-semibold">Editar peça</h1>
      <PecaForm
        action={updateWithId}
        submitLabel="Salvar alterações"
        categorias={categorias ?? []}
        defaultValues={peca}
        existingFotos={peca.fotos ?? []}
      />
    </div>
  );
}
