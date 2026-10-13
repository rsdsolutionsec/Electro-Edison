-- =============================================================================
-- Migración 0500: etapas del proyecto, entregas parciales y confirmación final
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Etapas del proyecto
-- -----------------------------------------------------------------------------
create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  sequence integer not null default 1,
  status text not null default 'pending',
  is_required_for_closure boolean not null default true,
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_stages_status check (status in ('pending', 'in_progress', 'completed')),
  constraint project_stages_name_len check (char_length(btrim(name)) between 2 and 150),
  constraint project_stages_sequence_pos check (sequence >= 1)
);
comment on table public.project_stages is 'Etapas operativas por proyecto.';
create index project_stages_project_idx on public.project_stages (project_id, sequence);
create index project_stages_status_idx on public.project_stages (status);

-- -----------------------------------------------------------------------------
-- Confirmaciones de entrega (parciales y finales)
-- -----------------------------------------------------------------------------
create table public.delivery_confirmations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  work_order_id uuid references public.work_orders (id) on delete set null,
  delivery_type text not null default 'final',
  confirmed_by uuid not null references public.profiles (id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  notes text not null,
  created_at timestamptz not null default now(),
  constraint delivery_confirmations_type check (delivery_type in ('partial', 'final')),
  constraint delivery_confirmations_notes_len check (char_length(btrim(notes)) >= 5)
);
comment on table public.delivery_confirmations is 'Registro formal de confirmación interna de entregas parciales y finales.';
create index delivery_confirmations_project_idx on public.delivery_confirmations (project_id);

-- -----------------------------------------------------------------------------
-- Procedimiento para completar etapa
-- -----------------------------------------------------------------------------
create or replace function public.complete_project_stage(
  p_stage_id uuid,
  p_notes text default null
)
returns public.project_stages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stage public.project_stages;
  v_can_update boolean := false;
  v_tech_allowed boolean := true;
begin
  -- Verificar si el usuario es staff o técnico asignado
  if private.is_staff() then
    v_can_update := true;
  else
    select technicians_can_update_stages into v_tech_allowed from public.company_settings where id = 1;
    if v_tech_allowed and private.is_technician() then
      select exists (
        select 1 from public.project_stages ps
        join public.work_orders wo on wo.project_id = ps.project_id
        join public.work_order_technicians wot on wot.work_order_id = wo.id
        where ps.id = p_stage_id and wot.user_id = auth.uid()
      ) into v_can_update;
    end if;
  end if;

  if not v_can_update then
    raise exception 'No tiene permisos para completar esta etapa.' using errcode = '42501';
  end if;

  select * into v_stage from public.project_stages where id = p_stage_id for update;
  if v_stage.id is null then
    raise exception 'Etapa no encontrada' using errcode = 'P0002';
  end if;

  update public.project_stages
  set status = 'completed',
      completed_at = now(),
      completed_by = auth.uid(),
      notes = coalesce(p_notes, notes),
      updated_at = now()
  where id = p_stage_id
  returning * into v_stage;

  perform private.log_activity('project_stage', v_stage.id, 'completed',
    'Etapa completada: ' || v_stage.name,
    null,
    jsonb_build_object('completed_at', v_stage.completed_at, 'notes', p_notes),
    v_stage.project_id
  );

  return v_stage;
end;
$$;

-- -----------------------------------------------------------------------------
-- Procedimiento para reabrir etapa (con auditoría y justificación)
-- -----------------------------------------------------------------------------
create or replace function public.reopen_project_stage(
  p_stage_id uuid,
  p_reason text
)
returns public.project_stages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stage public.project_stages;
begin
  perform private.require_staff();

  if p_reason is null or char_length(btrim(p_reason)) < 5 then
    raise exception 'Debe proporcionar un motivo válido (mínimo 5 caracteres) para reabrir la etapa.' using errcode = '22023';
  end if;

  select * into v_stage from public.project_stages where id = p_stage_id for update;
  if v_stage.id is null then
    raise exception 'Etapa no encontrada' using errcode = 'P0002';
  end if;

  update public.project_stages
  set status = 'in_progress',
      completed_at = null,
      completed_by = null,
      notes = coalesce(notes || E'\n[Reabierta]: ' || p_reason, '[Reabierta]: ' || p_reason),
      updated_at = now()
  where id = p_stage_id
  returning * into v_stage;

  perform private.log_activity('project_stage', v_stage.id, 'reopened',
    'Etapa reabierta: ' || v_stage.name,
    jsonb_build_object('previous_status', 'completed'),
    jsonb_build_object('reason', p_reason),
    v_stage.project_id
  );

  return v_stage;
end;
$$;

-- -----------------------------------------------------------------------------
-- Procedimiento para confirmar entrega y cerrar orden / proyecto (Regla 8)
-- -----------------------------------------------------------------------------
create or replace function public.confirm_project_delivery(
  p_project_id uuid,
  p_work_order_id uuid default null,
  p_delivery_type text default 'final',
  p_notes text default ''
)
returns public.delivery_confirmations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pending_count integer;
  v_conf public.delivery_confirmations;
  v_project public.projects;
begin
  perform private.require_staff();

  select * into v_project from public.projects where id = p_project_id for update;
  if v_project.id is null then
    raise exception 'Proyecto no encontrado' using errcode = 'P0002';
  end if;

  if p_delivery_type = 'final' then
    -- Regla 8: No se permite cierre mientras existan etapas obligatorias pendientes
    select count(*) into v_pending_count
    from public.project_stages
    where project_id = p_project_id
      and is_required_for_closure = true
      and status <> 'completed';

    if v_pending_count > 0 then
      raise exception 'No se puede confirmar la entrega final: existen % etapas obligatorias pendientes.', v_pending_count
        using errcode = '22023';
    end if;

    -- Cerrar proyecto y orden de trabajo asociada
    update public.projects
    set status = 'completed',
        closed_at = now(),
        closed_by = auth.uid(),
        updated_at = now()
    where id = p_project_id;

    if p_work_order_id is not null then
      update public.work_orders
      set status = 'completed',
          closed_at = now(),
          closed_by = auth.uid(),
          updated_at = now()
      where id = p_work_order_id;
    else
      update public.work_orders
      set status = 'completed',
          closed_at = now(),
          closed_by = auth.uid(),
          updated_at = now()
      where project_id = p_project_id and status <> 'cancelled';
    end if;
  end if;

  insert into public.delivery_confirmations (
    project_id,
    work_order_id,
    delivery_type,
    confirmed_by,
    notes
  )
  values (
    p_project_id,
    p_work_order_id,
    p_delivery_type,
    auth.uid(),
    p_notes
  )
  returning * into v_conf;

  perform private.log_activity('delivery_confirmation', v_conf.id, 'confirmed',
    'Entrega ' || p_delivery_type || ' confirmada',
    null,
    jsonb_build_object('delivery_type', p_delivery_type, 'notes', p_notes),
    p_project_id
  );

  return v_conf;
end;
$$;

create trigger project_stages_set_updated_at
before update on public.project_stages
for each row execute function private.set_updated_at();

create trigger project_stages_audit
after insert or update on public.project_stages
for each row execute function private.audit_row_change('project_stage');

create trigger delivery_confirmations_audit
after insert or update on public.delivery_confirmations
for each row execute function private.audit_row_change('delivery_confirmation');

alter table public.project_stages enable row level security;
alter table public.delivery_confirmations enable row level security;
