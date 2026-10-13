-- =============================================================================
-- Migración 0800: Catálogo de Técnicos de Campo y Cuadrillas de Proyectos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabla de Técnicos (personal operativo sin obligatoriedad de cuenta Auth)
-- -----------------------------------------------------------------------------
create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  identification text,
  phone text,
  email text,
  specialty text not null default 'Instalaciones Eléctricas Generales',
  category text not null default 'technician',
  status text not null default 'available',
  is_active boolean not null default true,
  notes text,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technicians_name_len check (char_length(btrim(full_name)) between 2 and 120),
  constraint technicians_category check (category in ('lead', 'technician', 'assistant')),
  constraint technicians_status check (status in ('available', 'assigned', 'on_leave', 'inactive'))
);

comment on table public.technicians is 'Personal técnico y electricistas de campo de Eléctrico Edison Pino.';
create index if not exists technicians_status_idx on public.technicians (status);
create index if not exists technicians_active_idx on public.technicians (is_active);

-- Trigger updated_at
create trigger technicians_set_updated_at
before update on public.technicians
for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Asignación de Cuadrillas a Proyectos (Relación N a N)
-- -----------------------------------------------------------------------------
create table if not exists public.project_technicians (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  technician_id uuid not null references public.technicians (id) on delete cascade,
  role text not null default 'technician',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  notes text,
  constraint project_technicians_role check (role in ('lead', 'technician', 'assistant')),
  constraint project_technicians_unique unique (project_id, technician_id)
);

comment on table public.project_technicians is 'Cuadrilla de técnicos asignados a la ejecución de un proyecto.';
create index if not exists project_technicians_project_idx on public.project_technicians (project_id);
create index if not exists project_technicians_technician_idx on public.project_technicians (technician_id);

-- -----------------------------------------------------------------------------
-- 3. Habilitar technician_id en visitas y órdenes de trabajo (opcional)
-- -----------------------------------------------------------------------------
alter table public.visit_technicians 
  add column if not exists technician_id uuid references public.technicians (id) on delete cascade;

alter table public.visit_technicians 
  alter column user_id drop not null;

alter table public.work_order_technicians 
  add column if not exists technician_id uuid references public.technicians (id) on delete cascade;

alter table public.work_order_technicians 
  alter column user_id drop not null;

-- -----------------------------------------------------------------------------
-- 4. Políticas RLS
-- -----------------------------------------------------------------------------
alter table public.technicians enable row level security;
alter table public.project_technicians enable row level security;

create policy "technicians_select_auth"
on public.technicians for select
to authenticated
using (true);

create policy "technicians_write_staff"
on public.technicians for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "project_technicians_select_auth"
on public.project_technicians for select
to authenticated
using (true);

create policy "project_technicians_write_staff"
on public.project_technicians for all
to authenticated
using (private.is_staff())
with check (private.is_staff());

-- -----------------------------------------------------------------------------
-- 5. Seed de Técnicos y Cuadrillas de Eléctrico Edison Pino
-- -----------------------------------------------------------------------------
insert into public.technicians (id, full_name, identification, phone, email, specialty, category, status, is_active, notes)
values
  ('77777777-0000-0000-0000-000000000001', 'Ing. Edison Pino', '0912345678', '+593 99 123 4567', 'admin@electricopino.ec', 'Ingeniería Eléctrica y Media Tensión', 'lead', 'available', true, 'Jefe técnico y director de obras'),
  ('77777777-0000-0000-0000-000000000002', 'Carlos Mendoza', '0923456789', '+593 98 765 4321', 'coordinador@electricopino.ec', 'Supervisión de Cuadrilla y Tableros', 'lead', 'available', true, 'Coordinador operativo de campo'),
  ('77777777-0000-0000-0000-000000000003', 'Luis Gómez', '0934567890', '+593 97 111 2233', 'luis.gomez@electricopino.ec', 'Electricista Industrial y Canalizaciones', 'technician', 'available', true, 'Especialista en tendido de alimentadores pesados'),
  ('77777777-0000-0000-0000-000000000004', 'Jorge Morales', '0945678901', '+593 96 222 3344', 'jorge.morales@electricopino.ec', 'Tableros de Distribución y Protecciones', 'technician', 'available', true, 'Armado, balanceo y pruebas con megóhmetro'),
  ('77777777-0000-0000-0000-000000000005', 'Kevin Ramírez', '0956789012', '+593 95 333 4455', 'kevin.ramirez@electricopino.ec', 'Instalaciones Comerciales y Residenciales', 'technician', 'available', true, 'Circuitos derivados, iluminación y fuerza'),
  ('77777777-0000-0000-0000-000000000006', 'Bryan Cedeño', '0967890123', '+593 94 444 5566', 'bryan.cedeno@electricopino.ec', 'Ayudante Técnico Electricista', 'assistant', 'available', true, 'Soporte en canalización, cableado y logística')
on conflict (id) do update set
  full_name = excluded.full_name,
  specialty = excluded.specialty,
  phone = excluded.phone;

-- Asignar cuadrillas iniciales a los proyectos existentes
insert into public.project_technicians (project_id, technician_id, role, notes)
values
  -- Proyecto 1 (Trifásico Comercial)
  ('33333333-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'lead', 'Responsable general de obra'),
  ('33333333-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000003', 'technician', 'Acometida trifásica y canalización'),
  ('33333333-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000006', 'assistant', 'Apoyo en tendido de cableado'),

  -- Proyecto 2 (Residencial Tableros)
  ('33333333-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000002', 'lead', 'Coordinador del servicio'),
  ('33333333-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000004', 'technician', 'Reemplazo y balanceo de tablero'),

  -- Proyecto 3 (Instalación Residencial)
  ('0e796e82-c46c-49a0-a406-c50010bd26a4', '77777777-0000-0000-0000-000000000002', 'lead', 'Supervisor asignado'),
  ('0e796e82-c46c-49a0-a406-c50010bd26a4', '77777777-0000-0000-0000-000000000005', 'technician', 'Instalación de circuitos interiores')
on conflict (project_id, technician_id) do nothing;
