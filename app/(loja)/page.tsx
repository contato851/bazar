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
    <div className="space-y-3">
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
              className="flex aspect-square items-center justify-center border border-neutral-300 bg-neutral-50 p-4 text-center font-medium hover:bg-neutral-100"
            >
              {categoria.nome}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 items-center gap-3">
        <p className="text-lg font-bold leading-snug sm:text-3xl">
          Navegue pelas categorias e adicione itens à sua lista. Depois é só
          finalizar a compra pelo WhatsApp.
        </p>
        <img
          src="/home/destaque.png"
          alt=""
          width={900}
          height={1600}
          className="w-full object-contain"
        />
      </div>
    </div>
  );
}
