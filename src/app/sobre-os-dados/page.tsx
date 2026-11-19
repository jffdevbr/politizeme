import { prisma } from "@/lib/db";
import { data, reais } from "@/lib/formato";
import { BarrasHorizontais } from "@/components/Graficos";

export default async function SobreOsDados() {
  const [conjuntos, campanha] = await Promise.all([
    prisma.conjunto.findMany({ orderBy: [{ origem: "asc" }, { titulo: "asc" }] }),
    prisma.campanhaSimulada.findMany(),
  ]);
  const reais_ = conjuntos.filter((c) => c.origem === "REAL");
  const simulados = conjuntos.filter((c) => c.origem === "SIMULADO");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Sobre os dados</h1>
        <p className="text-tinta-suave">
          O PolitizeMe é um protótipo. Para ser transparente, cada informação mostra se é <strong>real</strong>{" "}
          (coletada de fonte oficial, com data) ou <strong>simulada</strong> (criada só para mostrar como uma
          funcionalidade vai funcionar). Dados simulados usam autores fictícios e nunca o nome de um parlamentar real.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">
          <span className="etiqueta mr-2 bg-salvia-suave text-salvia-texto">✓ Real</span>
          {reais_.length} conjuntos de dados oficiais
        </h2>
        <Tabela conjuntos={reais_} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">
          <span className="etiqueta mr-2 bg-argila-suave text-argila">◇ Simulado</span>
          {simulados.length} conjuntos ilustrativos
        </h2>
        <Tabela conjuntos={simulados} />
      </section>

      <section id="campanha" className="cartao space-y-3 border-dashed">
        <h2 className="text-2xl font-semibold">Exemplo: prestação de contas de campanha</h2>
        <p className="text-tinta-suave">
          Exemplo genérico da &quot;Deputada Exemplo A&quot;, que não existe. Na versão real, os dados virão da prestação
          de contas registrada no TSE.
        </p>
        <span className="etiqueta bg-argila-suave text-argila">◇ Dado simulado, ilustrativo</span>
        <div className="grid gap-6 md:grid-cols-2">
          {(["receita", "despesa"] as const).map((tipo) => (
            <div key={tipo}>
              <h3 className="font-semibold">{tipo === "receita" ? "De onde veio o dinheiro" : "Com o que gastou"}</h3>
              <BarrasHorizontais
                dados={campanha.filter((c) => c.tipo === tipo).map((c) => ({ nome: c.categoria, valor: c.valor }))}
                titulo={`Campanha (exemplo) – ${tipo}s`}
              />
              <p className="text-sm text-tinta-suave">
                Total: {reais(campanha.filter((c) => c.tipo === tipo).reduce((s, c) => s + c.valor, 0))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="cartao space-y-2 text-sm">
        <h2 className="text-xl font-semibold">Metodologia completa</h2>
        <p>
          Fontes, critérios de seleção, tratamento e limitações conhecidas estão documentados em{" "}
          <a href="https://github.com/jffdevbr/politizeme/blob/main/docs/DADOS.md">docs/DADOS.md</a>. O código da coleta
          está em <a href="https://github.com/jffdevbr/politizeme/tree/main/etl">etl/</a>.
        </p>
      </section>
    </div>
  );
}

function Tabela({ conjuntos }: { conjuntos: Awaited<ReturnType<typeof prisma.conjunto.findMany>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-linha text-tinta-suave">
            <th className="py-2 pr-3">Conjunto</th>
            <th className="py-2 pr-3">Fonte</th>
            <th className="py-2 pr-3">Registros</th>
            <th className="py-2 pr-3">Coleta</th>
          </tr>
        </thead>
        <tbody>
          {conjuntos.map((c) => (
            <tr key={c.id} className="border-b border-linha align-top">
              <td className="py-2 pr-3">
                <span className="font-semibold">{c.titulo}</span>
                <span className="block text-xs text-tinta-suave">{c.observacao}</span>
              </td>
              <td className="py-2 pr-3">
                <a href={c.fonteUrl} target="_blank" rel="noreferrer">
                  {c.fonte}
                </a>
              </td>
              <td className="py-2 pr-3 tabular-nums">{c.registros.toLocaleString("pt-BR")}</td>
              <td className="py-2 pr-3">{data(c.coletadoEm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
