import { createClient } from '@/lib/supabase/server'
import { QuotationEditor } from '../[id]/quotation-editor'

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>
}) {
  const { projectId } = await searchParams
  const supabase = await createClient()

  // 1. Proyectos disponibles
  const { data: rawProjects } = await supabase
    .from('projects')
    .select('id, project_code, title, clients(name)')
    .order('created_at', { ascending: false })

  const projects = (rawProjects || []).map((p: any) => ({
    id: p.id,
    project_code: p.project_code,
    title: p.title,
    client_name: p.clients?.name,
  }))

  // 2. Catálogo de items
  const { data: catalogItems } = await supabase
    .from('catalog_items')
    .select('id, description, item_type, unit, unit_price')
    .eq('is_active', true)
    .order('description', { ascending: true })

  return (
    <div className="space-y-6">
      <QuotationEditor
        projectId={projectId}
        projects={projects}
        catalogItems={catalogItems || []}
      />
    </div>
  )
}
