-- =============================================================================
-- Migración 0400: órdenes de trabajo, visitas, técnicos y conflictos de agenda
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Órdenes de trabajo
-- -----------------------------------------------------------------------------
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  project_id uuid not null references public.projects (id) on delete restrict,
  quotation_id uuid not null references public.quotations (id) on delete restrict,
  status text not null default 'pending_schedule',
  scope_snapshot text not null default '',
  responsible_user_id uuid references public.profiles (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  constraint work_orders_status check (
    status in ('pending_schedule', 'scheduled', 'in_progress', 'paused', 'action_required', 'completed', 'cancelled')
  ),
  constraint work_orders_unique_quotation unique (quotation_id),
  constraint work_orders_closure check (status <> 'completed' or closed_at is not null)
);
comment on table public.work_orders is 'Órdenes de trabajo derivadas de cotizaciones aprobadas (idempotente).';
create index work_orders_project_idx on public.work_orders (project_id);
create index work_orders_status_idx on public.work_orders (status);
create index work_orders_responsible_idx on public.work_orders (responsible_user_id);

-- -----------------------------------------------------------------------------
-- Visitas operativas (agenda)
-- -----------------------------------------------------------------------------
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled',
  address_snapshot text,
  instructions text,
  notes text,
  allow_conflict_override boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_dates check (end_at > start_at),
  constraint visits_status check (status in ('scheduled', 'in_progress', 'completed', 'rescheduled', 'cancelled'))
);
comment on table public.visits is 'Visitas en campo programadas en agenda.';
create index visits_work_order_idx on public.visits (work_order_id);
create index visits_schedule_idx on public.visits (start_at, end_at);
create index visits_status_idx on public.visits (status);

-- -----------------------------------------------------------------------------
-- Técnicos colaboradores en orden de trabajo
-- -----------------------------------------------------------------------------
create table public.work_order_technicians (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  assignment_role text not null default 'technician',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  constraint wo_techs_role check (assignment_role in ('lead', 'technician', 'assistant')),
  constraint wo_techs_unique unique (work_order_id, user_id)
);
create index wo_techs_user_idx on public.work_order_technicians (user_id);

-- -----------------------------------------------------------------------------
-- Técnicos asignados a cada visita concreta
-- -----------------------------------------------------------------------------
create table public.visit_technicians (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  constraint visit_techs_unique unique (visit_id, user_id)
);
create index visit_techs_user_idx on public.visit_technicians (user_id);

-- -----------------------------------------------------------------------------
-- Detección de conflictos de agenda
-- -----------------------------------------------------------------------------
create or replace function public.check_technician_conflicts(
  p_technician_ids uuid[],
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_exclude_visit_id uuid default null
)
returns table (
  user_id uuid,
  technician_name text,
  conflict_visit_id uuid,
  conflict_start_at timestamptz,
  conflict_end_at timestamptz,
  conflict_order_number text,
  conflict_project_title text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    vt.user_id,
    p.full_name as technician_name,
    v.id as conflict_visit_id,
    v.start_at as conflict_start_at,
    v.end_at as conflict_end_at,
    wo.order_number as conflict_order_number,
    prj.title as conflict_project_title
  from public.visit_technicians vt
  join public.profiles p on p.id = vt.user_id
  join public.visits v on v.id = vt.visit_id
  join public.work_orders wo on wo.id = v.work_order_id
  join public.projects prj on prj.id = wo.project_id
  where vt.user_id = any(p_technician_ids)
    and (p_exclude_visit_id is null or v.id <> p_exclude_visit_id)
    and v.status not in ('cancelled', 'completed')
    and (p_start_at < v.end_at and p_end_at > v.start_at);
$$;

-- -----------------------------------------------------------------------------
-- Conversión idempotente de cotización aprobada a orden de trabajo
-- -----------------------------------------------------------------------------
create or replace function public.convert_quotation_to_work_order(
  p_quotation_id uuid,
  p_responsible_user_id uuid default null
)
returns public.work_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotations;
  v_project public.projects;
  v_wo public.work_orders;
  v_order_number text;
  v_responsible uuid;
  v_scope text;
begin
  perform private.require_staff();

  -- Verificar cotización
  select * into v_quote from public.quotations where id = p_quotation_id;
  if v_quote.id is null then
    raise exception 'Cotización no encontrada' using errcode = 'P0002';
  end if;
  if v_quote.status <> 'approved' then
    raise exception 'Solo una versión aprobada puede convertirse en orden de trabajo (estado actual: %).', v_quote.status
      using errcode = '22023';
  end if;

  -- Regla de idempotencia: si ya existe una orden de trabajo para esta cotización, retornarla directamente
  select * into v_wo from public.work_orders where quotation_id = p_quotation_id;
  if v_wo.id is not null then
    return v_wo;
  end if;

  select * into v_project from public.projects where id = v_quote.project_id;
  v_responsible := coalesce(p_responsible_user_id, v_project.responsible_user_id, auth.uid());

  v_order_number := private.next_document_number('work_order');
  v_scope := coalesce(v_quote.scope_description, v_project.scope_description, v_project.title);

  insert into public.work_orders (
    order_number,
    project_id,
    quotation_id,
    status,
    scope_snapshot,
    responsible_user_id,
    created_by
  )
  values (
    v_order_number,
    v_quote.project_id,
    v_quote.id,
    'pending_schedule',
    v_scope,
    v_responsible,
    auth.uid()
  )
  returning * into v_wo;

  -- Actualizar el estado del proyecto a 'in_progress'
  update public.projects
  set status = 'in_progress', updated_at = now()
  where id = v_quote.project_id and status in ('planning', 'approved');

  perform private.log_activity('work_order', v_wo.id, 'created',
    'Orden de trabajo generada desde cotización ' || v_quote.quotation_number || ' v' || v_quote.version::text,
    null,
    jsonb_build_object('order_number', v_wo.order_number, 'quotation_id', v_quote.id),
    v_quote.project_id
  );

  return v_wo;
end;
$$;

-- Triggers de actualización y guardas
create trigger work_orders_set_updated_at
before update on public.work_orders
for each row execute function private.set_updated_at();

create trigger visits_set_updated_at
before update on public.visits
for each row execute function private.set_updated_at();

create trigger work_orders_audit
after insert or update on public.work_orders
for each row execute function private.audit_row_change('work_order');

create trigger visits_audit
after insert or update on public.visits
for each row execute function private.audit_row_change('visit');

alter table public.work_orders enable row level security;
alter table public.visits enable row level security;
alter table public.work_order_technicians enable row level security;
alter table public.visit_technicians enable row level security;
