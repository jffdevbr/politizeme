"use client";
import Link from "next/link";
import { useState } from "react";
import { ChipVoto } from "./Voto";

type Item = { parlamentarId: string; nome: string; partido: string | null; voto: string };
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Voto de cada deputado de SP, em ordem alfabética, com busca por nome e filtro por voto e partido.
export function VotosSP({ itens }: { itens: Item[] }) {
  const [busca, setBusca] = useState("");
  const [voto, setVoto] = useState("");
  const [partido, setPartido] = useState("");
  const votos = [...new Set(itens.map((i) => i.voto))].sort();
  const partidos = [...new Set(itens.map((i) => i.partido).filter(Boolean))].sort() as string[];
  const filtrados = itens.filter(
    (i) => (!voto || i.voto === voto) && (!partido || i.partido === partido) && (!busca || norm(i.nome).includes(norm(busca))),
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor="b" className="mb-1 block text-sm font-semibold">
            Buscar deputado
          </label>
          <input id="b" className="campo" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div>
          <label htmlFor="v" className="mb-1 block text-sm font-semibold">
            Voto
          </label>
          <select id="v" className="campo" value={voto} onChange={(e) => setVoto(e.target.value)}>
            <option value="">Todos</option>
            {votos.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p" className="mb-1 block text-sm font-semibold">
            Partido
          </label>
          <select id="p" className="campo" value={partido} onChange={(e) => setPartido(e.target.value)}>
            <option value="">Todos</option>
            {partidos.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-tinta-suave" aria-live="polite">
        {filtrados.length} deputados · ordem alfabética
      </p>
      <ul className="grid gap-x-6 sm:grid-cols-2">
        {filtrados.map((i) => (
          <li key={i.parlamentarId} className="flex items-center justify-between gap-2 border-b border-linha py-2">
            <span>
              <Link href={`/representantes/${i.parlamentarId}`}>{i.nome}</Link>
              <span className="text-sm text-tinta-suave"> · {i.partido}</span>
            </span>
            <ChipVoto voto={i.voto} />
          </li>
        ))}
      </ul>
    </div>
  );
}
