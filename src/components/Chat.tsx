"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Poli } from "./Poli";

type Msg = {
  de: "poli" | "usuario";
  texto: string;
  fonte?: { nome: string; url: string };
  link?: { href: string; rotulo: string };
  modo?: "regras" | "llm";
};

const SUGESTOES = [
  "Quem são os senadores de SP?",
  "Como votaram na PEC da jornada de 36 horas?",
  "O que é cota parlamentar?",
  "Em quem devo votar?",
];

const BOAS_VINDAS: Msg = {
  de: "poli",
  texto:
    "Olá. Pergunte sobre os deputados federais e senadores de São Paulo. Eu explico em linguagem simples e mostro de onde veio cada informação.",
};

// Tipos mínimos da Web Speech API (não fazem parte do lib.dom padrão em todos os navegadores).
type Reconhecimento = { lang: string; start: () => void; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void };

export function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([BOAS_VINDAS]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [usadas, setUsadas] = useState<string[]>([]);
  const [ouvindo, setOuvindo] = useState(false);
  const [temVoz, setTemVoz] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTemVoz("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  }, []);
  useEffect(() => fim.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [msgs, pensando]);

  async function enviar(pergunta: string) {
    if (!pergunta.trim() || pensando) return;
    setMsgs((m) => [...m, { de: "usuario", texto: pergunta }]);
    setTexto("");
    setPensando(true);
    try {
      const r = await fetch("/api/poli", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pergunta }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { de: "poli", texto: d.texto ?? d.erro, fonte: d.fonte, link: d.link, modo: d.modo }]);
    } catch {
      setMsgs((m) => [...m, { de: "poli", texto: "Não consegui buscar agora. Tente de novo em instantes." }]);
    } finally {
      setPensando(false);
    }
  }

  function falar() {
    const W = window as unknown as { SpeechRecognition?: new () => Reconhecimento; webkitSpeechRecognition?: new () => Reconhecimento };
    const Classe = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Classe) return;
    const rec = new Classe();
    rec.lang = "pt-BR";
    rec.onresult = (e) => setTexto(e.results[0][0].transcript);
    rec.onend = () => setOuvindo(false);
    setOuvindo(true);
    rec.start();
  }

  function ouvir(t: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "pt-BR";
    window.speechSynthesis.speak(u);
  }

  const sugestoes = SUGESTOES.filter((s) => !usadas.includes(s));

  return (
    <div className="mx-auto flex max-w-2xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-linha bg-nevoa">
      <div className="flex items-center gap-3 border-b border-linha bg-papel px-4 py-3">
        <Poli size={44} expressao={pensando ? "pensando" : "neutro"} />
        <div>
          <p className="font-semibold">Assistente PolitizeMe</p>
          <p className="text-xs text-tinta-suave">Responde com fonte oficial · também no WhatsApp</p>
        </div>
      </div>

      <div className="max-h-[60vh] min-h-[320px] space-y-3 overflow-y-auto p-4" aria-live="polite" aria-busy={pensando}>
        {msgs.map((m, i) =>
          m.de === "usuario" ? (
            <p key={i} className="ml-auto w-fit max-w-[85%] rounded-[16px] rounded-br-[6px] bg-lago px-4 py-2 text-[15px] text-white">
              {m.texto}
            </p>
          ) : (
            <div key={i} className="w-fit max-w-[90%] space-y-2 rounded-[16px] rounded-bl-[6px] border border-linha bg-papel px-4 py-3 text-[15px]">
              <p>{m.texto}</p>
              {m.link && (
                <Link href={m.link.href} className="block text-sm font-semibold">
                  {m.link.rotulo} →
                </Link>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-tinta-suave">
                {m.fonte ? (
                  <span>
                    Fonte:{" "}
                    <a href={m.fonte.url} target="_blank" rel="noreferrer">
                      {m.fonte.nome}
                    </a>
                    {m.modo === "llm" && " · resposta escrita por IA a partir dos dados oficiais"}
                  </span>
                ) : (
                  <span />
                )}
                <button type="button" onClick={() => ouvir(m.texto)} className="text-lago-profundo underline">
                  Ouvir
                </button>
              </div>
            </div>
          ),
        )}
        {pensando && <p className="text-sm text-tinta-suave">Poli está buscando nos dados oficiais...</p>}
        <div ref={fim} />
      </div>

      {sugestoes.length > 0 && (
        <div className="space-y-2 px-4 pb-2">
          <p className="text-xs text-tinta-suave">Experimente perguntar</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setUsadas((u) => [...u, s]);
                  enviar(s);
                }}
                className="min-h-11 rounded-[10px] border border-lago-profundo bg-papel px-3 text-sm font-semibold text-lago-profundo hover:bg-lago-suave"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="flex gap-2 border-t border-linha bg-papel p-3"
      >
        <label htmlFor="pergunta" className="sr-only">
          Sua pergunta
        </label>
        <input
          id="pergunta"
          className="campo"
          placeholder="Escreva sua pergunta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        {temVoz && (
          <button
            type="button"
            onClick={falar}
            className="botao botao-secundario"
            aria-label={ouvindo ? "Ouvindo" : "Perguntar falando"}
            title="Perguntar falando"
          >
            {ouvindo ? "…" : "🎙"}
          </button>
        )}
        <button className="botao" aria-label="Enviar" disabled={pensando}>
          →
        </button>
      </form>
    </div>
  );
}
