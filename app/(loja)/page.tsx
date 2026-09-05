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
              className="flex aspect-[16/9] items-center justify-center border border-neutral-300 bg-neutral-50 p-4 text-center text-base font-semibold hover:bg-neutral-100 sm:text-xl"
            >
              {categoria.nome}
            </Link>
          ))}
        </div>
      )}

      <div className="relative w-full">
        <img
          src="/home/bia-destaque.png"
          alt="Sua compra em 3 passos: navegue pelas categorias, adicione itens à sua lista, finalize através do WhatsApp"
          width={1600}
          height={900}
          className="h-auto w-full"
        />
        <div className="absolute inset-y-0 left-0 flex w-3/5 flex-col justify-center px-2 sm:px-4">
          <p className="text-xs font-bold uppercase leading-tight sm:text-2xl md:text-3xl">
            Sua compra em
            <br />
            3 passos:
          </p>
          <div className="mt-1 space-y-0.5 text-[9px] font-medium leading-tight sm:mt-3 sm:space-y-1.5 sm:text-base md:text-lg">
            {[
              "1 - Navegue pelas categorias",
              "2 - Adicione itens à sua lista",
              "3 - Finalize através do WhatsApp",
            ].map((linha) => (
              <p key={linha} className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-1 w-1 shrink-0 rounded-full bg-accent sm:h-2 sm:w-2" />
                {linha}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
