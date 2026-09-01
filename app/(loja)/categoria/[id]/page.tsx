import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PecaCard } from "@/components/peca-card";

export const dynamic = "force-dynamic";

export default async function CategoriaPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: categoria } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("id", params.id)
    .single();

  if (!categoria) notFound();

  const { data: pecas } = await supabase
    .from("pecas")
    .select("id, nome, preco, fotos")
    .eq("categoria_id", params.id)
    .eq("status", "disponivel")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Categorias
        </Link>
        <h2 className="mt-2 text-xl font-semibold">{categoria.nome}</h2>
      </div>

      {(!pecas || pecas.length === 0) ? (
        <p className="border border-dashed p-8 text-center text-sm text-neutral-500">
          Nenhuma peça disponível nessa categoria no momento.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {pecas.map((peca) => (
            <PecaCard key={peca.id} peca={peca} />
          ))}
        </div>
      )}
    </div>
  );
}
