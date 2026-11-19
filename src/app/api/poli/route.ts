import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { responder } from "@/lib/poli";

export async function POST(req: Request) {
  const { pergunta, canal } = await req.json().catch(() => ({}));
  if (typeof pergunta !== "string" || !pergunta.trim()) {
    return NextResponse.json({ erro: "Escreva uma pergunta." }, { status: 400 });
  }
  const resposta = await responder(pergunta.slice(0, 500), canal === "whatsapp" ? "whatsapp" : "site");
  // Registro anônimo: só a intenção reconhecida, nunca o texto da pergunta.
  await prisma.eventoUso
    .create({ data: { tipo: "pergunta_poli", detalhe: resposta.intencao } })
    .catch(() => {});
  return NextResponse.json(resposta);
}
