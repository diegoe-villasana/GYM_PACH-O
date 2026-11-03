// ═══════════ PORTAL DEL CLIENTE ═══════════
// Pantallas para el rol "cliente": Inicio, Horario, Eventos, Membresías y el panel de Cuenta.
const PORTAL_TABS = [
  {id:'inicio',     label:'Inicio'},
  {id:'horario',    label:'Horario'},
  {id:'eventos',    label:'Eventos'},
  {id:'membresias', label:'Membresías'},
];
const PORTAL_TZ = 'America/Monterrey';
const DIAS_CORTOS = ['Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.','Dom.'];
const ESTADOS_RESERVA = {reservada:'Reservada', asistio:'Asistió', no_asistio:'No asistió', cancelada:'Cancelada', lista_espera:'Lista de espera'};

const lunesDe = d => { const r=parseD(d); r.setDate(r.getDate()-((r.getDay()+6)%7)); return localISO(r); };
const fmtLargo = d => parseD(d).toLocaleDateString('es-MX',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).replace(/,/g,'').replace(/ de /g,' ');
const fmtMes = ym => { const s=parseD(ym+'-01').toLocaleDateString('es-MX',{month:'long',year:'numeric'}).replace(' de ',' '); return s[0].toUpperCase()+s.slice(1); };
const horaTZ = () => new Date().toLocaleTimeString('en-US',{timeZone:PORTAL_TZ,hour:'2-digit',minute:'2-digit'});
const iniciales = n => { const w=(n||'?').trim().split(/\s+/); return (w[0][0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase(); };
const inicioClase = c => new Date(`${c.fecha}T${(c.hora_inicio||'00:00').slice(0,5)}:00`);
const dinero = n => '$' + (Number(n)||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});

const portalInicial = () => ({
  view:'inicio', dia:todayStr, semana:lunesDe(todayStr),
  filtroTipo:'', filtroEntrenador:'', filtrosAbiertos:false, cuentaAbierta:false,
});

const nombreCliente = () => state.perfil?.nombre || state.userEmail || 'Mi cuenta';

function renderPortal() {
  const p = state.portal;
  document.getElementById('portal-nav').innerHTML = PORTAL_TABS.map(t=>
    `<button class="pt-tab ${p.view===t.id?'active':''}" onclick="portalIr('${t.id}')">${t.label}</button>`).join('');
  document.getElementById('portal-avatar').textContent = iniciales(nombreCliente());
  document.getElementById('portal-content').innerHTML = renderPortalVista();
  document.getElementById('portal-cuenta').innerHTML = p.cuentaAbierta ? renderCuenta() : '';
}

function renderPortalVista() {
  switch(state.portal.view) {
    case 'inicio': return renderPortalInicio();
    case 'horario': return renderPortalHorario();
    case 'eventos': return renderPortalEventos();
    case 'membresias': return renderPortalMembresias();
    case 'dashboard': return renderPortalDashboard();
    case 'mi-perfil': return renderPortalPerfil();
    case 'mis-reservas': return renderPortalReservas();
    case 'mis-membresias': return renderPortalMisMembresias();
    case 'mis-facturas': return renderPortalFacturas();
    case 'terminos': return renderPortalTerminos();
  }
  return '';
}

// Barra de título + zona horaria, compartida por Horario y Eventos
function portalTitulo(titulo, conFiltros) {
  const p = state.portal;
  return `
    <div class="pt-title-row">
      <h1 class="pt-h1">${titulo}</h1>
      ${conFiltros?`<button class="pt-btn-outline ${p.filtrosAbiertos?'on':''}" onclick="toggleFiltros()"><i class="ti ti-adjustments-alt"></i> Filtros</button>`:''}
    </div>
    ${conFiltros&&p.filtrosAbiertos?renderFiltros():''}
    ${conFiltros?`<div class="pt-tz"><b>Zona horaria:</b><span class="pt-tz-pill"><i class="ti ti-world"></i> Mexico - Monterrey (${horaTZ()})</span></div>`:''}`;
}

function renderFiltros() {
  const p = state.portal;
  return `<div class="pt-filtros">
    <div><label>Tipo de clase</label>
      <select class="pt-select" onchange="setFiltro('filtroTipo',this.value)">
        <option value="">Todas</option>
        ${state.tiposClase.map(t=>`<option value="${t.id}" ${String(p.filtroTipo)===String(t.id)?'selected':''}>${t.nombre}</option>`).join('')}
      </select></div>
    <div><label>Entrenador</label>
      <select class="pt-select" onchange="setFiltro('filtroEntrenador',this.value)">
        <option value="">Todos</option>
        ${state.entrenadores.map(e=>`<option value="${e.id}" ${String(p.filtroEntrenador)===String(e.id)?'selected':''}>${e.nombre}</option>`).join('')}
      </select></div>
    ${p.filtroTipo||p.filtroEntrenador?`<button class="pt-btn ghost small" onclick="limpiarFiltros()">Limpiar filtros</button>`:''}
  </div>`;
}

function clasesFiltradas() {
  const p = state.portal;
  return state.clases.filter(c=>
    (!p.filtroTipo || String(c.tipo_clase_id)===String(p.filtroTipo)) &&
    (!p.filtroEntrenador || String(c.entrenador_id)===String(p.filtroEntrenador)));
}

// ── Inicio ──
function renderPortalInicio() {
  return `<section class="pt-hero">
    <div class="pt-hero-text"><span>STUDIO</span><span>8:7</span></div>
    <img src="./img/hero.jpg" alt="" onerror="this.remove()" />
    <button class="pt-btn" onclick="portalIr('membresias')">Únete a la familia Studio 8:7</button>
  </section>`;
}

// ── Horario ──
function renderPortalHorario() {
  const p = state.portal;
  const dias = [...Array(7)].map((_,i)=>localISO(addDays(p.semana,i)));
  const clases = clasesFiltradas();
  const fechasConClase = new Set(clases.map(c=>c.fecha));
  const delDia = clases.filter(c=>c.fecha===p.dia);
  const siguiente = [...fechasConClase].filter(f=>f>p.dia).sort()[0];
  const meses = [...Array(6)].map((_,i)=>{ const d=new Date(today.getFullYear(), today.getMonth()+i, 1); return localISO(d).slice(0,7); });
  return `<div class="pt-page">
    ${portalTitulo('Horario', true)}
    <div class="pt-cal-bar">
      <select class="pt-select" onchange="horarioMes(this.value)">
        ${meses.map(m=>`<option value="${m}" ${p.dia.slice(0,7)===m?'selected':''}>${fmtMes(m)}</option>`).join('')}
      </select>
      <div class="pt-cal-nav">
        <button class="pt-circle" onclick="horarioSemana(-1)" title="Semana anterior"><i class="ti ti-chevron-left"></i></button>
        <button class="pt-hoy" onclick="horarioDia(todayStr)">Hoy</button>
        <button class="pt-circle" onclick="horarioSemana(1)" title="Semana siguiente"><i class="ti ti-chevron-right"></i></button>
      </div>
    </div>
    <div class="pt-week">
      ${dias.map((f,i)=>`<button class="pt-day ${f===p.dia?'active':''} ${fechasConClase.has(f)?'has':''}" onclick="horarioDia('${f}')">${DIAS_CORTOS[i]}<br>${f.slice(8)}</button>`).join('')}
    </div>
    <div class="pt-day-box">
      <div class="pt-day-head">${fmtLargo(p.dia)}</div>
      ${delDia.length ? delDia.map(renderPortalClase).join('') : `<div class="pt-empty-day">
        <b>No hay clases</b> para este día.<br>
        ${siguiente?`Pero puedes reservar para el ${fmtLargo(siguiente)}<br>
          <button class="pt-btn" onclick="horarioDia('${siguiente}')">Ir al ${fmtLargo(siguiente)}</button>`
          :'Aún no hay clases programadas próximamente.'}
      </div>`}
    </div>
    <button class="pt-next" onclick="horarioDia('${localISO(addDays(p.dia,1))}')">Ver día siguiente</button>
  </div>`;
}

function renderPortalClase(c) {
  const memb = state.membresias[0];
  const sinClases = !memb || ((memb.clases_totales||0)-(memb.clases_usadas||0))<=0;
  const total = state.clasesOcupacion?.[c.id] ?? 0, max = c.capacidad_maxima, lleno = total>=max;
  const yaReserve = state.reservas.find(r=>r.clase_id===c.id&&r.estado==='reservada');
  const paso = inicioClase(c) < new Date();
  return `<div class="pt-clase">
    <div class="pt-clase-hora">${fmtHora(c.hora_inicio)}<small>hasta ${fmtHora(c.hora_fin)}</small></div>
    <span class="pt-clase-dot" style="background:${c.tipos_clase?.color||'var(--p-accent)'}"></span>
    <div class="pt-clase-info">
      <div class="pt-clase-nombre">${c.tipos_clase?.nombre||'Clase'}</div>
      <div class="pt-clase-meta"><i class="ti ti-user"></i> ${c.entrenadores?.nombre||'—'}</div>
    </div>
    <span class="pt-plazas ${lleno?'lleno':''}">${total}/${max} lugares</span>
    ${yaReserve?`<span class="pt-tag ok">✓ Reservada</span>`
      :paso?`<span class="pt-tag">Finalizada</span>`
      :lleno?`<button class="pt-btn small" disabled>Lleno</button>`
      :sinClases?`<button class="pt-btn small" disabled title="Necesitas una membresía con clases disponibles">Sin clases disponibles</button>`
      :`<button class="pt-btn small" onclick="hacerReserva(${c.id})">Reservar</button>`}
  </div>`;
}

// ── Eventos ──
// Todavía no existe una tabla de eventos en Supabase: se muestra el aviso vacío.
function renderPortalEventos() {
  return `<div class="pt-page narrow">
    ${portalTitulo('Eventos', true)}
    <div class="pt-info">Aún no hay eventos. Por favor, contacta a tu administrador para obtener más detalles.</div>
  </div>`;
}

// ── Membresías (planes disponibles) ──
function renderPortalMembresias() {
  const actual = state.membresias[0];
  return `<div class="pt-page narrow">
    <div class="pt-title-row"><h1 class="pt-h1" style="font-size:30px">Membresías</h1></div>
    ${state.planes.length ? `<div class="pt-grid">
      ${state.planes.map(pl=>`<div class="pt-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div class="pt-card-title">${pl.nombre}</div>
          ${actual&&actual.plan_id===pl.id?`<span class="pt-tag ok">Tu plan</span>`:''}
        </div>
        <div class="pt-precio">${dinero(pl.precio)} <small>MXN</small></div>
        <div class="pt-card-meta"><i class="ti ti-calendar-event"></i> ${pl.clases_por_periodo||0} clases</div>
        <div class="pt-card-meta"><i class="ti ti-clock"></i> Vigencia de ${pl.periodo_dias||30} días</div>
        <div class="pt-card-meta" style="margin-top:14px;color:var(--p-text3)">Contrátalo o renuévalo en recepción.</div>
      </div>`).join('')}
    </div>` : `<div class="pt-info">Aún no hay membresías. Por favor, contacta a tu administrador para obtener más detalles.</div>`}
  </div>`;
}

// ── Dashboard del cliente ──
function renderPortalDashboard() {
  const memb = state.membresias[0];
  const proximas = proximasReservas();
  const usadas=memb?.clases_usadas||0, total=memb?.clases_totales||0;
  return `<div class="pt-page mid">
    <h1 class="pt-h1" style="margin-bottom:24px">Hola, ${nombreCliente().split(' ')[0]}</h1>
    <div class="pt-grid" style="margin-bottom:8px">
      <div class="pt-card">
        <div class="pt-card-label">Mi membresía</div>
        ${memb?`<div class="pt-card-title">${memb.planes?.nombre||'—'}</div>
          <div class="pt-precio">${total-usadas} <small>clases restantes</small></div>
          <div class="pt-bar"><div style="width:${total?Math.round(usadas/total*100):0}%"></div></div>
          <div class="pt-card-meta">${usadas} de ${total} usadas · vence ${fmt(memb.fecha_fin)}</div>`
        :`<div class="pt-card-meta" style="margin-top:10px">No tienes una membresía activa.</div>
          <button class="pt-btn small" style="margin-top:14px" onclick="portalIr('membresias')">Ver membresías</button>`}
      </div>
      <div class="pt-card">
        <div class="pt-card-label">Próxima clase</div>
        ${proximas[0]?`<div class="pt-card-title">${proximas[0].clases.tipos_clase?.nombre||'Clase'}</div>
          <div class="pt-precio">${fmtHora(proximas[0].clases.hora_inicio)}</div>
          <div class="pt-card-meta">${fmtLargo(proximas[0].clases.fecha)}</div>`
        :`<div class="pt-card-meta" style="margin-top:10px">No tienes clases reservadas.</div>`}
        <button class="pt-btn small" style="margin-top:14px" onclick="portalIr('horario')">Reservar clase</button>
      </div>
    </div>
    <h2 class="pt-h2">Próximas reservas</h2>
    ${renderListaReservas(proximas, true)}
  </div>`;
}

// ── Cuenta: Mis reservas ──
function proximasReservas() {
  const ahora = new Date();
  return state.reservas.filter(r=>r.estado==='reservada'&&r.clases&&inicioClase(r.clases)>ahora)
    .sort((a,b)=>inicioClase(a.clases)-inicioClase(b.clases));
}

function renderListaReservas(lista, cancelable) {
  if(!lista.length) return `<div class="pt-info">No tienes reservas próximas.</div>`;
  return `<div class="pt-list">${lista.map(r=>{
    const cl = r.clases;
    const recupera = (inicioClase(cl)-new Date())/36e5 >= 12;
    return `<div class="pt-clase">
      <div class="pt-clase-hora">${fmtHora(cl.hora_inicio)}<small>${fmt(cl.fecha)}</small></div>
      <span class="pt-clase-dot" style="background:${cl.tipos_clase?.color||'var(--p-accent)'}"></span>
      <div class="pt-clase-info">
        <div class="pt-clase-nombre">${cl.tipos_clase?.nombre||'Clase'}</div>
        <div class="pt-clase-meta">${cl.entrenadores?.nombre||'—'}</div>
      </div>
      ${cancelable
        ?`<button class="pt-btn danger small" onclick="cancelarMiReserva(${r.id},${recupera})" title="${recupera?'Recuperarás la clase':'No recuperarás la clase (menos de 12h)'}">${recupera?'Cancelar':'Cancelar (sin recuperar)'}</button>`
        :`<span class="pt-tag ${r.estado==='asistio'?'ok':r.estado==='no_asistio'?'bad':''}">${ESTADOS_RESERVA[r.estado]||r.estado}</span>`}
    </div>`;
  }).join('')}</div>`;
}

function renderPortalReservas() {
  const proximas = proximasReservas();
  const ids = new Set(proximas.map(r=>r.id));
  const historial = state.reservas.filter(r=>!ids.has(r.id)&&r.clases).slice(0,20);
  return `<div class="pt-page mid">
    <h1 class="pt-h1">Mis reservas</h1>
    <h2 class="pt-h2">Próximas</h2>
    ${renderListaReservas(proximas, true)}
    ${historial.length?`<h2 class="pt-h2">Historial</h2>${renderListaReservas(historial, false)}`:''}
  </div>`;
}

// ── Cuenta: Mis membresías ──
function renderPortalMisMembresias() {
  const lista = state.misMembresias||[];
  return `<div class="pt-page mid">
    <h1 class="pt-h1" style="margin-bottom:24px">Mis membresías</h1>
    ${lista.length?`<div class="pt-grid">${lista.map(m=>{
      const usadas=m.clases_usadas||0, total=m.clases_totales||0;
      return `<div class="pt-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div class="pt-card-title">${m.planes?.nombre||'—'}</div>
          <span class="pt-tag ${m.estado==='activa'?'ok':''}">${m.estado}</span>
        </div>
        <div class="pt-card-meta">${fmt(m.fecha_inicio)} — ${fmt(m.fecha_fin)}</div>
        <div class="pt-bar"><div style="width:${total?Math.round(usadas/total*100):0}%"></div></div>
        <div class="pt-card-meta">${usadas} de ${total} clases usadas</div>
      </div>`;}).join('')}</div>`
    :`<div class="pt-info">Aún no tienes membresías. Por favor, contacta a tu administrador para obtener más detalles.</div>`}
  </div>`;
}

// ── Cuenta: Mis facturas (pagos) ──
function renderPortalFacturas() {
  const pagos = state.misPagos||[];
  return `<div class="pt-page mid">
    <h1 class="pt-h1" style="margin-bottom:24px">Mis facturas</h1>
    ${pagos.length?`<div class="pt-list" style="overflow-x:auto"><table class="pt-table">
      <thead><tr><th>Fecha</th><th>Monto</th><th>Estado</th></tr></thead>
      <tbody>${pagos.map(pg=>`<tr><td>${fmt(pg.fecha)}</td><td>${dinero(pg.monto)}</td>
        <td><span class="pt-tag ${pg.estado==='Pagado'?'ok':'warn'}">${pg.estado||'—'}</span></td></tr>`).join('')}</tbody>
    </table></div>`:`<div class="pt-info">Aún no tienes pagos registrados.</div>`}
  </div>`;
}

// ── Cuenta: Mi perfil ──
function renderPortalPerfil() {
  const c = state.perfil||{};
  const memb = state.membresias[0];
  const campo = (l,v) => `<div class="pt-field"><div class="pt-field-label">${l}</div><div class="pt-field-value">${v||'—'}</div></div>`;
  return `<div class="pt-page mid">
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px">
      <div class="pt-avatar" style="cursor:default">${iniciales(nombreCliente())}</div>
      <h1 class="pt-h1">${nombreCliente()}</h1>
    </div>
    <div class="pt-fields">
      ${campo('Nombre', c.nombre)}
      ${campo('Email', c.email||state.userEmail)}
      ${campo('Teléfono', c.telefono)}
      ${campo('Género', c.genero)}
      ${campo('Miembro desde', c.inicio?fmt(c.inicio):c.created_at?fmt(c.created_at):'')}
      ${campo('Plan actual', memb?.planes?.nombre)}
    </div>
    <div class="pt-card-meta" style="margin-top:16px;color:var(--p-text3)">¿Algún dato está mal? Pide en recepción que lo actualicen.</div>
  </div>`;
}

// ── Privacidad y términos (reutiliza la carta responsiva del registro) ──
function renderPortalTerminos() {
  const carta = document.querySelector('#registro-screen .responsiva');
  return `<div class="pt-page mid">
    <h1 class="pt-h1" style="margin-bottom:24px">Privacidad y términos</h1>
    <div class="pt-legal">${carta?carta.innerHTML:''}</div>
  </div>`;
}

// ── Panel lateral de Cuenta ──
function renderCuenta() {
  const memb = state.membresias[0];
  const item = (v,l) => `<button class="pt-menu-item" onclick="portalIr('${v}')">${l}<i class="ti ti-chevron-right"></i></button>`;
  return `<div class="pt-overlay" onclick="cerrarCuenta()"></div>
  <aside class="pt-drawer">
    <div class="pt-drawer-head">
      <button class="pt-icon-btn" onclick="cerrarCuenta()"><i class="ti ti-arrow-left"></i></button>
      <span>Cuenta</span>
      <button class="pt-icon-btn" onclick="cerrarCuenta()"><i class="ti ti-x"></i></button>
    </div>
    <div class="pt-profile">
      <div class="pt-avatar">${iniciales(nombreCliente())}</div>
      <div>
        <div class="pt-profile-name">${nombreCliente()}</div>
        <div class="pt-profile-mail">${state.perfil?.email||state.userEmail||''}</div>
        ${memb?`<div class="pt-profile-plan">${memb.planes?.nombre||'Membresía'} - ${(memb.clases_totales||0)-(memb.clases_usadas||0)} clases</div>`:''}
      </div>
    </div>
    <div class="pt-menu">
      ${item('dashboard','Dashboard')}${item('inicio','Inicio')}${item('mi-perfil','Mi perfil')}
      ${item('mis-reservas','Mis reservas')}${item('mis-membresias','Mis membresías')}${item('mis-facturas','Mis facturas')}
    </div>
    <div class="pt-menu">
      <div class="pt-menu-item static">Idioma<span>Español</span></div>
      <div class="pt-menu-item static">Zona horaria<span>Mexico - Monterrey (${horaTZ()})</span></div>
    </div>
    <div class="pt-menu">${item('terminos','Privacidad y términos')}</div>
    <div class="pt-menu"><button class="pt-menu-item logout" onclick="doLogout()">Cerrar sesión<i class="ti ti-logout"></i></button></div>
  </aside>`;
}
