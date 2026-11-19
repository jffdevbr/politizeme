import Link from "next/link";
import { Poli } from "@/components/Poli";

export default function NaoEncontrado() {
  return (
    <div className="cartao flex flex-col items-center gap-4 text-center">
      <Poli size={120} expressao="pensando" />
      <h1 className="text-2xl font-bold">Não encontrei esta página</h1>
      <p className="text-tinta-suave">O endereço pode estar errado ou a página ainda está em construção.</p>
      <Link href="/" className="botao">
        Voltar ao início
      </Link>
    </div>
  );
}
