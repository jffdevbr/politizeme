import { prisma } from "@/lib/db";
import { BarrasHorizontais } from "@/components/Graficos";

const MINIMO = 5; // grupos com menos de 5 eventos não aparecem (evita identificar pessoas)

const ROTULO_INTENCAO: Record<string, string> = {
  recusa_voto: "Pediu indicação de voto (recusado)",
  prefeitura: "Assunto da prefeitura",
  senadores: "Quem são os senadores",
  quantos_deputados: "Quantos deputados",
  gasto: "Gastos da cota",
  voto_parlamentar: "Voto de um parlamentar",
  votos_parlamentar: "Participação em votações",
  votacao: "Resultado de votação",
  votacoes_recentes: "Votações recentes",
  quem_votou: "Quem votou contra ou a favor",
  glossario: "O que significa (glossário)",
  sobre: "Sobre o PolitizeMe",
  parlamentar: "Sobre um parlamentar",
  fora_do_tema: "Fora do tema",
  saudacao: "Saudação",
  nao_entendi: "Não reconhecida",
  llm: "Respondida por IA",
};

// Painel da equipe PolitizeMe: decide o que melhorar e onde o serviço ainda não chega.
export default async function PainelUso() {
  const [usuarios, canais, seguindo, porTipo, intencoes, municipiosBusca, municipios] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.groupBy({ by: ["canal"], _count: true }),
    prisma.seguindo.count(),
    prisma.eventoUso.groupBy({ by: ["tipo"], _count: true }),
    prisma.eventoUso.groupBy({ by: ["detalhe"], where: { tipo: "pergunta_poli" }, _count: true }),
    prisma.eventoUso.groupBy({ by: ["municipioIbge"], where: { municipioIbge: { not: null } }, _count: true }),
    prisma.municipio.findMany(),
  ]);
  const nomeMunicipio = new Map(municipios.map((m) => [m.codigoIbge, m.nome]));
  const conta = (t: string) => porTipo.find((p) => p.tipo === t)?._count ?? 0;
  const perguntas = conta("pergunta_poli");
  const comFonte = intencoes
    .filter((i) => !["fora_do_tema", "saudacao", "nao_entendi", "prefeitura"].includes(i.detalhe ?? ""))
    .reduce((s, i) => s + i._count, 0);
  const whatsapp = canais.find((c) => c.canal === "whatsapp")?._count ?? 0;

  const cidades = municipiosBusca
    .filter((m) => m._count >= MINIMO)
    .map((m) => ({ nome: nomeMunicipio.get(m.municipioIbge!) ?? m.municipioIbge!, valor: m._count }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
  const ocultas = municipiosBusca.filter((m) => m._count < MINIMO).length;
  // Tipos de pergunta são anônimos e não identificam ninguém: mostramos todos. O limite mínimo vale para cidades.
  const intencoesVisiveis = intencoes
    .map((i) => ({ nome: ROTULO_INTENCAO[i.detalhe ?? ""] ?? i.detalhe ?? "?", valor: i._count }))
    .sort((a, b) => b.valor - a.valor);

  const kpis = [
    { rotulo: "Contas criadas", valor: usuarios.toLocaleString("pt-BR") },
    { rotulo: "Representantes seguidos (total)", valor: seguindo.toLocaleString("pt-BR") },
    { rotulo: "Buscas por cidade", valor: conta("busca_municipio").toLocaleString("pt-BR") },
    { rotulo: "Perguntas ao Poli", valor: perguntas.toLocaleString("pt-BR") },
    {
      rotulo: "Respostas do Poli com fonte",
      valor: perguntas ? `${Math.round((comFonte / perguntas) * 100)}%` : "–",
    },
    { rotulo: "Contas que preferem WhatsApp", valor: usuarios ? `${Math.round((whatsapp / usuarios) * 100)}%` : "–" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Painel de uso</h1>
        <p className="text-tinta-suave">
          Para a equipe do PolitizeMe decidir o que melhorar e onde o serviço ainda não chega. Os números vêm do uso real
          desta instalação do protótipo, por isso começam baixos.
        </p>
        <p className="rounded-md bg-lago-suave px-3 py-2 text-sm">
          Privacidade: os eventos são anônimos (sem conta, sem IP, sem o texto das perguntas). Cidades com menos de{" "}
          {MINIMO} buscas não aparecem. Quem segue quem nunca é exibido.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.rotulo} className="cartao">
            <p className="text-sm text-tinta-suave">{k.rotulo}</p>
            <p className="text-3xl font-bold">{k.valor}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="cartao">
          <h2 className="mb-2 text-xl font-semibold">Cidades que mais buscam</h2>
          {cidades.length ? (
            <BarrasHorizontais dados={cidades} titulo="Buscas por município" formato="numero" />
          ) : (
            <p className="text-sm text-tinta-suave">Ainda não há cidades com {MINIMO} buscas ou mais.</p>
          )}
          {ocultas > 0 && <p className="mt-2 text-xs text-tinta-suave">{ocultas} cidades ocultas por terem poucas buscas.</p>}
        </div>
        <div className="cartao">
          <h2 className="mb-2 text-xl font-semibold">O que perguntam ao Poli</h2>
          {intencoesVisiveis.length ? (
            <BarrasHorizontais dados={intencoesVisiveis} titulo="Perguntas ao Poli por tipo" formato="numero" larguraRotulo={230} />
          ) : (
            <p className="text-sm text-tinta-suave">Ainda não há perguntas registradas.</p>
          )}
          <p className="mt-2 text-xs text-tinta-suave">
            Mostra só o tipo de pergunta reconhecido, nunca o texto. &quot;Pediu indicação de voto&quot; alto indica que a
            recusa precisa ser bem explicada; &quot;Não reconhecida&quot; alto indica perguntas que o Poli precisa aprender.
          </p>
        </div>
      </section>
    </div>
  );
}
