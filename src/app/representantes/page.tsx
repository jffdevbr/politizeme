import { prisma } from "@/lib/db";
import { DataBadge } from "@/components/DataBadge";
import { ListaRepresentantes } from "@/components/ListaRepresentantes";

export default async function Representantes({ searchParams }: { searchParams: Promise<{ casa?: string }> }) {
  const { casa = "" } = await searchParams;
  const itens = await prisma.parlamentar.findMany({
    orderBy: { nomeBusca: "asc" },
    select: { id: true, nome: true, nomeBusca: true, partido: true, cargo: true, casa: true, foto: true },
  });
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Seus representantes</h1>
        <p className="text-tinta-suave">
          Os 70 deputados federais e os 3 senadores do estado de São Paulo em exercício. Toque em um nome para ver como
          votou e quanto gastou.
        </p>
        <DataBadge conjuntos={["deputados", "senadores"]} />
      </header>
      <ListaRepresentantes itens={itens} casaInicial={casa} />
    </div>
  );
}
