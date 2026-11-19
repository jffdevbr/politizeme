"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotaoSeguir({ parlamentarId, seguindo, nome }: { parlamentarId: string; seguindo: boolean; nome: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState(seguindo);
  const [carregando, setCarregando] = useState(false);

  async function alternar() {
    setCarregando(true);
    const r = await fetch("/api/seguir", {
      method: estado ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parlamentarId }),
    });
    setCarregando(false);
    if (r.status === 401) {
      router.push(`/cadastro?seguir=${parlamentarId}`);
      return;
    }
    if (r.ok) {
      setEstado(!estado);
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={alternar} disabled={carregando} className={estado ? "botao botao-secundario" : "botao"}>
        {estado ? "Deixar de seguir" : "Seguir"}
      </button>
      {estado && (
        <p role="status" className="rounded-md bg-salvia-suave px-3 py-2 text-sm text-salvia-texto">
          ✓ Você está seguindo {nome}. Vai receber o resumo semanal e alertas.
        </p>
      )}
    </div>
  );
}
