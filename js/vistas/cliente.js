// ═══════════ VISTAS CLIENTE ═══════════
function renderMisReservas() {
  const memb = state.membresias[0];
  const activas = state.reservas.filter(r=>r.estado==='reservada');
  const historial = state.reservas.filter(r=>r.estado!=='reservada');
  return `
    ${memb?`<div style="background:var(--surface);border:0.5px solid var(--border);border-radius:var(--rl);padding:16px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:1px">Mi membresía</div>
          <div style="font-size:16px;font-weight:700;margin-top:2px">${memb.planes?.nombre||'—'}</div></div>
        <div style="text-align:right"><div style="font-size:24px;font-weight:900;color:#E8001C">${(memb.clases_totales||0)-(memb.clases_usadas||0)}</div>
          <div style="font-size:11px;color:var(--text3)">clases restantes</div></div>
      </div>
      <div class="membresia-bar" style="margin-top:10px"><div class="membresia-fill" style="width:${memb.clases_totales?Math.round((memb.clases_usadas||0)/memb.clases_totales*100):0}%"></div></div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">Válida hasta ${fmt(memb.fecha_fin)}</div>
    </div>`:`<div style="background:var(--red-bg);border-radius:var(--rl);padding:14px;margin-bottom:20px;font-size:13px;color:var(--red-text)">
      ⚠️ No tienes una membresía activa. Contacta con el gimnasio para activar tu plan.
    </div>`}
    <div class="section-title">Próximas reservas</div>
    ${activas.length?activas.map(r=>{
      const cl=r.clases; if(!cl) return '';
      const inicio = new Date(`${cl.fecha}T${(cl.hora_inicio||'00:00').slice(0,5)}:00`);
      const hrs = (inicio - new Date())/36e5;
      if(hrs<0) return '';
      const recupera = hrs>=12;
      return `<div class="clase-card">
        <div class="clase-hora">${fmtHora(cl.hora_inicio)}</div>
        <div class="clase-info">
          <div class="clase-nombre">${cl.tipos_clase?.nombre||'—'}</div>
          <div class="clase-meta">${fmt(cl.fecha)} · ${cl.entrenadores?.nombre||'—'}</div>
        </div>
        <span class="badge reservada">Reservada</span>
        <button class="btn small danger" onclick="cancelarMiReserva(${r.id},${recupera})" title="${recupera?'Recuperarás la clase':'No recuperarás la clase (menos de 12h)'}">
          <i class="ti ti-x"></i> ${recupera?'Cancelar':'Cancelar (sin recuperar)'}
        </button>
      </div>`;
    }).join('')||'<div class="empty">Sin reservas próximas</div>':`<div class="empty">Sin reservas próximas. <button class="btn small primary" onclick="navigate('reservar')" style="margin-top:8px">Reservar clase</button></div>`}
    ${historial.length?`<div class="section-title" style="margin-top:20px">Historial</div>
      ${historial.slice(0,10).map(r=>{const cl=r.clases;return `<div class="clase-card" style="opacity:0.7">
        <div class="clase-hora" style="font-size:14px">${fmtHora(cl?.hora_inicio)}</div>
        <div class="clase-info"><div class="clase-nombre">${cl?.tipos_clase?.nombre||'—'}</div><div class="clase-meta">${fmt(cl?.fecha)}</div></div>
        <span class="badge ${r.estado}">${r.estado}</span>
      </div>`;}).join('')}`:''}`;
}

function renderReservar() {
  const memb = state.membresias[0];
  const sinClases = memb && ((memb.clases_totales||0)-(memb.clases_usadas||0))<=0;
  const porFecha = {};
  state.clases.forEach(c=>{ (porFecha[c.fecha]||(porFecha[c.fecha]=[])).push(c); });
  const fechas = Object.keys(porFecha).sort().slice(0,7);
  const manana = localISO(addDays(today,1));
  return `
    ${!memb?`<div style="background:var(--red-bg);border-radius:var(--rl);padding:14px;margin-bottom:20px;font-size:13px;color:var(--red-text)">⚠️ Necesitas una membresía activa para reservar clases.</div>`:''}
    ${sinClases?`<div style="background:var(--amber-bg);border-radius:var(--rl);padding:14px;margin-bottom:20px;font-size:13px;color:var(--amber-text)">⚠️ Has agotado las clases de tu membresía actual. Renueva tu plan para seguir reservando.</div>`:''}
    ${fechas.length?fechas.map(fecha=>{
      const label = fecha===todayStr?'HOY':fecha===manana?'MAÑANA':parseD(fecha).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
      return `<div class="section-title">${label}</div>
        ${porFecha[fecha].map(c=>{
          const total=state.clasesOcupacion?.[c.id]??0;
          const max=c.capacidad_maxima, lleno=total>=max;
          const yaReserve = state.reservas.find(r=>r.clase_id===c.id&&r.estado==='reservada');
          return `<div class="clase-card">
            <div class="clase-hora">${fmtHora(c.hora_inicio)}</div>
            <div class="clase-info">
              <div class="clase-nombre">${c.tipos_clase?.nombre||'—'}</div>
              <div class="clase-meta"><i class="ti ti-user"></i> ${c.entrenadores?.nombre||'—'} · hasta ${fmtHora(c.hora_fin)}</div>
            </div>
            <div class="clase-plazas ${lleno?'lleno':total>=max*0.75?'poco':'ok'}">${total}/${max}</div>
            ${yaReserve?`<span class="badge reservada">✓ Reservada</span>`
              :lleno?`<button class="btn small" disabled>Lleno</button>`
              :!memb||sinClases?`<button class="btn small" disabled>Sin membresía</button>`
              :`<button class="btn primary" onclick="hacerReserva(${c.id})"><i class="ti ti-calendar-plus"></i> Reservar</button>`}
          </div>`;
        }).join('')}`;
    }).join('') : '<div class="empty">No hay clases disponibles próximamente</div>'}`;
}

function renderMiMembresia() {
  const memb = state.membresias[0];
  if(!memb) return '<div class="empty">No tienes una membresía activa.<br>Contacta con el gimnasio.</div>';
  const usadas=memb.clases_usadas||0, total=memb.clases_totales||0, restantes=total-usadas;
  const pct=total>0?Math.round(usadas/total*100):0;
  return `
    <div class="table-card" style="padding:24px;max-width:480px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:32px;font-weight:900;color:#E8001C">${restantes}</div>
        <div style="font-size:14px;color:var(--text2)">clases restantes</div>
      </div>
      <div class="detail-grid">
        <div class="detail-field"><div class="detail-field-label">Plan</div><div class="detail-field-value">${memb.planes?.nombre||'—'}</div></div>
        <div class="detail-field"><div class="detail-field-label">Estado</div><div class="detail-field-value"><span class="badge ${memb.estado}">${memb.estado}</span></div></div>
        <div class="detail-field"><div class="detail-field-label">Inicio</div><div class="detail-field-value">${fmt(memb.fecha_inicio)}</div></div>
        <div class="detail-field"><div class="detail-field-label">Vence</div><div class="detail-field-value">${fmt(memb.fecha_fin)}</div></div>
      </div>
      <div style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
          <span style="color:var(--text2)">Clases usadas</span><span style="font-weight:700">${usadas} / ${total}</span>
        </div>
        <div class="membresia-bar" style="height:10px"><div class="membresia-fill" style="width:${pct}%"></div></div>
      </div>
      <div style="margin-top:20px;text-align:center">
        <button class="btn primary" onclick="navigate('reservar')"><i class="ti ti-calendar-plus"></i> Reservar clase</button>
      </div>
    </div>`;
}

