"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Municipio = { codigoIbge: string; nome: string };

export function FormConta({ modo, municipios = [], seguir }: { modo: "cadastro" | "entrar"; municipios?: Municipio[]; seguir?: string }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        acao: modo,
        email: f.get("email"),
        senha: f.get("senha"),
        municipioIbge: f.get("municipio") || undefined,
        canal: f.get("canal"),
        consentimento: f.get("consentimento") === "on",
        seguir,
      }),
    });
    setEnviando(false);
    const d = await r.json();
    if (!r.ok) {
      setErro(d.erro ?? "Algo deu errado. Tente de novo.");
      return;
    }
    router.push(seguir ? `/representantes/${seguir}` : "/seguindo");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="cartao mx-auto max-w-md space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="campo" />
      </div>
      <div>
        <label htmlFor="senha" className="mb-1 block text-sm font-semibold">
          Senha {modo === "cadastro" && <span className="font-normal text-tinta-suave">(pelo menos 8 caracteres)</span>}
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
          required
          minLength={modo === "cadastro" ? 8 : undefined}
          className="campo"
        />
      </div>

      {modo === "cadastro" && (
        <>
          <div>
            <label htmlFor="municipio" className="mb-1 block text-sm font-semibold">
              Sua cidade <span className="font-normal text-tinta-suave">(opcional, para alertas de emendas)</span>
            </label>
            <select id="municipio" name="municipio" className="campo" defaultValue="">
              <option value="">Prefiro não informar</option>
              {municipios.map((m) => (
                <option key={m.codigoIbge} value={m.codigoIbge}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Onde prefere receber os avisos</legend>
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name="canal" value="site" defaultChecked /> No site
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name="canal" value="whatsapp" /> WhatsApp (simulado no protótipo)
            </label>
          </fieldset>
          <div className="rounded-md bg-lago-suave p-3 text-sm">
            <p className="font-semibold">O que guardamos e por quê</p>
            <ul className="ml-4 list-disc">
              <li>E-mail e senha (protegida por criptografia), para você entrar.</li>
              <li>Cidade e canal, só se você informar, para os avisos.</li>
              <li>Quem você segue, visível só para você.</li>
            </ul>
            <p className="mt-1">
              Nunca perguntamos em quem você votou nem seu partido. Você pode apagar sua conta a qualquer momento.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="consentimento" required className="mt-1 h-5 w-5" />
            Concordo que o PolitizeMe guarde esses dados para enviar resumos e alertas.
          </label>
        </>
      )}

      {erro && (
        <p role="alert" className="rounded-md bg-argila-suave px-3 py-2 text-sm text-argila">
          {erro}
        </p>
      )}
      <button className="botao w-full" disabled={enviando}>
        {enviando ? "Enviando..." : modo === "cadastro" ? "Criar conta" : "Entrar"}
      </button>
      <p className="text-center text-sm">
        {modo === "cadastro" ? (
          <>
            Já tem conta? <Link href={`/entrar${seguir ? `?seguir=${seguir}` : ""}`}>Entrar</Link>
          </>
        ) : (
          <>
            <Link href="/recuperar-senha">Esqueci minha senha</Link>
            <span className="block">
              Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
            </span>
          </>
        )}
      </p>
    </form>
  );
}
