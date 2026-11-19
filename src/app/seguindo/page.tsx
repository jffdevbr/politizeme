import Link from "next/link";
import { prisma } from "@/lib/db";
import { alertasDe } from "@/lib/alertas";
import { data } from "@/lib/formato";
import { usuarioAtual } from "@/lib/sessao";
import { DataBadge } from "@/components/DataBadge";
import { Poli } from "@/components/Poli";

const ICONE = { votacao: "●", cota: "R$", sem_voto: "◌" };

export default async function Seguindo() {
  const usuario = await usuarioAtual();
  if (!usuario) {
    return (
      <div className="cartao mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <Poli size={110} expressao="feliz" />
        <h1 className="text-2xl font-bold">Acompanhe quem representa você</h1>
        <p className="text-tinta-suave">
          Siga deputados e senadores para receber um resumo semanal e alertas de votações e gastos, no site ou pelo
          WhatsApp. Consultar continua livre, sem conta.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/cadastro" className="botao">
            Criar conta
          </Link>
          <Link href="/entrar" className="botao botao-secundario">
            Já tenho conta
          </Link>
        </div>
        <Link href="/whatsapp" className="text-sm">
          Ver como são os avisos →
        </Link>
      </div>
    );
  }

  const seguindo = await prisma.seguindo.findMany({
    where: { usuarioId: usuario.id },
    include: { parlamentar: true },
    orderBy: { parlamentar: { nomeBusca: "asc" } },
  });
  const alertas = await alertasDe(seguindo.map((s) => s.parlamentarId));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Seguindo</h1>
        <p className="text-tinta-suave">Quem você acompanha e o que eles fizeram por último.</p>
      </header>

      {seguindo.length === 0 ? (
        <div className="cartao space-y-2">
          <p>Você ainda não segue ninguém.</p>
          <Link href="/representantes" className="botao">
            Escolher representantes
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-wrap gap-3">
            {seguindo.map(({ parlamentar: p }) => (
              <li key={p.id}>
                <Link href={`/representantes/${p.id}`} className="cartao flex items-center gap-2 !p-2 pr-4 no-underline">
                  {p.foto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.foto} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  )}
                  <span className="font-semibold text-tinta">{p.nome}</span>
                </Link>
              </li>
            ))}
          </ul>

          <section className="cartao space-y-3" aria-labelledby="linha">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="linha" className="text-2xl font-semibold">
                Linha do tempo e alertas
              </h2>
              <Link href="/whatsapp" className="botao botao-secundario">
                Ver o resumo no WhatsApp (simulação)
              </Link>
            </div>
            <ol className="space-y-1">
              {alertas.map((a, i) => (
                <li key={i} className="flex gap-3 border-b border-linha py-3">
                  <span aria-hidden="true" className="mt-1 w-8 shrink-0 text-center text-sm font-semibold text-lago">
                    {ICONE[a.tipo]}
                  </span>
                  <div>
                    <p className="text-xs text-tinta-suave">
                      {a.titulo} · {data(a.data)}
                    </p>
                    <Link href={a.href} className="text-tinta">
                      {a.texto}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
            <DataBadge conjuntos={["votos", "cota_camara_mensal"]} />
          </section>
        </>
      )}
    </div>
  );
}
