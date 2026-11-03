// ── Alertas ──
const alertStorageKey = key => 'alert_' + todayStr + '_' + key;
function isAlertDismissed(key) { try { return localStorage.getItem(alertStorageKey(key))==='1'; } catch(e) { return false; } }
function dismissAlert(key, ev) { if(ev) ev.stopPropagation(); try { localStorage.setItem(alertStorageKey(key),'1'); } catch(e){} render(); }
function dismissAllAlerts() { getAlerts().forEach(a=>{ try{localStorage.setItem(alertStorageKey(a.key),'1');}catch(e){} }); render(); }
function restoreAlerts() { try { Object.keys(localStorage).filter(k=>k.startsWith('alert_')).forEach(k=>localStorage.removeItem(k)); } catch(e){} render(); }

function getAlerts() {
  const alerts = [];
  state.clients.forEach(c => {
    if(c.estado!=='Activo') return;
    if(c.cobro) {
      const days = diffDays(today, c.cobro);
      if(days===1) alerts.push({type:'red', msg:`⚠️ ${c.nombre} vence mañana`, id:c.id, key:c.id+'_manana'});
      else if(days>=0&&days<=3) alerts.push({type:'amber', msg:`📅 ${c.nombre} vence en ${days} días`, id:c.id, key:c.id+'_prox'});
      else if(days<0) alerts.push({type:'red', msg:`🔴 ${c.nombre} vencido hace ${Math.abs(days)}d`, id:c.id, key:c.id+'_vencido'});
    }
    if(state.pagos.find(p=>p.cliente_id===c.id&&p.estado==='Pendiente'))
      alerts.push({type:'amber', msg:`💳 ${c.nombre} no ha pagado`, id:c.id, key:c.id+'_pago'});
  });
  return alerts;
}
function getVisibleAlerts() { return getAlerts().filter(a=>!isAlertDismissed(a.key)); }

