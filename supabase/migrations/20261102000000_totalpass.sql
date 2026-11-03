-- ═══════════ TOTALPASS: check-ins por webhook ═══════════
-- Ejecutar una vez en Supabase > SQL Editor (o con `supabase db push`).

-- ¿El usuario autenticado es admin? (lo usan las políticas RLS)
create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin');
$$;

-- Cada evento CHECK_IN_CREATED que manda TotalPass
create table if not exists public.totalpass_checkins (
  id            uuid primary key default gen_random_uuid(),
  endpoint      text not null unique,          -- URL de validación (una por check-in; evita duplicados si TotalPass reintenta)
  tp_user_code  text,
  nombre        text,
  email         text,
  telefono      text,
  documento     text,
  documento_tipo text,
  plan_code     text,
  place_code    text,
  started_at    timestamptz,
  expires_at    timestamptz,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','validado','expirado','no_disponible','no_encontrado','error','descartado')),
  cliente_id    bigint references public.clientes(id) on delete set null,
  asistencia_id bigint,
  respuesta_tp  jsonb,
  payload       jsonb,
  validado_por  uuid,
  validado_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists totalpass_checkins_estado_idx on public.totalpass_checkins (estado, created_at desc);

alter table public.totalpass_checkins enable row level security;
drop policy if exists "admin lee checkins totalpass" on public.totalpass_checkins;
create policy "admin lee checkins totalpass" on public.totalpass_checkins
  for select to authenticated using (public.es_admin());
drop policy if exists "admin actualiza checkins totalpass" on public.totalpass_checkins;
create policy "admin actualiza checkins totalpass" on public.totalpass_checkins
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
-- Sin política de insert/delete: solo las Edge Functions (service_role) insertan.

-- JWT de TotalPass en caché (dura 24 h). Sin políticas = nadie lo lee desde el navegador.
create table if not exists public.totalpass_token (
  id         int primary key default 1 check (id = 1),
  token      text not null,
  expires_at timestamptz not null
);
alter table public.totalpass_token enable row level security;

-- Marcar de dónde viene cada asistencia
alter table public.asistencia add column if not exists origen text not null default 'local';
alter table public.asistencia add column if not exists totalpass_checkin_id uuid references public.totalpass_checkins(id) on delete set null;

-- Avisos en vivo en el panel del admin
do $$ begin
  alter publication supabase_realtime add table public.totalpass_checkins;
exception when duplicate_object then null; when undefined_object then null; end $$;
