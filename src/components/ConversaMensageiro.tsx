"use client";
import { useState } from "react";

type Bolha = { de: "pm" | "eu"; texto: string; hora: string; selo?: "real" | "simulado" };

// Interpreta o *negrito* do formato de mensageiro.
function Formatado({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("\n").map((linha, i) => (
        <span key={i} className="block">
          {linha.split(/(\*[^*]+\*)/g).map((p, j) =>
            p.startsWith("*") && p.endsWith("*") ? <strong key={j}>{p.slice(1, -1)}</strong> : <span key={j}>{p}</span>,
          )}
        </span>
      ))}
    </>
  );
}

const agora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function ConversaMensageiro({ iniciais }: { iniciais: Bolha[] }) {
  const [bolhas, setBolhas] = useState(iniciais);
  const [texto, setTexto] = useState("");
  const [esperando, setEsperando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta) return;
    setBolhas((b) => [...b, { de: "eu", texto: pergunta, hora: agora() }]);
    setTexto("");
    setEsperando(true);
    fetch("/api/uso", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tipo: "whatsapp_simulado" }) }).catch(() => {});
    try {
      const r = await fetch("/api/poli", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pergunta, canal: "whatsapp" }),
      });
      const d = await r.json();
      const fonte = d.fonte ? `\nFonte: ${d.fonte.nome}` : "";
      setBolhas((b) => [...b, { de: "pm", texto: `${d.texto}${fonte}`, hora: agora() }]);
    } finally {
      setEsperando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border-[10px] border-tinta bg-[#ECE8E1] shadow-lg">
      <div className="flex items-center gap-3 bg-lago-profundo px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-papel text-lg" aria-hidden="true">
          🤖
        </span>
        <div>
          <p className="font-semibold leading-tight">PolitizeMe</p>
          <p className="text-xs opacity-80">conta oficial · simulação</p>
        </div>
      </div>
      <div className="max-h-[520px] min-h-[420px] space-y-2 overflow-y-auto p-3 text-[14px]" aria-live="polite">
        {bolhas.map((b, i) => (
          <div
            key={i}
            className={`w-fit max-w-[88%] rounded-lg px-3 py-2 shadow-sm ${b.de === "eu" ? "ml-auto bg-salvia-suave" : "bg-papel"}`}
          >
            <Formatado texto={b.texto} />
            <p className="mt-1 flex items-center justify-end gap-2 text-[11px] text-tinta-suave">
              {b.selo && (
                <span className={b.selo === "real" ? "text-salvia-texto" : "text-argila"}>
                  {b.selo === "real" ? "✓ dado real" : "◇ simulado"}
                </span>
              )}
              {b.hora}
            </p>
          </div>
        ))}
        {esperando && <p className="text-xs text-tinta-suave">digitando...</p>}
      </div>
      <form onSubmit={enviar} className="flex gap-2 bg-[#F6F4F0] p-2">
        <label htmlFor="msg" className="sr-only">
          Mensagem
        </label>
        <input
          id="msg"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte algo, ex.: o que é tramitação?"
          className="min-h-11 flex-1 rounded-full border border-linha bg-papel px-4"
        />
        <button className="h-11 w-11 rounded-full bg-lago text-white" aria-label="Enviar">
          →
        </button>
      </form>
    </div>
  );
}
