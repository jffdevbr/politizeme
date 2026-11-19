import Link from "next/link";
import { prisma } from "@/lib/db";
import { participacao, resumoCota } from "@/lib/consultas";
import { reais } from "@/lib/formato";
import { DataBadge } from "@/components/DataBadge";
import { EscolhaComparar } from "@/components/EscolhaComparar";
import { BarrasAgrupadas } from "@/components/Graficos";

export default async function Comparar({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await searchParams;
  const opcoes = await prisma.parlamentar.findMany({ orderBy: { nomeBusca: "asc" }, select: { id: true, nome: true, cargo: true } });
  const pedidos = ids.split(",").filter(Boolean).slice(0, 3);
  // Ordem alfabética: a posição na tela nunca sugere ranking.
  const escolhidos = await prisma.parlamentar.findMany({ where: { id: { in: pedidos } }, orderBy: { nomeBusca: "asc" } });

  const dados = await Promise.all(
    escolhidos.map(async (p) => ({
      p,
      cota: await resumoCota(p.id),
      part: p.casa === "CAMARA" ? await participacao(p.id) : null,
    })),
  );

  // Categorias presentes em qualquer um dos escolhidos, em ordem alfabética.
  const categorias = [...new Set(dados.flatMap((d) => d.cota.categorias.map((c) => c.nome)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const grafico = categorias.map((categoria) => {
    const linha: Record<string, string | number> = { categoria };
    for (const d of dados) linha[d.p.nome] = d.cota.categorias.find((c) => c.nome === categoria)?.valor ?? 0;
    return linha;
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Comparar representantes</h1>
        <p className="text-tinta-suave">
          Veja até três representantes lado a lado. Sem notas e sem ranking: os nomes aparecem em ordem alfabética e a
          avaliação é sua.
        </p>
      </header>
      <EscolhaComparar opcoes={opcoes} selecionados={pedidos} />

      {dados.length >= 2 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left">
              <caption className="sr-only">Comparação entre representantes</caption>
              <thead>
                <tr className="border-b border-linha">
                  <th scope="col" className="py-2 pr-3 text-sm text-tinta-suave">
                    &nbsp;
                  </th>
                  {dados.map(({ p }) => (
                    <th key={p.id} scope="col" className="py-2 pr-3">
                      <Link href={`/representantes/${p.id}`}>{p.nome}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                <Linha rotulo="Cargo e partido" valores={dados.map(({ p }) => `${p.cargo} · ${p.partido}`)} />
                <Linha
                  rotulo="Votou nas votações selecionadas"
                  valores={dados.map(({ part }) => (part ? `${part.votou} de ${part.consideradas}` : "Senado: ainda não coletado"))}
                />
                <Linha rotulo="Cota: total no período" valores={dados.map(({ cota }) => reais(cota.total))} />
                <Linha
                  rotulo="Cota: média por mês"
                  valores={dados.map(({ cota }) => (cota.meses.length ? reais(cota.total / cota.meses.length) : "–"))}
                />
                <Linha rotulo="Meses com registro" valores={dados.map(({ cota }) => String(cota.meses.length))} />
              </tbody>
            </table>
          </div>
          <section className="cartao">
            <h2 className="mb-2 text-xl font-semibold">Cota parlamentar por categoria</h2>
            <BarrasAgrupadas dados={grafico} series={dados.map((d) => d.p.nome)} titulo="Cota por categoria, lado a lado" />
            <p className="mt-2 text-xs text-tinta-suave">
              Deputados e senadores têm regras e valores de cota diferentes; compare com cuidado entre as casas.
            </p>
            <DataBadge conjuntos={["cota_camara_mensal", "cota_senado_mensal", "votos"]} />
          </section>
        </>
      )}
    </div>
  );
}

function Linha({ rotulo, valores }: { rotulo: string; valores: string[] }) {
  return (
    <tr className="border-b border-linha">
      <th scope="row" className="py-2 pr-3 font-semibold text-tinta-suave">
        {rotulo}
      </th>
      {valores.map((v, i) => (
        <td key={i} className="py-2 pr-3 tabular-nums">
          {v}
        </td>
      ))}
    </tr>
  );
}
