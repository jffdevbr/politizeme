"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcoesConta() {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);

  async function sair() {
    await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acao: "sair" }) });
    router.push("/");
    router.refresh();
  }
  async function excluir() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={sair} className="botao botao-secundario">
        Sair
      </button>
      {confirmar ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-argila-suave p-2">
          <span className="text-sm text-argila">Apagar a conta e tudo que você segue? Não dá para desfazer.</span>
          <button onClick={excluir} className="botao !bg-argila">
            Sim, apagar
          </button>
          <button onClick={() => setConfirmar(false)} className="botao botao-secundario">
            Cancelar
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmar(true)} className="botao botao-secundario !border-argila !text-argila">
          Excluir minha conta
        </button>
      )}
    </div>
  );
}
