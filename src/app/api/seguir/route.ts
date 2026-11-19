import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";

async function ler(req: Request) {
  const usuario = await usuarioAtual();
  const { parlamentarId } = await req.json().catch(() => ({}));
  return { usuario, parlamentarId: typeof parlamentarId === "string" ? parlamentarId : null };
}

export async function POST(req: Request) {
  const { usuario, parlamentarId } = await ler(req);
  if (!usuario) return NextResponse.json({ erro: "login" }, { status: 401 });
  if (!parlamentarId) return NextResponse.json({ erro: "parlamentar" }, { status: 400 });
  await prisma.seguindo.upsert({
    where: { usuarioId_parlamentarId: { usuarioId: usuario.id, parlamentarId } },
    create: { usuarioId: usuario.id, parlamentarId },
    update: {},
  });
  // Evento anônimo: não guarda QUEM seguiu QUEM (pode revelar opinião política).
  await prisma.eventoUso.create({ data: { tipo: "seguir", municipioIbge: usuario.municipioIbge } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { usuario, parlamentarId } = await ler(req);
  if (!usuario) return NextResponse.json({ erro: "login" }, { status: 401 });
  if (!parlamentarId) return NextResponse.json({ erro: "parlamentar" }, { status: 400 });
  await prisma.seguindo.deleteMany({ where: { usuarioId: usuario.id, parlamentarId } });
  return NextResponse.json({ ok: true });
}
