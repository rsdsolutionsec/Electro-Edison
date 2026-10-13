import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TecnicoView } from './tecnico-view'

export default async function TecnicoPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const userId = user?.id || ''
  const isElevated = user?.roles.includes('admin') || user?.roles.includes('operations')

  // Consultar visitas asignadas
  const { data: myVisits } = await supabase
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
          )
        )
      ),
      visit_technicians!inner (
        user_id
      )
    `)
    .eq('visit_technicians.user_id', userId)
    .order('start_at', { ascending: true })

  let visitsToDisplay: any[] = myVisits || []

  // Si no tiene visitas directas y es admin/operaciones, mostrar las visitas del día de todo el equipo
  if (visitsToDisplay.length === 0 && isElevated) {
    const { data: allVisits } = await supabase
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
            )
          )
        ),
        visit_technicians (
          user_id
        )
      `)
      .order('start_at', { ascending: true })
      .limit(10)

    visitsToDisplay = allVisits || []
  }

  return (
    <div className="py-2">
      <TecnicoView
        currentUserId={userId}
        userName={user?.full_name || 'Técnico'}
        assignedVisits={visitsToDisplay}
      />
    </div>
  )
}
