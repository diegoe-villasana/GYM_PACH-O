// Acciones de TotalPass que solo puede hacer un admin del gym (llamada desde el panel).
//   { accion: "estado" }                          → webhook registrado en TotalPass
//   { accion: "registrar" }                       → crea o actualiza el webhook CHECKIN
//   { accion: "validar", id, cliente_id? }        → confirma el check-in y registra la asistencia
// Deploy: supabase functions deploy totalpass-admin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { adminDb, cors, endpointValido, fechaLocal, json, tokenTP, tpFetch, TP_BASE } from "../_shared/totalpass.ts";

const webhookUrl = () =>
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/totalpass-webhook?key=${encodeURIComponent(Deno.env.get("TP_WEBHOOK_SECRET") ?? "")}`;
const ocultarKey = (url: string) => url.replace(/([?&]key=)[^&]+/, "$1•••");

const listaWebhooks = (body: any): any[] => Array.isArray(body) ? body : (body?.webhooks ?? []);

// Etiquetas de error 422 documentadas por TotalPass
const ESTADO_422: Record<string, string> = {
  check_in_expired_alert: "expirado",
  check_in_not_available: "no_disponible",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // ── Solo admins ──
  const auth = req.headers.get("Authorization") ?? "";
  const userDb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userDb.auth.getUser();
  if (!user) return json({ error: "No autenticado" }, 401);
  const db = adminDb();
  const { data: perfil } = await db.from("usuarios").select("rol").eq("id", user.id).maybeSingle();
  if (perfil?.rol !== "admin") return json({ error: "Solo un admin puede usar TotalPass" }, 403);

  if (!Deno.env.get("TP_PARTNER_API_KEY") || !Deno.env.get("TP_PLACE_API_KEY") || !Deno.env.get("TP_WEBHOOK_SECRET")) {
    return json({ error: "Faltan los secretos TP_PARTNER_API_KEY / TP_PLACE_API_KEY / TP_WEBHOOK_SECRET en Supabase" }, 500);
  }

  const body = await req.json().catch(() => ({}));
  try {
    switch (body.accion) {
      case "estado": return await estado(db);
      case "registrar": return await registrar(db);
      case "validar": return await validar(db, user.id, body);
    }
    return json({ error: "Acción no válida" }, 400);
  } catch (e) {
    console.error("totalpass-admin", e);
    return json({ error: String((e as Error).message ?? e) }, 502);
  }
});

async function estado(db: ReturnType<typeof adminDb>) {
  const res = await tpFetch(db, "/partner/webhook/get");
  const lista = listaWebhooks(await res.json().catch(() => []));
  if (!res.ok) return json({ error: `TotalPass respondió ${res.status}` }, 502);
  const esperado = webhookUrl();
  const checkin = lista.find((w) => w.webhook_type === "CHECKIN");
  return json({
    base: TP_BASE,
    registrado: !!checkin,
    correcto: checkin?.webhook_url === esperado,
    webhook_url: checkin ? ocultarKey(checkin.webhook_url) : null,
  });
}

async function registrar(db: ReturnType<typeof adminDb>) {
  const actual = listaWebhooks(await (await tpFetch(db, "/partner/webhook/get")).json().catch(() => []));
  const existe = actual.some((w) => w.webhook_type === "CHECKIN");
  const res = await tpFetch(db, existe ? "/partner/webhook/update" : "/partner/webhook/create", {
    method: existe ? "PUT" : "POST",
    body: JSON.stringify({ webhook_url: webhookUrl(), webhook_type: "CHECKIN" }),
  });
  const r = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: `TotalPass respondió ${res.status}`, detalle: r }, 502);
  return json({ ok: true, accion: existe ? "actualizado" : "creado" });
}

async function validar(db: ReturnType<typeof adminDb>, adminId: string, body: any) {
  const { data: ci } = await db.from("totalpass_checkins").select("*").eq("id", body.id).maybeSingle();
  if (!ci) return json({ error: "Check-in no encontrado" }, 404);
  if (ci.estado !== "pendiente") return json({ error: `Este check-in ya está ${ci.estado}` }, 409);
  if (!endpointValido(ci.endpoint)) return json({ error: "URL de validación inválida" }, 400);

  const cliente_id = body.cliente_id ? Number(body.cliente_id) : ci.cliente_id;

  // POST {endpoint} confirma el check-in. La documentación no exige Bearer aquí;
  // si el servidor lo pidiera (401/403) se reintenta con el JWT del partner.
  let res = await fetch(ci.endpoint, { method: "POST", headers: { "Content-Type": "application/json" } });
  if (res.status === 401 || res.status === 403) {
    res = await fetch(ci.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await tokenTP(db)}` },
    });
  }
  const texto = await res.text();
  let respuesta: unknown = texto;
  try { respuesta = JSON.parse(texto); } catch { /* texto plano, p. ej. "1" */ }

  let estadoNuevo: string;
  if (res.status === 200 || res.status === 201) estadoNuevo = "validado";
  else if (res.status === 404) estadoNuevo = "no_encontrado";
  else if (res.status === 422) {
    const label = (respuesta as any)?.errors?.[0]?.source?.label;
    estadoNuevo = ESTADO_422[label] ?? "error";
  } else {
    // 5xx u otro: se deja pendiente para intentarlo otra vez
    return json({ error: `TotalPass respondió ${res.status}`, respuesta }, 502);
  }

  let asistencia_id: number | null = null;
  if (estadoNuevo === "validado" && cliente_id) {
    const fecha = fechaLocal(ci.started_at ? new Date(ci.started_at) : new Date());
    const { data: ya } = await db.from("asistencia").select("id").eq("cliente_id", cliente_id).eq("fecha", fecha).maybeSingle();
    if (ya) asistencia_id = ya.id;
    else {
      const { data: nueva, error } = await db.from("asistencia")
        .insert({ cliente_id, fecha, origen: "totalpass", totalpass_checkin_id: ci.id }).select("id").single();
      if (error) console.error("asistencia insert", error);
      asistencia_id = nueva?.id ?? null;
    }
  }

  await db.from("totalpass_checkins").update({
    estado: estadoNuevo,
    cliente_id,
    asistencia_id,
    respuesta_tp: respuesta,
    validado_por: adminId,
    validado_at: new Date().toISOString(),
  }).eq("id", ci.id);

  return json({ ok: estadoNuevo === "validado", estado: estadoNuevo, asistencia_id });
}
