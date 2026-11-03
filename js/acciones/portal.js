// ═══════════ ACCIONES: PORTAL DEL CLIENTE ═══════════

function portalIr(v) {
  Object.assign(state.portal, {view:v, cuentaAbierta:false, filtrosAbiertos:false});
  renderPortal(); window.scrollTo(0,0);
}
function abrirCuenta() { state.portal.cuentaAbierta=true; renderPortal(); }
function cerrarCuenta() { state.portal.cuentaAbierta=false; renderPortal(); }

// Horario
function horarioDia(fecha) { state.portal.dia=fecha; state.portal.semana=lunesDe(fecha); renderPortal(); }
function horarioSemana(dir) { horarioDia(localISO(addDays(state.portal.semana, 7*dir))); }
function horarioMes(ym) { horarioDia(ym===todayStr.slice(0,7) ? todayStr : ym+'-01'); }

// Filtros
function toggleFiltros() { state.portal.filtrosAbiertos=!state.portal.filtrosAbiertos; renderPortal(); }
function setFiltro(k, v) { state.portal[k]=v; renderPortal(); }
function limpiarFiltros() { state.portal.filtroTipo=''; state.portal.filtroEntrenador=''; renderPortal(); }
