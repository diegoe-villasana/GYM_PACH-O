// Recibe el evento CHECK_IN_CREATED de TotalPass y lo guarda como "pendiente".
// TotalPass no firma sus webhooks, así que la URL registrada lleva ?key=<TP_WEBHOOK_SECRET>.
// Deploy: supabase functions deploy totalpass-webhook --no-verify-jwt
import { adminDb, endpointValido, igualSeguro, json } from "../_shared/totalpass.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!igualSeguro(key, Deno.env.get("TP_WEBHOOK_SECRET") ?? "")) return json({ error: "unauthorized" }, 401);

  let ev: any;
  try { ev = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  // Otros tipos de evento se aceptan sin procesar para que TotalPass no los reintente
  if (ev?.type !== "CHECK_IN_CREATED") return json({ received: true, ignored: ev?.type ?? null });
  if (!endpointValido(ev.endpoint)) return json({ error: "invalid_endpoint" }, 400);

  const db = adminDb();
  const u = ev.user ?? {}, ci = ev.check_in ?? {}, place = ev.place ?? {};
  const email = typeof u.email === "string" ? u.email.trim().toLowerCase() : null;

  // Intentar ligarlo a un cliente del gym por email
  let cliente_id: number | null = null;
  if (email) {
    const { data } = await db.from("clientes").select("id").ilike("email", email).limit(1).maybeSingle();
    cliente_id = data?.id ?? null;
  }

  const { error } = await db.from("totalpass_checkins").upsert({
    endpoint: ev.endpoint,
    tp_user_code: u.code ?? null,
    nombre: u.name ?? null,
    email,
    telefono: u.phone ?? null,
    documento: u.document_number ?? null,
    documento_tipo: u.document_type ?? null,
    plan_code: ci.plan_code ?? null,
    place_code: place.code ?? null,
    started_at: ci.started_at ?? null,
    expires_at: ci.expires_at ?? null,
    cliente_id,
    payload: ev,
  }, { onConflict: "endpoint", ignoreDuplicates: true });

  if (error) {
    console.error("totalpass-webhook insert", error);
    return json({ error: "storage_failed" }, 500); // 5xx → TotalPass puede reintentar
  }
  return json({ received: true });
});
