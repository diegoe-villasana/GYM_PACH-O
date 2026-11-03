// ═══════════ ACCIONES: CLASES Y RESERVAS ═══════════

// Clases
async function saveNuevoTipoClase() {
  setBtnLoading('save-btn',true);
  await db.from('tipos_clase').insert({nombre:document.getElementById('f-tcnombre').value, duracion_minutos:parseInt(document.getElementById('f-tcdur').value)||60});
  toast('Tipo creado ✓','ok'); closeModal(); await loadAll();
}
async function saveNuevoEntrenador() {
  setBtnLoading('save-btn',true);
  await db.from('entrenadores').insert({nombre:document.getElementById('f-enombre').value, especialidad:document.getElementById('f-eesp').value});
  toast('Entrenador creado ✓','ok'); closeModal(); await loadAll();
}
async function saveNuevaClase() {
  setBtnLoading('save-btn',true);
  const {error}=await db.from('clases').insert({
    tipo_clase_id:parseInt(document.getElementById('f-ctipo').value),
    entrenador_id:parseInt(document.getElementById('f-centrenador').value),
    fecha:document.getElementById('f-cfecha').value,
    hora_inicio:document.getElementById('f-cinicio').value,
    hora_fin:document.getElementById('f-cfin').value,
    capacidad_maxima:parseInt(document.getElementById('f-ccap').value)||8,
    notas:document.getElementById('f-cnotas').value, estado:'activa',
  });
  if(error){toast('Error al crear clase','error');setBtnLoading('save-btn',false);return;}
  toast('Clase creada ✓','ok'); closeModal(); await loadAll();
}
async function saveEditarClase(id) {
  setBtnLoading('save-btn',true);
  await db.from('clases').update({
    tipo_clase_id:parseInt(document.getElementById('f-ctipo').value),
    entrenador_id:parseInt(document.getElementById('f-centrenador').value),
    fecha:document.getElementById('f-cfecha').value,
    hora_inicio:document.getElementById('f-cinicio').value,
    hora_fin:document.getElementById('f-cfin').value,
    capacidad_maxima:parseInt(document.getElementById('f-ccap').value)||8,
  }).eq('id',id);
  toast('Clase actualizada ✓','ok'); closeModal(); await loadAll();
}
async function cancelarClase(id) {
  if(!confirm('¿Cancelar esta clase? Se cancelarán las reservas.')) return;
  await db.from('clases').update({estado:'cancelada'}).eq('id',id);
  await db.from('reservas').update({estado:'cancelada'}).eq('clase_id',id).eq('estado','reservada');
  toast('Clase cancelada','ok'); await loadAll();
}
function verAsistentesClase(id) { showModal('ver-asistentes', id); }

// Reservas
async function hacerReserva(claseId) {
  if(!state.clienteId){toast('Sin perfil de cliente','error');return;}
  const memb=state.membresias[0];
  if(!memb){toast('No tienes membresía activa','error');return;}
  if((memb.clases_totales||0)-(memb.clases_usadas||0)<=0){toast('No te quedan clases en tu membresía','error');return;}
  const {data:actuales}=await db.from('reservas').select('id').eq('clase_id',claseId).neq('estado','cancelada');
  const clase=state.clases.find(x=>x.id===claseId);
  if((actuales||[]).length>=clase.capacidad_maxima){toast('La clase está llena','error');return;}
  const {error}=await db.from('reservas').insert({cliente_id:state.clienteId, clase_id:claseId, estado:'reservada'});
  if(error){ toast(error.code==='23505'?'Ya tienes esta clase reservada':'Error al reservar','error'); return; }
  await db.from('membresias').update({clases_usadas:(memb.clases_usadas||0)+1}).eq('id',memb.id);
  toast('¡Reserva confirmada! ✓','ok'); await loadAll();
}
async function cancelarMiReserva(reservaId, recuperarClase) {
  const msg = recuperarClase ? '¿Cancelar reserva? Recuperarás la clase.' : '¿Cancelar reserva? No recuperarás la clase (menos de 12 horas).';
  if(!confirm(msg)) return;
  await db.from('reservas').update({estado:'cancelada'}).eq('id',reservaId);
  if(recuperarClase) {
    const memb=state.membresias[0];
    if(memb&&memb.clases_usadas>0) await db.from('membresias').update({clases_usadas:memb.clases_usadas-1}).eq('id',memb.id);
  }
  toast(recuperarClase?'Reserva cancelada — clase recuperada ✓':'Reserva cancelada','ok'); await loadAll();
}
async function cambiarEstadoReserva(id, nuevoEstado) {
  await db.from('reservas').update({estado:nuevoEstado}).eq('id',id);
  toast('Estado actualizado ✓','ok'); closeModal(); await loadAll();
}

