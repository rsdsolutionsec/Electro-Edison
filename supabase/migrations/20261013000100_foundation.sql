-- =============================================================================
-- Eléctrico Edison Pino — Migración 0100: fundamentos
-- Esquema privado, perfiles, roles, configuración, numeración documental,
-- impuestos configurables, catálogo de conceptos y registro de actividad.
-- =============================================================================

create schema if not exists private;
comment on schema private is 'Funciones internas no expuestas por la Data API.';
grant usage on schema private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Utilidades genéricas
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Indica si la sentencia actual proviene directamente de un usuario de la Data API
-- (rol "authenticated" o "anon"). Dentro de funciones SECURITY DEFINER el
-- current_user es el propietario de la función, por lo que los guardas
-- permiten operaciones realizadas por funciones de negocio confiables.
create or replace function private.is_direct_api_call()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('authenticated', 'anon');
$$;

-- -----------------------------------------------------------------------------
-- Perfiles y roles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(full_name) <= 120),
  constraint profiles_phone_len check (phone is null or char_length(phone) <= 30)
);
comment on table public.profiles is 'Datos visibles de cada usuario. Los permisos NO se derivan de metadatos de Auth.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint user_roles_role_check check (role in ('admin', 'operations', 'technician')),
  constraint user_roles_unique unique (user_id, role)
);
comment on table public.user_roles is 'Roles confiables. Solo modificables mediante public.admin_set_user_roles().';
create index user_roles_role_idx on public.user_roles (role);

-- Crea el perfil cuando Supabase Auth registra un usuario. Solo copia el nombre
-- visible; nunca asigna roles a partir de metadatos.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1)), 120),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function private.sync_auth_user_email();

-- -----------------------------------------------------------------------------
-- Funciones auxiliares de autorización (SECURITY DEFINER para evitar recursión RLS)
-- -----------------------------------------------------------------------------
create or replace function private.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id
    where r.user_id = auth.uid()
      and r.role = p_role
      and p.is_active
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin');
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id
    where r.user_id = auth.uid()
      and r.role in ('admin', 'operations')
      and p.is_active
  );
$$;

create or replace function private.is_technician()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('technician');
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active
      and exists (select 1 from public.user_roles r where r.user_id = p.id)
  );
$$;

create or replace function private.require_staff()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_staff() then
    raise exception 'No tiene permisos para realizar esta operación.' using errcode = '42501';
  end if;
end;
$$;

create or replace function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo un administrador puede realizar esta operación.' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Configuración del emisor (fila única)
-- -----------------------------------------------------------------------------
create table public.company_settings (
  id smallint primary key default 1,
  trade_name text not null default 'Eléctrico Edison Pino',
  legal_name text,
  tax_id text,
  address text,
  city text,
  phone text,
  email text,
  website text,
  logo_path text,
  currency_code text not null default 'USD',
  locale text not null default 'es-EC',
  timezone text not null default 'America/Guayaquil',
  default_validity_days integer not null default 15,
  default_payment_terms text,
  default_commercial_terms text,
  default_quote_notes text,
  document_footer text,
  tax_configuration_validated boolean not null default false,
  allow_operations_conflict_override boolean not null default false,
  technicians_can_update_stages boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint company_settings_singleton check (id = 1),
  constraint company_settings_currency check (currency_code ~ '^[A-Z]{3}$'),
  constraint company_settings_validity check (default_validity_days between 1 and 365),
  constraint company_settings_email check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
comment on table public.company_settings is
  'Datos del emisor y preferencias. Los datos empresariales desconocidos quedan NULL hasta que un administrador los configure.';

insert into public.company_settings (id) values (1) on conflict (id) do nothing;

create or replace function private.validate_company_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_dummy timestamp;
begin
  begin
    v_dummy := now() at time zone new.timezone;
  exception when others then
    raise exception 'Zona horaria no válida: %', new.timezone using errcode = '22023';
  end;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create trigger company_settings_validate
before insert or update on public.company_settings
for each row execute function private.validate_company_settings();

create or replace function private.app_timezone()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select timezone from public.company_settings where id = 1), 'America/Guayaquil');
$$;

create or replace function private.app_today()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone private.app_timezone())::date;
$$;

-- -----------------------------------------------------------------------------
-- Numeración documental (atómica, independiente del frontend)
-- -----------------------------------------------------------------------------
create table public.document_series (
  doc_type text primary key,
  prefix text not null,
  padding integer not null default 4,
  updated_at timestamptz not null default now(),
  constraint document_series_type check (doc_type in ('project', 'quotation', 'proforma', 'work_order')),
  constraint document_series_prefix check (prefix ~ '^[A-Z0-9]{1,8}$'),
  constraint document_series_padding check (padding between 3 and 8)
);

insert into public.document_series (doc_type, prefix) values
  ('project', 'PRY'),
  ('quotation', 'COT'),
  ('proforma', 'PRF'),
  ('work_order', 'OT')
on conflict (doc_type) do nothing;

create trigger document_series_set_updated_at
before update on public.document_series
for each row execute function private.set_updated_at();

create table public.document_counters (
  doc_type text not null references public.document_series (doc_type) on delete restrict,
  year integer not null,
  last_value integer not null default 0,
  primary key (doc_type, year),
  constraint document_counters_positive check (last_value >= 0)
);
comment on table public.document_counters is 'Contadores anuales. Solo se modifican mediante private.next_document_number().';

create or replace function private.next_document_number(p_doc_type text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from private.app_today())::integer;
  v_value integer;
  v_prefix text;
  v_padding integer;
begin
  select prefix, padding into v_prefix, v_padding
  from public.document_series where doc_type = p_doc_type;
  if v_prefix is null then
    raise exception 'Serie documental no configurada: %', p_doc_type;
  end if;

  insert into public.document_counters as c (doc_type, year, last_value)
  values (p_doc_type, v_year, 1)
  on conflict (doc_type, year) do update set last_value = c.last_value + 1
  returning c.last_value into v_value;

  return v_prefix || '-' || v_year::text || '-' || lpad(v_value::text, v_padding, '0');
end;
$$;

-- -----------------------------------------------------------------------------
-- Impuestos configurables
-- -----------------------------------------------------------------------------
create table public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rate numeric(5, 2) not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_rates_rate check (rate >= 0 and rate <= 100),
  constraint tax_rates_name_len check (char_length(btrim(name)) between 2 and 60),
  constraint tax_rates_default_active check (not is_default or is_active)
);
create unique index tax_rates_single_default on public.tax_rates (is_default) where is_default;

create trigger tax_rates_set_updated_at
before update on public.tax_rates
for each row execute function private.set_updated_at();

insert into public.tax_rates (id, name, rate, is_default, notes) values
  ('00000000-0000-4000-8000-000000000015', 'IVA 15 %', 15.00, true,
   'Configuración inicial PENDIENTE DE VALIDACIÓN tributaria. Verifique la tarifa vigente antes de emitir documentos.'),
  ('00000000-0000-4000-8000-000000000000', 'IVA 0 %', 0.00, false,
   'Configuración inicial PENDIENTE DE VALIDACIÓN tributaria.')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Catálogo de conceptos (ayuda opcional; los precios se copian a cada partida)
-- -----------------------------------------------------------------------------
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  item_type text not null default 'material',
  unit text not null default 'u',
  unit_price numeric(14, 4) not null default 0,
  tax_rate_id uuid references public.tax_rates (id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_items_type check (item_type in ('material', 'labor', 'service', 'other')),
  constraint catalog_items_description_len check (char_length(btrim(description)) between 2 and 500),
  constraint catalog_items_unit_len check (char_length(btrim(unit)) between 1 and 20),
  constraint catalog_items_price check (unit_price >= 0)
);
create index catalog_items_description_idx on public.catalog_items (lower(description));

create trigger catalog_items_set_updated_at
before update on public.catalog_items
for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Registro de actividad (auditoría)
-- -----------------------------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  project_id uuid,
  client_id uuid,
  action text not null,
  summary text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);
comment on table public.activity_logs is
  'Trazabilidad. Solo se inserta desde funciones/triggers confiables; no admite escrituras directas.';
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id, created_at desc);
create index activity_logs_project_idx on public.activity_logs (project_id, created_at desc);
create index activity_logs_client_idx on public.activity_logs (client_id, created_at desc);
create index activity_logs_created_idx on public.activity_logs (created_at desc);
create index activity_logs_user_idx on public.activity_logs (user_id, created_at desc);

create or replace function private.log_activity(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_summary text default null,
  p_old jsonb default null,
  p_new jsonb default null,
  p_project_id uuid default null,
  p_client_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client uuid := p_client_id;
begin
  -- La tabla projects se crea en una migración posterior; se consulta dinámicamente.
  if v_client is null and p_project_id is not null and to_regclass('public.projects') is not null then
    execute 'select client_id from public.projects where id = $1' into v_client using p_project_id;
  end if;
  insert into public.activity_logs (user_id, entity_type, entity_id, project_id, client_id, action, summary, old_values, new_values)
  values (
    (select p.id from public.profiles p where p.id = auth.uid()),
    p_entity_type, p_entity_id, p_project_id, v_client, p_action, p_summary, p_old, p_new
  );
end;
$$;

-- Trigger genérico de auditoría: registra solo las columnas modificadas.
create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_key text;
  v_old_diff jsonb := '{}'::jsonb;
  v_new_diff jsonb := '{}'::jsonb;
  v_project uuid;
  v_client uuid;
  v_id uuid;
  v_entity text := tg_argv[0];
  v_uuid_re constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  v_new := to_jsonb(new) - 'updated_at';
  if (v_new ->> 'id') ~ v_uuid_re then
    v_id := (v_new ->> 'id')::uuid;
  end if;
  if v_entity = 'project' then
    v_project := v_id;
  elsif (v_new ->> 'project_id') ~ v_uuid_re then
    v_project := (v_new ->> 'project_id')::uuid;
  end if;
  if v_entity = 'client' then
    v_client := v_id;
  elsif (v_new ->> 'client_id') ~ v_uuid_re then
    v_client := (v_new ->> 'client_id')::uuid;
  end if;

  if tg_op = 'INSERT' then
    perform private.log_activity(v_entity, v_id, 'created', null, null, v_new - 'created_at', v_project, v_client);
    return new;
  end if;

  v_old := to_jsonb(old) - 'updated_at';
  for v_key in select jsonb_object_keys(v_new) loop
    if (v_old -> v_key) is distinct from (v_new -> v_key) then
      v_old_diff := v_old_diff || jsonb_build_object(v_key, v_old -> v_key);
      v_new_diff := v_new_diff || jsonb_build_object(v_key, v_new -> v_key);
    end if;
  end loop;

  if v_new_diff <> '{}'::jsonb then
    perform private.log_activity(v_entity, v_id, 'updated', null, v_old_diff, v_new_diff, v_project, v_client);
  end if;
  return new;
end;
$$;

create trigger company_settings_audit
after update on public.company_settings
for each row execute function private.audit_row_change('company_settings');

create trigger tax_rates_audit
after insert or update on public.tax_rates
for each row execute function private.audit_row_change('tax_rate');

create trigger document_series_audit
after update on public.document_series
for each row execute function private.audit_row_change('document_series');

create trigger catalog_items_audit
after insert or update on public.catalog_items
for each row execute function private.audit_row_change('catalog_item');

-- Habilitar RLS de inmediato (las políticas se definen en la migración 0600).
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.company_settings enable row level security;
alter table public.document_series enable row level security;
alter table public.document_counters enable row level security;
alter table public.tax_rates enable row level security;
alter table public.catalog_items enable row level security;
alter table public.activity_logs enable row level security;
