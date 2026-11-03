// ═══════════ VISTA: CHECK-INS TOTALPASS (dentro de Asistencia) ═══════════

const TP_ESTADOS = {
  pendiente:'Pendiente', validado:'Validado', expirado:'Expirado', no_disponible:'No disponible',
  no_encontrado:'No encontrado', error:'Error', descartado:'Descartado',
};
const TP_BADGE = { validado:'activo', pendiente:'pendiente', expirado:'vencida', descartado:'cancelada' };

const tpVencido = c => c.expires_at && new Date(c.expires_at).getTime() < Date.now();

function renderTotalpassCheckins() {
  const lista = state.tpCheckins||[];
  const pendientes = lista.filter(c=>c.estado==='pendiente' && !tpVencido(c));
  const hoy = lista.filter(c=>(c.estado!=='pendiente'||tpVencido(c)) && localISO(new Date(c.created_at))===todayStr);
  const wh = state.tpWebhook;
  const whTxt = !wh ? '' : wh.error ? `<span style="color:var(--red)">${escHtml(wh.error)}</span>`
    : wh.registrado&&wh.correcto ? `<span style="color:var(--green)">Webhook activo ✓</span>`
    : wh.registrado ? `<span style="color:var(--amber)">Webhook apunta a otra URL</span>`
    : `<span style="color:var(--amber)">Webhook sin registrar</span>`;
  const optsCliente = sel => `<option value="">— Ligar a cliente —</option>`+state.clients.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${escHtml(c.nombre)}</option>`).join('');

  return `
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <div class="section-title" style="margin:0">TotalPass — check-ins ${pendientes.length?`<span class="alerts-badge">${pendientes.length}</span>`:''}</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px">
          ${whTxt}
          ${wh&&!wh.error&&!(wh.registrado&&wh.correcto)?`<button class="btn small primary" id="tp-registrar" onclick="tpRegistrarWebhook()"><i class="ti ti-plug-connected"></i> Registrar webhook</button>`:''}
          <button class="btn small" id="tp-estado" onclick="tpEstadoWebhook()"><i class="ti ti-settings"></i> Conexión</button>
          <button class="btn small" onclick="loadAll()"><i class="ti ti-refresh"></i></button>
        </div>
      </div>
      <div class="table-card">
        ${pendientes.length?`<table><thead><tr><th>Usuario TotalPass</th><th class="hide-mobile">Vence</th><th>Cliente</th><th></th></tr></thead><tbody>
          ${pendientes.map(c=>`<tr>
            <td><div style="font-weight:700">${escHtml(c.nombre||'Sin nombre')}</div><div style="font-size:11px;color:var(--text3)">${escHtml(c.email||c.telefono||c.tp_user_code||'')}</div></td>
            <td class="hide-mobile" style="font-size:12px;color:var(--text2)">${c.expires_at?new Date(c.expires_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
            <td><select class="form-input" style="padding:6px 8px;font-size:12px" id="tp-cli-${c.id}">${optsCliente(c.cliente_id)}</select></td>
            <td style="white-space:nowrap">
              <button class="btn small primary" id="tp-val-${c.id}" onclick="tpValidar('${c.id}')"><i class="ti ti-check"></i> Validar</button>
              <button class="btn small" onclick="tpDescartar('${c.id}')" title="Descartar"><i class="ti ti-x"></i></button>
            </td></tr>`).join('')}
        </tbody></table>`:`<div style="padding:16px;font-size:13px;color:var(--text3)">Sin check-ins pendientes. Cuando un usuario de TotalPass haga check-in en la app aparecerá aquí.</div>`}
        ${hoy.length?`<div style="border-top:1px solid var(--border);padding:10px 16px;display:flex;flex-direction:column;gap:6px">
          ${hoy.map(c=>{ const e=c.estado==='pendiente'?'expirado':c.estado; return `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px">
            <span>${escHtml(c.nombre||'Sin nombre')} <span style="color:var(--text3)">${new Date(c.created_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</span></span>
            <span class="badge ${TP_BADGE[e]||'no_asistio'}">${TP_ESTADOS[e]||e}</span></div>`; }).join('')}
        </div>`:''}
      </div>
    </div>`;
}
