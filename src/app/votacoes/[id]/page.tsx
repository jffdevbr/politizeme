import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { data } from "@/lib/formato";
import { DataBadge } from "@/components/DataBadge";
import { BarrasHorizontais } from "@/components/Graficos";
import { VotosSP } from "@/components/VotosSP";

const ORDEM = ["Sim", "Não", "Abstenção", "Obstrução", "Artigo 17"];

export default async function Votacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await prisma.votacao.findUnique({
    where: { id },
    include: {
      votos: { include: { parlamentar: true } },
      orientacoes: { orderBy: { sigla: "asc" } },
    },
  });
  if (!v) notFound();

  const placar = v.placar as Record<string, number>;
  const geral = ORDEM.filter((k) => placar[k]).map((k) => ({ nome: k, valor: placar[k] }));
  const contaSP = new Map<string, number>();
  for (const x of v.votos) contaSP.set(x.voto, (contaSP.get(x.voto) ?? 0) + 1);
  const sp = ORDEM.filter((k) => contaSP.get(k)).map((k) => ({ nome: k, valor: contaSP.get(k)! }));
  const itens = v.votos
    .map((x) => ({ parlamentarId: x.parlamentarId, nome: x.parlamentar.nome, partido: x.partidoNaEpoca, voto: x.voto }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const semVoto = 70 - v.votos.length;

  return (
    <div className="space-y-8">
      <p className="text-sm">
        <Link href="/votacoes">← Votações</Link>
      </p>

      <header className="cartao space-y-3">
        <p className="text-sm text-tinta-suave">
          Plenário da Câmara · {data(v.data)} · {v.aprovada ? "Aprovada" : "Rejeitada"}
        </p>
        <h1 className="text-3xl font-bold">{v.proposicao}</h1>
        <div>
          <h2 className="text-sm font-semibold text-tinta-suave">O que a proposta diz (ementa oficial)</h2>
          <p className="text-lg">{v.ementa}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-tinta-suave">O que foi votado</h2>
          <p>{v.descricao}</p>
        </div>
        <a href={v.urlOficial} target="_blank" rel="noreferrer" className="botao botao-secundario">
          Ler o texto oficial na Câmara
        </a>
        <DataBadge conjuntos={["votacoes"]} />
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="cartao">
          <h2 className="mb-2 text-xl font-semibold">Resultado na Câmara (todos os estados)</h2>
          <BarrasHorizontais dados={geral} titulo="Resultado geral da votação" formato="numero" />
        </div>
        <div className="cartao">
          <h2 className="mb-2 text-xl font-semibold">Deputados de São Paulo</h2>
          <BarrasHorizontais dados={sp} titulo="Votos dos deputados de SP" formato="numero" />
          {semVoto > 0 && (
            <p className="mt-2 text-xs text-tinta-suave">
              {semVoto} dos 70 deputados de SP em exercício hoje não têm voto registrado nesta votação (ausência,
              licença ou ainda não estavam no cargo).
            </p>
          )}
        </div>
      </section>
      <p className="text-xs text-tinta-suave">
        &quot;Artigo 17&quot; é o presidente da Câmara, que pelo regimento não vota nas votações comuns. Sim e Não
        aparecem com a mesma cor de propósito: o PolitizeMe mostra o dado sem dizer qual voto é certo.
      </p>

      <section className="cartao space-y-3" aria-labelledby="cada">
        <h2 id="cada" className="text-2xl font-semibold">
          Como votou cada deputado de SP
        </h2>
        <VotosSP itens={itens} />
        <DataBadge conjuntos={["votos"]} />
      </section>

      {v.orientacoes.length > 0 && (
        <section className="cartao space-y-3" aria-labelledby="orient">
          <h2 id="orient" className="text-2xl font-semibold">
            Orientação dos partidos e do governo
          </h2>
          <p className="text-sm text-tinta-suave">
            Antes de votar, cada partido ou bloco e o governo indicam como sugerem que seus deputados votem. É um dado,
            não uma avaliação.
          </p>
          <ul className="grid gap-x-6 text-sm sm:grid-cols-2 md:grid-cols-3">
            {v.orientacoes.map((o) => (
              <li key={o.id} className="flex justify-between border-b border-linha py-1">
                <span>{o.sigla}</span>
                <span className="text-tinta-suave">{o.orientacao}</span>
              </li>
            ))}
          </ul>
          <DataBadge conjuntos={["orientacoes"]} />
        </section>
      )}
    </div>
  );
}
