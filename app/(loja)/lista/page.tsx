"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { fecharListaAction } from "./actions";

export default function ListaPage() {
  const { items, removeItem, clear } = useCart();
  const [nomeCliente, setNomeCliente] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const total = items.reduce((sum, item) => sum + item.preco, 0);

  async function handleFechar() {
    setIsSubmitting(true);
    setError(null);
    try {
      const { pedidoId } = await fecharListaAction(
        items.map(({ id, nome, preco }) => ({ id, nome, preco })),
        nomeCliente
      );
      clear();
      router.push(`/pedido/${pedidoId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fechar a lista");
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-neutral-500">Sua lista está vazia.</p>
        <Link href="/" className="inline-block text-sm font-medium underline">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Minha lista</h2>

      <div className="divide-y border border-neutral-200">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3">
            <div className="h-16 w-16 shrink-0 bg-neutral-100">
              {item.foto && <img src={item.foto} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.nome}</p>
              <p className="text-sm text-neutral-600">{formatPrice(item.preco)}</p>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-lg font-medium">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="nome_cliente">
          Seu nome (opcional)
        </label>
        <input
          id="nome_cliente"
          value={nomeCliente}
          onChange={(event) => setNomeCliente(event.target.value)}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleFechar}
        disabled={isSubmitting}
        className="w-full bg-accent px-4 py-3 text-sm font-medium text-bold-text hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Enviando..." : "Fechar lista"}
      </button>
    </div>
  );
}
