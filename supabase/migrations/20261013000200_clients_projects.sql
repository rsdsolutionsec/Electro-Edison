-- =============================================================================
-- Migración 0200: clientes, ubicaciones y proyectos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Clientes
-- -----------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  identification text,
  client_type text not null default 'residential',
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_len check (char_length(btrim(name)) between 2 and 200),
  constraint clients_identification_len check (identification is null or char_length(btrim(identification)) between 3 and 20),
  constraint clients_type check (client_type in ('residential', 'commercial', 'industrial', 'institutional', 'other')),
  constraint clients_phone_len check (phone is null or char_length(phone) <= 30),
  constraint clients_email check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint clients_notes_len check (notes is null or char_length(notes) <= 4000)
);
comment on table public.clients is 'Clientes. No se eliminan físicamente: se archivan con is_active = false.';
create unique index clients_identification_key on public.clients (identification) where identification is not null;
create index clients_name_idx on public.clients (lower(name));
create index clients_active_idx on public.clients (is_active);

-- -----------------------------------------------------------------------------
-- Ubicaciones de servicio
-- -----------------------------------------------------------------------------
create table public.client_locations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  label text,
  address text not null,
  city text,
  reference text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_locations_address_len check (char_length(btrim(address)) between 3 and 300),
  constraint client_locations_label_len check (label is null or char_length(label) <= 80),
  constraint client_locations_id_client unique (id, client_id)
);
create index client_locations_client_idx on public.client_locations (client_id);

-- -----------------------------------------------------------------------------
-- Proyectos (instalaciones o encargos concretos)
-- -----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null,
  client_id uuid not null references public.clients (id) on delete restrict,
  location_id uuid,
  title text not null,
  description text,
  scope_description text,
  status text not null default 'planning',
  priority text not null default 'normal',
  responsible_user_id uuid references public.profiles (id) on delete set null,
  start_date date,
  target_end_date date,
  notes text,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_code_key unique (project_code),
  constraint projects_location_fk foreign key (location_id, client_id)
    references public.client_locations (id, client_id) on delete restrict,
  constraint projects_title_len check (char_length(btrim(title)) between 3 and 200),
  constraint projects_status check (status in ('planning', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  constraint projects_priority check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint projects_dates check (target_end_date is null or start_date is null or target_end_date >= start_date),
  constraint projects_closed check (status <> 'completed' or closed_at is not null)
);
comment on table public.projects is
  'Proyecto de instalación. El estado y los datos de cierre solo cambian mediante funciones de negocio.';
create index projects_client_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status);
create index projects_target_end_idx on public.projects (target_end_date);
create index projects_responsible_idx on public.projects (responsible_user_id);

-- -----------------------------------------------------------------------------
-- Guardas: autoría, código generado y columnas protegidas
-- -----------------------------------------------------------------------------
create or replace function private.clients_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.name := btrim(new.name);
    new.identification := nullif(btrim(new.identification), '');
    new.email := nullif(lower(btrim(new.email)), '');
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.name := btrim(new.name);
    new.identification := nullif(btrim(new.identification), '');
    new.email := nullif(lower(btrim(new.email)), '');
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger clients_guard
before insert or update on public.clients
for each row execute function private.clients_guard();

create trigger client_locations_set_updated_at
before update on public.client_locations
for each row execute function private.set_updated_at();

create or replace function private.client_locations_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.client_id <> old.client_id then
    raise exception 'Una ubicación no puede cambiar de cliente.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger client_locations_guard
before update on public.client_locations
for each row execute function private.client_locations_guard();

create or replace function private.projects_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- El código siempre se genera en la base de datos.
    new.project_code := private.next_document_number('project');
    new.created_by := coalesce(auth.uid(), new.created_by);
    if private.is_direct_api_call() then
      new.status := 'planning';
      new.closed_at := null;
      new.closed_by := null;
    end if;
    return new;
  end if;

  new.project_code := old.project_code;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();

  if private.is_direct_api_call() then
    if new.status is distinct from old.status
       or new.closed_at is distinct from old.closed_at
       or new.closed_by is distinct from old.closed_by then
      raise exception 'El estado del proyecto solo puede cambiarse mediante las acciones autorizadas.' using errcode = '42501';
    end if;
    if new.client_id <> old.client_id
       and exists (select 1 from public.quotations q where q.project_id = old.id) then
      raise exception 'No se puede cambiar el cliente de un proyecto que ya tiene cotizaciones.' using errcode = '22023';
    end if;
    if old.status in ('completed', 'cancelled') then
      raise exception 'El proyecto está cerrado y no puede editarse.' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;

create trigger projects_guard
before insert or update on public.projects
for each row execute function private.projects_guard();

create trigger clients_audit
after insert or update on public.clients
for each row execute function private.audit_row_change('client');

create trigger client_locations_audit
after insert or update on public.client_locations
for each row execute function private.audit_row_change('client_location');

create trigger projects_audit
after insert or update on public.projects
for each row execute function private.audit_row_change('project');

alter table public.clients enable row level security;
alter table public.client_locations enable row level security;
alter table public.projects enable row level security;
