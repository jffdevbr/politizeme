"use client";
import { useEffect, useState } from "react";

// Acessibilidade: aumenta o tamanho base da fonte e lembra a escolha neste navegador.
export function AjusteFonte() {
  const [grande, setGrande] = useState(false);
  useEffect(() => {
    try {
      setGrande(localStorage.getItem("fonte") === "grande");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.fonte = grande ? "grande" : "normal";
    try {
      localStorage.setItem("fonte", grande ? "grande" : "normal");
    } catch {}
  }, [grande]);
  return (
    <button
      type="button"
      onClick={() => setGrande((g) => !g)}
      aria-pressed={grande}
      className="min-h-11 min-w-11 rounded-md border border-linha bg-papel px-2 text-sm font-semibold text-lago-profundo"
      title={grande ? "Diminuir a letra" : "Aumentar a letra"}
    >
      {grande ? "A−" : "A+"}
    </button>
  );
}
