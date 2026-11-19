"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function postar(corpo: object) {
  const r = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
  return { ok: r.ok, d: await r.json() };
}

export function PedirRecuperacao() {
  const [mensagem, setMensagem] = useState("");
  const [link, setLink] = useState<string>();
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    const { ok, d } = await postar({ acao: "recuperar", email: new FormData(e.currentTarget).get("email") });
    if (!ok) return setErro(d.erro);
    setMensagem(d.mensagem);
    setLink(d.linkDemonstracao);
  }

  return (
    <form onSubmit={enviar} className="cartao mx-auto max-w-md space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold">
          E-mail da conta
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="campo" />
      </div>
      {erro && (
        <p role="alert" className="rounded-md bg-argila-suave px-3 py-2 text-sm text-argila">
          {erro}
        </p>
      )}
      {mensagem ? (
        <div role="status" className="space-y-2">
          <p className="rounded-md bg-salvia-suave px-3 py-2 text-sm text-salvia-texto">{mensagem}</p>
          {link && (
            <div className="rounded-md bg-argila-suave px-3 py-2 text-sm text-argila">
              <p>
                ◇ <strong>Modo demonstração:</strong> este protótipo não envia e-mails. Em produção, o link abaixo iria
                só para a sua caixa de entrada.
              </p>
              <Link href={link} className="font-semibold">
                Abrir o link de nova senha →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <button className="botao w-full">Enviar link</button>
      )}
      <p className="text-center text-sm">
        <Link href="/entrar">Voltar para entrar</Link>
      </p>
    </form>
  );
}

export function NovaSenha({ token }: { token: string }) {
  const router = useRouter();
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("senha") !== f.get("confirmacao")) return setErro("As duas senhas não são iguais.");
    const { ok, d } = await postar({ acao: "redefinir", token, senha: f.get("senha") });
    if (!ok) return setErro(d.erro);
    router.push("/seguindo");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="cartao mx-auto max-w-md space-y-4">
      <div>
        <label htmlFor="senha" className="mb-1 block text-sm font-semibold">
          Nova senha <span className="font-normal text-tinta-suave">(pelo menos 8 caracteres)</span>
        </label>
        <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required className="campo" />
      </div>
      <div>
        <label htmlFor="confirmacao" className="mb-1 block text-sm font-semibold">
          Repita a nova senha
        </label>
        <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" minLength={8} required className="campo" />
      </div>
      {erro && (
        <p role="alert" className="rounded-md bg-argila-suave px-3 py-2 text-sm text-argila">
          {erro}
        </p>
      )}
      <button className="botao w-full">Salvar nova senha</button>
    </form>
  );
}
