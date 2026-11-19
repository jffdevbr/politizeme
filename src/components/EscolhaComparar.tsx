"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Opcao = { id: string; nome: string; cargo: string };

export function EscolhaComparar({ opcoes, selecionados }: { opcoes: Opcao[]; selecionados: string[] }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([selecionados[0] ?? "", selecionados[1] ?? "", selecionados[2] ?? ""]);
  function comparar(e: React.FormEvent) {
    e.preventDefault();
    const escolhidos = [...new Set(ids.filter(Boolean))];
    router.push(`/comparar?ids=${escolhidos.join(",")}`);
  }
  return (
    <form onSubmit={comparar} className="grid gap-2 sm:grid-cols-4 sm:items-end">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <label htmlFor={`r${i}`} className="mb-1 block text-sm font-semibold">
            Representante {i + 1}
            {i === 2 && " (opcional)"}
          </label>
          <select
            id={`r${i}`}
            className="campo"
            value={ids[i]}
            onChange={(e) => setIds((atual) => atual.map((v, j) => (j === i ? e.target.value : v)))}
          >
            <option value="">Escolha...</option>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} ({o.cargo})
              </option>
            ))}
          </select>
        </div>
      ))}
      <button className="botao">Comparar</button>
    </form>
  );
}
