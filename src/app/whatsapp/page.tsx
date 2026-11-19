import { prisma } from "@/lib/db";
import { participacao, resumoCota } from "@/lib/consultas";
import { data, MESES, reais } from "@/lib/formato";
import { usuarioAtual } from "@/lib/sessao";
import { ConversaMensageiro } from "@/components/ConversaMensageiro";

// Simulação do canal WhatsApp: nenhuma mensagem é enviada. Os textos usam dados reais do banco,
// exceto o alerta de emenda, que é simulado (autor fictício).
export default async function WhatsApp({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const usuario = await usuarioAtual();
  const seguido = usuario ? await prisma.seguindo.findFirst({ where: { usuarioId: usuario.id }, orderBy: { desde: "asc" } }) : null;
  const opcoes = await prisma.parlamentar.findMany({ where: { casa: "CAMARA" }, orderBy: { nomeBusca: "asc" } });
  const id = p ?? seguido?.parlamentarId ?? opcoes[0]?.id;
  const parl = await prisma.parlamentar.findUnique({ where: { id } });
  const pec = await prisma.votacao.findFirst({ where: { proposicao: { startsWith: "PEC 221" } } });

  const bolhas: { de: "pm" | "eu"; texto: string; hora: string; selo?: "real" | "simulado" }[] = [];
  if (parl) {
    const cota = await resumoCota(parl.id);
    const ult = cota.ultimo;
    const part = parl.casa === "CAMARA" ? await participacao(parl.id) : null;
    bolhas.push({
      de: "pm",
      hora: "08:00",
      selo: "real",
      texto:
        `📋 *Resumo da semana*\nQuem você segue:\n` +
        (part ? `• *${parl.nome}* votou em ${part.votou} de ${part.consideradas} votações acompanhadas.\n` : "") +
        (ult ? `• Usou ${reais(ult.valor)} da cota parlamentar em ${MESES[ult.mes - 1]}/${ult.ano}.\n` : "") +
        `\nVer tudo: politizeme/representantes/${parl.id}`,
    });
    if (pec && parl.casa === "CAMARA") {
      const voto = await prisma.voto.findUnique({ where: { votacaoId_parlamentarId: { votacaoId: pec.id, parlamentarId: parl.id } } });
      bolhas.push({
        de: "pm",
        hora: "12:10",
        selo: "real",
        texto:
          `*Votação importante*\n${pec.proposicao} (${data(pec.data)}): jornada de trabalho de 36 horas semanais.\n` +
          (voto ? `*${parl.nome}* votou ${voto.voto}.` : `*${parl.nome}* não tem voto registrado.`) +
          `\nFonte: Câmara dos Deputados`,
      });
    }
  }
  bolhas.push({
    de: "pm",
    hora: "12:14",
    selo: "simulado",
    texto: "*Nova emenda para São Paulo*\nDeputada Exemplo A indicou R$ 500 mil para saúde.\nFonte: Portal da Transparência",
  });
  bolhas.push({ de: "eu", hora: "12:20", texto: "o que é tramitação?" });
  bolhas.push({
    de: "pm",
    hora: "12:20",
    selo: "real",
    texto:
      "É o caminho que um projeto percorre até virar lei: passa por comissões, é votado na Câmara e no Senado e vai para sanção.\nQuer receber um aviso quando o projeto andar?",
  });

  return (
    <div className="space-y-6">
      <p role="note" className="rounded-md bg-argila-suave px-4 py-3 text-sm text-argila">
        ◇ <strong>Simulação:</strong> nenhuma mensagem é enviada. Ilustração genérica de um aplicativo de mensagens para
        mostrar como o PolitizeMe vai funcionar no WhatsApp. Cada mensagem indica se usa dado real ou simulado.
      </p>
      <div className="grid gap-8 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">O PolitizeMe no WhatsApp</h1>
          <p className="text-tinta-suave">
            Para quem tem pouco pacote de dados: mensagens curtas, sem imagens pesadas, com a fonte no fim. Resumo uma
            vez por semana e alertas só quando algo importante acontece.
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Resumo semanal:</strong> votos e gastos de quem você segue.
            </li>
            <li>
              <strong>Alertas:</strong> votação importante, nova emenda para a sua cidade ou votos não registrados.
            </li>
            <li>
              <strong>Respostas:</strong> pergunte qualquer coisa ao Poli no campo da conversa. É o mesmo assistente do
              site, com formatação de mensageiro.
            </li>
          </ul>
          <form className="space-y-1" action="/whatsapp">
            <label htmlFor="p" className="block text-sm font-semibold">
              Ver o resumo de outro deputado
            </label>
            <div className="flex gap-2">
              <select id="p" name="p" defaultValue={id} className="campo">
                {opcoes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
              <button className="botao botao-secundario">Ver</button>
            </div>
          </form>
        </div>
        <ConversaMensageiro key={id} iniciais={bolhas} />
      </div>
    </div>
  );
}
