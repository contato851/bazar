import Link from "next/link";
import { CartProvider } from "@/lib/cart";
import { CartBadge } from "@/components/cart-badge";

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white pb-24">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
            <Link href="/">
              <img
                src="/logo/bazar-fashionista.png"
                alt="Bazar da Bia"
                width={1630}
                height={192}
                className="h-6 w-auto"
              />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
        <CartBadge />
      </div>
    </CartProvider>
  );
}
