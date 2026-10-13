import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'
import { TechniciansView } from './technicians-view'

export default async function TecnicosPage() {
  await requireStaff()
  const supabase = await createClient()

  // 1. Consultar técnicos con sus proyectos asignados
  const { data: rawTechnicians, error } = await supabase
    .from('technicians')
    .select(`
      *,
      project_technicians (
        id,
        role,
        assigned_at,
        projects (
          id,
          project_code,
          title,
          status
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching technicians:', error)
  }

  // 2. Consultar proyectos activos disponibles para asignación rápida
  const { data: activeProjects } = await supabase
    .from('projects')
    .select('id, project_code, title, status')
    .not('status', 'in', '("completed","cancelled")')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <TechniciansView
        technicians={(rawTechnicians || []) as any[]}
        activeProjects={activeProjects || []}
      />
    </div>
  )
}
