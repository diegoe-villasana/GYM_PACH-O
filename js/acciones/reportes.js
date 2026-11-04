// ═══════════ ACCIONES: REPORTES Y EMAIL ═══════════

// Cierre de mes (CSV)
function exportarCierreMes() {
  const mes = todayStr.slice(0,7);
  const ventasMes = state.ventas.filter(v=>v.created_at?.startsWith(mes));
  const ingresos = ventasMes.reduce((a,v)=>a+Number(v.total),0);
  const ganancias = ventasMes.reduce((a,v)=>a+gananciaVenta(v),0);
  const comisiones = ventasMes.reduce((a,v)=>a+Number(v.comision||0),0);
  const totalEfectivo = ventasMes.filter(v=>v.metodo_pago!=='tarjeta').reduce((a,v)=>a+Number(v.total),0);
  const totalTarjeta = ventasMes.filter(v=>v.metodo_pago==='tarjeta').reduce((a,v)=>a+Number(v.total),0);
  const lineas = [
    'STUDIO 8:7 — CIERRE DE MES', `Período: ${mes}`, `Fecha de exportación: ${todayStr}`, '',
    'RESUMEN', `Total ventas: $${ingresos.toFixed(2)}`,
    `Ventas en efectivo: $${totalEfectivo.toFixed(2)}`, `Ventas con tarjeta: $${totalTarjeta.toFixed(2)}`,
    `Comisiones de tarjeta: $${comisiones.toFixed(2)}`,
    `Ganancia neta (después de comisiones): $${ganancias.toFixed(2)}`,
    `Número de transacciones: ${ventasMes.length}`, '',
    'VENTAS POR PRODUCTO', 'Producto,Unidades vendidas,Total ($),Ganancia ($)',
  ];
  const por = {};
  ventasMes.forEach(v=>{ const o=por[v.producto_id]||(por[v.producto_id]={total:0,cantidad:0,ganancia:0}); o.total+=Number(v.total); o.cantidad+=Number(v.cantidad); o.ganancia+=gananciaVenta(v); });
  const q = s => `"${String(s).replace(/"/g,'""')}"`;
  Object.entries(por).sort((a,b)=>b[1].total-a[1].total).forEach(([pid,v])=>{ const p=state.productos.find(x=>x.id==pid); lineas.push(`${q(p?.nombre||'—')},${v.cantidad},${v.total.toFixed(2)},${v.ganancia.toFixed(2)}`); });
  lineas.push('', 'STOCK ACTUAL', 'Producto,Stock actual,Stock mínimo,Estado');
  state.productos.forEach(p=>lineas.push(`${q(p.nombre)},${p.stock},${p.stock_minimo},${p.stock<=p.stock_minimo?'BAJO':'OK'}`));
  const blob = new Blob(['\uFEFF' + lineas.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`studio87_cierre_${mes}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('Cierre de mes exportado ✓','ok');
}

// Email (Supabase Edge Function "send-email")
async function enviarEmailVencimiento(cliente, silencioso=false) {
  if(!cliente?.email) { toast('Este cliente no tiene email registrado','error'); return false; }
  try {
    const {data:{session}} = await db.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session?.access_token}` },
      body: JSON.stringify({
        to: cliente.email,
        subject: 'Studio 8:7 — Tu membresía vence pronto',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:32px;border-radius:8px">
            <div style="font-size:24px;font-weight:900;margin-bottom:4px">STUDIO <span style="color:#E8001C">8:7</span></div>
            <div style="font-size:11px;color:#606060;letter-spacing:2px;margin-bottom:24px">GYM TRAINING</div>
            <p style="font-size:16px;margin-bottom:16px">Hola <strong>${cliente.nombre}</strong>,</p>
            <p style="color:#a0a0a0;margin-bottom:24px">Tu membresía en Studio 8:7 está próxima a vencer el <strong style="color:#f0f0f0">${fmt(cliente.cobro)}</strong>.</p>
            <p style="color:#a0a0a0;margin-bottom:24px">Renueva tu plan para seguir entrenando sin interrupciones.</p>
            <div style="background:#1a1a1a;border-radius:6px;padding:16px;margin-bottom:24px">
              <div style="font-size:12px;color:#606060;margin-bottom:4px">PLAN ACTUAL</div>
              <div style="font-size:16px;font-weight:700">${cliente.plan||'—'}</div>
            </div>
            <p style="color:#606060;font-size:12px">Cualquier duda, contacta con nosotros directamente.</p>
          </div>`
      })
    });
    if(res.ok) { if(!silencioso) toast(`Email enviado a ${cliente.email} ✓`,'ok'); return true; }
    toast('Error al enviar email — revisa la configuración de Resend','error'); return false;
  } catch(e) {
    toast('No se pudo enviar el email. ¿Está configurada la Edge Function?','error'); return false;
  }
}
async function enviarEmailTodosVencen() {
  const proximos = state.clients.filter(c=>{
    if(c.estado!=='Activo'||!c.email||!c.cobro) return false;
    const d=diffDays(today,c.cobro); return d>=0&&d<=7;
  });
  if(!proximos.length){ toast('No hay clientes con vencimiento próximo esta semana','ok'); return; }
  let enviados=0;
  for(const c of proximos) { if(await enviarEmailVencimiento(c,true)) enviados++; }
  toast(`${enviados} de ${proximos.length} emails enviados`, enviados?'ok':'error');
}
