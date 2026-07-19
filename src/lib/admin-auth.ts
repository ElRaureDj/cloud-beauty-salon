import { cookies } from "next/headers";

// Auth mínima del panel /admin (bloque 3), sin store de sesión. La cookie
// guarda `${exp}.${HMAC-SHA256(exp, ADMIN_SECRET)}`: para verificar se recomputa
// la firma y se compara en tiempo constante, y se comprueba la expiración. El
// login compara la contraseña contra ADMIN_PASSWORD (también en tiempo
// constante, sobre el HMAC). Sin ADMIN_SECRET/ADMIN_PASSWORD, el panel queda
// inaccesible (nunca autentica). Solo servidor.

export const COOKIE_ADMIN = "cbs_admin";
const DIAS_VALIDEZ = 30;

const enc = (s: string) => new TextEncoder().encode(s);

function aHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function igualdadConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function firmar(mensaje: string): Promise<string | null> {
  const secreto = process.env.ADMIN_SECRET;
  if (!secreto) return null;
  const clave = await crypto.subtle.importKey(
    "raw",
    enc(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, enc(mensaje));
  return aHex(firma);
}

async function crearToken(): Promise<string | null> {
  const exp = Date.now() + DIAS_VALIDEZ * 24 * 60 * 60 * 1000;
  const firma = await firmar(String(exp));
  return firma ? `${exp}.${firma}` : null;
}

async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const punto = token.lastIndexOf(".");
  if (punto < 0) return false;
  const exp = Number(token.slice(0, punto));
  const firma = token.slice(punto + 1);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const esperada = await firmar(String(exp));
  return esperada !== null && igualdadConstante(firma, esperada);
}

// La contraseña se compara vía su HMAC (longitud fija) en tiempo constante.
export async function passwordCorrecta(entrada: unknown): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof entrada !== "string") return false;
  const a = await firmar(entrada);
  const b = await firmar(real);
  return a !== null && b !== null && igualdadConstante(a, b);
}

export async function estaAutenticado(): Promise<boolean> {
  const store = await cookies();
  return tokenValido(store.get(COOKIE_ADMIN)?.value);
}

export async function iniciarSesion(): Promise<boolean> {
  const token = await crearToken();
  if (!token) return false;
  const store = await cookies();
  store.set(COOKIE_ADMIN, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DIAS_VALIDEZ * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_ADMIN);
}
