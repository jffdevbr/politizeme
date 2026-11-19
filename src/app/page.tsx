import Link from "next/link";
import { prisma } from "@/lib/db";
import { BuscaCep } from "@/components/BuscaCep";
import { DataBadge } from "@/components/DataBadge";
import { Poli } from "@/components/Poli";
import { data } from "@/lib/formato";

export default async function Inicio() {
  const [municipios, deputados, senadores, ultima] = await Promise.all([
    prisma.municipio.findMany({ orderBy: { nome: "asc" }, select: { codigoIbge: true, nome: true } }),
    prisma.parlamentar.count({ where: { casa: "CAMARA" } }),
    prisma.parlamentar.count({ where: { casa: "SENADO" } }),
    prisma.votacao.findFirst({ orderBy: { data: "desc" } }),
  ]);

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            Saiba o que fazem os deputados e senadores que representam você
          </h1>
          <p className="max-w-2xl text-lg text-tinta-suave">
            Como votaram, quanto gastaram e o que chegou à sua cidade. Em linguagem simples, sempre com a fonte
            oficial. Sem precisar criar conta.
          </p>
          <BuscaCep municipios={municipios} />
        </div>
        <div className="hidden md:block">
          <Poli size={180} expressao="feliz" />
        </div>
      </section>

      <section aria-labelledby="quem" className="space-y-4">
        <h2 id="quem" className="text-2xl font-semibold">
          Quem representa o estado de São Paulo
        </h2>
        <p className="text-tinta-suave">
          Deputados federais e senadores são eleitos pelo estado inteiro. Por isso todos eles representam a sua cidade.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/representantes?casa=CAMARA" className="cartao block no-underline hover:border-lago">
            <p className="text-4xl font-bold text-tinta">{deputados}</p>
            <p className="font-semibold text-tinta">deputados federais</p>
            <p className="text-sm text-tinta-suave">Fazem e votam as leis na Câmara dos Deputados.</p>
          </Link>
          <Link href="/representantes?casa=SENADO" className="cartao block no-underline hover:border-lago">
            <p className="text-4xl font-bold text-tinta">{senadores}</p>
            <p className="font-semibold text-tinta">senadores</p>
            <p className="text-sm text-tinta-suave">Revisam as leis e representam o estado no Senado Federal.</p>
          </Link>
        </div>
        <DataBadge conjuntos={["deputados", "senadores"]} />
      </section>

      {ultima && (
        <section aria-labelledby="ultima" className="cartao space-y-2">
          <p className="text-sm font-semibold text-lago-profundo">Votação mais recente coletada · {data(ultima.data)}</p>
          <h2 id="ultima" className="text-xl font-semibold">
            {ultima.proposicao}
          </h2>
          <p className="line-clamp-3 text-tinta-suave">{ultima.ementa}</p>
          <Link href={`/votacoes/${ultima.id}`} className="botao mt-2">
            Ver como votou cada deputado de SP
          </Link>
          <DataBadge conjuntos={["votacoes"]} />
        </section>
      )}

      <section className="cartao flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Poli size={72} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Ficou com dúvida? Pergunte ao Poli</h2>
          <p className="text-tinta-suave">
            Ele explica termos como emenda e cota parlamentar e mostra de onde veio cada informação. Também pelo
            WhatsApp.
          </p>
        </div>
        <Link href="/assistente" className="botao botao-secundario">
          Abrir o assistente
        </Link>
      </section>
    </div>
  );
}
