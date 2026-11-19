// Poli, o assistente: cabeça branca com visor escuro, orelhas e corpo sálvia, braços lago, símbolo no peito.
// Desenho simplificado a partir do Guia Visual.
type Expressao = "neutro" | "feliz" | "pensando" | "surpreso";

export function Poli({ size = 64, expressao = "neutro" }: { size?: number; expressao?: Expressao }) {
  const olhos =
    expressao === "feliz" ? (
      <>
        <path d="M37 36 q4 -5 8 0" stroke="#DCE8EA" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M55 36 q4 -5 8 0" stroke="#DCE8EA" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : expressao === "pensando" ? (
      <>
        <circle cx="41" cy="35" r="3.5" fill="#DCE8EA" />
        <path d="M55 35 h8" stroke="#DCE8EA" strokeWidth="3" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="41" cy="35" r={expressao === "surpreso" ? 4.5 : 3.5} fill="#DCE8EA" />
        <circle cx="59" cy="35" r={expressao === "surpreso" ? 4.5 : 3.5} fill="#DCE8EA" />
      </>
    );
  const boca =
    expressao === "surpreso" ? (
      <ellipse cx="50" cy="45" rx="3" ry="3.5" fill="#8FAE9B" />
    ) : expressao === "pensando" ? (
      <path d="M46 46 h7" stroke="#8FAE9B" strokeWidth="2.5" strokeLinecap="round" />
    ) : (
      <path d="M45 44 q5 5 10 0" fill="#8FAE9B" />
    );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Poli, o assistente do PolitizeMe">
      {/* braços */}
      <rect x="13" y="62" width="7" height="22" rx="3.5" fill="#4F7C8A" transform="rotate(12 16 62)" />
      <rect x="80" y="62" width="7" height="22" rx="3.5" fill="#4F7C8A" transform="rotate(-12 84 62)" />
      {/* corpo */}
      <path d="M26 66 a24 22 0 0 0 48 0 v-4 h-48 z" fill="#FFFFFF" stroke="#D6DDDC" />
      <path d="M28 62 a22 10 0 0 1 44 0 z" fill="#8FAE9B" />
      <rect x="25" y="61" width="50" height="3.5" rx="1.75" fill="#4F7C8A" />
      <g transform="translate(43 72) scale(0.28)">
        <path d="M4 30 A8 8 0 0 1 20 30 Z" fill="#8FAE9B" />
        <rect x="21.5" y="3" width="3.5" height="27" rx="1.75" fill="#4F7C8A" />
        <rect x="27" y="3" width="3.5" height="27" rx="1.75" fill="#4F7C8A" />
        <path d="M32 22 A8 8 0 0 0 48 22 Z" fill="#8FAE9B" />
        <rect x="3" y="33" width="44" height="4" rx="2" fill="#4F7C8A" />
      </g>
      {/* orelhas */}
      <rect x="17" y="28" width="7" height="16" rx="3.5" fill="#8FAE9B" />
      <rect x="76" y="28" width="7" height="16" rx="3.5" fill="#8FAE9B" />
      {/* cabeça */}
      <rect x="22" y="14" width="56" height="42" rx="20" fill="#FFFFFF" stroke="#D6DDDC" />
      <rect x="28" y="21" width="44" height="29" rx="13" fill="#2E3A3F" />
      {olhos}
      {boca}
    </svg>
  );
}
