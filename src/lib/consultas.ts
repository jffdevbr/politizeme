import { prisma } from "./db";
import { MESES } from "./formato";

// Consultas compartilhadas entre as páginas e o assistente Poli.

export async function resumoCota(parlamentarId: string) {
  const linhas = await prisma.despesaMensal.findMany({ where: { parlamentarId } });
  const porCategoria = new Map<string, number>();
  const porMes = new Map<string, { ano: number; mes: number; valor: number }>();
  let total = 0;
  for (const l of linhas) {
    total += l.valor;
    porCategoria.set(l.categoria, (porCategoria.get(l.categoria) ?? 0) + l.valor);
    const chave = `${l.ano}-${String(l.mes).padStart(2, "0")}`;
    const m = porMes.get(chave) ?? { ano: l.ano, mes: l.mes, valor: 0 };
    m.valor += l.valor;
    porMes.set(chave, m);
  }
  const categorias = [...porCategoria.entries()]
    .map(([nome, valor]) => ({ nome, valor: Math.round(valor) }))
    .sort((a, b) => b.valor - a.valor);
  const meses = [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => ({ rotulo: `${MESES[m.mes - 1]}/${String(m.ano).slice(2)}`, ano: m.ano, mes: m.mes, valor: Math.round(m.valor) }));
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  return { total, categorias, meses, primeiro, ultimo };
}

// Participação: votações selecionadas desde o primeiro mês com registro de cota do deputado
// (aproximação do início do exercício; suplentes que assumiram depois não são cobrados por votações anteriores).
export async function participacao(parlamentarId: string) {
  const [primeiraDespesa, votos, votacoes] = await Promise.all([
    prisma.despesaMensal.findFirst({ where: { parlamentarId }, orderBy: [{ ano: "asc" }, { mes: "asc" }] }),
    prisma.voto.findMany({ where: { parlamentarId }, include: { votacao: true }, orderBy: { votacao: { data: "desc" } } }),
    prisma.votacao.findMany({ orderBy: { data: "desc" } }),
  ]);
  const inicio = primeiraDespesa ? new Date(Date.UTC(primeiraDespesa.ano, primeiraDespesa.mes - 1, 1)) : null;
  const consideradas = votacoes.filter((v) => !inicio || v.data >= inicio);
  const votou = new Set(votos.map((v) => v.votacaoId));
  return {
    votos,
    consideradas: consideradas.length,
    votou: consideradas.filter((v) => votou.has(v.id)).length,
    semRegistro: consideradas.filter((v) => !votou.has(v.id)),
  };
}
