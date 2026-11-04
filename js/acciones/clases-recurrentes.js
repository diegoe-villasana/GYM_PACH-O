// ═══════════ ACCIONES: CLASES RECURRENTES ═══════════
// Permite crear varias clases de una vez: ciertos días de la semana, varios horarios, en un rango de fechas.

const REC_DIAS = [
  {n:1,l:'Lun'},{n:2,l:'Mar'},{n:3,l:'Mié'},{n:4,l:'Jue'},{n:5,l:'Vie'},{n:6,l:'Sáb'},{n:0,l:'Dom'}
];
const REC_HORAS_BASE = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
const REC_MAX_CLASES = 500;

let recDias = new Set();   // 0=Dom ... 6=Sáb
let recHoras = new Set();  // 'HH:MM'

// ── Utilidades de fecha (siempre en hora local, sin desfases de zona horaria) ──
function recISO(d) {
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function recParseISO(s) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function recFmtFecha(s) { return s.split('-').reverse().join('/'); }
function recSumarMin(hhmm, min) {
  const [h,m]=hhmm.split(':').map(Number);
  const t=Math.min(h*60+m+min, 23*60+59);
  return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
}
function recEtiquetaHora(h) {
  const hh=parseInt(h.slice(0,2),10), mm=h.slice(3,5);
  const h12=hh%12||12, suf=hh>=12?'pm':'am';
  return mm==='00' ? `${h12} ${suf}` : `${h12}:${mm} ${suf}`;
}

// ── Genera la lista de clases (fecha + hora) según lo elegido ──
function recGenerar() {
  const desde=document.getElementById('f-rdesde')?.value;
  const hasta=document.getElementById('f-rhasta')?.value;
  const horas=[...recHoras].sort();
  const fechas=[];
  if(desde&&hasta) {
    if(desde>hasta) return {lista:[],fechas:[],horas,error:'La fecha "Desde" debe ser anterior a "Hasta".'};
    let d=recParseISO(desde); const fin=recParseISO(hasta);
    if(Math.round((fin-d)/86400000)>366) return {lista:[],fechas:[],horas,error:'El rango no puede pasar de 1 año.'};
    while(d<=fin) { if(recDias.has(d.getDay())) fechas.push(recISO(d)); d.setDate(d.getDate()+1); }
  }
  const lista=[];
  fechas.forEach(f=>horas.forEach(h=>lista.push({fecha:f,hora:h})));
  return {lista,fechas,horas};
}

// ── Pantalla: selectores y resumen ──
function recRenderChips() {
  const dias=document.getElementById('rec-dias');
  if(dias) dias.innerHTML = REC_DIAS.map(d=>
    `<button type="button" class="btn small ${recDias.has(d.n)?'primary':''}" style="text-transform:none" onclick="recToggleDia(${d.n})">${d.l}</button>`
  ).join('') + `<button type="button" class="btn small" style="text-transform:none;margin-left:6px" onclick="recPresetDias()">Lun–Vie</button>`;
  const horas=document.getElementById('rec-horas');
  if(horas) {
    const todas=[...new Set([...REC_HORAS_BASE,...recHoras])].sort();
    horas.innerHTML = todas.map(h=>
      `<button type="button" class="btn small ${recHoras.has(h)?'primary':''}" style="text-transform:none" onclick="recToggleHora('${h}')">${recEtiquetaHora(h)}</button>`
    ).join('');
  }
  actualizarResumenRec();
}
function recToggleDia(n) { recDias.has(n)?recDias.delete(n):recDias.add(n); recRenderChips(); }
function recToggleHora(h) { recHoras.has(h)?recHoras.delete(h):recHoras.add(h); recRenderChips(); }
function recPresetDias() { recDias=new Set([1,2,3,4,5]); recRenderChips(); }
function recAgregarHora() {
  const inp=document.getElementById('rec-hora-custom');
  if(!inp||!inp.value) { toast('Elige una hora primero','error'); return; }
  recHoras.add(inp.value.slice(0,5)); inp.value=''; recRenderChips();
}

function actualizarResumenRec() {
  const el=document.getElementById('rec-resumen'); if(!el) return;
  const {lista,fechas,horas,error}=recGenerar();
  let msg;
  if(error) msg=`<span style="color:var(--red)">${error}</span>`;
  else if(!recDias.size) msg='Elige al menos un día de la semana.';
  else if(!recHoras.size) msg='Elige al menos un horario.';
  else if(!lista.length) msg='No hay fechas dentro de ese rango con los días elegidos.';
  else if(lista.length>REC_MAX_CLASES) msg=`<span style="color:var(--red)">Serían ${lista.length} clases; el máximo por vez es ${REC_MAX_CLASES}. Acorta el rango.</span>`;
  else msg=`Se crearán <strong style="color:var(--text);font-size:15px">${lista.length} clases</strong> (${fechas.length} días × ${horas.length} horarios), del ${recFmtFecha(fechas[0])} al ${recFmtFecha(fechas[fechas.length-1])}.`;
  el.innerHTML=msg;
}

function actualizarDuracionRec() {
  const sel=document.getElementById('f-ctipo'); const dur=document.getElementById('f-rdur');
  if(!sel||!dur||!sel.options.length) return;
  dur.value=sel.options[sel.selectedIndex].dataset.dur||60;
}

// Se llama justo después de abrir el modal "Nueva clase"
function initClaseRecurrente() {
  recDias=new Set(); recHoras=new Set();
  const base=state.clasesFecha&&/^\d{4}-\d{2}-\d{2}$/.test(state.clasesFecha) ? recParseISO(state.clasesFecha) : new Date();
  const fin=new Date(base); fin.setDate(fin.getDate()+28);
  const d=document.getElementById('f-rdesde'), h=document.getElementById('f-rhasta');
  if(d) d.value=recISO(base);
  if(h) h.value=recISO(fin);
  actualizarDuracionRec();
  recRenderChips();
}

function toggleRepetirClase() {
  const on=document.getElementById('f-crepetir').checked;
  document.getElementById('bloque-unica').style.display=on?'none':'';
  document.getElementById('bloque-repetir').style.display=on?'':'none';
  const b=document.getElementById('save-btn'); if(b) b.textContent=on?'Crear clases':'Crear clase';
  if(on) actualizarResumenRec();
}

// Botón "Crear": decide si es una clase o varias (saveNuevaClase sigue siendo el original)
function guardarClaseModal() {
  if(document.getElementById('f-crepetir')?.checked) saveClasesRecurrentes();
  else saveNuevaClase();
}

// ── Guardado ──
async function saveClasesRecurrentes() {
  const tipo=parseInt(document.getElementById('f-ctipo').value);
  const entr=parseInt(document.getElementById('f-centrenador').value);
  const cap=parseInt(document.getElementById('f-ccap').value)||8;
  const dur=parseInt(document.getElementById('f-rdur').value)||60;
  const notas=document.getElementById('f-cnotas').value;
  if(!tipo||!entr){ toast('Crea primero un tipo de clase y un entrenador','error'); return; }
  if(cap<1){ toast('La capacidad debe ser al menos 1','error'); return; }
  if(dur<5){ toast('La duración debe ser de al menos 5 minutos','error'); return; }
  if(!recDias.size){ toast('Elige al menos un día de la semana','error'); return; }
  if(!recHoras.size){ toast('Elige al menos un horario','error'); return; }
  const {lista,error}=recGenerar();
  if(error){ toast(error,'error'); return; }
  if(!lista.length){ toast('No hay fechas dentro de ese rango con los días elegidos','error'); return; }
  if(lista.length>REC_MAX_CLASES){ toast(`Son demasiadas clases de una vez (máx. ${REC_MAX_CLASES}). Acorta el rango.`,'error'); return; }

  setBtnLoading('save-btn',true);
  const desde=lista[0].fecha, hasta=lista[lista.length-1].fecha;

  // Evitar duplicados: misma fecha + hora + tipo + entrenador (ignora las canceladas)
  const {data:existentes,error:e1}=await db.from('clases')
    .select('fecha,hora_inicio,tipo_clase_id,entrenador_id')
    .gte('fecha',desde).lte('fecha',hasta).neq('estado','cancelada');
  if(e1){ toast('Error al revisar clases existentes: '+e1.message,'error'); setBtnLoading('save-btn',false); return; }
  const ya=new Set((existentes||[]).map(c=>`${c.fecha}|${String(c.hora_inicio).slice(0,5)}|${c.tipo_clase_id}|${c.entrenador_id}`));

  const nuevas=lista
    .filter(x=>!ya.has(`${x.fecha}|${x.hora}|${tipo}|${entr}`))
    .map(x=>({tipo_clase_id:tipo,entrenador_id:entr,fecha:x.fecha,hora_inicio:x.hora,hora_fin:recSumarMin(x.hora,dur),capacidad_maxima:cap,notas,estado:'activa'}));
  const omitidas=lista.length-nuevas.length;
  if(!nuevas.length){ toast('Todas esas clases ya existen','error'); setBtnLoading('save-btn',false); return; }

  let creadas=0;
  for(let i=0;i<nuevas.length;i+=100) {
    const lote=nuevas.slice(i,i+100);
    const {error}=await db.from('clases').insert(lote);
    if(error) {
      toast(`Error al crear clases (se crearon ${creadas}): ${error.message}`,'error');
      setBtnLoading('save-btn',false);
      if(creadas) await loadAll();
      return;
    }
    creadas+=lote.length;
  }
  state.clasesFecha=desde;
  toast(`${creadas} clases creadas${omitidas?` · ${omitidas} ya existían`:''} ✓`,'ok');
  closeModal(); await loadAll();
}
