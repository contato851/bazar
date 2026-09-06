"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

/**
 * Ícone fixo da lista (carrinho) — visível em toda navegação pública,
 * mostrando a quantidade de peças escolhidas.
 */
export function CartBadge() {
  const { items } = useCart();

  return (
    <Link
      href="/lista"
      className="fixed bottom-4 right-4 z-30 flex items-center gap-2 border border-neutral-900 bg-[#d7df1f] px-4 py-3 text-sm font-medium text-neutral-900 shadow-lg hover:brightness-95"
    >
      Minha lista
      {items.length > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center bg-neutral-900 px-1 text-xs font-semibold text-white">
          {items.length}
        </span>
      )}
    </Link>
  );
}
