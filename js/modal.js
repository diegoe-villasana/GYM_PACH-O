// ═══════════ MODAL ═══════════
function showModal(type, id) { state.showModal={type,id}; renderModal(); }
function closeModal() { state.showModal=null; renderModal(); }
const X_BTN = `<button class="btn small" onclick="closeModal()"><i class="ti ti-x"></i></button>`;
const CANCEL_BTN = `<button class="btn" onclick="closeModal()">Cancelar</button>`;

function renderModal() {
  const root = document.getElementById('modal-root');
  if(!state.showModal){root.innerHTML='';return;}
  const {type,id} = state.showModal;
  const c = id ? state.clients.find(x=>x.id===id) : null;
  const p = id ? state.productos.find(x=>x.id===id) : null;
  const cl = id ? state.clases.find(x=>x.id===id) : null;
  const PLANES_TIPO = ['Mensual','Trimestral','Anual'];
  const CATS = ['Suplementos','Bebidas','Snacks','Ropa','Accesorios','Otro'];
  let inner = '';

  if(type==='new-client') {
    const mes=localISO(addDays(today,30));
    inner=`<div class="modal-title">Nuevo cliente ${X_BTN}</div>
      <div class="form-row"><div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" id="f-nombre" /></div>
      <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" id="f-tel" /></div></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="f-email" type="email" /></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Inicio</label><input class="form-input" id="f-inicio" type="date" value="${todayStr}" /></div>
      <div class="form-group"><label class="form-label">Próximo cobro</label><input class="form-input" id="f-cobro" type="date" value="${mes}" /></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Plan</label><select class="form-input" id="f-plan">${PLANES_TIPO.map(x=>`<option>${x}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Importe ($)</label><input class="form-input" id="f-importe" type="number" step="0.01" /></div></div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-input" id="f-notas" style="min-height:70px;resize:vertical"></textarea></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveNewClient()">Guardar</button></div>`;
  }
  if(type==='edit-client'&&c) {
    inner=`<div class="modal-title">Editar — ${c.nombre} ${X_BTN}</div>
      <div class="form-row"><div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="f-nombre" value="${c.nombre}" /></div>
      <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" id="f-tel" value="${c.telefono||''}" /></div></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="f-email" value="${c.email||''}" /></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Inicio</label><input class="form-input" id="f-inicio" type="date" value="${c.inicio||''}" /></div>
      <div class="form-group"><label class="form-label">Cobro</label><input class="form-input" id="f-cobro" type="date" value="${c.cobro||''}" /></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Plan</label><select class="form-input" id="f-plan">${PLANES_TIPO.map(pt=>`<option ${pt===c.plan?'selected':''}>${pt}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Importe ($)</label><input class="form-input" id="f-importe" type="number" step="0.01" value="${c.importe||''}" /></div></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveEditClient(${c.id})">Guardar</button></div>`;
  }
  if(type==='new-payment'&&c) {
    inner=`<div class="modal-title">Registrar pago — ${c.nombre} ${X_BTN}</div>
      <div class="form-row"><div class="form-group"><label class="form-label">Fecha</label><input class="form-input" id="f-fecha" type="date" value="${todayStr}" /></div>
      <div class="form-group"><label class="form-label">Importe ($)</label><input class="form-input" id="f-monto" type="number" step="0.01" value="${c.importe||35}" /></div></div>
      <div class="form-group"><label class="form-label">Estado</label><select class="form-input" id="f-estado"><option>Pagado</option><option>Pendiente</option></select></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveNewPayment(${c.id})">Registrar</button></div>`;
  }
  if(type==='nueva-membresia'||type==='nueva-membresia-global') {
    const clienteId = type==='nueva-membresia' ? id : null;
    inner=`<div class="modal-title">Asignar membresía ${X_BTN}</div>
      ${!clienteId?`<div class="form-group"><label class="form-label">Cliente</label><select class="form-input" id="f-mclient">${state.clients.map(x=>`<option value="${x.id}">${x.nombre}</option>`).join('')}</select></div>`:''}
      <div class="form-group"><label class="form-label">Plan</label><select class="form-input" id="f-mplan" onchange="actualizarClasesPlan()">${state.planes.map(x=>`<option value="${x.id}" data-clases="${x.clases_por_periodo}" data-dias="${x.periodo_dias}">${x.nombre} (${x.clases_por_periodo} clases)</option>`).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Fecha inicio</label><input class="form-input" id="f-minicio" type="date" value="${todayStr}" onchange="actualizarClasesPlan()" /></div>
      <div class="form-group"><label class="form-label">Fecha fin</label><input class="form-input" id="f-mfin" type="date" /></div></div>
      <div class="form-group"><label class="form-label">Clases incluidas</label><input class="form-input" id="f-mclases" type="number" /></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveMembresia(${clienteId||'null'})">Asignar</button></div>`;
  }
  if(type==='nuevo-plan') {
    inner=`<div class="modal-title">Nuevo plan ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="f-pnombre2" placeholder="Ej: Plan Mensual 8 clases" /></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Clases por período</label><input class="form-input" id="f-pclases" type="number" value="8" /></div>
      <div class="form-group"><label class="form-label">Período (días)</label><input class="form-input" id="f-pdias" type="number" value="30" /></div></div>
      <div class="form-group"><label class="form-label">Precio ($)</label><input class="form-input" id="f-pprecio2" type="number" step="0.01" /></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveNuevoPlan()">Guardar plan</button></div>`;
  }
  if(type==='nuevo-tipo-clase') {
    inner=`<div class="modal-title">Nuevo tipo de clase ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="f-tcnombre" placeholder="Ej: Full Body, Strength..." /></div>
      <div class="form-group"><label class="form-label">Duración (minutos)</label><input class="form-input" id="f-tcdur" type="number" value="60" /></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveNuevoTipoClase()">Guardar</button></div>`;
  }
  if(type==='nuevo-entrenador') {
    inner=`<div class="modal-title">Nuevo entrenador ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="f-enombre" /></div>
      <div class="form-group"><label class="form-label">Especialidad</label><input class="form-input" id="f-eesp" placeholder="Fuerza, Cardio..." /></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveNuevoEntrenador()">Guardar</button></div>`;
  }
  if(type==='nueva-clase') {
    inner=`<div class="modal-title">Nueva clase ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Tipo de clase</label><select class="form-input" id="f-ctipo">${state.tiposClase.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')||'<option value="">— Crea primero un tipo de clase —</option>'}</select></div>
      <div class="form-group"><label class="form-label">Entrenador</label><select class="form-input" id="f-centrenador">${state.entrenadores.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join('')||'<option value="">— Crea primero un entrenador —</option>'}</select></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Fecha</label><input class="form-input" id="f-cfecha" type="date" value="${state.clasesFecha}" /></div>
      <div class="form-group"><label class="form-label">Capacidad máxima</label><input class="form-input" id="f-ccap" type="number" value="8" /></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Hora inicio</label><input class="form-input" id="f-cinicio" type="time" value="08:00" /></div>
      <div class="form-group"><label class="form-label">Hora fin</label><input class="form-input" id="f-cfin" type="time" value="09:00" /></div></div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-input" id="f-cnotas" style="min-height:60px;resize:vertical"></textarea></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveNuevaClase()">Crear clase</button></div>`;
  }
  if(type==='editar-clase'&&cl) {
    inner=`<div class="modal-title">Editar clase ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Tipo de clase</label><select class="form-input" id="f-ctipo">${state.tiposClase.map(t=>`<option value="${t.id}" ${t.id===cl.tipo_clase_id?'selected':''}>${t.nombre}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Entrenador</label><select class="form-input" id="f-centrenador">${state.entrenadores.map(e=>`<option value="${e.id}" ${e.id===cl.entrenador_id?'selected':''}>${e.nombre}</option>`).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Fecha</label><input class="form-input" id="f-cfecha" type="date" value="${cl.fecha}" /></div>
      <div class="form-group"><label class="form-label">Capacidad</label><input class="form-input" id="f-ccap" type="number" value="${cl.capacidad_maxima}" /></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Hora inicio</label><input class="form-input" id="f-cinicio" type="time" value="${cl.hora_inicio?.slice(0,5)}" /></div>
      <div class="form-group"><label class="form-label">Hora fin</label><input class="form-input" id="f-cfin" type="time" value="${cl.hora_fin?.slice(0,5)}" /></div></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveEditarClase(${cl.id})">Guardar</button></div>`;
  }
  if(type==='ver-asistentes') {
    const clase = state.clases.find(x=>x.id===id);
    const rs = state.reservas.filter(r=>r.clase_id===id&&r.estado!=='cancelada');
    inner=`<div class="modal-title">${clase?.tipos_clase?.nombre||'Clase'} — ${fmt(clase?.fecha)} ${fmtHora(clase?.hora_inicio)} ${X_BTN}</div>
      <div style="margin-bottom:12px;font-size:13px;color:var(--text2)">${rs.length}/${clase?.capacidad_maxima} plazas ocupadas</div>
      ${rs.map(r=>`<div class="history-item">
        <i class="ti ti-user" style="color:var(--blue)"></i>
        <div style="flex:1"><div style="font-weight:700">${r.clientes?.nombre||'—'}</div><div style="font-size:11px;color:var(--text3)">${r.clientes?.telefono||''}</div></div>
        <span class="badge ${r.estado}">${r.estado}</span>
        ${r.estado==='reservada'?`
          <button class="btn small success" onclick="cambiarEstadoReserva(${r.id},'asistio')"><i class="ti ti-check"></i></button>
          <button class="btn small danger" onclick="cambiarEstadoReserva(${r.id},'no_asistio')"><i class="ti ti-x"></i></button>
        `:''}
      </div>`).join('')||'<div class="empty">Sin reservas</div>'}`;
  }
  if(type==='nuevo-producto') {
    inner=`<div class="modal-title">Nuevo producto ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input" id="f-pnombre" /></div>
      <div class="form-group"><label class="form-label">Categoría</label><select class="form-input" id="f-pcat">${CATS.map(x=>`<option>${x}</option>`).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Costo ($)</label><input class="form-input" id="f-pcosto" type="number" step="0.01" value="0" /></div>
      <div class="form-group"><label class="form-label">Precio venta ($)</label><input class="form-input" id="f-pprecio" type="number" step="0.01" value="0" /></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Stock</label><input class="form-input" id="f-pstock" type="number" value="0" /></div>
      <div class="form-group"><label class="form-label">Stock mínimo</label><input class="form-input" id="f-pmin" type="number" value="5" /></div></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveNuevoProducto()">Guardar</button></div>`;
  }
  if(type==='editar-producto'&&p) {
    inner=`<div class="modal-title">Editar — ${p.nombre} ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="f-pnombre" value="${p.nombre}" /></div>
      <div class="form-group"><label class="form-label">Categoría</label><select class="form-input" id="f-pcat">${CATS.map(cat=>`<option ${cat===p.categoria?'selected':''}>${cat}</option>`).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Costo ($)</label><input class="form-input" id="f-pcosto" type="number" step="0.01" value="${p.costo||0}" /></div>
      <div class="form-group"><label class="form-label">Precio venta ($)</label><input class="form-input" id="f-pprecio" type="number" step="0.01" value="${p.precio_venta||0}" /></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Stock</label><input class="form-input" id="f-pstock" type="number" value="${p.stock||0}" /></div>
      <div class="form-group"><label class="form-label">Stock mínimo</label><input class="form-input" id="f-pmin" type="number" value="${p.stock_minimo||5}" /></div></div>
      <div class="form-actions"><button class="btn danger" onclick="eliminarProducto(${p.id})">Eliminar</button>${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="saveEditarProducto(${p.id})">Guardar</button></div>`;
  }
  if(type==='reponer'&&p) {
    inner=`<div class="modal-title">Reponer — ${p.nombre} ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Stock actual</label><input class="form-input" disabled value="${p.stock}" /></div>
      <div class="form-group"><label class="form-label">Unidades a añadir</label><input class="form-input" id="f-reponer" type="number" value="10" min="1" /></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="reponerStock(${p.id},${p.stock})">Reponer</button></div>`;
  }
  if(type==='venta-rapida'&&p) {
    inner=`<div class="modal-title">Vender — ${p.nombre} ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Stock</label><input class="form-input" disabled value="${p.stock} unidades" /></div>
      <div class="form-group"><label class="form-label">Precio</label><input class="form-input" disabled value="$${p.precio_venta}" /></div>
      <div class="form-group"><label class="form-label">Cantidad</label><input class="form-input" id="f-vcantidad" type="number" value="1" min="1" max="${p.stock}" /></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="registrarVentaRapida(${p.id})">Registrar</button></div>`;
  }
  if(type==='nueva-venta') {
    inner=`<div class="modal-title">Registrar venta ${X_BTN}</div>
      <div class="form-group"><label class="form-label">Producto *</label><select class="form-input" id="f-vprod" onchange="resetPrecioVenta()">${state.productos.map(x=>`<option value="${x.id}" data-precio="${x.precio_venta}" data-stock="${x.stock}">${x.nombre} (stock: ${x.stock})</option>`).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Cantidad</label><input class="form-input" id="f-vcantidad" type="number" value="1" min="1" oninput="actualizarPrecioVenta()" /></div>
      <div class="form-group"><label class="form-label">Precio unitario ($)</label><input class="form-input" id="f-vprecio" type="number" step="0.01" oninput="actualizarPrecioVenta()" /></div></div>
      <div id="venta-total" style="background:var(--surface2);border-radius:var(--r);padding:12px;font-size:14px;color:var(--text2);margin-bottom:4px"></div>
      <div class="form-actions">${CANCEL_BTN}<button class="btn primary" id="save-btn" onclick="registrarVenta()">Registrar</button></div>`;
  }

  root.innerHTML=`<div class="modal-overlay" onclick="event.target===this&&closeModal()"><div class="modal">${inner}</div></div>`;
  if(type==='nueva-membresia'||type==='nueva-membresia-global') setTimeout(actualizarClasesPlan, 50);
  if(type==='nueva-venta') setTimeout(resetPrecioVenta, 50);
}

