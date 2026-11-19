import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { criarSessao, encerrarSessao, usuarioAtual } from "@/lib/sessao";

const VERSAO_TERMO = "2026-11-18";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

// POST { acao: "cadastro" | "entrar" | "sair", ... }
export async function POST(req: Request) {
  const corpo = await req.json().catch(() => ({}));
  const { acao } = corpo;

  if (acao === "sair") {
    await encerrarSessao();
    return NextResponse.json({ ok: true });
  }

  if (acao === "redefinir") {
    const senha = String(corpo.senha ?? "");
    if (senha.length < 8) return NextResponse.json({ erro: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    const token = await prisma.tokenRecuperacao.findUnique({ where: { tokenHash: hashToken(String(corpo.token ?? "")) } });
    if (!token || token.usadoEm || token.expiraEm < new Date())
      return NextResponse.json({ erro: "Este link é inválido ou expirou. Peça um novo." }, { status: 400 });
    await prisma.$transaction([
      prisma.usuario.update({ where: { id: token.usuarioId }, data: { senhaHash: await bcrypt.hash(senha, 10) } }),
      prisma.tokenRecuperacao.update({ where: { id: token.id }, data: { usadoEm: new Date() } }),
      prisma.tokenRecuperacao.deleteMany({ where: { usuarioId: token.usuarioId, usadoEm: null } }),
    ]);
    await criarSessao(token.usuarioId);
    return NextResponse.json({ ok: true });
  }

  const email = String(corpo.email ?? "").trim().toLowerCase();
  const senha = String(corpo.senha ?? "");
  if (!EMAIL.test(email)) return NextResponse.json({ erro: "Digite um e-mail válido." }, { status: 400 });

  if (acao === "cadastro") {
    if (senha.length < 8) return NextResponse.json({ erro: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    if (corpo.consentimento !== true)
      return NextResponse.json({ erro: "Para criar a conta, é preciso aceitar o uso dos dados descrito acima." }, { status: 400 });
    if (await prisma.usuario.findUnique({ where: { email } }))
      return NextResponse.json({ erro: "Já existe uma conta com este e-mail. Tente entrar." }, { status: 409 });
    const municipioIbge =
      typeof corpo.municipioIbge === "string" && (await prisma.municipio.findUnique({ where: { codigoIbge: corpo.municipioIbge } }))
        ? corpo.municipioIbge
        : null;
    const usuario = await prisma.usuario.create({
      data: {
        email,
        senhaHash: await bcrypt.hash(senha, 10),
        municipioIbge,
        canal: corpo.canal === "whatsapp" ? "whatsapp" : "site",
        consentimentoEm: new Date(),
        versaoTermo: VERSAO_TERMO,
      },
    });
    if (typeof corpo.seguir === "string" && (await prisma.parlamentar.findUnique({ where: { id: corpo.seguir } }))) {
      await prisma.seguindo.create({ data: { usuarioId: usuario.id, parlamentarId: corpo.seguir } });
    }
    await prisma.eventoUso.create({ data: { tipo: "cadastro", municipioIbge, detalhe: usuario.canal } });
    await criarSessao(usuario.id);
    return NextResponse.json({ ok: true });
  }

  if (acao === "recuperar") {
    // Resposta igual exista ou não a conta, para não revelar quais e-mails estão cadastrados.
    const mensagem = "Se existir uma conta com este e-mail, enviamos um link para criar uma nova senha. Ele vale por 30 minutos.";
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return NextResponse.json({ ok: true, mensagem });
    const token = randomBytes(32).toString("hex");
    await prisma.tokenRecuperacao.create({
      data: { usuarioId: usuario.id, tokenHash: hashToken(token), expiraEm: new Date(Date.now() + 30 * 60 * 1000) },
    });
    const link = `/redefinir-senha?token=${token}`;
    // Sem provedor de e-mail no protótipo: só em modo demonstração (instalação local) o link aparece na tela.
    return NextResponse.json({ ok: true, mensagem, linkDemonstracao: process.env.RECUPERACAO_DEMO === "1" ? link : undefined });
  }

  if (acao === "entrar") {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash)))
      return NextResponse.json({ erro: "E-mail ou senha não conferem." }, { status: 401 });
    await criarSessao(usuario.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
}

// Direito de eliminação (LGPD art. 18): apaga a conta e tudo que a pessoa segue.
export async function DELETE() {
  const usuario = await usuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "login" }, { status: 401 });
  await prisma.usuario.delete({ where: { id: usuario.id } });
  await encerrarSessao();
  return NextResponse.json({ ok: true });
}
