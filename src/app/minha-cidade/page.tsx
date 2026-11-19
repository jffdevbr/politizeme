import Link from "next/link";
import { prisma } from "@/lib/db";
import { reais } from "@/lib/formato";
import { BuscaCep } from "@/components/BuscaCep";
import { DataBadge } from "@/components/DataBadge";
import { BarrasHorizontais } from "@/components/Graficos";
import { usuarioAtual } from "@/lib/sessao";

export default async function MinhaCidade({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const usuario = await usuarioAtual();
  const codigo = m ?? usuario?.municipioIbge ?? undefined;
  const municipio = codigo ? await prisma.municipio.findUnique({ where: { codigoIbge: codigo } }) : null;

  if (!municipio) {
    const municipios = await prisma.municipio.findMany({ orderBy: { nome: "asc" }, select: { codigoIbge: true, nome: true } });
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Minha cidade</h1>
        <p className="text-tinta-suave">Informe seu CEP ou escolha o município para ver o que chegou à sua cidade.</p>
        <BuscaCep municipios={municipios} />
      </div>
    );
  }

  const [emendas, deputados, senadores, cotaSP] = await Promise.all([
    prisma.emendaSimulada.findMany({ where: { municipioIbge: municipio.codigoIbge }, orderBy: { valorIndicado: "desc" } }),
    prisma.parlamentar.count({ where: { casa: "CAMARA" } }),
    prisma.parlamentar.count({ where: { casa: "SENADO" } }),
    prisma.despesaMensal.groupBy({ by: ["categoria"], _sum: { valor: true }, where: { ano: 2026 } }),
  ]);
  const porArea = new Map<string, number>();
  for (const e of emendas) porArea.set(e.area, (porArea.get(e.area) ?? 0) + e.valorIndicado);
  const totalIndicado = emendas.reduce((s, e) => s + e.valorIndicado, 0);
  const totalPago = emendas.reduce((s, e) => s + e.valorPago, 0);
  const categoriasSP = cotaSP
    .map((c) => ({ nome: c.categoria, valor: Math.round(c._sum.valor ?? 0) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);
  const totalSP = cotaSP.reduce((s, c) => s + (c._sum.valor ?? 0), 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-tinta-suave">Minha cidade</p>
        <h1 className="text-3xl font-bold">{municipio.nome} (SP)</h1>
        <p className="text-tinta-suave">
          Quem representa {municipio.nome} no Congresso são os{" "}
          <Link href="/representantes?casa=CAMARA">{deputados} deputados federais</Link> e os{" "}
          <Link href="/representantes?casa=SENADO">{senadores} senadores</Link> de São Paulo, porque eles são eleitos pelo
          estado inteiro.
        </p>
        <DataBadge conjuntos={["municipios", "deputados", "senadores"]} />
      </header>

      <section className="cartao space-y-4 border-dashed" aria-labelledby="emendas">
        <div>
          <h2 id="emendas" className="text-2xl font-semibold">
            Emendas para {municipio.nome}
          </h2>
          <p className="text-tinta-suave">
            Emenda parlamentar é uma parte do orçamento federal que deputados e senadores indicam para uma cidade, uma
            área ou um projeto. Esta seção mostra como vai funcionar; os valores e autores abaixo são fictícios.
          </p>
        </div>
        <DataBadge conjuntos={["emendas_simuladas"]} />
        {emendas.length === 0 ? (
          <p className="text-tinta-suave">Nenhuma emenda no exemplo para esta cidade.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-nevoa p-4">
                <p className="text-sm text-tinta-suave">Indicado (exemplo)</p>
                <p className="text-2xl font-bold">{reais(totalIndicado)}</p>
              </div>
              <div className="rounded-lg bg-nevoa p-4">
                <p className="text-sm text-tinta-suave">Já pago (exemplo)</p>
                <p className="text-2xl font-bold">{reais(totalPago)}</p>
              </div>
            </div>
            <BarrasHorizontais
              dados={[...porArea.entries()].map(([nome, valor]) => ({ nome, valor }))}
              titulo={`Emendas por área em ${municipio.nome} (simulado)`}
            />
            <ul className="divide-y divide-linha text-sm">
              {emendas.map((e) => (
                <li key={e.id} className="flex justify-between gap-2 py-2">
                  <span>
                    {e.autor} · {e.area} · {e.ano}
                  </span>
                  <span className="tabular-nums">
                    {reais(e.valorIndicado)} <span className="text-tinta-suave">(pago {reais(e.valorPago)})</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="text-xs text-tinta-suave">
          Fonte real prevista: Portal da Transparência (CGU), emendas parlamentares por município de destino.
        </p>
      </section>

      <section className="cartao space-y-3" aria-labelledby="cota-sp">
        <h2 id="cota-sp" className="text-2xl font-semibold">
          Quanto os representantes de SP gastaram da cota em 2026
        </h2>
        <p className="text-tinta-suave">
          Soma da cota parlamentar dos {deputados + senadores} representantes do estado, por categoria. Total:{" "}
          <strong className="text-tinta">{reais(totalSP)}</strong>.
        </p>
        <BarrasHorizontais dados={categoriasSP} titulo="Cota parlamentar dos representantes de SP em 2026, por categoria" />
        <DataBadge conjuntos={["cota_camara_mensal", "cota_senado_mensal"]} />
      </section>
    </div>
  );
}
