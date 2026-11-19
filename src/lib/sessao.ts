import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const COOKIE = "pm_sessao";
const SETE_DIAS = 60 * 60 * 24 * 7;
const segredo = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "troque-este-segredo-em-producao-politizeme");

export async function criarSessao(usuarioId: string) {
  const token = await new SignJWT({ sub: usuarioId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(segredo());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
    path: "/",
    maxAge: SETE_DIAS,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}

export async function usuarioAtual() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo());
    if (!payload.sub) return null;
    return await prisma.usuario.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}
