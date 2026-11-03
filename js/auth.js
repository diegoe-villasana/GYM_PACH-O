// ── Auth ──
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const btn   = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.style.display='none';
  btn.disabled=true; btn.textContent='Entrando...';
  const {data,error} = await db.auth.signInWithPassword({email, password:pass});
  if(error){ errEl.textContent='Email o contraseña incorrectos'; errEl.style.display='block'; btn.disabled=false; btn.textContent='Entrar'; return; }
  const ok = await setupUser(data.user);
  btn.disabled=false; btn.textContent='Entrar';
  if(!ok){ errEl.textContent='Tu cuenta aún no tiene acceso. Pide al administrador que la active.'; errEl.style.display='block'; return; }
  showApp();
}

// Devuelve true si el usuario tiene perfil en la tabla "usuarios"
async function setupUser(user) {
  state.userId = user.id;
  state.userEmail = user.email;
  const {data} = await db.from('usuarios').select('*').eq('id', user.id).maybeSingle();
  if(!data) {
    // ⚠️ TEMPORAL: sin fila en "usuarios" entra como admin (como estaba antes).
    // TODO: crear tu fila admin en "usuarios" y volver a bloquear con:
    //   await db.auth.signOut(); return false;
    console.warn('Acceso admin por defecto: falta la fila de este usuario en la tabla usuarios');
    setTimeout(()=>toast(' Entraste como admin por defecto. Pendiente: crear tu fila en "usuarios" y quitar este acceso.','error'), 800);
    return false;
  } else {
    state.rol = data.rol;
    state.clienteId = data.cliente_id;
    state.entrenadorId = data.entrenador_id;
    if (state.rol==='cliente' && !state.clienteId) {
      console.warn('Usuario cliente sin cliente_id en tabla usuarios');
      toast('Tu cuenta no tiene cliente_id asignado. Pide al administrador que lo agregue.','error');
    }
    if (state.rol==='entrenador' && !state.entrenadorId) {
      console.warn('Usuario entrenador sin entrenador_id en tabla usuarios');
      toast('Tu cuenta no tiene entrenador_id asignado. Pide al administrador que lo agregue.','error');
    }
    console.log('Usuario cargado:', state.rol, state.clienteId, state.entrenadorId);
  }
  document.getElementById('role-badge').textContent = state.rol;
  return true;
}

function showRegister() {
  document.getElementById('login-screen').style.display='none';
  document.getElementById('register-screen').style.display='flex';
  document.getElementById('register-error').style.display='none';
}
function showLogin() {
  document.getElementById('register-screen').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-error').style.display='none';
}

async function doRegister() {
  const name=document.getElementById('reg-name').value.trim();
  const email=document.getElementById('reg-email').value.trim();
  const pass=document.getElementById('reg-pass').value;
  const pass2=document.getElementById('reg-pass2').value;
  const errEl=document.getElementById('register-error');
  const btn=document.getElementById('register-btn');
  const fail=m=>{errEl.textContent=m;errEl.style.display='block';btn.disabled=false;btn.textContent='Crear usuario';};
  errEl.style.display='none';
  if(!name) return fail('El nombre es obligatorio');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Ingresa un email válido');
  if(pass.length<6) return fail('La contraseña debe tener al menos 6 caracteres');
  if(pass!==pass2) return fail('Las contraseñas no coinciden');
  btn.disabled=true; btn.textContent='Creando cuenta...';
  try {
    const {data,error}=await db.auth.signUp({email,password:pass});
    if(error) return fail('Error al crear usuario: '+error.message);
    const {data:cli}=await db.from('clientes').insert({nombre:name,email,estado:'Activo',documentos:[]}).select().single();
    if(data.user && cli) await db.from('usuarios').insert({id:data.user.id,rol:'cliente',cliente_id:cli.id});
    btn.disabled=false; btn.textContent='Crear usuario';
    toast('Usuario creado. Revisa tu email para confirmar.');
    showLogin();
  } catch(e) { fail('Error al crear usuario'); }
}

async function doLogout() {
  tpDesuscribir();
  await db.auth.signOut();
  state.rol=null; state.userId=null; state.clienteId=null; state.entrenadorId=null;
  const b=document.getElementById('login-btn'); b.disabled=false; b.textContent='Entrar';
  document.getElementById('login-pass').value='';
  document.getElementById('login-screen').style.display='flex';
  document.querySelector('.app').style.display='none';
  document.getElementById('portal').style.display='none';
}

function showApp() {
  document.getElementById('login-screen').style.display='none';
  // Los clientes usan el portal (js/vistas/portal.js) en lugar del panel con menú lateral
  if(state.rol==='cliente') {
    state.portal = portalInicial();
    document.getElementById('portal').style.display='block';
    return loadAll();
  }
  document.querySelector('.app').style.display='flex';
  if(state.rol==='entrenador') state.view='mis-clases';
  else state.view='dashboard';
  setTitle(state.view);
  if(state.rol==='admin') tpSuscribir();
  loadAll();
}

