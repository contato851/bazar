"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/admin/pecas", label: "Peças" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/relatorios", label: "Relatórios" },
];

type Props = {
  signOutAction: (formData: FormData) => void;
};

/**
 * Nav do admin: horizontal normal a partir do "sm", e um menu sanduíche que
 * abre um dropdown no mobile — evita os 4 links (+ Sair) apertados numa
 * linha só em tela estreita.
 */
export function AdminNav({ signOutAction }: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-4 text-sm text-neutral-600 sm:flex">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-neutral-900">
            {link.label}
          </Link>
        ))}
        <form action={signOutAction}>
          <button type="submit" className="hover:text-neutral-900">
            Sair
          </button>
        </form>
      </nav>

      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 sm:hidden"
      >
        <span
          className={`block h-0.5 w-6 bg-neutral-900 transition-transform ${aberto ? "translate-y-2 rotate-45" : ""}`}
        />
        <span className={`block h-0.5 w-6 bg-neutral-900 transition-opacity ${aberto ? "opacity-0" : ""}`} />
        <span
          className={`block h-0.5 w-6 bg-neutral-900 transition-transform ${aberto ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {aberto && (
        <div className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white px-4 py-4 shadow-sm sm:hidden">
          <nav className="flex flex-col gap-4 text-sm text-neutral-600">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setAberto(false)}
                className="hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button type="submit" className="hover:text-neutral-900">
                Sair
              </button>
            </form>
          </nav>
        </div>
      )}
    </>
  );
}
