"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

type Peca = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  fotos: string[] | null;
  status: string;
};

export function PecaDetail({ peca }: { peca: Peca }) {
  const { addItem, isInCart } = useCart();
  const fotos = peca.fotos ?? [];
  const [index, setIndex] = useState(0);
  const inCart = isInCart(peca.id);
  const disponivel = peca.status === "disponivel";

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] w-full bg-neutral-100">
        {fotos.length > 0 ? (
          <img src={fotos[index]} alt={peca.nome} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-neutral-400">
            Sem foto
          </span>
        )}

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((current) => (current - 1 + fotos.length) % fotos.length)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/90 text-lg hover:bg-white"
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIndex((current) => (current + 1) % fotos.length)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/90 text-lg hover:bg-white"
              aria-label="Próxima foto"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {fotos.map((foto, photoIndex) => (
                <button
                  key={foto}
                  type="button"
                  onClick={() => setIndex(photoIndex)}
                  className={`h-2 w-2 ${
                    photoIndex === index ? "bg-neutral-900" : "bg-white/80"
                  }`}
                  aria-label={`Ver foto ${photoIndex + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold">{peca.nome}</h2>
        <p className="mt-1 text-lg">{formatPrice(peca.preco)}</p>
      </div>

      {peca.descricao && <p className="text-sm text-neutral-600">{peca.descricao}</p>}

      {!disponivel ? (
        <p className="border border-neutral-300 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-500">
          Peça vendida
        </p>
      ) : (
        <button
          type="button"
          disabled={inCart}
          onClick={() =>
            addItem({ id: peca.id, nome: peca.nome, preco: peca.preco, foto: fotos[0] ?? null })
          }
          className="w-full border border-neutral-900 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:cursor-default disabled:border-neutral-300 disabled:text-neutral-400"
        >
          {inCart ? "Na lista" : "Adicionar à lista"}
        </button>
      )}
    </div>
  );
}
