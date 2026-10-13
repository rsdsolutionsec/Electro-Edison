import { createClient } from '@/lib/supabase/server'
import { AgendaView } from './agenda-view'

export default async function AgendaPage() {
  const supabase = await createClient()

  // 1. Obtener todas las visitas con relaciones completas
  const { data: visits } = await supabase
    .from('visits')
    .select(`
      id,
      work_order_id,
      start_at,
      end_at,
      status,
      address_snapshot,
      instructions,
      notes,
      allow_conflict_override,
      work_orders (
        id,
        order_number,
        projects (
          id,
          title,
          clients (
            id,
            name,
            phone
          ),
          client_locations (
            id,
            address,
            city
          )
        )
      ),
      visit_technicians (
        id,
        user_id,
        profiles!visit_technicians_user_id_fkey (
          id,
          full_name
        )
      )
    `)
    .order('start_at', { ascending: true })

  // 2. Órdenes de trabajo disponibles para agendar (no cerradas)
  const { data: rawWorkOrders } = await supabase
    .from('work_orders')
    .select(`
      id,
      order_number,
      projects (
        id,
        title,
        clients (
          id,
          name,
          phone
        ),
        client_locations (
          id,
          address
        )
      )
    `)
    .not('status', 'in', '("completed","cancelled")')
    .order('created_at', { ascending: false })

  // 3. Catálogo de técnicos de campo para asignar a visitas
  const { data: techList } = await supabase
    .from('technicians')
    .select('id, full_name, specialty')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const { data: profilesList } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  // Presentar todos los electricistas disponibles
  const combinedTechs = (techList && techList.length > 0)
    ? techList.map((t) => ({ id: t.id, full_name: `${t.full_name} — ${t.specialty}` }))
    : (profilesList || [])

  return (
    <div className="space-y-6">
      <AgendaView
        initialVisits={(visits || []) as any[]}
        workOrders={(rawWorkOrders || []) as any[]}
        technicians={combinedTechs}
      />
    </div>
  )
}
