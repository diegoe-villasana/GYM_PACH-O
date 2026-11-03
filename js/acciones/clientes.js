// ═══════════ ACCIONES: CLIENTES, PAGOS Y DOCUMENTOS ═══════════

async function openClient(id) {
  state.selectedClient=id; state.view='client-detail'; state.clientTab='info';
  state.calMes={y:today.getFullYear(),m:today.getMonth()};
  document.getElementById('page-title').textContent = state.clients.find(x=>x.id===id)?.nombre||'Cliente';
  await loadAll();
}
async function toggleStatus(id, nuevoEstado) {
  await db.from('clientes').update({estado:nuevoEstado}).eq('id',id);
  toast(nuevoEstado==='Activo'?'Cliente reactivado':'Cliente dado de baja');
  await loadAll();
}
async function markPaid(pagoId) {
  await db.from('pagos').update({estado:'Pagado'}).eq('id',pagoId);
  toast('Pago marcado ✓','ok'); await loadAll();
}
async function saveNotas(clientId) {
  const notas=document.getElementById('notas-area').value;
  await db.from('clientes').update({notas}).eq('id',clientId);
  toast('Notas guardadas ✓','ok'); await loadAll();
}

// Documentos (Supabase Storage, bucket "Documentos")
async function uploadDoc(file, folder) {
  const ext=file.name.split('.').pop();
  const path=`${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const {error}=await db.storage.from(BUCKET).upload(path,file);
  if(error) throw error;
  return {name:file.name, path, size:file.size, fecha:new Date().toISOString()};
}
async function openDocIdx(clientId, i) {
  const d=(state.clients.find(x=>x.id===clientId)?.documentos||[])[i]; if(!d) return;
  const {data}=await db.storage.from(BUCKET).createSignedUrl(d.path,60);
  if(data?.signedUrl) window.open(data.signedUrl,'_blank'); else toast('No se pudo abrir el documento','error');
}
async function deleteDocIdx(clientId, i) {
  if(!confirm('¿Eliminar este documento?')) return;
  const c=state.clients.find(x=>x.id===clientId); const d=(c?.documentos||[])[i]; if(!d) return;
  await db.storage.from(BUCKET).remove([d.path]);
  const docs=(c.documentos||[]).filter((_,k)=>k!==i);
  await db.from('clientes').update({documentos:docs}).eq('id',clientId);
  toast('Documento eliminado'); await loadAll();
}
async function handleDocUpload(event, clientId) {
  const files=[...event.target.files]; if(!files.length) return;
  try {
    const c=state.clients.find(x=>x.id===clientId);
    toast('Subiendo...');
    const nuevos=await Promise.all(files.map(f=>uploadDoc(f,`clientes/${clientId}`)));
    await db.from('clientes').update({documentos:[...(c.documentos||[]),...nuevos]}).eq('id',clientId);
    toast(`${nuevos.length} documento(s) subido(s) ✓`,'ok'); await loadAll();
  } catch(e){ console.error(e); toast('Error al subir','error'); }
}

// Clientes
async function saveNewClient() {
  const nombre=document.getElementById('f-nombre').value.trim();
  if(!nombre){toast('Nombre obligatorio','error');return;}
  setBtnLoading('save-btn',true);
  const {error}=await db.from('clientes').insert({
    nombre, telefono:document.getElementById('f-tel').value,
    email:document.getElementById('f-email').value,
    inicio:document.getElementById('f-inicio').value||null,
    cobro:document.getElementById('f-cobro').value||null,
    plan:document.getElementById('f-plan').value,
    importe:parseFloat(document.getElementById('f-importe').value)||null,
    notas:document.getElementById('f-notas').value, estado:'Activo', documentos:[],
  });
  if(error){toast('Error al crear','error');setBtnLoading('save-btn',false);return;}
  toast('Cliente creado ✓','ok'); closeModal(); await navigate('clients');
}
async function saveEditClient(id) {
  setBtnLoading('save-btn',true);
  await db.from('clientes').update({
    nombre:document.getElementById('f-nombre').value, telefono:document.getElementById('f-tel').value,
    email:document.getElementById('f-email').value, inicio:document.getElementById('f-inicio').value||null,
    cobro:document.getElementById('f-cobro').value||null, plan:document.getElementById('f-plan').value,
    importe:parseFloat(document.getElementById('f-importe').value)||null,
  }).eq('id',id);
  toast('Guardado ✓','ok'); closeModal(); await loadAll();
}
async function saveNewPayment(clientId) {
  setBtnLoading('save-btn',true);
  await db.from('pagos').insert({
    cliente_id:clientId, fecha:document.getElementById('f-fecha').value,
    monto:parseFloat(document.getElementById('f-monto').value),
    estado:document.getElementById('f-estado').value, documentos:[],
  });
  toast('Pago registrado ✓','ok'); closeModal(); await loadAll();
}

