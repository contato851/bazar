import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PecaDetail } from "@/components/peca-detail";

export const dynamic = "force-dynamic";

export default async function PecaPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data: peca } = await supabase
    .from("pecas")
    .select("id, nome, descricao, preco, fotos, status, categoria_id")
    .eq("id", params.id)
    .single();

  if (!peca) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={peca.categoria_id ? `/categoria/${peca.categoria_id}` : "/"}
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Voltar
      </Link>
      <PecaDetail peca={peca} />
    </div>
  );
}
