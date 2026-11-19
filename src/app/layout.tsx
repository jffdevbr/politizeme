import type { Metadata } from "next";
import Link from "next/link";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Marca";
import { AjusteFonte } from "@/components/AjusteFonte";
import { usuarioAtual } from "@/lib/sessao";

// Todas as páginas leem o banco em tempo de requisição.
export const dynamic = "force-dynamic";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: "PolitizeMe",
  description:
    "Acompanhe o que fazem os deputados federais e senadores de São Paulo, com dados públicos oficiais em linguagem simples.",
  icons: { icon: "/favicon.svg" },
};

const NAV = [
  { href: "/", label: "Início" },
  { href: "/representantes", label: "Representantes" },
  { href: "/votacoes", label: "Votações" },
  { href: "/minha-cidade", label: "Minha cidade" },
  { href: "/comparar", label: "Comparar" },
  { href: "/assistente", label: "Assistente" },
  { href: "/seguindo", label: "Seguindo" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  return (
    <html lang="pt-BR" className={figtree.variable}>
      <body className="min-h-screen font-sans">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 botao">
          Pular para o conteúdo
        </a>
        <header className="border-b border-linha bg-papel">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" aria-label="PolitizeMe – início" className="no-underline">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <AjusteFonte />
              {usuario ? (
                <Link href="/conta" className="botao botao-secundario">
                  Minha conta
                </Link>
              ) : (
                <Link href="/entrar" className="botao botao-secundario">
                  Entrar
                </Link>
              )}
            </div>
          </div>
          <nav aria-label="Principal" className="mx-auto max-w-5xl overflow-x-auto px-2">
            <ul className="flex gap-1 whitespace-nowrap pb-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-tinta-suave no-underline hover:bg-lago-suave hover:text-lago-profundo"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main id="conteudo" className="mx-auto max-w-5xl px-4 py-6 md:py-10">
          {children}
        </main>
        <footer className="border-t border-linha bg-papel">
          <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-tinta-suave">
            <p>
              <strong className="text-tinta">PolitizeMe</strong> é neutro: não dá notas, não faz ranking e não indica
              em quem votar. Todo dado mostra a fonte oficial.
            </p>
            <p>
              <Link href="/sobre-os-dados">Sobre os dados (real × simulado)</Link> ·{" "}
              <Link href="/whatsapp">Simulação do WhatsApp</Link> · <Link href="/painel-uso">Painel de uso</Link> ·{" "}
              <a href="https://github.com/jffdevbr/politizeme">Código no GitHub</a>
            </p>
            <p>Protótipo acadêmico – Global Solution 2026.2 · FIAP · 2TSCPW</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
