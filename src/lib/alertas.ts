import { prisma } from "./db";
import { participacao, resumoCota } from "./consultas";
import { MESES, reais } from "./formato";

export type Alerta = { data: Date; tipo: "votacao" | "cota" | "sem_voto"; titulo: string; texto: string; href: string };

// Linha do tempo de quem a pessoa segue, montada só com dados reais do banco.
export async function alertasDe(parlamentarIds: string[]): Promise<Alerta[]> {
  const parlamentares = await prisma.parlamentar.findMany({ where: { id: { in: parlamentarIds } } });
  const alertas: Alerta[] = [];
  for (const p of parlamentares) {
    const href = `/representantes/${p.id}`;
    const cota = await resumoCota(p.id);
    for (const m of cota.meses.slice(-3)) {
      alertas.push({
        data: new Date(Date.UTC(m.ano, m.mes - 1, 28)),
        tipo: "cota",
        titulo: "Gastos da cota",
        texto: `${p.nome} usou ${reais(m.valor)} da cota parlamentar em ${MESES[m.mes - 1]}/${m.ano}.`,
        href,
      });
    }
    if (p.casa !== "CAMARA") continue;
    const part = await participacao(p.id);
    for (const v of part.votos.slice(0, 5)) {
      alertas.push({
        data: v.votacao.data,
        tipo: "votacao",
        titulo: "Votação",
        texto: `${p.nome} votou ${v.voto} na ${v.votacao.proposicao}.`,
        href: `/votacoes/${v.votacaoId}`,
      });
    }
    const recentes = await prisma.votacao.findMany({ orderBy: { data: "desc" }, take: 3 });
    const semVoto = recentes.filter((r) => part.semRegistro.some((s) => s.id === r.id));
    if (semVoto.length >= 2) {
      alertas.push({
        data: recentes[0].data,
        tipo: "sem_voto",
        titulo: "Sem voto registrado",
        texto: `${p.nome} não registrou voto em ${semVoto.length} das 3 votações mais recentes que acompanhamos. Pode ser licença, missão oficial ou ausência.`,
        href,
      });
    }
  }
  return alertas.sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, 20);
}
