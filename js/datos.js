// ── Carga de datos según rol ──
async function loadAll() {
  try {
    if(state.rol === 'admin') await loadAdmin();
    else if(state.rol === 'entrenador') await loadEntrenador();
    else await loadCliente();
  } catch(e) { console.error(e); toast('Error al cargar datos','error'); }
  render();
}

async function loadAdmin() {
  const r = await Promise.all([
    db.from('clientes').select('*').order('created_at',{ascending:false}),
    db.from('pagos').select('*').order('fecha',{ascending:false}),
    db.from('asistencia').select('*').order('fecha',{ascending:false}),
    db.from('productos').select('*').order('nombre',{ascending:true}),
    db.from('ventas').select('*').order('created_at',{ascending:false}),
    db.from('clases').select('*, tipos_clase(nombre,color), entrenadores(nombre)').order('fecha').order('hora_inicio'),
    db.from('reservas').select('*, clientes(nombre,telefono)').order('created_at',{ascending:false}),
    db.from('tipos_clase').select('*').order('nombre'),
    db.from('entrenadores').select('*').eq('activo',true).order('nombre'),
    db.from('planes').select('*').eq('activo',true).order('nombre'),
    db.from('membresias').select('*, clientes(nombre), planes(nombre)').order('created_at',{ascending:false}),
    db.from('totalpass_checkins').select('*').order('created_at',{ascending:false}).limit(50),
  ]);
  state.clients=r[0].data||[]; state.pagos=r[1].data||[]; state.asistencia=r[2].data||[];
  state.productos=r[3].data||[]; state.ventas=r[4].data||[]; state.clases=r[5].data||[];
  state.reservas=r[6].data||[]; state.tiposClase=r[7].data||[]; state.entrenadores=r[8].data||[];
  state.planes=r[9].data||[]; state.membresias=r[10].data||[];
  state.tpCheckins=r[11].data||[]; // vacío si aún no se corre la migración de TotalPass
}

async function loadEntrenador() {
  const [{data:clases},{data:reservas},{data:entrenadores}] = await Promise.all([
    db.from('clases').select('*, tipos_clase(nombre,color), entrenadores(nombre)').eq('entrenador_id', state.entrenadorId).order('fecha').order('hora_inicio'),
    db.from('reservas').select('*, clientes(nombre,telefono)').order('created_at',{ascending:false}),
    db.from('entrenadores').select('*'),
  ]);
  state.clases=clases||[]; state.reservas=reservas||[]; state.entrenadores=entrenadores||[];
}

async function loadCliente() {
  const [{data:reservas},{data:clases},{data:membresias},{data:tiposClase},{data:entrenadores},
         {data:planes},{data:perfil},{data:misMembresias},{data:misPagos}] = await Promise.all([
    db.from('reservas').select('*, clases(*, tipos_clase(nombre,color), entrenadores(nombre))').eq('cliente_id', state.clienteId).order('created_at',{ascending:false}),
    db.from('clases').select('*, tipos_clase(nombre,color), entrenadores(nombre)').gte('fecha', todayStr).eq('estado','activa').order('fecha').order('hora_inicio'),
    db.from('membresias').select('*, planes(nombre,clases_por_periodo)').eq('cliente_id', state.clienteId).eq('estado','activa').order('fecha_fin',{ascending:false}).limit(1),
    db.from('tipos_clase').select('*'),
    db.from('entrenadores').select('*'),
    // Portal: planes disponibles, perfil, historial de membresías y pagos
    db.from('planes').select('*').eq('activo',true).order('precio'),
    db.from('clientes').select('*').eq('id', state.clienteId).maybeSingle(),
    db.from('membresias').select('*, planes(nombre)').eq('cliente_id', state.clienteId).order('fecha_inicio',{ascending:false}),
    db.from('pagos').select('*').eq('cliente_id', state.clienteId).order('fecha',{ascending:false}),
  ]);
  state.reservas=reservas||[]; state.clases=clases||[]; state.membresias=membresias||[];
  state.tiposClase=tiposClase||[]; state.entrenadores=entrenadores||[];
  state.planes=planes||[]; state.perfil=perfil||null; state.misMembresias=misMembresias||[]; state.misPagos=misPagos||[];
  // Ocupación real de cada clase (para mostrar plazas y bloquear si está llena)
  state.clasesOcupacion = {};
  const ids = state.clases.map(c=>c.id);
  if(ids.length) {
    const {data:occ} = await db.from('reservas').select('clase_id').in('clase_id', ids).neq('estado','cancelada');
    (occ||[]).forEach(r=>{ state.clasesOcupacion[r.clase_id]=(state.clasesOcupacion[r.clase_id]||0)+1; });
  }
}

