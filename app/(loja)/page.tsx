import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const supabase = createAdminClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome")
    .order("ordem", { ascending: true });

  return (
    <div className="space-y-4">
      <img
        src="/home/bia-destaque.webp"
        alt="Navegue, faça sua lista, compre. São 3 passos simples para garantir seus novos looks."
        width={1400}
        height={1200}
        className="h-auto w-full rounded-[1rem]"
      />

      {!categorias || categorias.length === 0 ? (
        <p className="border border-dashed p-8 text-center text-sm text-neutral-500">
          Nenhuma categoria disponível ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {categorias.map((categoria) => (
            <Link
              key={categoria.id}
              href={`/categoria/${categoria.id}`}
              className="flex aspect-[16/9] items-center justify-center rounded-[1rem] border border-neutral-300 bg-neutral-50 p-4 text-center text-base font-semibold hover:bg-neutral-100 sm:text-xl"
            >
              {categoria.nome}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
