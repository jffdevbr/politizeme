// Motor do assistente Poli (modo híbrido) – regras em docs/POLI.md.
// 1) guarda-corpos por regra  2) intenções respondidas com dados do banco  3) Claude opcional com contexto do banco.
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import { participacao, resumoCota } from "./consultas";
import { data, MESES, normalizar, reais } from "./formato";

export type Canal = "site" | "whatsapp";
export type Resposta = {
  texto: string;
  fonte?: { nome: string; url: string };
  link?: { href: string; rotulo: string };
  intencao: string;
  expressao?: "neutro" | "feliz" | "pensando" | "surpreso";
  modo: "regras" | "llm";
};

const F = {
  camara: { nome: "Câmara dos Deputados – Dados Abertos", url: "https://dadosabertos.camara.leg.br" },
  cota: { nome: "Câmara dos Deputados – Cota parlamentar", url: "https://www.camara.leg.br/transparencia/gastos-parlamentares" },
  ceaps: { nome: "Senado Federal – Cota parlamentar (CEAPS)", url: "https://www12.senado.leg.br/transparencia/sen/gastos-dos-senadores" },
  senado: { nome: "Senado Federal – Dados Abertos", url: "https://legis.senado.leg.br/dadosabertos" },
  cgu: { nome: "Portal da Transparência (CGU)", url: "https://portaldatransparencia.gov.br/emendas" },
  principios: { nome: "Princípios de neutralidade do PolitizeMe", url: "/sobre-os-dados" },
};

const GLOSSARIO: { termos: RegExp; texto: string; fonte: { nome: string; url: string } }[] = [
  {
    termos: /\bemendas?\b/,
    texto:
      "Emenda parlamentar é uma parte do orçamento federal que deputados e senadores indicam para uma cidade, uma área (como saúde) ou um projeto. No PolitizeMe você vê as emendas que chegaram à sua cidade.",
    fonte: F.cgu,
  },
  {
    termos: /\b(cota|ceaps?|verba de gabinete)\b/,
    texto:
      "A cota parlamentar (CEAP, na Câmara, e CEAPS, no Senado) é um valor mensal que cada parlamentar pode usar para despesas do mandato, como escritório, combustível, passagens e divulgação. Os gastos precisam de nota fiscal e são publicados.",
    fonte: F.cota,
  },
  {
    termos: /\btramit/,
    texto:
      "Tramitação é o caminho que um projeto percorre até virar lei: passa por comissões, é votado na Câmara e no Senado e vai para sanção do presidente da República.",
    fonte: F.camara,
  },
  {
    termos: /\bpec\b|emenda (a|à) constituicao/,
    texto:
      "PEC é uma Proposta de Emenda à Constituição. Ela muda a Constituição e precisa de 3/5 dos votos (308 deputados e 49 senadores), em dois turnos em cada casa.",
    fonte: F.camara,
  },
  {
    termos: /\bplp\b|lei complementar/,
    texto:
      "PLP é um Projeto de Lei Complementar. Ele regulamenta pontos que a Constituição pede e precisa de maioria absoluta: 257 dos 513 deputados.",
    fonte: F.camara,
  },
  {
    termos: /\bpl\b|projeto de lei/,
    texto:
      "PL é um Projeto de Lei. Ele cria ou muda leis comuns e, em geral, é aprovado pela maioria dos deputados presentes na votação.",
    fonte: F.camara,
  },
  {
    termos: /\bmp\b|medida provisoria/,
    texto:
      "Medida Provisória é uma norma do presidente da República que vale assim que é publicada, por até 120 dias. Para continuar valendo, precisa ser aprovada pela Câmara e pelo Senado.",
    fonte: F.camara,
  },
  {
    termos: /orientac/,
    texto:
      "Orientação é a indicação que cada partido, bloco ou o governo dá aos deputados sobre como votar. O deputado pode seguir ou não.",
    fonte: F.camara,
  },
  {
    termos: /abstenc/,
    texto: "Abstenção é quando o deputado participa da votação, mas não vota nem Sim nem Não.",
    fonte: F.camara,
  },
  {
    termos: /obstruc/,
    texto:
      "Obstrução é quando o deputado registra que não quer que a votação aconteça naquele momento. É uma estratégia para atrasar ou impedir a decisão.",
    fonte: F.camara,
  },
  {
    termos: /artigo 17/,
    texto: "\"Artigo 17\" indica o presidente da Câmara, que pelo regimento não vota nas votações comuns.",
    fonte: F.camara,
  },
  {
    termos: /auxilio.moradia/,
    texto:
      "Auxílio-moradia é um valor para o parlamentar que não usa imóvel funcional em Brasília. Parte dele pode ser complementada com a cota parlamentar, e por isso aparece nos gastos da cota.",
    fonte: F.cota,
  },
  {
    termos: /diferenca.*(deputad|senador)|(deputad|senador).*diferenca|o que faz (um|o) (deputad|senador)/,
    texto:
      "Deputados federais representam a população e fazem e votam as leis na Câmara. Senadores representam os estados e revisam as leis no Senado. São Paulo tem 70 deputados federais e 3 senadores.",
    fonte: F.camara,
  },
];

const PALAVRAS_TEMA =
  /deputad|senador|vot|cota|gast|emenda|lei\b|projeto|congresso|camara|senado|partido|mandato|politic|pec|plp|\bpl\b|\bmp\b|tramit|represent|eleit|despesa|politizeme|poli\b/;

const STOP = new Set(
  "como votaram votou votacao votacoes deputados deputado deputada senador senadores sobre quem quais qual quanto quando onde porque para pelos pelas sobre minha cidade paulo fizeram foram estava estao sao eles elas dessa desse essa esse isso aquela aquele contra favor votar aprovou aprovaram rejeitou quantos ultimas ultima".split(
    " ",
  ),
);

export async function responder(pergunta: string, canal: Canal = "site"): Promise<Resposta> {
  const q = normalizar(pergunta).replace(/[?!.,;:]/g, " ").replace(/\s+/g, " ");

  // ---------- 1. Guarda-corpos (sempre por regra) ----------
  if (
    /(em quem|quem) (eu )?(devo|deveria|posso|vou|tenho que)? ?votar|recomend|indica(r|ção|cao)? (um |uma )?(candidat|deputad|senador|partido)|(melhor|pior)(es)? (deputad|senador|candidat|partido|politic)|qual partido|vale a pena votar|merece (meu )?voto|ranking/.test(
      q,
    )
  ) {
    return {
      texto:
        "Eu não indico candidatos nem partidos. Posso mostrar como cada representante votou, quanto gastou e o que enviou para a sua cidade, para você tirar suas próprias conclusões.",
      fonte: F.principios,
      intencao: "recusa_voto",
      expressao: "neutro",
      modo: "regras",
    };
  }
  if (/creche|\bubs\b|posto de saude|buraco|asfalto|iluminacao|coleta de lixo|zeladoria|prefeit|vereador|onibus|merenda/.test(q)) {
    return {
      texto:
        "Creche, UBS, ônibus e zeladoria são responsabilidade da prefeitura. Eu acompanho deputados federais e senadores. Posso mostrar as emendas federais que chegaram à sua cidade.",
      link: { href: "/minha-cidade", rotulo: "Ver minha cidade" },
      intencao: "prefeitura",
      modo: "regras",
    };
  }
  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa)\b/.test(q) && q.split(" ").length <= 4) {
    return {
      texto:
        "Olá. Pergunte sobre os deputados federais e senadores de São Paulo. Eu explico em linguagem simples e mostro de onde veio cada informação.",
      intencao: "saudacao",
      expressao: "feliz",
      modo: "regras",
    };
  }

  // ---------- 2. Intenções com dados do banco ----------
  const parlamentar = await acharParlamentar(q);

  if (/senador/.test(q) && /quem|quais|lista|nomes?/.test(q) && !parlamentar) {
    const s = await prisma.parlamentar.findMany({ where: { casa: "SENADO" }, orderBy: { nomeBusca: "asc" } });
    return {
      texto: `Os senadores de São Paulo em exercício são: ${lista(s.map((x) => `${negrito(x.nome, canal)} (${x.partido})`))}.`,
      fonte: F.senado,
      link: { href: "/representantes?casa=SENADO", rotulo: "Ver os senadores" },
      intencao: "senadores",
      modo: "regras",
    };
  }
  if (/quantos deputados|numero de deputados/.test(q)) {
    const n = await prisma.parlamentar.count({ where: { casa: "CAMARA" } });
    return {
      texto: `São Paulo tem ${n} deputados federais em exercício. É o estado com mais deputados, porque o número depende da população.`,
      fonte: F.camara,
      link: { href: "/representantes?casa=CAMARA", rotulo: "Ver a lista" },
      intencao: "quantos_deputados",
      modo: "regras",
    };
  }

  const votacao = await acharVotacao(q);

  if (parlamentar && /gast|cota|despesa|dinheiro|gastou|passage|combust|escritorio|divulga|aliment|hosped|aluguel|telefon/.test(q)) {
    const cota = await resumoCota(parlamentar.id);
    const fonte = parlamentar.casa === "CAMARA" ? F.cota : F.ceaps;
    if (!cota.primeiro || !cota.ultimo) {
      return { texto: `Ainda não tenho gastos registrados de ${parlamentar.nome}.`, fonte, intencao: "gasto", modo: "regras" };
    }
    const periodo = `${MESES[cota.primeiro.mes - 1]}/${cota.primeiro.ano} a ${MESES[cota.ultimo.mes - 1]}/${cota.ultimo.ano}`;
    const cat = cota.categorias.find((c) => q.includes(normalizar(c.nome).split(" ")[0].slice(0, 6)));
    const texto = cat
      ? `De ${periodo}, ${negrito(parlamentar.nome, canal)} usou ${reais(cat.valor)} da cota parlamentar com ${cat.nome.toLowerCase()}. O total no período foi ${reais(cota.total)}.`
      : `De ${periodo}, ${negrito(parlamentar.nome, canal)} usou ${reais(cota.total)} da cota parlamentar. A maior categoria foi ${cota.categorias[0].nome.toLowerCase()} (${reais(cota.categorias[0].valor)}).`;
    return {
      texto: `${texto} Quer ver cada nota fiscal?`,
      fonte,
      link: { href: `/representantes/${parlamentar.id}`, rotulo: `Ver gastos de ${parlamentar.nome}` },
      intencao: "gasto",
      modo: "regras",
    };
  }

  if (parlamentar && votacao) {
    const voto = await prisma.voto.findUnique({
      where: { votacaoId_parlamentarId: { votacaoId: votacao.id, parlamentarId: parlamentar.id } },
    });
    const texto = voto
      ? `Na votação da ${votacao.proposicao}, em ${data(votacao.data)}, ${negrito(parlamentar.nome, canal)} votou ${voto.voto}.`
      : `${negrito(parlamentar.nome, canal)} não tem voto registrado na votação da ${votacao.proposicao}, em ${data(votacao.data)}.`;
    return {
      texto: `${texto} Quer ver o voto de cada deputado de SP?`,
      fonte: F.camara,
      link: { href: `/votacoes/${votacao.id}`, rotulo: "Ver a votação" },
      intencao: "voto_parlamentar",
      modo: "regras",
    };
  }

  if (parlamentar && parlamentar.casa === "CAMARA" && /vot|particip|presen|falt/.test(q)) {
    const p = await participacao(parlamentar.id);
    const ultimo = p.votos[0];
    return {
      texto:
        `${negrito(parlamentar.nome, canal)} votou em ${p.votou} das ${p.consideradas} votações de mérito que acompanhamos.` +
        (ultimo ? ` A mais recente foi a ${ultimo.votacao.proposicao}, em ${data(ultimo.votacao.data)}: voto ${ultimo.voto}.` : ""),
      fonte: F.camara,
      link: { href: `/representantes/${parlamentar.id}`, rotulo: `Ver perfil de ${parlamentar.nome}` },
      intencao: "votos_parlamentar",
      modo: "regras",
    };
  }

  const sentido = /contra|nao/.test(q) ? "Não" : /a favor|sim/.test(q) ? "Sim" : null;
  if (votacao && sentido && /quem|quais|lista|nomes?/.test(q)) {
    const votos = await prisma.voto.findMany({
      where: { votacaoId: votacao.id, voto: sentido },
      include: { parlamentar: true },
      orderBy: { parlamentar: { nomeBusca: "asc" } },
    });
    const nomes = votos.map((v) => `${negrito(v.parlamentar.nome, canal)} (${v.partidoNaEpoca})`);
    const mostrar = nomes.length > 12 ? [...nomes.slice(0, 12), `mais ${nomes.length - 12}`] : nomes;
    const tema = `${votacao.proposicao}, que ${resumoEmenta(votacao.ementa)}`;
    return {
      texto: nomes.length
        ? `Na votação da ${tema}, em ${data(votacao.data)}, ${nomes.length} ${nomes.length === 1 ? "deputado de SP votou" : "deputados de SP votaram"} ${sentido}: ${lista(mostrar)}.`
        : `Na votação da ${tema}, em ${data(votacao.data)}, nenhum deputado de SP em exercício hoje votou ${sentido}.`,
      fonte: F.camara,
      link: { href: `/votacoes/${votacao.id}`, rotulo: "Ver o voto de todos" },
      intencao: "quem_votou",
      modo: "regras",
    };
  }

  if (votacao && /vot|aprov|rejeit|passou|decid/.test(q)) {
    const votos = await prisma.voto.groupBy({ by: ["voto"], where: { votacaoId: votacao.id }, _count: true });
    const sp = votos.map((v) => `${v.voto} ${v._count}`).join(", ");
    const placar = votacao.placar as Record<string, number>;
    return {
      texto: `A ${votacao.proposicao}, que ${resumoEmenta(votacao.ementa)}, foi ${votacao.aprovada ? "aprovada" : "rejeitada"} na Câmara em ${data(votacao.data)} (Sim ${placar["Sim"] ?? 0}, Não ${placar["Não"] ?? 0}). Os deputados de SP votaram assim: ${sp}. Quer ver o voto de cada um?`,
      fonte: F.camara,
      link: { href: `/votacoes/${votacao.id}`, rotulo: "Ver como votou cada deputado" },
      intencao: "votacao",
      modo: "regras",
    };
  }

  if (/ultimas votac|votacoes recentes|o que (foi|esta sendo) votad/.test(q)) {
    const vs = await prisma.votacao.findMany({ orderBy: { data: "desc" }, take: 3 });
    return {
      texto: `As votações mais recentes que acompanhamos são: ${lista(vs.map((v) => `${v.proposicao} (${data(v.data)})`))}.`,
      fonte: F.camara,
      link: { href: "/votacoes", rotulo: "Ver todas as votações" },
      intencao: "votacoes_recentes",
      modo: "regras",
    };
  }

  const termo = GLOSSARIO.find((g) => g.termos.test(q));
  if (termo && /o que|que e|significa|explica|como funciona|serve/.test(q)) {
    return { texto: termo.texto, fonte: termo.fonte, intencao: "glossario", modo: "regras" };
  }

  if (/politizeme|como (voce )?funciona|o que voce faz|quem e voce/.test(q)) {
    return {
      texto:
        "Eu sou o Poli, do PolitizeMe. Mostro como votaram, quanto gastaram e o que enviaram para a sua cidade os deputados federais e senadores de São Paulo, sempre com a fonte oficial e sem dizer em quem votar.",
      fonte: F.principios,
      intencao: "sobre",
      expressao: "feliz",
      modo: "regras",
    };
  }

  if (parlamentar) {
    return {
      texto: `${negrito(parlamentar.nome, canal)} é ${parlamentar.cargo.toLowerCase()} por São Paulo (${parlamentar.partido}). Posso mostrar como votou ou quanto gastou da cota parlamentar.`,
      fonte: parlamentar.casa === "CAMARA" ? F.camara : F.senado,
      link: { href: `/representantes/${parlamentar.id}`, rotulo: "Ver perfil" },
      intencao: "parlamentar",
      modo: "regras",
    };
  }

  if (!PALAVRAS_TEMA.test(q) && !termo) {
    return {
      texto:
        "Eu só falo sobre o mandato dos deputados federais e senadores de SP. Quer saber quem representa a sua cidade?",
      link: { href: "/minha-cidade", rotulo: "Ver minha cidade" },
      intencao: "fora_do_tema",
      modo: "regras",
    };
  }

  // ---------- 3. Claude (opcional) ----------
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await responderComClaude(pergunta, parlamentar, votacao, canal);
    } catch (e) {
      console.error("[poli] falha no modo LLM:", e instanceof Error ? e.message : e);
    }
  }
  if (termo) return { texto: termo.texto, fonte: termo.fonte, intencao: "glossario", modo: "regras" };
  return {
    texto:
      "Ainda não sei responder isso. Experimente perguntar quem são os senadores de SP, quanto um deputado gastou da cota ou como votaram em uma votação.",
    intencao: "nao_entendi",
    expressao: "pensando",
    modo: "regras",
  };
}

// ---------- utilidades ----------

// Primeira oração da ementa oficial, em minúscula, para caber numa frase ("altera a Constituição para...").
function resumoEmenta(ementa: string | null) {
  if (!ementa) return "consta no texto oficial";
  // Corta no fim da primeira frase (ponto seguido de maiúscula), sem quebrar abreviações como "Art. 7º".
  const curta = ementa.split(/;|\.\s+(?=[A-ZÀ-Ú])/)[0].replace(/\s+/g, " ").trim();
  const texto = curta.length > 160 ? `${curta.slice(0, 157)}...` : curta;
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

const negrito = (s: string, canal: Canal) => (canal === "whatsapp" ? `*${s}*` : s);
const lista = (itens: string[]) =>
  itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;

async function acharParlamentar(q: string) {
  const todos = await prisma.parlamentar.findMany();
  const completo = todos
    .filter((p) => q.includes(p.nomeBusca))
    .sort((a, b) => b.nomeBusca.length - a.nomeBusca.length)[0];
  if (completo) return completo;
  // Um sobrenome que identifica só uma pessoa (ex.: "Gabrilli").
  const tokens = q.split(" ").filter((t) => t.length >= 5 && !STOP.has(t));
  for (const t of tokens) {
    const achados = todos.filter((p) => p.nomeBusca.split(" ").includes(t));
    if (achados.length === 1) return achados[0];
  }
  return null;
}

const APELIDOS: [RegExp, string][] = [
  [/6x1|6 x 1|36 horas|jornada|escala de trabalho|carga horaria/, "jornada de trabalho"],
  [/suas|assistencia social/, "assistencia social"],
  [/terra(s)? indigena/, "indigena"],
];

async function acharVotacao(q: string) {
  const votacoes = await prisma.votacao.findMany({ orderBy: { data: "desc" } });
  const numero = q.match(/\b(pec|pl|plp|mp|mpv|pdl)\s*(\d+)/);
  if (numero) {
    const v = votacoes.find((v) => normalizar(v.proposicao ?? "").startsWith(`${numero[1]} ${numero[2]}/`));
    if (v) return v;
  }
  // Apelidos populares de temas: têm prioridade sobre o casamento por palavras.
  for (const [apelido, termo] of APELIDOS) {
    if (apelido.test(q)) {
      const v = votacoes.find((v) => normalizar(v.ementa ?? "").includes(termo));
      if (v) return v;
    }
  }
  const tokens = q.split(" ").filter((t) => t.length >= 5 && !STOP.has(t));
  let melhor: (typeof votacoes)[number] | null = null;
  let pontos = 0;
  for (const v of votacoes) {
    const ementa = normalizar(v.ementa ?? "");
    const p = tokens.filter((t) => ementa.includes(t)).length;
    if (p > pontos) {
      melhor = v;
      pontos = p;
    }
  }
  return pontos >= 1 ? melhor : null;
}

async function contexto(
  parlamentar: Awaited<ReturnType<typeof acharParlamentar>>,
  votacao: Awaited<ReturnType<typeof acharVotacao>>,
) {
  const [senadores, nDeputados, votacoes] = await Promise.all([
    prisma.parlamentar.findMany({ where: { casa: "SENADO" } }),
    prisma.parlamentar.count({ where: { casa: "CAMARA" } }),
    prisma.votacao.findMany({ orderBy: { data: "desc" }, take: 8 }),
  ]);
  const partes = [
    `[Fonte: ${F.senado.nome}] Senadores de SP: ${senadores.map((s) => `${s.nome} (${s.partido})`).join("; ")}.`,
    `[Fonte: ${F.camara.nome}] SP tem ${nDeputados} deputados federais em exercício.`,
    `[Fonte: ${F.camara.nome}] Votações recentes do Plenário: ` +
      votacoes.map((v) => `${v.proposicao} em ${data(v.data)} (${v.aprovada ? "aprovada" : "rejeitada"}): ${(v.ementa ?? "").slice(0, 180)}`).join(" | "),
    ...GLOSSARIO.map((g) => `[Fonte: ${g.fonte.nome}] ${g.texto}`),
  ];
  if (parlamentar) {
    const cota = await resumoCota(parlamentar.id);
    partes.push(
      `[Fonte: ${parlamentar.casa === "CAMARA" ? F.cota.nome : F.ceaps.nome}] ${parlamentar.nome} (${parlamentar.cargo}, ${parlamentar.partido}) usou ${reais(cota.total)} da cota no período coletado; por categoria: ` +
        cota.categorias.map((c) => `${c.nome} ${reais(c.valor)}`).join(", "),
    );
    if (parlamentar.casa === "CAMARA") {
      const p = await participacao(parlamentar.id);
      partes.push(
        `[Fonte: ${F.camara.nome}] Votos de ${parlamentar.nome}: ` +
          p.votos.map((v) => `${v.votacao.proposicao} (${data(v.votacao.data)}): ${v.voto}`).join("; "),
      );
    }
  }
  if (votacao) {
    const votos = await prisma.voto.groupBy({ by: ["voto"], where: { votacaoId: votacao.id }, _count: true });
    partes.push(
      `[Fonte: ${F.camara.nome}] Na ${votacao.proposicao} (${data(votacao.data)}), ementa: ${votacao.ementa}. Votos dos deputados de SP: ` +
        votos.map((v) => `${v.voto} ${v._count}`).join(", "),
    );
  }
  return partes.join("\n");
}

const SISTEMA = `Você é o Poli, assistente do PolitizeMe, que ajuda eleitores de São Paulo a acompanhar o mandato dos deputados federais e senadores do estado.

Regras:
- Responda em português do Brasil, em até 4 frases curtas, em linguagem simples. Explique siglas na primeira vez.
- Use somente as informações dentro de <contexto>. Se a resposta não estiver lá, diga "Ainda não tenho esse dado." e sugira consultar a fonte oficial.
- Nunca recomende voto, candidato ou partido. Nunca julgue parlamentares, não use adjetivos sobre eles e não ordene parlamentares por desempenho.
- Sem exclamação e sem tom de urgência.
- A última linha deve ser exatamente "Fonte: <nome da fonte>" usando o nome entre colchetes do trecho do contexto que você usou.`;

async function responderComClaude(
  pergunta: string,
  parlamentar: Awaited<ReturnType<typeof acharParlamentar>>,
  votacao: Awaited<ReturnType<typeof acharVotacao>>,
  canal: Canal,
): Promise<Resposta> {
  const client = new Anthropic();
  const ctx = await contexto(parlamentar, votacao);
  const resposta = await client.beta.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SISTEMA + (canal === "whatsapp" ? "\n- Formato WhatsApp: negrito com *asteriscos*, sem markdown." : ""),
    messages: [{ role: "user", content: `<contexto>\n${ctx}\n</contexto>\n\nPergunta: ${pergunta}` }],
  });
  if (resposta.stop_reason === "refusal") throw new Error("recusa do modelo");
  const texto = resposta.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  const m = texto.match(/\n?Fonte:\s*(.+)\s*$/);
  const nomeFonte = m?.[1]?.trim();
  const fonte = Object.values(F).find((f) => f.nome === nomeFonte) ?? (nomeFonte ? { nome: nomeFonte, url: "/sobre-os-dados" } : undefined);
  return {
    texto: m ? texto.slice(0, m.index).trim() : texto,
    fonte,
    intencao: "llm",
    modo: "llm",
  };
}
