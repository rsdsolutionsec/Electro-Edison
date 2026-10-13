-- =============================================================================
-- Migración 0300: cotizaciones, versiones, partidas, documentos y pagos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Cotizaciones
-- -----------------------------------------------------------------------------
create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  quotation_number text not null,
  version integer not null default 1,
  status text not null default 'draft',
  issue_date date not null default private.app_today(),
  valid_until date,
  scope_description text,
  subtotal numeric(14, 2) not null default 0,
  discount_total numeric(14, 2) not null default 0,
  tax_total numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  deposit_type text not null default 'percentage',
  deposit_value numeric(14, 2) not null default 50,
  deposit_amount numeric(14, 2) not null default 0,
  estimated_balance numeric(14, 2) not null default 0,
  payment_terms text,
  execution_time_description text,
  notes text,
  commercial_terms text,
  sent_at timestamptz,
  sent_via text,
  response_at timestamptz,
  response_notes text,
  approved_at timestamptz,
  approved_by_user_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  superseded_by_id uuid references public.quotations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_unique_num_version unique (quotation_number, version),
  constraint quotations_version_pos check (version >= 1),
  constraint quotations_status check (status in ('draft', 'sent', 'approved', 'rejected', 'expired', 'superseded')),
  constraint quotations_deposit_type check (deposit_type in ('percentage', 'fixed')),
  constraint quotations_deposit_value check (deposit_value >= 0),
  constraint quotations_amounts_pos check (
    subtotal >= 0 and discount_total >= 0 and tax_total >= 0 and total >= 0 and deposit_amount >= 0 and estimated_balance >= 0
  ),
  constraint quotations_valid_dates check (valid_until is null or valid_until >= issue_date)
);
comment on table public.quotations is 'Cotizaciones con versionado inmutable una vez enviadas/aprobadas.';
create index quotations_project_idx on public.quotations (project_id);
create index quotations_number_idx on public.quotations (quotation_number);
create index quotations_status_idx on public.quotations (status);

-- -----------------------------------------------------------------------------
-- Partidas de cotización
-- -----------------------------------------------------------------------------
create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  description text not null,
  item_type text not null default 'material',
  unit text not null default 'u',
  quantity numeric(12, 3) not null default 1,
  unit_price numeric(14, 4) not null default 0,
  discount_type text not null default 'percentage',
  discount_value numeric(14, 4) not null default 0,
  tax_rate numeric(5, 2) not null default 15,
  tax_rate_id uuid references public.tax_rates (id) on delete set null,
  line_subtotal numeric(14, 2) not null default 0,
  line_discount numeric(14, 2) not null default 0,
  line_tax numeric(14, 2) not null default 0,
  line_total numeric(14, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint quotation_items_type check (item_type in ('material', 'labor', 'service', 'other')),
  constraint quotation_items_unit_len check (char_length(btrim(unit)) between 1 and 20),
  constraint quotation_items_desc_len check (char_length(btrim(description)) between 1 and 500),
  constraint quotation_items_quantity check (quantity > 0),
  constraint quotation_items_price check (unit_price >= 0),
  constraint quotation_items_disc_type check (discount_type in ('percentage', 'fixed')),
  constraint quotation_items_disc_val check (discount_value >= 0),
  constraint quotation_items_tax_rate check (tax_rate >= 0 and tax_rate <= 100),
  constraint quotation_items_totals check (line_subtotal >= 0 and line_discount >= 0 and line_tax >= 0 and line_total >= 0)
);
create index quotation_items_quote_idx on public.quotation_items (quotation_id, sort_order);

-- -----------------------------------------------------------------------------
-- Documentos generados (metadatos / storage)
-- -----------------------------------------------------------------------------
create table public.quotation_documents (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  document_type text not null,
  version integer not null,
  storage_path text,
  file_name text not null,
  file_size integer,
  generated_by uuid references public.profiles (id) on delete set null,
  generated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  constraint quotation_docs_type check (document_type in ('quotation', 'proforma', 'work_order'))
);
create index quotation_documents_quote_idx on public.quotation_documents (quotation_id, document_type, version);

-- -----------------------------------------------------------------------------
-- Registro de pagos recibidos
-- -----------------------------------------------------------------------------
create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  quotation_id uuid references public.quotations (id) on delete set null,
  payment_type text not null default 'deposit',
  amount numeric(14, 2) not null,
  payment_date date not null default private.app_today(),
  reference text,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payment_records_amount check (amount > 0),
  constraint payment_records_type check (payment_type in ('deposit', 'milestone', 'final', 'other'))
);
create index payment_records_project_idx on public.payment_records (project_id);
create index payment_records_quotation_idx on public.payment_records (quotation_id);

-- -----------------------------------------------------------------------------
-- Guardas y triggers para cotizaciones
-- -----------------------------------------------------------------------------
create or replace function private.quotations_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_default_validity integer;
begin
  if tg_op = 'INSERT' then
    if new.quotation_number is null or new.quotation_number = '' then
      new.quotation_number := private.next_document_number('quotation');
    end if;
    new.created_by := coalesce(auth.uid(), new.created_by);
    if new.valid_until is null then
      select default_validity_days into v_default_validity from public.company_settings where id = 1;
      new.valid_until := new.issue_date + coalesce(v_default_validity, 15);
    end if;
    if private.is_direct_api_call() then
      new.status := 'draft';
      new.sent_at := null;
      new.approved_at := null;
      new.approved_by_user_id := null;
      new.superseded_by_id := null;
    end if;
    return new;
  end if;

  new.quotation_number := old.quotation_number;
  new.version := old.version;
  new.project_id := old.project_id;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();

  -- Regla de inmutabilidad: cotización aprobada, enviada o sustituida no se edita en contenido
  if private.is_direct_api_call() then
    if old.status in ('approved', 'superseded', 'rejected', 'expired') then
      raise exception 'La cotización en estado % no admite modificaciones directas. Debe crear una nueva versión.', old.status
        using errcode = '22023';
    end if;
    if old.status = 'sent' and (
      new.subtotal <> old.subtotal or
      new.total <> old.total or
      new.discount_total <> old.discount_total or
      new.tax_total <> old.tax_total or
      new.scope_description is distinct from old.scope_description
    ) then
      raise exception 'No se puede modificar el contenido comercial de una cotización ya enviada. Debe generar una nueva versión.'
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

create trigger quotations_guard
before insert or update on public.quotations
for each row execute function private.quotations_guard();

-- Protección sobre partidas: no modificar partidas de cotizaciones congeladas
create or replace function private.quotation_items_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_qid uuid := case when tg_op = 'DELETE' then old.quotation_id else new.quotation_id end;
begin
  select status into v_status from public.quotations where id = v_qid;
  if v_status in ('approved', 'superseded', 'sent', 'rejected', 'expired') and private.is_direct_api_call() then
    raise exception 'No se pueden modificar las partidas de una cotización en estado %.', v_status
      using errcode = '22023';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger quotation_items_guard
before insert or update or delete on public.quotation_items
for each row execute function private.quotation_items_guard();

-- -----------------------------------------------------------------------------
-- Función de recálculo en servidor de cotización
-- -----------------------------------------------------------------------------
create or replace function public.recalculate_quotation(p_quotation_id uuid)
returns public.quotations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotations;
  v_subtotal numeric(14, 2) := 0;
  v_discount numeric(14, 2) := 0;
  v_tax numeric(14, 2) := 0;
  v_total numeric(14, 2) := 0;
  v_deposit numeric(14, 2) := 0;
  v_balance numeric(14, 2) := 0;
begin
  select * into v_quote from public.quotations where id = p_quotation_id for update;
  if v_quote.id is null then
    raise exception 'Cotización no encontrada' using errcode = 'P0002';
  end if;

  select
    coalesce(sum(line_subtotal), 0),
    coalesce(sum(line_discount), 0),
    coalesce(sum(line_tax), 0),
    coalesce(sum(line_total), 0)
  into v_subtotal, v_discount, v_tax, v_total
  from public.quotation_items
  where quotation_id = p_quotation_id;

  if v_quote.deposit_type = 'percentage' then
    v_deposit := round((v_total * coalesce(v_quote.deposit_value, 50) / 100.0), 2);
  else
    v_deposit := least(v_total, coalesce(v_quote.deposit_value, 0));
  end if;
  v_balance := greatest(0, v_total - v_deposit);

  update public.quotations
  set subtotal = v_subtotal,
      discount_total = v_discount,
      tax_total = v_tax,
      total = v_total,
      deposit_amount = v_deposit,
      estimated_balance = v_balance,
      updated_at = now()
  where id = p_quotation_id
  returning * into v_quote;

  return v_quote;
end;
$$;

-- -----------------------------------------------------------------------------
-- Procedimiento para generar nueva versión de cotización (inmutabilidad)
-- -----------------------------------------------------------------------------
create or replace function public.create_quotation_version(p_quotation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_orig public.quotations;
  v_new_id uuid;
  v_max_version integer;
begin
  perform private.require_staff();

  select * into v_orig from public.quotations where id = p_quotation_id;
  if v_orig.id is null then
    raise exception 'Cotización no encontrada' using errcode = 'P0002';
  end if;

  select coalesce(max(version), 0) into v_max_version
  from public.quotations
  where quotation_number = v_orig.quotation_number;

  insert into public.quotations (
    project_id,
    quotation_number,
    version,
    status,
    issue_date,
    valid_until,
    scope_description,
    subtotal,
    discount_total,
    tax_total,
    total,
    deposit_type,
    deposit_value,
    deposit_amount,
    estimated_balance,
    payment_terms,
    execution_time_description,
    notes,
    commercial_terms,
    created_by
  )
  values (
    v_orig.project_id,
    v_orig.quotation_number,
    v_max_version + 1,
    'draft',
    private.app_today(),
    v_orig.valid_until,
    v_orig.scope_description,
    v_orig.subtotal,
    v_orig.discount_total,
    v_orig.tax_total,
    v_orig.total,
    v_orig.deposit_type,
    v_orig.deposit_value,
    v_orig.deposit_amount,
    v_orig.estimated_balance,
    v_orig.payment_terms,
    v_orig.execution_time_description,
    v_orig.notes,
    v_orig.commercial_terms,
    auth.uid()
  )
  returning id into v_new_id;

  -- Copiar las partidas a la nueva versión
  insert into public.quotation_items (
    quotation_id,
    description,
    item_type,
    unit,
    quantity,
    unit_price,
    discount_type,
    discount_value,
    tax_rate,
    tax_rate_id,
    line_subtotal,
    line_discount,
    line_tax,
    line_total,
    sort_order
  )
  select
    v_new_id,
    description,
    item_type,
    unit,
    quantity,
    unit_price,
    discount_type,
    discount_value,
    tax_rate,
    tax_rate_id,
    line_subtotal,
    line_discount,
    line_tax,
    line_total,
    sort_order
  from public.quotation_items
  where quotation_id = p_quotation_id
  order by sort_order;

  -- Marcar la anterior como superseded si ya estaba enviada
  if v_orig.status in ('draft', 'sent') then
    update public.quotations
    set status = 'superseded', superseded_by_id = v_new_id, updated_at = now()
    where id = v_orig.id;
  end if;

  perform private.log_activity('quotation', v_new_id, 'version_created',
    'Versión ' || (v_max_version + 1)::text || ' creada a partir de v' || v_orig.version::text,
    jsonb_build_object('source_id', v_orig.id, 'source_version', v_orig.version),
    jsonb_build_object('new_version', v_max_version + 1),
    v_orig.project_id
  );

  return v_new_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Procedimiento para registrar aprobación de cotización
-- -----------------------------------------------------------------------------
create or replace function public.approve_quotation(
  p_quotation_id uuid,
  p_notes text default null
)
returns public.quotations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotations;
begin
  perform private.require_staff();

  select * into v_quote from public.quotations where id = p_quotation_id for update;
  if v_quote.id is null then
    raise exception 'Cotización no encontrada' using errcode = 'P0002';
  end if;
  if v_quote.status not in ('draft', 'sent') then
    raise exception 'Solo cotizaciones en borrador o enviadas pueden aprobarse (estado actual: %).', v_quote.status
      using errcode = '22023';
  end if;

  update public.quotations
  set status = 'approved',
      approved_at = now(),
      approved_by_user_id = auth.uid(),
      response_at = now(),
      response_notes = coalesce(p_notes, response_notes),
      updated_at = now()
  where id = p_quotation_id
  returning * into v_quote;

  -- Actualizar estado del proyecto a 'approved' si estaba en 'planning'
  update public.projects
  set status = 'approved', updated_at = now()
  where id = v_quote.project_id and status = 'planning';

  -- Marcar otras versiones anteriores de la misma cotización como superseded
  update public.quotations
  set status = 'superseded', superseded_by_id = v_quote.id, updated_at = now()
  where quotation_number = v_quote.quotation_number
    and id <> v_quote.id
    and status in ('draft', 'sent');

  perform private.log_activity('quotation', v_quote.id, 'approved',
    'Cotización aprobada v' || v_quote.version::text,
    null,
    jsonb_build_object('approved_at', v_quote.approved_at, 'notes', p_notes),
    v_quote.project_id
  );

  return v_quote;
end;
$$;

create trigger quotations_audit
after insert or update on public.quotations
for each row execute function private.audit_row_change('quotation');

create trigger payment_records_audit
after insert or update on public.payment_records
for each row execute function private.audit_row_change('payment_record');

alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.quotation_documents enable row level security;
alter table public.payment_records enable row level security;
