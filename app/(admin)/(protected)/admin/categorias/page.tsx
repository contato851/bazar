import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCategoriaAction,
  deleteCategoriaAction,
  updateCategoriaAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const supabase = createAdminClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, ordem")
    .order("ordem", { ascending: true });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Categorias</h1>

      <form
        action={createCategoriaAction}
        className="flex flex-wrap items-end gap-3 border border-neutral-200 bg-white p-4"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            placeholder="Ex: Vestidos"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="w-24">
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="ordem">
            Ordem
          </label>
          <input
            id="ordem"
            name="ordem"
            type="number"
            defaultValue={0}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-sm font-medium text-bold-text hover:opacity-90"
        >
          + Nova categoria
        </button>
      </form>

      {(!categorias || categorias.length === 0) ? (
        <p className="border border-dashed p-8 text-center text-sm text-neutral-500">
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {categorias.map((categoria) => {
            const updateWithId = updateCategoriaAction.bind(null, categoria.id);
            return (
              <form
                key={categoria.id}
                action={updateWithId}
                className="flex flex-wrap items-end gap-3 border border-neutral-200 bg-white p-4"
              >
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-neutral-500">Nome</label>
                  <input
                    name="nome"
                    type="text"
                    defaultValue={categoria.nome}
                    required
                    className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs text-neutral-500">Ordem</label>
                  <input
                    name="ordem"
                    type="number"
                    defaultValue={categoria.ordem}
                    className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  Salvar
                </button>
                <button
                  type="submit"
                  formAction={deleteCategoriaAction}
                  name="id"
                  value={categoria.id}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                >
                  Excluir
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
