import Link from "next/link";
import { prisma } from "@/lib/db";
import { data } from "@/lib/formato";

// Selo de origem do dado. Toda seção com dados mostra se é REAL (com fonte e data de coleta) ou SIMULADO.
export async function DataBadge({ conjuntos }: { conjuntos: string[] }) {
  const lista = await prisma.conjunto.findMany({ where: { id: { in: conjuntos } } });
  if (lista.length === 0) return null;
  const simulado = lista.find((c) => c.origem === "SIMULADO");
  if (simulado) {
    return (
      <p className="etiqueta mt-3 bg-argila-suave text-argila" role="note">
        <span aria-hidden="true">◇</span> Dado simulado, ilustrativo. Não corresponde a nenhum parlamentar real.{" "}
        <Link href="/sobre-os-dados" className="underline">
          Saiba mais
        </Link>
      </p>
    );
  }
  const fontes = [...new Map(lista.map((c) => [c.fonte, c])).values()];
  const coleta = lista.reduce((a, c) => (c.coletadoEm < a ? c.coletadoEm : a), lista[0].coletadoEm);
  return (
    <p className="mt-3 text-xs text-tinta-suave" role="note">
      <span className="etiqueta mr-1 bg-salvia-suave text-salvia-texto">
        <span aria-hidden="true">✓</span> Dado real
      </span>
      Fonte:{" "}
      {fontes.map((c, i) => (
        <span key={c.id}>
          {i > 0 && " · "}
          <a href={c.fonteUrl} target="_blank" rel="noreferrer">
            {c.fonte}
          </a>
        </span>
      ))}{" "}
      · coletado em {data(coleta)}
    </p>
  );
}
