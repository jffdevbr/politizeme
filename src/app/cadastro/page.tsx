import { prisma } from "@/lib/db";
import { FormConta } from "@/components/FormConta";

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ seguir?: string }> }) {
  const { seguir } = await searchParams;
  const [municipios, alvo] = await Promise.all([
    prisma.municipio.findMany({ orderBy: { nome: "asc" }, select: { codigoIbge: true, nome: true } }),
    seguir ? prisma.parlamentar.findUnique({ where: { id: seguir } }) : null,
  ]);
  return (
    <div className="space-y-6">
      <header className="mx-auto max-w-md space-y-2">
        <h1 className="text-3xl font-bold">Criar conta</h1>
        <p className="text-tinta-suave">
          {alvo
            ? `Crie uma conta para seguir ${alvo.nome} e receber o resumo semanal e alertas.`
            : "Consultar não precisa de conta. A conta serve para seguir representantes e receber resumos e alertas."}
        </p>
      </header>
      <FormConta modo="cadastro" municipios={municipios} seguir={alvo?.id} />
    </div>
  );
}
