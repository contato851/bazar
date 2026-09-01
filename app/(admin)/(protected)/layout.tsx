import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/supabase/admin-session";
import { signOutAdminAction } from "../admin/login/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await getAdminSession();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin/pecas">
            <img
              src="/logo/bazar-fashionista.png"
              alt="Bazar da Bia"
              width={1630}
              height={192}
              className="h-6 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            <Link href="/admin/pecas" className="hover:text-neutral-900">
              Peças
            </Link>
            <Link href="/admin/categorias" className="hover:text-neutral-900">
              Categorias
            </Link>
            <form action={signOutAdminAction}>
              <button type="submit" className="hover:text-neutral-900">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
