import { Chat } from "@/components/Chat";

export default function Assistente() {
  const llm = !!process.env.ANTHROPIC_API_KEY;
  return (
    <div className="space-y-4">
      <header className="mx-auto max-w-2xl space-y-1">
        <h1 className="text-3xl font-bold">Pergunte ao Poli</h1>
        <p className="text-tinta-suave">
          O Poli responde com os dados oficiais coletados pelo PolitizeMe e mostra a fonte de cada resposta. Ele não
          indica em quem votar.
        </p>
        <p className="text-xs text-tinta-suave">
          {llm
            ? "Modo completo: perguntas reconhecidas são respondidas direto do banco; as demais são escritas por IA (Claude) usando só os dados oficiais."
            : "Modo básico: respostas montadas direto do banco de dados, sem IA generativa. Perguntas fora do que o Poli reconhece ainda não têm resposta."}
        </p>
      </header>
      <Chat />
    </div>
  );
}
