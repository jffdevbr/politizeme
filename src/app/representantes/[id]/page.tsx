import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { participacao, resumoCota } from "@/lib/consultas";
import { data, MESES, reais, reaisCentavos } from "@/lib/formato";
import { usuarioAtual } from "@/lib/sessao";
import { DataBadge } from "@/components/DataBadge";
import { BarrasHorizontais, LinhaMensal } from "@/components/Graficos";
import { BotaoSeguir } from "@/components/BotaoSeguir";
import { ChipVoto } from "@/components/Voto";

export default async function Perfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.parlamentar.findUnique({ where: { id } });
  if (!p) notFound();

  const camara = p.casa === "CAMARA";
  const prefixo = camara ? "cota_camara" : "cota_senado";
  const [cota, part, fornecedores, despesas, usuario] = await Promise.all([
    resumoCota(p.id),
    camara ? participacao(p.id) : null,
    prisma.fornecedor.findMany({ where: { parlamentarId: p.id }, orderBy: { total: "desc" } }),
    prisma.despesa.findMany({ where: { parlamentarId: p.id }, orderBy: [{ data: "desc" }], take: 10 }),
    usuarioAtual(),
  ]);
  const seguindo = usuario
    ? !!(await prisma.seguindo.findUnique({ where: { usuarioId_parlamentarId: { usuarioId: usuario.id, parlamentarId: p.id } } }))
    : false;
  const periodo =
    cota.primeiro && cota.ultimo
      ? `${MESES[cota.primeiro.mes - 1]}/${cota.primeiro.ano} a ${MESES[cota.ultimo.mes - 1]}/${cota.ultimo.ano}`
      : "";
  const mediaMensal = cota.meses.length ? cota.total / cota.meses.length : 0;

  return (
    <div className="space-y-8">
      <p className="text-sm">
        <Link href="/representantes">← Representantes</Link>
      </p>

      <header className="cartao flex flex-col gap-4 sm:flex-row sm:items-center">
        {p.foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.foto} alt={`Foto de ${p.nome}`} width={112} height={112} className="h-28 w-28 rounded-full object-cover bg-lago-suave" />
        )}
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{p.nome}</h1>
          <p className="text-tinta-suave">
            {p.cargo} por São Paulo · {p.partido}
          </p>
          <p className="text-sm">
            <a href={p.paginaOficial} target="_blank" rel="noreferrer">
              Página oficial
            </a>
            {p.email && (
              <>
                {" · "}
                <a href={`mailto:${p.email}`}>{p.email}</a>
              </>
            )}
          </p>
        </div>
        <BotaoSeguir parlamentarId={p.id} seguindo={seguindo} nome={p.nome} />
      </header>
      <DataBadge conjuntos={[camara ? "deputados" : "senadores"]} />

      {/* ---------- Votações ---------- */}
      <section aria-labelledby="votos" className="cartao space-y-4">
        <h2 id="votos" className="text-2xl font-semibold">
          Como votou
        </h2>
        {part ? (
          <>
            <div className="rounded-lg bg-lago-suave p-4">
              <p className="text-3xl font-bold">
                {part.votou} de {part.consideradas}
              </p>
              <p className="text-sm text-tinta-suave">
                votações de mérito selecionadas em que {p.nome} registrou voto. Contamos só as votações desde o primeiro
                mês em que o deputado aparece nos dados da cota (aproximação do início do exercício). Não registrar voto
                pode ter vários motivos, como licença ou missão oficial.
              </p>
            </div>
            <ul className="divide-y divide-linha">
              {part.votos.map((v) => (
                <li key={v.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/votacoes/${v.votacaoId}`} className="font-semibold">
                      {v.votacao.proposicao}
                    </Link>
                    <p className="line-clamp-1 text-sm text-tinta-suave">{v.votacao.ementa}</p>
                    <p className="text-xs text-tinta-suave">{data(v.votacao.data)}</p>
                  </div>
                  <ChipVoto voto={v.voto} />
                </li>
              ))}
            </ul>
            <DataBadge conjuntos={["votacoes", "votos"]} />
          </>
        ) : (
          <p className="text-tinta-suave">
            As votações do Senado ainda não foram coletadas no MVP. Veja os votos na{" "}
            <a href={p.paginaOficial} target="_blank" rel="noreferrer">
              página oficial do Senado
            </a>
            .
          </p>
        )}
      </section>

      {/* ---------- Cota parlamentar ---------- */}
      <section aria-labelledby="cota" className="cartao space-y-6">
        <div className="space-y-1">
          <h2 id="cota" className="text-2xl font-semibold">
            Quanto gastou da cota parlamentar
          </h2>
          <p className="text-tinta-suave">
            A cota ({camara ? "CEAP" : "CEAPS"}) é um valor mensal que cada parlamentar pode usar para despesas do
            mandato, como escritório, combustível e passagens. Os gastos precisam de nota fiscal e são publicados.
          </p>
        </div>

        {cota.meses.length === 0 ? (
          <p className="text-tinta-suave">Ainda não temos despesas registradas para este parlamentar no período.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-lago-suave p-4">
                <p className="text-sm text-tinta-suave">Total no período</p>
                <p className="text-2xl font-bold">{reais(cota.total)}</p>
                <p className="text-xs text-tinta-suave">{periodo}</p>
              </div>
              <div className="rounded-lg bg-lago-suave p-4">
                <p className="text-sm text-tinta-suave">Média por mês</p>
                <p className="text-2xl font-bold">{reais(mediaMensal)}</p>
                <p className="text-xs text-tinta-suave">{cota.meses.length} meses com registro</p>
              </div>
              <div className="rounded-lg bg-lago-suave p-4">
                <p className="text-sm text-tinta-suave">Maior categoria</p>
                <p className="text-2xl font-bold">{cota.categorias[0]?.nome}</p>
                <p className="text-xs text-tinta-suave">{reais(cota.categorias[0]?.valor ?? 0)}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Gastos por categoria</h3>
              <BarrasHorizontais dados={cota.categorias} titulo={`Gastos da cota por categoria – ${p.nome}`} />
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Gastos mês a mês</h3>
              <LinhaMensal dados={cota.meses} titulo={`Gastos da cota por mês – ${p.nome}`} />
              <p className="text-xs text-tinta-suave">
                Valores negativos ou quedas bruscas podem ser estornos e cancelamentos de passagens, que entram na soma.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Principais fornecedores</h3>
                <ul className="divide-y divide-linha text-sm">
                  {fornecedores.map((f) => (
                    <li key={f.id} className="flex justify-between gap-2 py-2">
                      <span>
                        {f.fornecedor}
                        <span className="block text-xs text-tinta-suave">
                          {f.cnpjCpf} · {f.qtd} {f.qtd === 1 ? "documento" : "documentos"}
                        </span>
                      </span>
                      <span className="tabular-nums">{reais(f.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Despesas mais recentes</h3>
                <ul className="divide-y divide-linha text-sm">
                  {despesas.map((d) => (
                    <li key={d.id} className="flex justify-between gap-2 py-2">
                      <span>
                        {d.categoria} · {d.fornecedor}
                        <span className="block text-xs text-tinta-suave">
                          {d.data ? data(d.data) : `${d.mes}/${d.ano}`}
                          {d.urlDocumento && (
                            <>
                              {" · "}
                              <a href={d.urlDocumento} target="_blank" rel="noreferrer">
                                ver nota
                              </a>
                            </>
                          )}
                        </span>
                      </span>
                      <span className="tabular-nums">{reaisCentavos(d.valor)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
        <DataBadge conjuntos={[`${prefixo}_mensal`, `${prefixo}_recentes`]} />
      </section>

      {/* ---------- Campanha (simulado) ---------- */}
      <section aria-labelledby="campanha" className="cartao space-y-2 border-dashed">
        <h2 id="campanha" className="text-2xl font-semibold">
          Campanha: quem financiou e quanto gastou
        </h2>
        <p className="text-tinta-suave">
          Esta parte vai mostrar a prestação de contas da campanha registrada no TSE. Ainda não está conectada aos dados
          reais. Veja como vai funcionar com um{" "}
          <Link href="/sobre-os-dados#campanha">exemplo genérico</Link>.
        </p>
        <DataBadge conjuntos={["campanha_simulada"]} />
      </section>
    </div>
  );
}
