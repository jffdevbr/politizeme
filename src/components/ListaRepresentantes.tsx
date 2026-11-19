"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

type Item = { id: string; nome: string; nomeBusca: string; partido: string | null; cargo: string; casa: string; foto: string | null };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Lista em ordem alfabética (nunca por desempenho), com busca por nome e filtro por casa e partido.
export function ListaRepresentantes({ itens, casaInicial }: { itens: Item[]; casaInicial: string }) {
  const [busca, setBusca] = useState("");
  const [casa, setCasa] = useState(casaInicial);
  const [partido, setPartido] = useState("");
  const partidos = useMemo(() => [...new Set(itens.map((i) => i.partido).filter(Boolean))].sort() as string[], [itens]);

  const filtrados = itens.filter(
    (i) =>
      (!casa || i.casa === casa) &&
      (!partido || i.partido === partido) &&
      (!busca || i.nomeBusca.includes(norm(busca))),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor="busca" className="mb-1 block text-sm font-semibold">
            Buscar pelo nome
          </label>
          <input id="busca" className="campo" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div>
          <label htmlFor="casa" className="mb-1 block text-sm font-semibold">
            Casa
          </label>
          <select id="casa" className="campo" value={casa} onChange={(e) => setCasa(e.target.value)}>
            <option value="">Câmara e Senado</option>
            <option value="CAMARA">Deputados federais</option>
            <option value="SENADO">Senadores</option>
          </select>
        </div>
        <div>
          <label htmlFor="partido" className="mb-1 block text-sm font-semibold">
            Partido
          </label>
          <select id="partido" className="campo" value={partido} onChange={(e) => setPartido(e.target.value)}>
            <option value="">Todos</option>
            {partidos.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-tinta-suave" aria-live="polite">
        {filtrados.length} {filtrados.length === 1 ? "representante" : "representantes"} · em ordem alfabética
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((p) => (
          <li key={p.id}>
            <Link
              href={`/representantes/${p.id}`}
              className="cartao flex items-center gap-3 !p-3 no-underline hover:border-lago"
            >
              {p.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.foto} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 rounded-full object-cover bg-lago-suave" />
              ) : (
                <span className="h-14 w-14 rounded-full bg-lago-suave" />
              )}
              <span>
                <span className="block font-semibold text-tinta">{p.nome}</span>
                <span className="block text-sm text-tinta-suave">
                  {p.cargo} · {p.partido}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
