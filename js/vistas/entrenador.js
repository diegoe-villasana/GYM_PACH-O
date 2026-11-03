// ═══════════ VISTAS ENTRENADOR ═══════════
function renderMisClases() {
  const mis = state.clases.filter(c=>c.fecha>=todayStr&&c.estado==='activa').slice(0,20);
  const hoy = mis.filter(c=>c.fecha===todayStr);
  const proximas = mis.filter(c=>c.fecha>todayStr);
  return `
    <div class="metric-grid" style="margin-bottom:20px">
      <div class="metric"><div class="metric-label">Clases hoy</div><div class="metric-value" style="color:#E8001C">${hoy.length}</div></div>
      <div class="metric"><div class="metric-label">Próximas clases</div><div class="metric-value">${proximas.length}</div></div>
    </div>
    ${hoy.length?`<div class="section-title">HOY</div>${hoy.map(renderClaseCardEntrenador).join('')}`:''}
    ${proximas.length?`<div class="section-title" style="margin-top:16px">PRÓXIMAS</div>${proximas.slice(0,10).map(renderClaseCardEntrenador).join('')}`:''}
    ${!hoy.length&&!proximas.length?'<div class="empty">No tienes clases programadas</div>':''}`;
}

function renderClaseCardEntrenador(c) {
  const total=state.reservas.filter(r=>r.clase_id===c.id&&r.estado!=='cancelada').length;
  const max=c.capacidad_maxima;
  return `<div class="clase-card">
    <div class="clase-hora">${fmtHora(c.hora_inicio)}</div>
    <div class="clase-info">
      <div class="clase-nombre">${c.tipos_clase?.nombre||'—'}</div>
      <div class="clase-meta">${c.fecha===todayStr?'<strong style="color:#E8001C">Hoy</strong> · ':fmt(c.fecha)+' · '}hasta ${fmtHora(c.hora_fin)}</div>
    </div>
    <div class="clase-plazas ${total>=max?'lleno':total>=max*0.75?'poco':'ok'}">${total}/${max}</div>
    <button class="btn small primary" onclick="verAsistentesClase(${c.id})"><i class="ti ti-clipboard-check"></i> Lista</button>
  </div>`;
}

function renderAsistenciaClase() {
  const clasesHoy = state.clases.filter(c=>c.fecha===todayStr&&c.estado==='activa');
  if(!clasesHoy.length) return '<div class="empty">No tienes clases hoy</div>';
  return clasesHoy.map(c=>{
    const rs = state.reservas.filter(r=>r.clase_id===c.id&&r.estado!=='cancelada');
    return `
      <div style="margin-bottom:24px">
        <div class="section-title">${fmtHora(c.hora_inicio)} — ${c.tipos_clase?.nombre||'Clase'}</div>
        <div class="table-card"><table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Estado</th><th>Asistencia</th></tr></thead>
        <tbody>${rs.map(r=>`<tr>
          <td style="font-weight:700">${r.clientes?.nombre||'—'}</td>
          <td style="color:var(--text2)">${r.clientes?.telefono||'—'}</td>
          <td><span class="badge ${r.estado}">${r.estado}</span></td>
          <td><div style="display:flex;gap:4px">
            ${r.estado==='reservada'?`
              <button class="btn small success" onclick="cambiarEstadoReserva(${r.id},'asistio')"><i class="ti ti-check"></i> Asistió</button>
              <button class="btn small danger" onclick="cambiarEstadoReserva(${r.id},'no_asistio')"><i class="ti ti-x"></i> No</button>
            `:r.estado==='asistio'?'✅':r.estado==='no_asistio'?'❌':'—'}
          </div></td>
        </tr>`).join('')||'<tr><td colspan="4" class="empty">Sin reservas</td></tr>'}
        </tbody></table></div>
      </div>`;
  }).join('');
}

