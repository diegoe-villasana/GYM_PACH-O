// ═══════════ REGISTRO POR INVITACIÓN ═══════════
async function checkInvitacion() {
  const token = new URLSearchParams(window.location.search).get('token');
  if(!token) return false;
  const {data, error} = await db.from('invitaciones').select('token')
    .eq('token', token).eq('usado', false).gt('expires_at', new Date().toISOString()).maybeSingle();
  if(error || !data) mostrarPaginaRegistro(null, 'Este enlace no es válido, ya fue usado o expiró. Pide uno nuevo al gimnasio.');
  else mostrarPaginaRegistro(token);
  return true;
}

function mostrarPaginaRegistro(token, errorMsg) {
  document.querySelector('.app').style.display='none';
  document.getElementById('login-screen').style.display='none';
  document.getElementById('register-screen').style.display='none';
  document.getElementById('registro-screen').style.display='block';
  if(errorMsg) {
    const g=document.getElementById('registro-error-global');
    g.textContent=errorMsg; g.style.display='block';
    document.getElementById('registro-form').style.display='none';
    return;
  }
  document.getElementById('registro-token').value=token;
  document.getElementById('registro-fecha').textContent=today.toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
  cargarPlanesRegistro();
}

async function cargarPlanesRegistro() {
  const {data:planes} = await db.from('planes').select('*').eq('activo',true).order('precio');
  const sel=document.getElementById('registro-plan'); if(!sel) return;
  sel.innerHTML='<option value="">— Selecciona tu plan —</option>' +
    (planes||[]).map(p=>`<option value="${p.id}" data-dias="${p.periodo_dias}" data-clases="${p.clases_por_periodo}">${p.nombre} — $${Number(p.precio||0).toFixed(2)} (${p.clases_por_periodo} clases)</option>`).join('');
}

async function enviarRegistro() {
  const btn=document.getElementById('registro-btn');
  const errEl=document.getElementById('registro-error');
  const v=id=>document.getElementById(id).value.trim();
  const fail=m=>{ errEl.textContent=m; errEl.style.display='block'; btn.disabled=false; btn.textContent='Completar registro'; };
  errEl.style.display='none';
  const nombre=v('registro-nombre'), email=v('registro-email'), tel=v('registro-tel');
  const genero=v('registro-genero'), planId=v('registro-plan'), firma=v('registro-firma'), token=v('registro-token');
  const pass=document.getElementById('registro-pass').value, pass2=document.getElementById('registro-pass2').value;
  const acepta=document.getElementById('registro-acepta').checked;
  if(!nombre||!email||!pass||!planId||!firma||!acepta) return fail('Completa todos los campos obligatorios y acepta la carta de responsiva.');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Ingresa un email válido.');
  if(pass.length<6) return fail('La contraseña debe tener al menos 6 caracteres.');
  if(pass!==pass2) return fail('Las contraseñas no coinciden.');
  if(firma.toLowerCase()!==nombre.toLowerCase()) return fail('La firma debe coincidir exactamente con tu nombre completo.');
  btn.disabled=true; btn.textContent='Registrando...';
  try {
    const {data:authData, error:authError} = await db.auth.signUp({email, password:pass});
    if(authError) throw new Error(authError.message);
    const opt=document.getElementById('registro-plan').selectedOptions[0];
    const dias=parseInt(opt.dataset.dias)||30, clases=parseInt(opt.dataset.clases)||8;
    const fechaFin=localISO(addDays(today,dias));
    const {data:cli, error:cliError} = await db.from('clientes').insert({
      nombre, email, telefono:tel, genero, inicio:todayStr, cobro:fechaFin,
      estado:'Activo', documentos:[], firma_electronica:firma, fecha_firma:new Date().toISOString(),
    }).select().single();
    if(cliError) throw new Error(cliError.message);
    const {error:mErr} = await db.from('membresias').insert({ cliente_id:cli.id, plan_id:parseInt(planId), clases_totales:clases, clases_usadas:0, fecha_inicio:todayStr, fecha_fin:fechaFin, estado:'activa' });
    if(mErr) throw new Error(mErr.message);
    if(authData.user) {
      const {error:uErr} = await db.from('usuarios').insert({ id:authData.user.id, cliente_id:cli.id, rol:'cliente' });
      if(uErr) throw new Error(uErr.message);
    }
    await db.from('invitaciones').update({usado:true}).eq('token',token);
    await db.auth.signOut();
    document.getElementById('registro-form').style.display='none';
    document.getElementById('registro-exito').style.display='block';
  } catch(e) {
    console.error(e);
    fail('Error: '+e.message);
  }
}

async function generarEnlaceInvitacion() {
  const {data, error} = await db.from('invitaciones').insert({}).select().single();
  if(error) { console.error(error); toast('Error al generar enlace','error'); return; }
  const url = window.location.origin + window.location.pathname + '?token=' + encodeURIComponent(data.token);
  try { await navigator.clipboard.writeText(url); toast('Enlace copiado ✓ — válido 24 horas','ok'); }
  catch(e) { prompt('Copia este enlace:', url); }
}

