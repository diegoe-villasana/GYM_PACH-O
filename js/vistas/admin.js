// ═══════════ VISTAS ADMIN ═══════════
function renderDashboard() {
  const activos = state.clients.filter(c=>c.estado==='Activo').length;
  const pendientes = state.pagos.filter(p=>p.estado==='Pendiente').length;
  const mes = todayStr.slice(0,7);
  const ingresos = state.pagos.filter(p=>p.estado==='Pagado'&&p.fecha?.startsWith(mes)).reduce((a,p)=>a+Number(p.monto),0);
  const clasesHoy = state.clases.filter(c=>c.fecha===todayStr&&c.estado==='activa');
  const reservasHoy = state.reservas.filter(r=>clasesHoy.find(c=>c.id===r.clase_id)&&r.estado!=='cancelada').length;
  const va = getVisibleAlerts();
  return `
    <div class="metric-grid">
      <div class="metric"><div class="metric-label">Clientes activos</div><div class="metric-value">${activos}</div><div class="metric-sub">de ${state.clients.length} totales</div></div>
      <div class="metric"><div class="metric-label">Pagos pendientes</div><div class="metric-value" style="color:var(--amber)">${pendientes}</div></div>
      <div class="metric"><div class="metric-label">Ingresos del mes</div><div class="metric-value">$${ingresos.toFixed(0)}</div></div>
      <div class="metric"><div class="metric-label">Clases hoy</div><div class="metric-value" style="color:#E8001C">${clasesHoy.length}</div><div class="metric-sub">${reservasHoy} reservas</div></div>
    </div>
    ${va.length?`<div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="section-title" style="margin:0">Alertas</div>
        <button class="btn small" onclick="dismissAllAlerts()" style="font-size:11px;color:var(--text3)"><i class="ti ti-bell-off"></i> Limpiar todas</button>
      </div>
      ${va.slice(0,5).map(a=>`
        <div class="alert-card" onclick="openClient(${a.id})" style="margin-bottom:6px">
          <div class="alert-dot ${a.type}"></div>
          <div style="flex:1;font-size:13px">${a.msg}</div>
          <button class="btn small" onclick="dismissAlert('${a.key}',event)" style="opacity:0.6;flex-shrink:0"><i class="ti ti-x"></i></button>
        </div>`).join('')}
    </div>`:''}
    <div class="section-title">Clases de hoy</div>
    ${clasesHoy.length ? clasesHoy.map(c=>renderClaseCard(c, true)).join('') : '<div class="empty">No hay clases programadas hoy</div>'}`;
}

function renderClaseCard(c, esAdmin=false) {
  const total = state.reservas.filter(r=>r.clase_id===c.id&&r.estado!=='cancelada').length;
  const max = c.capacidad_maxima;
  const pClass = total>=max ? 'lleno' : total>=max*0.75 ? 'poco' : 'ok';
  return `
    <div class="clase-card">
      <div class="clase-hora">${fmtHora(c.hora_inicio)}</div>
      <div class="clase-info">
        <div class="clase-nombre">${c.tipos_clase?.nombre||'—'}</div>
        <div class="clase-meta"><i class="ti ti-user"></i> ${c.entrenadores?.nombre||'—'} &nbsp;·&nbsp; <i class="ti ti-clock"></i> ${fmtHora(c.hora_inicio)}–${fmtHora(c.hora_fin)}</div>
      </div>
      <div class="clase-plazas ${pClass}">${total}/${max}</div>
      ${esAdmin ? `<button class="btn small" onclick="verAsistentesClase(${c.id})"><i class="ti ti-users"></i> Ver</button>` : ''}
    </div>`;
}

function renderClients() {
  const q = state.searchClients.toLowerCase();
  const filtered = state.clients.filter(c=>c.nombre.toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q));
  return `
    <div class="table-card">
      <div class="table-header">
        <div class="table-search"><i class="ti ti-search" style="color:var(--text3)"></i><input type="text" placeholder="Buscar..." value="${state.searchClients}" oninput="state.searchClients=this.value;render()" /></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn small" onclick="generarEnlaceInvitacion()" title="Enlace de registro de un solo uso para enviárselo al cliente"><i class="ti ti-link"></i> Generar enlace</button>
          <button class="btn primary" onclick="showModal('new-client')"><i class="ti ti-plus"></i> Nuevo cliente</button>
        </div>
      </div>
      <table><thead><tr><th>Nombre</th><th class="hide-mobile">Plan</th><th class="hide-mobile">Importe</th><th class="hide-mobile">Cobro</th><th>Estado</th></tr></thead>
      <tbody>${filtered.map(c=>`<tr onclick="openClient(${c.id})">
        <td><div style="font-weight:700">${c.nombre}</div><div style="font-size:11px;color:var(--text3)">${c.email||''}</div></td>
        <td class="hide-mobile"><span class="badge ${(c.plan||'').toLowerCase()}">${c.plan||'—'}</span></td>
        <td class="hide-mobile">${c.importe?'$'+Number(c.importe).toFixed(2):'—'}</td>
        <td class="hide-mobile">${fmt(c.cobro)}</td>
        <td><span class="badge ${(c.estado||'').toLowerCase()}">${c.estado||'—'}</span></td>
      </tr>`).join('')||'<tr><td colspan="5" class="empty">Sin clientes</td></tr>'}
      </tbody></table>
    </div>`;
}

function renderClientDetail() {
  const c = state.clients.find(x=>x.id===state.selectedClient);
  if(!c) return '<div class="empty">No encontrado</div>';
  const cPagos = state.pagos.filter(p=>p.cliente_id===c.id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const cMemb = state.membresias.filter(m=>m.cliente_id===c.id);
  const cReservas = state.reservas.filter(r=>r.cliente_id===c.id);
  const initials = c.nombre.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const pendiente = cPagos.find(p=>p.estado==='Pendiente');
  const docs = c.documentos||[];
  const T = state.clientTab;
  return `
    <div style="margin-bottom:16px"><button class="btn small" onclick="navigate('clients')"><i class="ti ti-arrow-left"></i> Volver</button></div>
    <div class="table-card" style="padding:20px">
      <div class="detail-header">
        <div class="avatar">${initials}</div>
        <div><div style="font-size:18px;font-weight:700">${c.nombre}</div><div style="font-size:13px;color:var(--text2)">${c.email||''} ${c.telefono?'· '+c.telefono:''}</div></div>
        <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn small" onclick="showModal('edit-client',${c.id})"><i class="ti ti-edit"></i> Editar</button>
          ${c.email?`<button class="btn small" onclick="enviarEmailVencimiento(state.clients.find(x=>x.id===${c.id}))"><i class="ti ti-mail"></i> Email</button>`:''}
          ${c.estado==='Activo'?`<button class="btn small danger" onclick="toggleStatus(${c.id},'Inactivo')">Dar de baja</button>`:`<button class="btn small" onclick="toggleStatus(${c.id},'Activo')">Reactivar</button>`}
        </div>
      </div>
      <div class="tabs">
        <button class="tab ${T==='info'?'active':''}" onclick="state.clientTab='info';render()">Info</button>
        <button class="tab ${T==='pagos'?'active':''}" onclick="state.clientTab='pagos';render()">Pagos</button>
        <button class="tab ${T==='membresia'?'active':''}" onclick="state.clientTab='membresia';render()">Membresía</button>
        <button class="tab ${T==='reservas'?'active':''}" onclick="state.clientTab='reservas';render()">Reservas</button>
        <button class="tab ${T==='docs'?'active':''}" onclick="state.clientTab='docs';render()">Docs ${docs.length?`<span style="background:var(--blue-bg);color:var(--blue-text);border-radius:10px;padding:1px 6px;font-size:10px">${docs.length}</span>`:''}</button>
        <button class="tab ${T==='notas'?'active':''}" onclick="state.clientTab='notas';render()">Notas</button>
      </div>
      ${T==='info'?`
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-field-label">Inicio</div><div class="detail-field-value">${fmt(c.inicio)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Próximo cobro</div><div class="detail-field-value">${fmt(c.cobro)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Plan</div><div class="detail-field-value"><span class="badge ${(c.plan||'').toLowerCase()}">${c.plan||'—'}</span></div></div>
          <div class="detail-field"><div class="detail-field-label">Importe</div><div class="detail-field-value">${c.importe?'$'+Number(c.importe).toFixed(2):'—'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Teléfono</div><div class="detail-field-value">${c.telefono||'—'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Estado</div><div class="detail-field-value"><span class="badge ${(c.estado||'').toLowerCase()}">${c.estado||'—'}</span></div></div>
        </div>
        ${pendiente?`<div style="background:var(--amber-bg);border-radius:var(--r);padding:12px;font-size:13px;color:var(--amber-text);display:flex;justify-content:space-between;align-items:center">
          <span>💳 Pago pendiente desde ${fmt(pendiente.fecha)}: $${pendiente.monto}</span>
          <button class="btn small" onclick="markPaid(${pendiente.id})" style="background:var(--amber);color:#000">Marcar pagado</button>
        </div>`:''}`:''}
      ${T==='pagos'?`
        <div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn small primary" onclick="showModal('new-payment',${c.id})"><i class="ti ti-plus"></i> Registrar pago</button></div>
        ${cPagos.map(p=>`<div class="history-item">
          <i class="ti ${p.estado==='Pagado'?'ti-circle-check':'ti-clock'}" style="color:${p.estado==='Pagado'?'var(--green)':'var(--amber)'}"></i>
          <div style="flex:1"><div style="font-weight:700">$${Number(p.monto).toFixed(2)}</div><div style="font-size:12px;color:var(--text3)">${fmt(p.fecha)}</div></div>
          <span class="badge ${p.estado.toLowerCase()}">${p.estado}</span>
          ${p.estado==='Pendiente'?`<button class="btn small" onclick="markPaid(${p.id})">Pagar</button>`:''}
        </div>`).join('')||'<div class="empty">Sin pagos</div>'}`:''}
      ${T==='membresia'?`
        <div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn small primary" onclick="showModal('nueva-membresia',${c.id})"><i class="ti ti-plus"></i> Asignar membresía</button></div>
        ${cMemb.map(m=>{
          const usadas=m.clases_usadas||0, total=m.clases_totales||0, pct=total>0?Math.round(usadas/total*100):0;
          return `<div class="detail-field" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><div style="font-weight:700">${m.planes?.nombre||'—'}</div><div style="font-size:12px;color:var(--text3)">${fmt(m.fecha_inicio)} → ${fmt(m.fecha_fin)}</div></div>
              <span class="badge ${m.estado}">${m.estado}</span>
            </div>
            <div style="margin-top:10px;font-size:13px;color:var(--text2)">Clases: <strong>${usadas}/${total}</strong></div>
            <div class="membresia-bar"><div class="membresia-fill" style="width:${pct}%"></div></div>
          </div>`;
        }).join('')||'<div class="empty">Sin membresías</div>'}`:''}
      ${T==='reservas'?`
        ${cReservas.map(r=>{
          const cl = state.clases.find(x=>x.id===r.clase_id);
          return `<div class="history-item">
            <i class="ti ti-calendar-event" style="color:var(--blue)"></i>
            <div style="flex:1"><div style="font-weight:700">${cl?.tipos_clase?.nombre||'Clase'}</div>
            <div style="font-size:12px;color:var(--text3)">${fmt(cl?.fecha)} ${fmtHora(cl?.hora_inicio)}</div></div>
            <span class="badge ${r.estado}">${r.estado}</span>
          </div>`;
        }).join('')||'<div class="empty">Sin reservas</div>'}`:''}
      ${T==='docs'?`
        <div style="margin-bottom:12px">
          <label class="doc-upload-area" for="doc-upload-c">
            <i class="ti ti-upload" style="font-size:20px;color:var(--text3)"></i>
            <div style="font-size:13px;color:var(--text2);margin-top:4px">Subir documento</div>
            <input type="file" id="doc-upload-c" multiple onchange="handleDocUpload(event,${c.id})" style="display:none"/>
          </label>
        </div>
        ${docs.map((d,i)=>`<div class="doc-item">
          <i class="ti ${fileIcon(d.name)}" style="color:var(--blue)"></i>
          <span class="doc-item-name">${d.name}</span>
          <span class="doc-item-type">${d.name.split('.').pop().toUpperCase()}</span>
          <button class="btn small" onclick="openDocIdx(${c.id},${i})"><i class="ti ti-eye"></i></button>
          <button class="btn small danger" onclick="deleteDocIdx(${c.id},${i})"><i class="ti ti-trash"></i></button>
        </div>`).join('')||'<div class="empty">Sin documentos</div>'}`:''}
      ${T==='notas'?`
        <textarea class="form-input" id="notas-area" style="min-height:140px;resize:vertical">${c.notas||''}</textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn small primary" onclick="saveNotas(${c.id})">Guardar</button></div>`:''}
    </div>`;
}

function renderPayments() {
  const mes = todayStr.slice(0,7);
  const pendientes = state.pagos.filter(p=>p.estado==='Pendiente');
  const cobrado = state.pagos.filter(p=>p.estado==='Pagado'&&p.fecha?.startsWith(mes)).reduce((a,p)=>a+Number(p.monto),0);
  const q = state.searchPayments.toLowerCase();
  const enriched = state.pagos.map(p=>({...p,clienteNombre:state.clients.find(x=>x.id===p.cliente_id)?.nombre||'—'}))
    .filter(p=>p.clienteNombre.toLowerCase().includes(q));
  return `
    <div class="metric-grid" style="margin-bottom:20px">
      <div class="metric"><div class="metric-label">Pendiente</div><div class="metric-value" style="color:var(--amber)">$${pendientes.reduce((a,p)=>a+Number(p.monto),0).toFixed(0)}</div></div>
      <div class="metric"><div class="metric-label">Cobrado este mes</div><div class="metric-value" style="color:var(--green)">$${cobrado.toFixed(0)}</div></div>
      <div class="metric"><div class="metric-label">Sin pagar</div><div class="metric-value">${pendientes.length}</div></div>
    </div>
    <div class="table-card">
      <div class="table-header">
        <div class="table-search"><i class="ti ti-search" style="color:var(--text3)"></i><input type="text" placeholder="Buscar..." value="${state.searchPayments}" oninput="state.searchPayments=this.value;render()" /></div>
      </div>
      <table><thead><tr><th>Cliente</th><th class="hide-mobile">Fecha</th><th>Importe</th><th>Estado</th><th></th></tr></thead>
      <tbody>${enriched.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(p=>`<tr onclick="openClient(${p.cliente_id})">
        <td style="font-weight:700">${p.clienteNombre}</td><td class="hide-mobile" style="color:var(--text2)">${fmt(p.fecha)}</td>
        <td style="font-weight:700">$${Number(p.monto).toFixed(2)}</td>
        <td><span class="badge ${p.estado.toLowerCase()}">${p.estado}</span></td>
        <td>${p.estado==='Pendiente'?`<button class="btn small" onclick="event.stopPropagation();markPaid(${p.id})">Pagar</button>`:'—'}</td>
      </tr>`).join('')||'<tr><td colspan="5" class="empty">Sin pagos</td></tr>'}
      </tbody></table>
    </div>`;
}

function renderMembresias() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">Membresías</div>
      <div style="display:flex;gap:8px">
        <button class="btn small" onclick="showModal('nuevo-plan')"><i class="ti ti-plus"></i> Nuevo plan</button>
        <button class="btn primary" onclick="showModal('nueva-membresia-global')"><i class="ti ti-plus"></i> Asignar membresía</button>
      </div>
    </div>
    <div class="table-card">
      <table><thead><tr><th>Cliente</th><th>Plan</th><th>Clases usadas</th><th>Válida hasta</th><th>Estado</th></tr></thead>
      <tbody>${state.membresias.map(m=>{
        const usadas=m.clases_usadas||0, total=m.clases_totales||0, pct=total>0?Math.round(usadas/total*100):0;
        return `<tr>
          <td style="font-weight:700">${m.clientes?.nombre||'—'}</td>
          <td>${m.planes?.nombre||'—'}</td>
          <td><div style="font-size:13px">${usadas}/${total}</div><div class="membresia-bar" style="width:80px"><div class="membresia-fill" style="width:${pct}%"></div></div></td>
          <td>${fmt(m.fecha_fin)}</td>
          <td><span class="badge ${m.estado}">${m.estado}</span></td>
        </tr>`;
      }).join('')||'<tr><td colspan="5" class="empty">Sin membresías</td></tr>'}
      </tbody></table>
    </div>`;
}

function renderClasesAdmin() {
  const lista = state.clases.filter(c=>c.fecha===state.clasesFecha);
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn small" onclick="cambiarFechaClases(-1)"><i class="ti ti-chevron-left"></i></button>
        <input type="date" class="form-input" style="width:160px" value="${state.clasesFecha}" onchange="state.clasesFecha=this.value;render()" />
        <button class="btn small" onclick="cambiarFechaClases(1)"><i class="ti ti-chevron-right"></i></button>
        <button class="btn small" onclick="state.clasesFecha=todayStr;render()">Hoy</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn small" onclick="showModal('nuevo-tipo-clase')"><i class="ti ti-tag"></i> Tipo de clase</button>
        <button class="btn small" onclick="showModal('nuevo-entrenador')"><i class="ti ti-user-plus"></i> Entrenador</button>
        <button class="btn primary" onclick="showModal('nueva-clase')"><i class="ti ti-plus"></i> Nueva clase</button>
      </div>
    </div>
    ${lista.length ? lista.map(c=>{
      const total = state.reservas.filter(r=>r.clase_id===c.id&&r.estado!=='cancelada').length;
      const max = c.capacidad_maxima;
      return `
        <div class="clase-card" style="${c.estado==='cancelada'?'opacity:0.5':''}">
          <div class="clase-hora">${fmtHora(c.hora_inicio)}</div>
          <div class="clase-info">
            <div class="clase-nombre">${c.tipos_clase?.nombre||'—'} ${c.estado==='cancelada'?'<span class="badge cancelada">Cancelada</span>':''}</div>
            <div class="clase-meta"><i class="ti ti-user"></i> ${c.entrenadores?.nombre||'—'} &nbsp;·&nbsp; hasta ${fmtHora(c.hora_fin)} &nbsp;·&nbsp; cap. ${max}</div>
          </div>
          <div class="clase-plazas ${total>=max?'lleno':total>=max*0.75?'poco':'ok'}">${total}/${max}</div>
          <button class="btn small" onclick="verAsistentesClase(${c.id})"><i class="ti ti-users"></i> Lista</button>
          <button class="btn small" onclick="showModal('editar-clase',${c.id})"><i class="ti ti-edit"></i></button>
          ${c.estado!=='cancelada'?`<button class="btn small danger" onclick="cancelarClase(${c.id})"><i class="ti ti-x"></i></button>`:''}
        </div>`;
    }).join('') : `<div class="empty">No hay clases para esta fecha.<br><br><button class="btn primary" onclick="showModal('nueva-clase')"><i class="ti ti-plus"></i> Crear clase</button></div>`}`;
}

function cambiarFechaClases(dir) {
  state.clasesFecha = localISO(addDays(state.clasesFecha, dir));
  render();
}

function renderReservasAdmin() {
  const todas = state.reservas.map(r=>{
    const cl = state.clases.find(x=>x.id===r.clase_id);
    return {...r, claseNombre: cl?.tipos_clase?.nombre||'—', claseFecha: cl?.fecha||'', claseHora: cl?.hora_inicio||''};
  });
  return `
    <div class="metric-grid" style="margin-bottom:20px">
      <div class="metric"><div class="metric-label">Total reservas</div><div class="metric-value">${todas.length}</div></div>
      <div class="metric"><div class="metric-label">Activas</div><div class="metric-value" style="color:var(--blue)">${todas.filter(r=>r.estado==='reservada').length}</div></div>
      <div class="metric"><div class="metric-label">Asistieron</div><div class="metric-value" style="color:var(--green)">${todas.filter(r=>r.estado==='asistio').length}</div></div>
      <div class="metric"><div class="metric-label">Canceladas</div><div class="metric-value" style="color:var(--text3)">${todas.filter(r=>r.estado==='cancelada').length}</div></div>
    </div>
    <div class="table-card">
      <table><thead><tr><th>Cliente</th><th>Clase</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${todas.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')).slice(0,50).map(r=>`<tr>
        <td style="font-weight:700">${r.clientes?.nombre||'—'}</td>
        <td>${r.claseNombre}</td>
        <td style="color:var(--text2)">${fmt(r.claseFecha)} ${fmtHora(r.claseHora)}</td>
        <td><span class="badge ${r.estado}">${r.estado}</span></td>
        <td><div style="display:flex;gap:4px">
          ${r.estado==='reservada'?`
            <button class="btn small success" onclick="cambiarEstadoReserva(${r.id},'asistio')"><i class="ti ti-check"></i></button>
            <button class="btn small danger" onclick="cambiarEstadoReserva(${r.id},'no_asistio')"><i class="ti ti-x"></i></button>
            <button class="btn small" onclick="cambiarEstadoReserva(${r.id},'cancelada')">Cancelar</button>
          `:r.estado==='asistio'?'✅ Asistió':'—'}
        </div></td>
      </tr>`).join('')||'<tr><td colspan="5" class="empty">Sin reservas</td></tr>'}
      </tbody></table>
    </div>`;
}

function renderAsistencia() {
  const asistHoy = state.asistencia.filter(a=>a.fecha===todayStr);
  const activos = state.clients.filter(c=>c.estado==='Activo');
  const sinVenir7 = activos.filter(c=>{
    const asis = state.asistencia.filter(a=>a.cliente_id===c.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
    return !asis.length || diffDays(asis[0].fecha, today) > 7;
  });
  const sel = state.clienteAsistencia ? state.clients.find(c=>c.id===state.clienteAsistencia) : null;
  const q = (state.searchAsistencia||'').toLowerCase();
  const filtrados = activos.filter(c=>c.nombre.toLowerCase().includes(q));
  return `
    <div class="metric-grid" style="margin-bottom:20px">
      <div class="metric"><div class="metric-label">Asistencias hoy</div><div class="metric-value" style="color:var(--green)">${asistHoy.length}</div></div>
      <div class="metric"><div class="metric-label">Sin venir +7 días</div><div class="metric-value" style="color:var(--amber)">${sinVenir7.length}</div></div>
    </div>
    ${renderTotalpassCheckins()}
    <div style="display:grid;grid-template-columns:${sel?'repeat(auto-fit,minmax(300px,1fr))':'1fr'};gap:20px;align-items:start">
      <div>
        <div class="section-title">Pasar lista — ${today.toLocaleDateString('es-MX',{day:'numeric',month:'long'})}</div>
        <div class="table-card">
          <div class="table-header"><div class="table-search"><i class="ti ti-search" style="color:var(--text3)"></i><input type="text" placeholder="Buscar..." value="${state.searchAsistencia||''}" oninput="state.searchAsistencia=this.value;render()" /></div></div>
          <table><thead><tr><th>Cliente</th><th>Última visita</th><th>Hoy</th></tr></thead>
          <tbody>${filtrados.map(c=>{
            const asis=state.asistencia.filter(a=>a.cliente_id===c.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
            const ultima=asis.length?asis[0].fecha:null;
            const dias=ultima?diffDays(ultima,today):null;
            const vino=asistHoy.find(a=>a.cliente_id===c.id);
            const color=dias===null?'var(--text3)':dias>14?'var(--red)':dias>7?'var(--amber)':'var(--green)';
            return `<tr><td onclick="selClienteAsistencia(${c.id})" style="cursor:pointer"><div style="font-weight:700">${c.nombre}</div><div style="font-size:11px;color:${color}">${dias===null?'Sin registros':dias===0?'Hoy':'hace '+dias+'d'}</div></td>
              <td style="font-size:12px;color:var(--text2)">${ultima?fmt(ultima):'Nunca'}</td>
              <td>${vino?`<button class="btn small danger" onclick="quitarAsistencia(${vino.id})"><i class="ti ti-x"></i></button>`:`<button class="btn small primary" onclick="marcarAsistencia(${c.id})"><i class="ti ti-check"></i></button>`}</td>
            </tr>`;
          }).join('')}</tbody></table>
        </div>
      </div>
      ${sel?`<div>
        <div class="section-title">📅 ${sel.nombre}</div>
        <div class="table-card" style="padding:16px"><div id="asist-content">${renderAsistenciaCliente(sel.id)}</div></div>
      </div>`:''}
    </div>`;
}

function renderAsistenciaCliente(clientId) {
  const asis = state.asistencia.filter(a=>a.cliente_id===clientId);
  const vino = asis.find(a=>a.fecha===todayStr);
  const totalMes = asis.filter(a=>a.fecha?.startsWith(todayStr.slice(0,7))).length;
  if(!state.calMes) state.calMes = { y: today.getFullYear(), m: today.getMonth() };
  const {y,m} = state.calMes;
  const mesNombre = new Date(y,m,1).toLocaleDateString('es-MX',{month:'long',year:'numeric'});
  const offset = (new Date(y,m,1).getDay()||7)-1;
  const diasMes = new Date(y,m+1,0).getDate();
  const asistMap = {}; asis.forEach(a=>{asistMap[a.fecha]=a.id;});
  let cells='';
  for(let i=0;i<offset;i++) cells+=`<div class="cal-day empty"></div>`;
  for(let d=1;d<=diasMes;d++){
    const f=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const fut=f>todayStr, esHoy=f===todayStr, pres=!!asistMap[f];
    const cls='cal-day'+(fut?' future':'')+(esHoy?' today':'')+(pres?' present':'');
    const onclick=fut?'':pres?`onclick="quitarAsistencia(${asistMap[f]})"`:`onclick="marcarAsistenciaFecha(${clientId},'${f}')"`;
    cells+=`<button class="${cls}" ${onclick}>${d}</button>`;
  }
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;color:var(--text2)">Este mes: <strong>${totalMes}</strong> · Total: <strong>${asis.length}</strong></div>
      ${vino?`<button class="btn small danger" onclick="quitarAsistencia(${vino.id})">Quitar hoy</button>`:`<button class="btn small primary" onclick="marcarAsistencia(${clientId})">Marcar hoy</button>`}
    </div>
    <div class="cal-wrap">
      <div class="cal-header">
        <button class="btn small" onclick="calCambiarMes(${clientId},-1)"><i class="ti ti-chevron-left"></i></button>
        <div class="cal-month">${mesNombre}</div>
        <button class="btn small" onclick="calCambiarMes(${clientId},1)"><i class="ti ti-chevron-right"></i></button>
      </div>
      <div class="cal-grid">
        ${['L','M','X','J','V','S','D'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
        ${cells}
      </div>
    </div>`;
}

function renderInventario() {
  const mes = todayStr.slice(0,7);
  const mesAnterior = localISO(new Date(today.getFullYear(), today.getMonth()-1, 1)).slice(0,7);
  const ventasMes = state.ventas.filter(v=>v.created_at?.startsWith(mes));
  const ventasMesAnt = state.ventas.filter(v=>v.created_at?.startsWith(mesAnterior));
  const ingresos = ventasMes.reduce((a,v)=>a+Number(v.total),0);
  const ingresosMesAnt = ventasMesAnt.reduce((a,v)=>a+Number(v.total),0);
  const ganancias = ventasMes.reduce((a,v)=>a+gananciaVenta(v),0);
  const stockBajo = state.productos.filter(p=>p.stock<=p.stock_minimo);
  const q = (state.searchProductos||'').toLowerCase();
  const filtered = state.productos.filter(p=>p.nombre.toLowerCase().includes(q));
  const varPct = ingresosMesAnt>0?Math.round((ingresos-ingresosMesAnt)/ingresosMesAnt*100):null;
  const porProd = {};
  ventasMes.forEach(v=>{ const o=porProd[v.producto_id]||(porProd[v.producto_id]={total:0,cantidad:0}); o.total+=Number(v.total); o.cantidad+=Number(v.cantidad); });
  return `
    <div class="metric-grid" style="margin-bottom:20px">
      <div class="metric"><div class="metric-label">Productos</div><div class="metric-value">${state.productos.length}</div><div class="metric-sub">${stockBajo.length} con stock bajo</div></div>
      <div class="metric"><div class="metric-label">Ventas este mes</div><div class="metric-value">$${ingresos.toFixed(0)}</div><div class="metric-sub">${varPct!==null?`${varPct>=0?'▲':'▼'} ${Math.abs(varPct)}% vs mes ant.`:`${ventasMes.length} transacciones`}</div></div>
      <div class="metric"><div class="metric-label">Ganancia mes</div><div class="metric-value" style="color:var(--green)">$${ganancias.toFixed(0)}</div><div class="metric-sub">neto de comisiones</div></div>
      <div class="metric"><div class="metric-label">Mes anterior</div><div class="metric-value" style="color:var(--text2)">$${ingresosMesAnt.toFixed(0)}</div><div class="metric-sub">${ventasMesAnt.length} ventas</div></div>
    </div>
    ${stockBajo.length?`<div style="margin-bottom:20px"><div class="section-title">⚠️ Stock bajo</div>${stockBajo.map(p=>`
      <div class="alert-card" style="margin-bottom:6px"><div class="alert-dot red"></div>
        <div style="flex:1;font-size:13px">${p.nombre} — quedan <strong>${p.stock}</strong> (mín ${p.stock_minimo})</div>
        <button class="btn small" onclick="showModal('reponer',${p.id})">Reponer</button>
      </div>`).join('')}</div>`:''}
    <div class="table-card">
      <div class="table-header">
        <div class="table-search"><i class="ti ti-search" style="color:var(--text3)"></i><input type="text" placeholder="Buscar producto..." value="${state.searchProductos||''}" oninput="state.searchProductos=this.value;render()" /></div>
        <div style="display:flex;gap:8px">
          <button class="btn small" onclick="showModal('nueva-venta')"><i class="ti ti-shopping-cart"></i> Venta</button>
          <button class="btn primary" onclick="showModal('nuevo-producto')"><i class="ti ti-plus"></i> Producto</button>
        </div>
      </div>
      <table><thead><tr><th>Producto</th><th>Stock</th><th>Costo</th><th>Precio</th><th>Margen</th><th></th></tr></thead>
      <tbody>${filtered.map(p=>{
        const m=p.precio_venta&&p.costo?(((p.precio_venta-p.costo)/p.precio_venta)*100).toFixed(0)+'%':'—';
        const c=p.stock<=p.stock_minimo?'var(--red)':p.stock<=p.stock_minimo*2?'var(--amber)':'var(--green)';
        return `<tr><td><div style="font-weight:700">${p.nombre}</div><div style="font-size:11px;color:var(--text3)">${p.categoria||''}</div></td>
          <td style="color:${c};font-weight:700">${p.stock}</td><td>$${Number(p.costo).toFixed(2)}</td>
          <td style="font-weight:700">$${Number(p.precio_venta).toFixed(2)}</td><td style="color:var(--green)">${m}</td>
          <td><div style="display:flex;gap:4px">
            <button class="btn small primary" onclick="showModal('venta-rapida',${p.id})"><i class="ti ti-shopping-cart"></i></button>
            <button class="btn small" onclick="showModal('editar-producto',${p.id})"><i class="ti ti-edit"></i></button>
          </div></td></tr>`;
      }).join('')||'<tr><td colspan="6" class="empty">Sin productos</td></tr>'}
      </tbody></table>
    </div>
    ${Object.keys(porProd).length?`
      <div style="margin-top:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="section-title" style="margin:0">Ranking este mes</div>
          <button class="btn small" onclick="exportarCierreMes()"><i class="ti ti-download"></i> Cierre de mes</button>
        </div>
        <div class="table-card"><table><thead><tr><th>Producto</th><th>Unidades</th><th>Total</th><th>% del total</th></tr></thead>
        <tbody>${Object.entries(porProd).sort((a,b)=>b[1].total-a[1].total).map(([pid,v])=>{
          const p=state.productos.find(x=>x.id==pid);
          const pct=ingresos>0?Math.round(v.total/ingresos*100):0;
          return `<tr><td style="font-weight:700">${p?.nombre||'—'}</td><td>${v.cantidad}</td>
            <td style="font-weight:700;color:var(--green)">$${v.total.toFixed(2)}</td>
            <td><div style="display:flex;align-items:center;gap:8px">
              <div style="background:var(--surface2);border-radius:3px;height:6px;width:60px;overflow:hidden"><div style="background:#E8001C;height:100%;width:${pct}%"></div></div>
              <span style="font-size:12px;color:var(--text2)">${pct}%</span>
            </div></td></tr>`;
        }).join('')}</tbody></table></div>
      </div>`:''}
    ${state.ventas.length?`<div style="margin-top:20px"><div class="section-title">Últimas ventas</div>
      <div class="table-card"><table><thead><tr><th>Producto</th><th>Cant.</th><th>Total</th><th>Pago</th><th class="hide-mobile">Ganancia</th><th class="hide-mobile">Fecha</th></tr></thead>
      <tbody>${state.ventas.slice(0,10).map(v=>{const p=state.productos.find(x=>x.id===v.producto_id);return `<tr>
        <td style="font-weight:700">${p?.nombre||'—'}</td><td>${v.cantidad}</td>
        <td style="font-weight:700;color:var(--green)">$${Number(v.total).toFixed(2)}</td>
        <td>${v.metodo_pago==='tarjeta'?'<i class="ti ti-credit-card"></i> Tarjeta':'<i class="ti ti-cash"></i> Efectivo'}</td>
        <td class="hide-mobile" style="color:var(--green)">$${gananciaVenta(v).toFixed(2)}</td>
        <td class="hide-mobile" style="color:var(--text2)">${v.created_at?fmt(localISO(v.created_at)):'—'}</td>
      </tr>`;}).join('')}</tbody></table></div></div>`:''}`;
}

function renderAlerts() {
  const todas = getAlerts();
  const visibles = getVisibleAlerts();
  const descartadas = todas.length - visibles.length;
  const conEmail = state.clients.filter(c=>{
    if(c.estado!=='Activo'||!c.email||!c.cobro) return false;
    const d=diffDays(today,c.cobro); return d>=0&&d<=7;
  }).length;
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;color:var(--text2)">${visibles.length} alerta${visibles.length!==1?'s':''} activa${visibles.length!==1?'s':''}${descartadas>0?` · <span style="color:var(--text3)">${descartadas} descartada${descartadas!==1?'s':''}</span>`:''}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${conEmail>0?`<button class="btn small primary" onclick="enviarEmailTodosVencen()"><i class="ti ti-mail"></i> Avisar a ${conEmail} que vencen esta semana</button>`:''}
        ${descartadas>0?`<button class="btn small" onclick="restoreAlerts()"><i class="ti ti-refresh"></i> Restaurar</button>`:''}
        ${visibles.length>0?`<button class="btn small danger" onclick="dismissAllAlerts()"><i class="ti ti-bell-off"></i> Limpiar todas</button>`:''}
      </div>
    </div>
    ${visibles.length ? visibles.map(a=>`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div class="alert-card" onclick="openClient(${a.id})" style="flex:1;margin:0">
          <div class="alert-dot ${a.type}"></div>
          <div style="flex:1;font-size:14px">${a.msg}</div>
          <i class="ti ti-chevron-right" style="color:var(--text3)"></i>
        </div>
        <button class="btn small" onclick="dismissAlert('${a.key}',event)" title="Descartar alerta" style="flex-shrink:0"><i class="ti ti-x"></i></button>
      </div>`).join('') : '<div class="empty">Sin alertas activas ✅<br><br><span style="font-size:12px;color:var(--text3)">Las alertas se reinician cada día automáticamente</span></div>'}`;
}
