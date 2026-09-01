import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PecaForm } from "@/components/peca-form";
import { createPecaAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaPecaPage() {
  const supabase = createAdminClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome")
    .order("ordem", { ascending: true });

  return (
    <div className="space-y-6">
      <Link href="/admin/pecas" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Peças
      </Link>
      <h1 className="text-2xl font-semibold">Nova peça</h1>
      <PecaForm action={createPecaAction} submitLabel="Cadastrar peça" categorias={categorias ?? []} />
    </div>
  );
}
