-- =============================================================================
-- Migración 0700: Datos de demostración reproducibles e idempotentes
-- =============================================================================

-- Permitir que confirmed_by sea nullable para registros de demostración iniciales
alter table public.delivery_confirmations alter column confirmed_by drop not null;

do $$
declare
  v_client_res_id uuid := '11111111-0000-0000-0000-000000000001';
  v_client_com_id uuid := '11111111-0000-0000-0000-000000000002';
  v_loc_1_id uuid := '22222222-0000-0000-0000-000000000001';
  v_loc_2_id uuid := '22222222-0000-0000-0000-000000000002';
  v_project_1_id uuid := '33333333-0000-0000-0000-000000000001';
  v_project_2_id uuid := '33333333-0000-0000-0000-000000000002';
  v_quote_1_id uuid := '44444444-0000-0000-0000-000000000001';
  v_quote_2_id uuid := '44444444-0000-0000-0000-000000000002';
  v_wo_1_id uuid := '55555555-0000-0000-0000-000000000001';
  v_visit_1_id uuid := '66666666-0000-0000-0000-000000000001';
  v_visit_2_id uuid := '66666666-0000-0000-0000-000000000002';
  v_stage_1_id uuid := '77777777-0000-0000-0000-000000000001';
  v_stage_2_id uuid := '77777777-0000-0000-0000-000000000002';
  v_stage_3_id uuid := '77777777-0000-0000-0000-000000000003';
  v_stage_4_id uuid := '77777777-0000-0000-0000-000000000004';
  v_stage_5_id uuid := '77777777-0000-0000-0000-000000000005';
  v_deliv_part_id uuid := '88888888-0000-0000-0000-000000000001';
  v_first_profile uuid;
begin

  select id into v_first_profile from public.profiles limit 1;

  -- Conceptos del catálogo base
  insert into public.catalog_items (id, description, item_type, unit, unit_price, tax_rate_id) values
    ('99999999-0000-0000-0000-000000000001', 'Cable de cobre THHN #10 AWG (rollo 100m)', 'material', 'rollo', 85.50, '00000000-0000-4000-8000-000000000015'),
    ('99999999-0000-0000-0000-000000000002', 'Tablero de distribución trifásico 24 puntos', 'material', 'u', 145.00, '00000000-0000-4000-8000-000000000015'),
    ('99999999-0000-0000-0000-000000000003', 'Breaker termomagnético 1P 20A', 'material', 'u', 6.25, '00000000-0000-4000-8000-000000000015'),
    ('99999999-0000-0000-0000-000000000004', 'Tubería conduit EMT 3/4" (tramo 3m)', 'material', 'tramo', 8.90, '00000000-0000-4000-8000-000000000015'),
    ('99999999-0000-0000-0000-000000000005', 'Mano de obra técnica: canalización y cableado', 'labor', 'punto', 22.00, '00000000-0000-4000-8000-000000000015'),
    ('99999999-0000-0000-0000-000000000006', 'Mano de obra técnica: montaje y balanceo de tablero', 'labor', 'gl', 180.00, '00000000-0000-4000-8000-000000000015'),
    ('99999999-0000-0000-0000-000000000007', 'Certificación y protocolo de pruebas de aislamiento', 'service', 'gl', 120.00, '00000000-0000-4000-8000-000000000015')
  on conflict (id) do nothing;

  -- 1. Clientes de demostración
  insert into public.clients (id, name, identification, client_type, phone, email, notes) values
    (v_client_com_id, 'Comercializadora Las Acacias S.A. [DEMO]', '0992345678001', 'commercial', '0991234567', 'contacto@lasacacias-demo.ec', 'Cliente comercial para instalación de tableros y climatización.'),
    (v_client_res_id, 'Dra. Carmen Villavicencio [DEMO]', '1712345678', 'residential', '0987654321', 'carmen.v@correo-demo.ec', 'Remodelación de red eléctrica domiciliaria.')
  on conflict (id) do nothing;

  -- 2. Ubicaciones
  insert into public.client_locations (id, client_id, label, address, city, reference) values
    (v_loc_1_id, v_client_com_id, 'Local Principal CC Las Acacias', 'Av. 9 de Octubre y Pichincha, Local 14', 'Guayaquil', 'Junto a la plazoleta bancaria'),
    (v_loc_2_id, v_client_res_id, 'Residencia Los Ceibos', 'Urb. Los Ceibos, Mz. 12 Villa 4', 'Guayaquil', 'Frente al parque central')
  on conflict (id) do nothing;

  -- 3. Proyectos
  insert into public.projects (id, project_code, client_id, location_id, title, description, scope_description, status, priority, start_date, target_end_date) values
    (v_project_1_id, 'PRY-DEMO-001', v_client_com_id, v_loc_1_id, 'Instalación Sistema Eléctrico Trifásico Comercial [DEMO]', 'Adecuación integral de acometida, tablero trifásico y 18 puntos de fuerza.', 'Canalización emt, cableado thhn, tablero 24 pts con breakers y balanceo de fases.', 'in_progress', 'high', private.app_today() - 5, private.app_today() + 10),
    (v_project_2_id, 'PRY-DEMO-002', v_client_res_id, v_loc_2_id, 'Renovación de Tablero y Circuitos Residenciales [DEMO]', 'Reemplazo de tablero antiguo por centro de carga monofásico moderno.', 'Desmontaje de fusibles antiguos, colocación de nuevo tablero y revisión de tierras.', 'planning', 'normal', private.app_today() + 2, private.app_today() + 7)
  on conflict (id) do nothing;

  -- 4. Cotización 1 (Aprobada) para Proyecto 1
  insert into public.quotations (
    id, project_id, quotation_number, version, status, issue_date, valid_until,
    scope_description, subtotal, discount_total, tax_total, total, deposit_type, deposit_value, deposit_amount, estimated_balance,
    payment_terms, execution_time_description, approved_at
  ) values (
    v_quote_1_id, v_project_1_id, 'COT-DEMO-001', 1, 'approved', private.app_today() - 6, private.app_today() + 15,
    'Suministro e instalación de acometida trifásica, tablero y circuitos de iluminación/fuerza.',
    1240.00, 40.00, 180.00, 1380.00, 'percentage', 50.00, 690.00, 690.00,
    '50% de anticipo al aprobar y 50% contra entrega final a satisfacción.', '8 días laborables', now() - interval '4 days'
  ) on conflict (id) do nothing;

  -- Partidas de Cotización 1
  insert into public.quotation_items (quotation_id, description, item_type, unit, quantity, unit_price, discount_type, discount_value, tax_rate, line_subtotal, line_discount, line_tax, line_total, sort_order) values
    (v_quote_1_id, 'Cable THHN #10 AWG (rollo 100m)', 'material', 'rollo', 3, 85.00, 'percentage', 0, 15.00, 255.00, 0, 38.25, 293.25, 1),
    (v_quote_1_id, 'Tablero trifásico de 24 puntos con breakers', 'material', 'u', 1, 245.00, 'percentage', 0, 15.00, 245.00, 0, 36.75, 281.75, 2),
    (v_quote_1_id, 'Tubería conduit EMT 3/4" con accesorios', 'material', 'tramo', 20, 8.50, 'percentage', 0, 15.00, 170.00, 0, 25.50, 195.50, 3),
    (v_quote_1_id, 'Mano de obra de canalización y cableado estructurado', 'labor', 'gl', 1, 450.00, 'fixed', 40.00, 15.00, 450.00, 40.00, 61.50, 471.50, 4),
    (v_quote_1_id, 'Pruebas de aislamiento y balanceo de cargas', 'service', 'gl', 1, 120.00, 'percentage', 0, 15.00, 120.00, 0, 18.00, 138.00, 5)
  on conflict do nothing;

  -- Pago de anticipo registrado para Cotización 1
  insert into public.payment_records (project_id, quotation_id, payment_type, amount, payment_date, reference, notes) values
    (v_project_1_id, v_quote_1_id, 'deposit', 690.00, private.app_today() - 4, 'TRANSF-BCO-789012', 'Anticipo del 50% recibido vía transferencia bancaria comprobada.')
  on conflict do nothing;

  -- Cotización 2 (Borrador/Enviada) para Proyecto 2
  insert into public.quotations (
    id, project_id, quotation_number, version, status, issue_date, valid_until,
    scope_description, subtotal, discount_total, tax_total, total, deposit_type, deposit_value, deposit_amount, estimated_balance,
    payment_terms, execution_time_description
  ) values (
    v_quote_2_id, v_project_2_id, 'COT-DEMO-002', 1, 'sent', private.app_today() - 1, private.app_today() + 14,
    'Renovación completa de centro de carga y circuitos residenciales.',
    420.00, 0, 63.00, 483.00, 'percentage', 50.00, 241.50, 241.50,
    '50% anticipo y 50% al finalizar las pruebas.', '3 días laborables'
  ) on conflict (id) do nothing;

  -- Partidas de Cotización 2
  insert into public.quotation_items (quotation_id, description, item_type, unit, quantity, unit_price, discount_type, discount_value, tax_rate, line_subtotal, line_discount, line_tax, line_total, sort_order) values
    (v_quote_2_id, 'Centro de carga 8 espacios monofásico', 'material', 'u', 1, 65.00, 'percentage', 0, 15.00, 65.00, 0, 9.75, 74.75, 1),
    (v_quote_2_id, 'Breakers 1P 15A y 20A (pack 6u)', 'material', 'pack', 1, 45.00, 'percentage', 0, 15.00, 45.00, 0, 6.75, 51.75, 2),
    (v_quote_2_id, 'Mano de obra desmontaje y conexión', 'labor', 'gl', 1, 310.00, 'percentage', 0, 15.00, 310.00, 0, 46.50, 356.50, 3)
  on conflict do nothing;

  -- 5. Orden de trabajo para Cotización 1
  insert into public.work_orders (
    id, order_number, project_id, quotation_id, status, scope_snapshot
  ) values (
    v_wo_1_id, 'OT-DEMO-001', v_project_1_id, v_quote_1_id, 'in_progress',
    'Suministro e instalación de acometida trifásica, tablero y circuitos de iluminación/fuerza acordados en COT-DEMO-001.'
  ) on conflict (id) do nothing;

  -- 6. Visitas operativas para la orden
  insert into public.visits (
    id, work_order_id, start_at, end_at, status, address_snapshot, instructions
  ) values (
    v_visit_1_id, v_wo_1_id,
    now() - interval '2 days 3 hours', now() - interval '2 days', 'completed',
    'Av. 9 de Octubre y Pichincha, Local 14, Guayaquil',
    'Canalización perimetral y tendido de tubería EMT.'
  ), (
    v_visit_2_id, v_wo_1_id,
    now() + interval '1 day 2 hours', now() + interval '1 day 6 hours', 'scheduled',
    'Av. 9 de Octubre y Pichincha, Local 14, Guayaquil',
    'Montaje de tablero trifásico y conexionado de breakers.'
  ) on conflict (id) do nothing;

  -- 7. Etapas del Proyecto 1
  insert into public.project_stages (id, project_id, name, description, sequence, status, is_required_for_closure, completed_at, notes) values
    (v_stage_1_id, v_project_1_id, '1. Preparación y canalización', 'Replanteo en sitio y fijación de ductos EMT.', 1, 'completed', true, now() - interval '2 days', 'Canalización completada al 100%.'),
    (v_stage_2_id, v_project_1_id, '2. Cableado y tendido de conductores', 'Guía y cableado de fases, neutro y tierra.', 2, 'completed', true, now() - interval '1 day', 'Conductores pasados e identificados.'),
    (v_stage_3_id, v_project_1_id, '3. Montaje de tableros y componentes', 'Instalación de tablero, barrajes y térmicos.', 3, 'in_progress', true, null, 'En ejecución durante la visita programada.'),
    (v_stage_4_id, v_project_1_id, '4. Pruebas y revisión técnica', 'Prueba de aislamiento y balanceo de fases.', 4, 'pending', true, null, null),
    (v_stage_5_id, v_project_1_id, '5. Entrega final a satisfacción', 'Verificación final con el cliente y entrega formal.', 5, 'pending', true, null, null)
  on conflict (id) do nothing;

  -- 8. Ejemplo de entrega parcial registrada
  insert into public.delivery_confirmations (
    id, project_id, work_order_id, delivery_type, confirmed_by, confirmed_at, notes
  ) values (
    v_deliv_part_id, v_project_1_id, v_wo_1_id, 'partial',
    v_first_profile,
    now() - interval '1 day',
    'Entrega parcial de canalización y cableado para permitir cierre de cielo raso por parte del cliente.'
  ) on conflict (id) do nothing;

end $$;
