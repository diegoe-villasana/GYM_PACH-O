// Cliente de la API de check-in de TotalPass (https://dev.totalpass.com)
// Secretos requeridos (supabase secrets set ...):
//   TP_PARTNER_API_KEY, TP_PLACE_API_KEY, TP_WEBHOOK_SECRET
//   TP_BASE (opcional) = https://gym-service-api.totalpass.com  |  https://gym-service-api.staging.totalpass.com
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export const TP_BASE = (Deno.env.get("TP_BASE") ?? "https://gym-service-api.totalpass.com").replace(/\/$/, "");
export const GYM_TZ = "America/Monterrey";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export function adminDb(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

// La documentación pide renovar el JWT cada 24 h; lo guardamos 23 h para tener margen.
const TOKEN_HORAS = 23;

async function pedirToken(): Promise<string> {
  const res = await fetch(`${TP_BASE}/partner/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      place_api_key: Deno.env.get("TP_PLACE_API_KEY"),
      partner_api_key: Deno.env.get("TP_PARTNER_API_KEY"),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 201 || !body.token) throw new Error(`TotalPass auth ${res.status}: ${JSON.stringify(body.message ?? body)}`);
  return body.token;
}

export async function tokenTP(db: SupabaseClient, forzar = false): Promise<string> {
  if (!forzar) {
    const { data } = await db.from("totalpass_token").select("token, expires_at").eq("id", 1).maybeSingle();
    if (data && new Date(data.expires_at).getTime() > Date.now()) return data.token;
  }
  const token = await pedirToken();
  const expires_at = new Date(Date.now() + TOKEN_HORAS * 3600_000).toISOString();
  await db.from("totalpass_token").upsert({ id: 1, token, expires_at });
  return token;
}

// Llamada autenticada a gym-service-api; si el token caducó antes de tiempo, se renueva una vez.
export async function tpFetch(db: SupabaseClient, path: string, init: RequestInit = {}): Promise<Response> {
  const hacer = async (forzar: boolean) =>
    fetch(`${TP_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}), Authorization: `Bearer ${await tokenTP(db, forzar)}` },
    });
  const res = await hacer(false);
  return res.status === 401 ? hacer(true) : res;
}

// Solo aceptamos URLs de validación de TotalPass (evita que alguien nos haga llamar a otro servidor)
export function endpointValido(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      (u.hostname === "totalpass.com" || u.hostname.endsWith(".totalpass.com")) &&
      u.pathname.startsWith("/api/v1/webhook_confirmations/");
  } catch {
    return false;
  }
}

// YYYY-MM-DD en la zona horaria del gimnasio (la columna asistencia.fecha es local)
export const fechaLocal = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: GYM_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export function igualSeguro(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
