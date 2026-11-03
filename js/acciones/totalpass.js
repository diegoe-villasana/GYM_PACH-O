// ═══════════ ACCIONES: TOTALPASS ═══════════
// Las llaves de TotalPass viven solo en Supabase (Edge Function "totalpass-admin"), nunca aquí.

async function tpLlamar(body) {
  const {data, error} = await db.functions.invoke('totalpass-admin', {body});
  if(error) {
    let msg = error.message;
    try { const j = await error.context.json(); msg = j.error || msg; } catch(e) {}
    throw new Error(msg);
  }
  return data;
}

async function tpEstadoWebhook() {
  const btn=document.getElementById('tp-estado'); if(btn) btn.disabled=true;
  try { state.tpWebhook = await tpLlamar({accion:'estado'}); }
  catch(e) { state.tpWebhook = {error:e.message}; }
  render();
}

async function tpRegistrarWebhook() {
  const btn=document.getElementById('tp-registrar'); if(btn){ btn.disabled=true; btn.textContent='Registrando...'; }
  try {
    const r = await tpLlamar({accion:'registrar'});
    toast(`Webhook ${r.accion} en TotalPass ✓`,'ok');
    await tpEstadoWebhook();
  } catch(e) { toast('TotalPass: '+e.message,'error'); render(); }
}

const TP_MENSAJES = {
  validado:'Check-in validado ✓', expirado:'El check-in expiró; el usuario debe hacer uno nuevo',
  no_disponible:'Check-in no disponible en TotalPass', no_encontrado:'TotalPass no encontró este check-in',
};

async function tpValidar(id) {
  const cliente_id = document.getElementById('tp-cli-'+id)?.value || null;
  if(!cliente_id && !confirm('Este check-in no está ligado a ningún cliente, así que no se marcará asistencia. ¿Validar de todos modos?')) return;
  const btn=document.getElementById('tp-val-'+id); if(btn){ btn.disabled=true; btn.textContent='Validando...'; }
  try {
    const r = await tpLlamar({accion:'validar', id, cliente_id});
    toast(TP_MENSAJES[r.estado]||('Estado: '+r.estado), r.ok?'ok':'error');
  } catch(e) { toast('TotalPass: '+e.message,'error'); }
  await loadAll();
}

async function tpDescartar(id) {
  await db.from('totalpass_checkins').update({estado:'descartado'}).eq('id',id);
  toast('Check-in descartado'); await loadAll();
}

// Avisos en vivo: cuando llega un check-in nuevo
let tpCanal = null;
function tpSuscribir() {
  if(tpCanal) return;
  tpCanal = db.channel('totalpass-checkins')
    .on('postgres_changes', {event:'INSERT', schema:'public', table:'totalpass_checkins'}, p => {
      toast(`TotalPass: check-in de ${p.new.nombre||'un usuario'}`,'ok');
      if(state.view==='asistencia' || state.view==='dashboard') loadAll();
    })
    .subscribe();
}
function tpDesuscribir() {
  if(tpCanal){ db.removeChannel(tpCanal); tpCanal=null; }
}
