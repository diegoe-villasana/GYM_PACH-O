// ═══════════ ACCIONES: MEMBRESÍAS Y PLANES ═══════════

function actualizarClasesPlan() {
  const sel=document.getElementById('f-mplan'); if(!sel) return;
  const opt=sel.options[sel.selectedIndex];
  const clases=opt?.dataset.clases||0, dias=parseInt(opt?.dataset.dias)||30;
  const inicio=document.getElementById('f-minicio')?.value;
  if(inicio) document.getElementById('f-mfin').value=localISO(addDays(inicio,dias));
  const mc=document.getElementById('f-mclases'); if(mc) mc.value=clases;
}
async function saveMembresia(clienteId) {
  setBtnLoading('save-btn',true);
  const cId = clienteId || parseInt(document.getElementById('f-mclient')?.value);
  const {error}=await db.from('membresias').insert({
    cliente_id:cId, plan_id:parseInt(document.getElementById('f-mplan').value),
    clases_totales:parseInt(document.getElementById('f-mclases').value)||0, clases_usadas:0,
    fecha_inicio:document.getElementById('f-minicio').value,
    fecha_fin:document.getElementById('f-mfin').value, estado:'activa',
  });
  if(error){toast('Error al asignar','error');setBtnLoading('save-btn',false);return;}
  toast('Membresía asignada ✓','ok'); closeModal(); await loadAll();
}
async function saveNuevoPlan() {
  setBtnLoading('save-btn',true);
  const {error}=await db.from('planes').insert({
    nombre:document.getElementById('f-pnombre2').value,
    clases_por_periodo:parseInt(document.getElementById('f-pclases').value)||8,
    periodo_dias:parseInt(document.getElementById('f-pdias').value)||30,
    precio:parseFloat(document.getElementById('f-pprecio2').value)||0,
  });
  if(error){toast('Error','error');setBtnLoading('save-btn',false);return;}
  toast('Plan creado ✓','ok'); closeModal(); await loadAll();
}

