// Neutralidade visual: Sim, Não e Abstenção têm o mesmo peso (sem verde/vermelho). A diferença é só o texto e o símbolo.
const SIMBOLO: Record<string, string> = { Sim: "●", Não: "○", Abstenção: "◐", Obstrução: "◇", "Artigo 17": "–" };

export function ChipVoto({ voto }: { voto: string }) {
  return (
    <span className="etiqueta border border-borda bg-papel text-tinta">
      <span aria-hidden="true">{SIMBOLO[voto] ?? "·"}</span> {voto}
    </span>
  );
}
