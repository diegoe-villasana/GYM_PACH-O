// ═══════════ ACCIONES: ASISTENCIA ═══════════

// Asistencia libre
function selClienteAsistencia(clientId) {
  state.clienteAsistencia=state.clienteAsistencia===clientId?null:clientId;
  state.calMes={y:today.getFullYear(),m:today.getMonth()};
  render();
}
async function marcarAsistencia(clientId) {
  if(state.asistencia.find(a=>a.cliente_id===clientId&&a.fecha===todayStr)){toast('Ya marcado hoy');return;}
  await db.from('asistencia').insert({cliente_id:clientId,fecha:todayStr});
  toast('Asistencia marcada ✓','ok'); await loadAll();
}
async function marcarAsistenciaFecha(clientId, fecha) {
  if(state.asistencia.find(a=>a.cliente_id===clientId&&a.fecha===fecha)) return;
  await db.from('asistencia').insert({cliente_id:clientId,fecha});
  await loadAll();
}
async function quitarAsistencia(asistId) {
  await db.from('asistencia').delete().eq('id',asistId);
  toast('Eliminado'); await loadAll();
}
function calCambiarMes(clientId, dir) {
  if(!state.calMes) state.calMes={y:today.getFullYear(),m:today.getMonth()};
  let {y,m}=state.calMes; m+=dir;
  if(m>11){m=0;y++;} if(m<0){m=11;y--;}
  if(y>today.getFullYear()||(y===today.getFullYear()&&m>today.getMonth())) return;
  state.calMes={y,m};
  const el=document.getElementById('asist-content');
  if(el) el.innerHTML=renderAsistenciaCliente(clientId);
}

