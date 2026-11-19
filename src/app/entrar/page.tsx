import { FormConta } from "@/components/FormConta";

export default async function Entrar({ searchParams }: { searchParams: Promise<{ seguir?: string }> }) {
  const { seguir } = await searchParams;
  return (
    <div className="space-y-6">
      <header className="mx-auto max-w-md space-y-2">
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="text-tinta-suave">Entre para ver quem você segue e seus alertas.</p>
      </header>
      <FormConta modo="entrar" seguir={seguir} />
    </div>
  );
}
