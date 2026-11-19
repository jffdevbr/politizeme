// Símbolo do PolitizeMe: cúpula do Senado (sálvia), duas torres (lago), cuia da Câmara (sálvia) e base (lago).
// Versão simplificada redesenhada a partir do Guia Visual; substitua pelo SVG original do design system se disponível.
export function Simbolo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={(size * 40) / 50} viewBox="0 0 50 40" className={className} aria-hidden="true">
      <path d="M4 30 A8 8 0 0 1 20 30 Z" fill="#8FAE9B" />
      <rect x="21.5" y="3" width="3.5" height="27" rx="1.75" fill="#4F7C8A" />
      <rect x="27" y="3" width="3.5" height="27" rx="1.75" fill="#4F7C8A" />
      <path d="M32 22 A8 8 0 0 0 48 22 Z" fill="#8FAE9B" />
      <rect x="3" y="33" width="44" height="4" rx="2" fill="#4F7C8A" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <Simbolo size={34} />
      <span className="text-xl font-bold tracking-tight text-tinta">PolitizeMe</span>
    </span>
  );
}
