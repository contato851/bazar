import { LoginForm } from "@/components/login-form";
import { signInAdminAction } from "./actions";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <img
          src="/logo/bazar-fashionista.png"
          alt="Bazar da Bia"
          width={1630}
          height={192}
          className="mx-auto mb-3 h-10 w-auto"
        />
        <p className="mb-6 text-center text-sm text-neutral-500">Painel administrativo</p>
        <LoginForm action={signInAdminAction} error={searchParams.error} />
      </div>
    </div>
  );
}
