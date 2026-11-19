// Carrega o snapshot tratado (data/snapshot/*.json) no banco.
// Por padrão só carrega se o banco estiver vazio. Use `--force` para recarregar os dados públicos
// (contas de usuário e quem cada um segue são preservadas sempre que o parlamentar continuar existindo).
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SNAP = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "snapshot");
const force = process.argv.includes("--force");

const TITULOS = {
  deputados: "Deputados federais de SP",
  senadores: "Senadores de SP",
  municipios: "Municípios de SP",
  cota_camara_mensal: "Cota parlamentar dos deputados – por mês e categoria",
  cota_camara_recentes: "Cota parlamentar dos deputados – despesas recentes",
  cota_camara_fornecedores: "Cota parlamentar dos deputados – principais fornecedores",
  cota_senado_mensal: "Cota parlamentar dos senadores – por mês e categoria",
  cota_senado_recentes: "Cota parlamentar dos senadores – despesas recentes",
  cota_senado_fornecedores: "Cota parlamentar dos senadores – principais fornecedores",
  votacoes: "Votações do Plenário da Câmara",
  votos: "Votos dos deputados de SP",
  orientacoes: "Orientação dos partidos nas votações",
  emendas_simuladas: "Emendas por município",
  campanha_simulada: "Financiamento de campanha",
};

const normalizar = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function ler(nome) {
  const caminho = join(SNAP, `${nome}.json`);
  if (!existsSync(caminho)) {
    console.warn(`  (sem ${nome}.json – pulando)`);
    return { meta: null, dados: [] };
  }
  return JSON.parse(readFileSync(caminho, "utf-8"));
}

async function emLotes(model, linhas, tamanho = 2000) {
  for (let i = 0; i < linhas.length; i += tamanho) {
    await model.createMany({ data: linhas.slice(i, i + tamanho), skipDuplicates: true });
  }
}

async function main() {
  const jaTem = await prisma.conjunto.count();
  if (jaTem > 0 && !force) {
    console.log("Banco já populado – seed ignorado (use --force para recarregar).");
    return;
  }
  console.log("Carregando snapshot no banco...");

  const arquivos = Object.fromEntries(Object.keys(TITULOS).map((n) => [n, ler(n)]));

  // Limpa dados públicos (Seguindo é apagado em cascata só se o parlamentar sumir).
  await prisma.$transaction([
    prisma.voto.deleteMany(),
    prisma.orientacao.deleteMany(),
    prisma.votacao.deleteMany(),
    prisma.despesaMensal.deleteMany(),
    prisma.despesa.deleteMany(),
    prisma.fornecedor.deleteMany(),
    prisma.emendaSimulada.deleteMany(),
    prisma.campanhaSimulada.deleteMany(),
    prisma.municipio.deleteMany(),
    prisma.conjunto.deleteMany(),
  ]);

  // Conjuntos (metadados de origem)
  await prisma.conjunto.createMany({
    data: Object.entries(arquivos)
      .filter(([, a]) => a.meta)
      .map(([id, a]) => ({
        id,
        titulo: TITULOS[id],
        origem: a.meta.origem,
        fonte: a.meta.fonte,
        fonteUrl: a.meta.fonteUrl,
        coletadoEm: new Date(a.meta.coletadoEm),
        observacao: a.meta.observacao || "",
        registros: a.meta.registros,
      })),
  });

  // Parlamentares (upsert para preservar quem os usuários seguem)
  const parlamentares = [...arquivos.deputados.dados, ...arquivos.senadores.dados];
  for (const p of parlamentares) {
    const dados = { ...p, nomeBusca: normalizar(p.nome) };
    await prisma.parlamentar.upsert({ where: { id: p.id }, create: dados, update: dados });
  }
  await prisma.parlamentar.deleteMany({ where: { id: { notIn: parlamentares.map((p) => p.id) } } });

  await emLotes(
    prisma.municipio,
    arquivos.municipios.dados.map((m) => ({ ...m, nomeBusca: normalizar(m.nome) })),
  );

  const mensal = [...arquivos.cota_camara_mensal.dados, ...arquivos.cota_senado_mensal.dados];
  await emLotes(prisma.despesaMensal, mensal);

  const recentes = [...arquivos.cota_camara_recentes.dados, ...arquivos.cota_senado_recentes.dados];
  await emLotes(
    prisma.despesa,
    recentes.map((d) => ({ ...d, data: d.data ? new Date(d.data) : null, urlDocumento: d.urlDocumento || null })),
  );

  const fornecedores = [...arquivos.cota_camara_fornecedores.dados, ...arquivos.cota_senado_fornecedores.dados];
  await emLotes(prisma.fornecedor, fornecedores);

  await emLotes(
    prisma.votacao,
    arquivos.votacoes.dados.map((v) => ({ ...v, data: new Date(v.data) })),
  );
  await emLotes(prisma.voto, arquivos.votos.dados);
  await emLotes(prisma.orientacao, arquivos.orientacoes.dados);

  await emLotes(prisma.emendaSimulada, arquivos.emendas_simuladas.dados);
  await emLotes(prisma.campanhaSimulada, arquivos.campanha_simulada.dados);

  console.log(
    `Seed concluído: ${parlamentares.length} parlamentares, ${mensal.length} linhas de cota mensal, ` +
      `${arquivos.votacoes.dados.length} votações, ${arquivos.votos.dados.length} votos.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
