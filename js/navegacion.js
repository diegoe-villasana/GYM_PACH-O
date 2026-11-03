// ── Navegación ──
const NAV_ADMIN = [
  {section:'GESTIÓN'},
  {id:'dashboard',    icon:'ti-dashboard',      label:'Dashboard'},
  {id:'clients',      icon:'ti-users',          label:'Clientes'},
  {id:'payments',     icon:'ti-credit-card',    label:'Pagos'},
  {id:'membresias',   icon:'ti-id-badge',       label:'Membresías'},
  {section:'CLASES'},
  {id:'clases-admin', icon:'ti-calendar-event', label:'Clases'},
  {id:'reservas-admin',icon:'ti-clipboard-list',label:'Reservas'},
  {section:'OPERACIÓN'},
  {id:'asistencia',   icon:'ti-calendar-check', label:'Asistencia'},
  {id:'inventario',   icon:'ti-package',        label:'Inventario'},
  {id:'alerts',       icon:'ti-bell',           label:'Recordatorios'},
];
const NAV_ENTRENADOR = [
  {id:'mis-clases',       icon:'ti-calendar-event',  label:'Mis clases'},
  {id:'asistencia-clase', icon:'ti-clipboard-check', label:'Pasar lista'},
];
const NAV_CLIENTE = [
  {id:'mis-reservas', icon:'ti-calendar-heart', label:'Mis reservas'},
  {id:'reservar',     icon:'ti-calendar-plus',  label:'Reservar clase'},
  {id:'mi-membresia', icon:'ti-id-badge',       label:'Mi membresía'},
];
const TITLES = {
  'dashboard':'Dashboard','clients':'Clientes','payments':'Pagos','membresias':'Membresías',
  'clases-admin':'Clases','reservas-admin':'Reservas','asistencia':'Asistencia',
  'inventario':'Inventario','alerts':'Recordatorios',
  'mis-clases':'Mis Clases','asistencia-clase':'Pasar Lista',
  'mis-reservas':'Mis Reservas','reservar':'Reservar Clase','mi-membresia':'Mi Membresía',
  'client-detail':'Cliente',
};
const setTitle = v => { document.getElementById('page-title').textContent = TITLES[v]||v; };

function getNavItems() {
  if(state.rol==='admin') return NAV_ADMIN;
  if(state.rol==='entrenador') return NAV_ENTRENADOR;
  return NAV_CLIENTE;
}

function renderNav() {
  const alerts = state.rol==='admin' ? getVisibleAlerts() : [];
  document.getElementById('nav').innerHTML = getNavItems().map(n => {
    if(n.section) return `<div class="nav-section">${n.section}</div>`;
    const isActive = state.view===n.id || (state.view==='client-detail'&&n.id==='clients');
    return `<button class="nav-item ${isActive?'active':''}" onclick="navigate('${n.id}')">
      <i class="ti ${n.icon}"></i>${n.label}
      ${n.id==='alerts'&&alerts.length?`<span class="alerts-badge">${alerts.length}</span>`:''}
    </button>`;
  }).join('');
}

async function navigate(v) {
  state.view=v; state.selectedClient=null;
  setTitle(v);
  await loadAll();
}

function renderView() {
  switch(state.view) {
    case 'dashboard': return renderDashboard();
    case 'clients': return renderClients();
    case 'client-detail': return renderClientDetail();
    case 'payments': return renderPayments();
    case 'membresias': return renderMembresias();
    case 'clases-admin': return renderClasesAdmin();
    case 'reservas-admin': return renderReservasAdmin();
    case 'asistencia': return renderAsistencia();
    case 'inventario': return renderInventario();
    case 'alerts': return renderAlerts();
    case 'mis-clases': return renderMisClases();
    case 'asistencia-clase': return renderAsistenciaClase();
    case 'mis-reservas': return renderMisReservas();
    case 'reservar': return renderReservar();
    case 'mi-membresia': return renderMiMembresia();
  }
  return '';
}

// Re-pinta conservando el foco del buscador mientras se escribe
function render() {
  if(state.rol==='cliente') return renderPortal();
  renderNav();
  const el = document.getElementById('content');
  const ae = document.activeElement;
  let idx=-1, pos=0;
  if(ae && ae.tagName==='INPUT' && el.contains(ae)) { idx=[...el.querySelectorAll('input')].indexOf(ae); try{pos=ae.selectionStart;}catch(e){} }
  el.innerHTML = renderView();
  if(idx>=0) { const n=el.querySelectorAll('input')[idx]; if(n){ n.focus(); try{n.setSelectionRange(pos,pos);}catch(e){} } }
}

