import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Registra eventos de uso ANÔNIMOS (sem usuário, sem IP) para o painel de uso.
const TIPOS = new Set(["busca_municipio", "pergunta_poli", "seguir", "cadastro", "whatsapp_simulado"]);

export async function POST(req: Request) {
  try {
    const { tipo, municipioIbge, detalhe } = await req.json();
    if (!TIPOS.has(tipo)) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.eventoUso.create({
      data: {
        tipo,
        municipioIbge: typeof municipioIbge === "string" ? municipioIbge.slice(0, 7) : null,
        detalhe: typeof detalhe === "string" ? detalhe.slice(0, 60) : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
