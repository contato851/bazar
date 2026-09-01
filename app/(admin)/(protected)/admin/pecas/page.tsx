import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { deletePecaAction, toggleStatusPecaAction } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  categoria?: string;
  status?: string;
};

export default async function PecasPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createAdminClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome")
    .order("ordem", { ascending: true });

  let query = supabase
    .from("pecas")
    .select("id, nome, preco, fotos, status, categoria_id")
    .order("created_at", { ascending: false });

  if (searchParams.categoria) {
    query = query.eq("categoria_id", searchParams.categoria);
  }
  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: pecas } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Peças</h1>
        <Link
          href="/admin/pecas/nova"
          className="bg-accent px-4 py-2 text-center text-sm font-medium text-bold-text hover:opacity-90"
        >
          + Nova peça
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="categoria">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={searchParams.categoria ?? ""}
            className="border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">Todas</option>
            {categorias?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="vendido">Vendido</option>
          </select>
        </div>
        <button
          type="submit"
          className="border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          Filtrar
        </button>
      </form>

      {(!pecas || pecas.length === 0) ? (
        <p className="border border-dashed p-8 text-center text-sm text-neutral-500">
          Nenhuma peça encontrada.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {pecas.map((peca) => {
            const foto = peca.fotos?.[0] ?? null;
            const proximoStatus = peca.status === "disponivel" ? "vendido" : "disponivel";
            return (
              <div key={peca.id} className="border border-neutral-200 bg-white">
                <div className="aspect-[3/4] w-full bg-neutral-100">
                  {foto ? (
                    <img src={foto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-neutral-400">
                      Sem foto
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="truncate text-sm font-medium">{peca.nome}</p>
                  <p className="text-sm text-neutral-600">{formatPrice(peca.preco)}</p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium ${
                      peca.status === "disponivel"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {peca.status === "disponivel" ? "Disponível" : "Vendido"}
                  </span>

                  <div className="flex items-center justify-between pt-1 text-sm">
                    <Link
                      href={`/admin/pecas/${peca.id}/editar`}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Editar
                    </Link>
                    <form action={deletePecaAction}>
                      <input type="hidden" name="id" value={peca.id} />
                      <button type="submit" className="text-neutral-600 hover:text-neutral-900">
                        Excluir
                      </button>
                    </form>
                  </div>
                  <form action={toggleStatusPecaAction}>
                    <input type="hidden" name="id" value={peca.id} />
                    <input type="hidden" name="status" value={proximoStatus} />
                    <button
                      type="submit"
                      className="w-full border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50"
                    >
                      Marcar como {proximoStatus === "vendido" ? "vendida" : "disponível"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
