"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

type Peca = {
  id: string;
  nome: string;
  preco: number;
  fotos: string[] | null;
};

export function PecaCard({ peca }: { peca: Peca }) {
  const { addItem, isInCart } = useCart();
  const foto = peca.fotos?.[0] ?? null;
  const inCart = isInCart(peca.id);

  return (
    <div className="border border-neutral-200 bg-white">
      <Link href={`/peca/${peca.id}`} className="block aspect-[3/4] w-full bg-neutral-100">
        {foto ? (
          <img src={foto} alt={peca.nome} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-xs text-neutral-400">
            Sem foto
          </span>
        )}
      </Link>

      <div className="space-y-1 p-3">
        <Link href={`/peca/${peca.id}`}>
          <p className="truncate text-sm font-medium">{peca.nome}</p>
        </Link>
        <p className="text-sm text-neutral-600">{formatPrice(peca.preco)}</p>

        <button
          type="button"
          disabled={inCart}
          onClick={() =>
            addItem({ id: peca.id, nome: peca.nome, preco: peca.preco, foto })
          }
          className="mt-1 w-full border border-neutral-900 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:cursor-default disabled:border-neutral-300 disabled:text-neutral-400"
        >
          {inCart ? "Na lista" : "Adicionar à lista"}
        </button>
      </div>
    </div>
  );
}
