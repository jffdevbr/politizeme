import Link from "next/link";
import { NovaSenha } from "@/components/FormRecuperacao";

export default async function RedefinirSenha({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="space-y-6">
      <header className="mx-auto max-w-md space-y-2">
        <h1 className="text-3xl font-bold">Criar nova senha</h1>
      </header>
      {token ? (
        <NovaSenha token={token} />
      ) : (
        <p className="cartao mx-auto max-w-md">
          Link incompleto. <Link href="/recuperar-senha">Peça um novo link</Link>.
        </p>
      )}
    </div>
  );
}
