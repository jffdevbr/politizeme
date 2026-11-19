import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { data } from "@/lib/formato";
import { usuarioAtual } from "@/lib/sessao";
import { AcoesConta } from "@/components/AcoesConta";

// Direito de acesso (LGPD): mostra TODOS os dados guardados sobre a pessoa.
export default async function Conta() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  const [municipio, seguindo] = await Promise.all([
    usuario.municipioIbge ? prisma.municipio.findUnique({ where: { codigoIbge: usuario.municipioIbge } }) : null,
    prisma.seguindo.findMany({ where: { usuarioId: usuario.id }, include: { parlamentar: true } }),
  ]);
  const linhas: [string, string][] = [
    ["E-mail", usuario.email],
    ["Senha", "Guardada só como código criptografado (hash bcrypt). Nem a equipe consegue ler."],
    ["Cidade", municipio?.nome ?? "Não informada"],
    ["Canal de avisos", usuario.canal === "whatsapp" ? "WhatsApp (simulado no protótipo)" : "Site"],
    ["Consentimento", `Aceito em ${data(usuario.consentimentoEm)} (termo versão ${usuario.versaoTermo})`],
    ["Conta criada em", data(usuario.criadoEm)],
    ["Segue", seguindo.length ? seguindo.map((s) => s.parlamentar.nome).join(", ") : "Ninguém ainda"],
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Minha conta</h1>
      <section className="cartao space-y-3">
        <h2 className="text-xl font-semibold">Tudo o que o PolitizeMe guarda sobre você</h2>
        <dl className="divide-y divide-linha">
          {linhas.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2 sm:grid-cols-[180px_1fr]">
              <dt className="font-semibold text-tinta-suave">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-tinta-suave">
          Não guardamos o CEP buscado, em quem você votou nem seu partido. Detalhes em{" "}
          <a href="https://github.com/jffdevbr/politizeme/blob/main/docs/LGPD.md">nossa política de dados</a>.
        </p>
      </section>
      <AcoesConta />
      <p>
        <Link href="/seguindo">Ver meus alertas →</Link>
      </p>
    </div>
  );
}
