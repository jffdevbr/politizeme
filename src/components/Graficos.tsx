"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Cores neutras do design system. Nenhuma cor "julga" um parlamentar ou um voto.
const LAGO = "#4F7C8A";
const SERIES = ["#4F7C8A", "#8FAE9B", "#2E3A3F", "#87938F"];
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const curto = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil` : String(v);

const eixo = { fontSize: 12, fill: "#5E6B70" };
const tooltip = {
  contentStyle: { borderRadius: 10, border: "1px solid #D6DDDC", fontFamily: "inherit" },
  formatter: (v: number) => reais(v),
};

export function BarrasHorizontais({
  dados,
  titulo,
  formato = "reais",
}: {
  dados: { nome: string; valor: number }[];
  titulo: string;
  formato?: "reais" | "numero";
}) {
  const altura = Math.max(160, dados.length * 36);
  const fmt = formato === "reais" ? reais : (v: number) => v.toLocaleString("pt-BR");
  return (
    <figure>
      <figcaption className="sr-only">{titulo}</figcaption>
      <div style={{ height: altura }}>
        <ResponsiveContainer>
          <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} stroke="#D6DDDC" />
            <XAxis type="number" tickFormatter={formato === "reais" ? curto : undefined} tick={eixo} allowDecimals={false} />
            <YAxis type="category" dataKey="nome" width={170} tick={eixo} />
            <Tooltip {...tooltip} formatter={(v: number) => fmt(v)} />
            <Bar dataKey="valor" name="Valor" fill={LAGO} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TabelaAcessivel titulo={titulo} linhas={dados.map((d) => [d.nome, fmt(d.valor)])} />
    </figure>
  );
}

export function LinhaMensal({ dados, titulo }: { dados: { rotulo: string; valor: number }[]; titulo: string }) {
  return (
    <figure>
      <figcaption className="sr-only">{titulo}</figcaption>
      <div style={{ height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={dados} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke="#D6DDDC" vertical={false} />
            <XAxis dataKey="rotulo" tick={eixo} interval="preserveStartEnd" />
            <YAxis tickFormatter={curto} tick={eixo} width={56} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="valor" name="Gasto no mês" stroke={LAGO} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <TabelaAcessivel titulo={titulo} linhas={dados.map((d) => [d.rotulo, reais(d.valor)])} />
    </figure>
  );
}

// Barras agrupadas para comparar representantes lado a lado (ordem alfabética, sem ranking).
export function BarrasAgrupadas({
  dados,
  series,
  titulo,
}: {
  dados: Record<string, string | number>[];
  series: string[];
  titulo: string;
}) {
  return (
    <figure>
      <figcaption className="sr-only">{titulo}</figcaption>
      <div style={{ height: 340 }}>
        <ResponsiveContainer>
          <BarChart data={dados} margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke="#D6DDDC" vertical={false} />
            <XAxis dataKey="categoria" tick={eixo} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis tickFormatter={curto} tick={eixo} width={56} />
            <Tooltip {...tooltip} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {series.map((s, i) => (
              <Bar key={s} dataKey={s} fill={SERIES[i % SERIES.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

// Alternativa em texto para leitores de tela e para quem prefere números.
function TabelaAcessivel({ titulo, linhas }: { titulo: string; linhas: string[][] }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-lago-profundo">Ver os números em tabela</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{titulo}</caption>
        <tbody>
          {linhas.map(([a, b]) => (
            <tr key={a} className="border-b border-linha">
              <td className="py-1 pr-2">{a}</td>
              <td className="py-1 text-right tabular-nums">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
