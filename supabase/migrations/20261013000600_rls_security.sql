-- =============================================================================
-- Migración 0600: políticas RLS para todos los roles y administración de usuarios
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funciones administrativas para gestión de usuarios (solo ADMIN)
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_user_roles(
  p_user_id uuid,
  p_roles text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  perform private.require_admin();

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  -- Borrar roles actuales
  delete from public.user_roles where user_id = p_user_id;

  -- Insertar nuevos roles validados
  foreach v_role in array p_roles loop
    if v_role in ('admin', 'operations', 'technician') then
      insert into public.user_roles (user_id, role, created_by)
      values (p_user_id, v_role, auth.uid())
      on conflict (user_id, role) do nothing;
    end if;
  end loop;

  perform private.log_activity('user_roles', p_user_id, 'roles_updated',
    'Roles actualizados para usuario',
    null,
    jsonb_build_object('roles', p_roles)
  );
end;
$$;

create or replace function public.admin_toggle_user_active(
  p_user_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();

  if p_user_id = auth.uid() and not p_is_active then
    raise exception 'No puede desactivar su propia cuenta de administrador.' using errcode = '22023';
  end if;

  update public.profiles
  set is_active = p_is_active, updated_at = now()
  where id = p_user_id;

  perform private.log_activity('profile', p_user_id, 'status_updated',
    case when p_is_active then 'Usuario activado' else 'Usuario desactivado' end,
    null,
    jsonb_build_object('is_active', p_is_active)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Funciones auxiliares para RLS en técnicos (visitas y órdenes asignadas)
-- -----------------------------------------------------------------------------
create or replace function private.is_assigned_to_work_order(p_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.work_order_technicians wot
    where wot.work_order_id = p_work_order_id and wot.user_id = auth.uid()
  ) or exists (
    select 1 from public.visits v
    join public.visit_technicians vt on vt.visit_id = v.id
    where v.work_order_id = p_work_order_id and vt.user_id = auth.uid()
  );
$$;

create or replace function private.is_assigned_to_visit(p_visit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.visit_technicians vt
    where vt.visit_id = p_visit_id and vt.user_id = auth.uid()
  ) or exists (
    select 1 from public.visits v
    join public.work_order_technicians wot on wot.work_order_id = v.work_order_id
    where v.id = p_visit_id and wot.user_id = auth.uid()
  );
$$;

create or replace function private.is_assigned_to_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.work_orders wo
    where wo.project_id = p_project_id
      and private.is_assigned_to_work_order(wo.id)
  );
$$;

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: PROFILES
-- -----------------------------------------------------------------------------
create policy "profiles_select_active"
on public.profiles for select
to authenticated
using (is_active or id = auth.uid() or private.is_admin());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid() or private.is_admin())
with check (id = auth.uid() or private.is_admin());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: USER_ROLES
-- -----------------------------------------------------------------------------
create policy "user_roles_select_auth"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or private.is_staff());

-- Inserción/actualización directa denegada: usar admin_set_user_roles

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: COMPANY_SETTINGS
-- -----------------------------------------------------------------------------
create policy "settings_select"
on public.company_settings for select
to authenticated
using (true);

create policy "settings_update_admin"
on public.company_settings for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: DOCUMENT_SERIES & DOCUMENT_COUNTERS
-- -----------------------------------------------------------------------------
create policy "series_select"
on public.document_series for select
to authenticated
using (true);

create policy "series_admin"
on public.document_series for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "counters_select"
on public.document_counters for select
to authenticated
using (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: TAX_RATES & CATALOG_ITEMS
-- -----------------------------------------------------------------------------
create policy "tax_rates_select"
on public.tax_rates for select
to authenticated
using (is_active or private.is_staff());

create policy "tax_rates_write_admin"
on public.tax_rates for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "catalog_select"
on public.catalog_items for select
to authenticated
using (is_active or private.is_staff());

create policy "catalog_write_staff"
on public.catalog_items for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: CLIENTS & CLIENT_LOCATIONS
-- -----------------------------------------------------------------------------
create policy "clients_select"
on public.clients for select
to authenticated
using (
  private.is_staff() or
  exists (
    select 1 from public.projects prj
    where prj.client_id = public.clients.id
      and private.is_assigned_to_project(prj.id)
  )
);

create policy "clients_write_staff"
on public.clients for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "locations_select"
on public.client_locations for select
to authenticated
using (
  private.is_staff() or
  exists (
    select 1 from public.projects prj
    where prj.location_id = public.client_locations.id
      and private.is_assigned_to_project(prj.id)
  )
);

create policy "locations_write_staff"
on public.client_locations for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: PROJECTS
-- -----------------------------------------------------------------------------
create policy "projects_select"
on public.projects for select
to authenticated
using (
  private.is_staff() or
  private.is_assigned_to_project(id)
);

create policy "projects_write_staff"
on public.projects for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: QUOTATIONS & ITEMS & DOCUMENTS (PRIVADOS PARA STAFF)
-- -----------------------------------------------------------------------------
-- Técnicos NUNCA deben ver cotizaciones ni precios
create policy "quotations_staff_only"
on public.quotations for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "quotation_items_staff_only"
on public.quotation_items for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "quotation_docs_staff_only"
on public.quotation_documents for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: WORK_ORDERS
-- -----------------------------------------------------------------------------
create policy "work_orders_select"
on public.work_orders for select
to authenticated
using (
  private.is_staff() or
  private.is_assigned_to_work_order(id)
);

create policy "work_orders_insert_staff"
on public.work_orders for insert
to authenticated
with check (private.is_staff());

create policy "work_orders_update"
on public.work_orders for update
to authenticated
using (
  private.is_staff() or
  private.is_assigned_to_work_order(id)
)
with check (
  private.is_staff() or
  private.is_assigned_to_work_order(id)
);

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: VISITS
-- -----------------------------------------------------------------------------
create policy "visits_select"
on public.visits for select
to authenticated
using (
  private.is_staff() or
  private.is_assigned_to_visit(id)
);

create policy "visits_insert_staff"
on public.visits for insert
to authenticated
with check (private.is_staff());

create policy "visits_update"
on public.visits for update
to authenticated
using (
  private.is_staff() or
  private.is_assigned_to_visit(id)
)
with check (
  private.is_staff() or
  private.is_assigned_to_visit(id)
);

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: TECHNICIAN ASSIGNMENTS
-- -----------------------------------------------------------------------------
create policy "wo_techs_select"
on public.work_order_technicians for select
to authenticated
using (
  private.is_staff() or
  user_id = auth.uid() or
  private.is_assigned_to_work_order(work_order_id)
);

create policy "wo_techs_write_staff"
on public.work_order_technicians for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "visit_techs_select"
on public.visit_technicians for select
to authenticated
using (
  private.is_staff() or
  user_id = auth.uid() or
  private.is_assigned_to_visit(visit_id)
);

create policy "visit_techs_write_staff"
on public.visit_technicians for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: PROJECT_STAGES & DELIVERIES
-- -----------------------------------------------------------------------------
create policy "project_stages_select"
on public.project_stages for select
to authenticated
using (
  private.is_staff() or
  private.is_assigned_to_project(project_id)
);

create policy "project_stages_write_staff"
on public.project_stages for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "deliveries_select"
on public.delivery_confirmations for select
to authenticated
using (
  private.is_staff() or
  private.is_assigned_to_project(project_id)
);

create policy "deliveries_write_staff"
on public.delivery_confirmations for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: PAYMENT_RECORDS (STAFF ONLY)
-- -----------------------------------------------------------------------------
create policy "payments_staff_only"
on public.payment_records for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS: ACTIVITY_LOGS
-- -----------------------------------------------------------------------------
create policy "activity_logs_select"
on public.activity_logs for select
to authenticated
using (
  private.is_staff() or
  (project_id is not null and private.is_assigned_to_project(project_id))
);
