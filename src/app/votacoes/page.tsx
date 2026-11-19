import Link from "next/link";
import { prisma } from "@/lib/db";
import { data } from "@/lib/formato";
import { DataBadge } from "@/components/DataBadge";

export default async function Votacoes() {
  const votacoes = await prisma.votacao.findMany({ orderBy: { data: "desc" } });
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Votações explicadas</h1>
        <p className="text-tinta-suave">
          As {votacoes.length} votações nominais mais recentes do Plenário da Câmara sobre projetos de lei, propostas de
          emenda à Constituição e medidas provisórias. Toque em uma para ver como votou cada deputado de São Paulo.
        </p>
        <details className="text-sm text-tinta-suave">
          <summary className="cursor-pointer text-lago-profundo">Como escolhemos essas votações</summary>
          <p className="mt-2">
            Votações nominais (com voto registrado de cada deputado) que aprovam ou rejeitam uma proposta, de 2025 e
            2026, uma por proposta. Requerimentos e destaques ficam de fora porque são etapas do processo. Votações
            secretas não entram porque o voto individual não é público.
          </p>
        </details>
        <DataBadge conjuntos={["votacoes"]} />
      </header>
      <ul className="space-y-3">
        {votacoes.map((v) => {
          const placar = v.placar as Record<string, number>;
          return (
            <li key={v.id}>
              <Link href={`/votacoes/${v.id}`} className="cartao block space-y-1 no-underline hover:border-lago">
                <p className="text-sm text-tinta-suave">
                  {data(v.data)} · {v.aprovada ? "Aprovada" : "Rejeitada"}
                </p>
                <h2 className="text-lg font-semibold text-tinta">{v.proposicao}</h2>
                <p className="line-clamp-2 text-tinta">{v.ementa}</p>
                <p className="text-sm text-tinta-suave">
                  Sim {placar["Sim"] ?? 0} · Não {placar["Não"] ?? 0} · Abstenção {placar["Abstenção"] ?? 0}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
