// ═══════════ NÚCLEO: Supabase, fechas, estado global y utilidades ═══════════

const SUPABASE_URL = 'https://gfsofbjhmorkgegnbsli.supabase.co';
const SUPABASE_KEY = "sb_publishable_tbORXjpZr-4W8CzvsN4vZA_5Jkw1NYd";
const BUCKET = 'Documentos';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Fechas (hora local, no UTC) ──
const localISO = d => { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
const parseD = d => (typeof d==='string' && d.length===10) ? new Date(d+'T00:00:00') : new Date(d);
const today = new Date(); today.setHours(0,0,0,0);
const todayStr = localISO(today);
const fmt = d => d ? parseD(d).toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
const fmtHora = t => t ? t.slice(0,5) : '—';
const addDays = (d,n) => { const r=parseD(d); r.setDate(r.getDate()+n); return r; };
const diffDays = (a,b) => Math.round((parseD(b)-parseD(a))/86400000);
const fileIcon = n => { const e=(n||'').split('.').pop().toLowerCase(); return ['jpg','jpeg','png','gif','webp'].includes(e)?'ti-photo':e==='pdf'?'ti-file-type-pdf':'ti-file'; };

document.getElementById('topbar-date').textContent = today.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});

// ── Estado global ──
let state = {
  rol: null, userId: null, clienteId: null, entrenadorId: null,
  view: 'dashboard', clientTab: 'info', selectedClient: null,
  searchClients: '', searchPayments: '', searchProductos: '', searchAsistencia: '',
  clienteAsistencia: null, calMes: null, showModal: null,
  clients: [], pagos: [], asistencia: [], productos: [], ventas: [],
  clases: [], reservas: [], tiposClase: [], entrenadores: [], planes: [], membresias: [],
  clasesFecha: todayStr,
};

function toast(msg, type='ok') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}

// Escapa texto externo (p. ej. datos de TotalPass) antes de meterlo en innerHTML
const escHtml = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toggleSide() {
  document.getElementById('sidebar').classList.toggle('ocultar');
  document.getElementById('main').classList.toggle('expandido');
  document.getElementById('showSidebar').classList.toggle('visible');
}

function setBtnLoading(id, loading) {
  const btn=document.getElementById(id);
  if(btn){ if(!btn.dataset.label) btn.dataset.label=btn.textContent; btn.disabled=loading; btn.textContent=loading?'Guardando...':btn.dataset.label; }
}

