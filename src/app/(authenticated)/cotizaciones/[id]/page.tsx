import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuotationEditor } from './quotation-editor'

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Consultar la cotización con sus partidas y proyecto
  const { data: quotation, error } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (
        id,
        description,
        item_type,
        unit,
        quantity,
        unit_price,
        discount_type,
        discount_value,
        tax_rate,
        sort_order
      ),
      projects (
        id,
        project_code,
        title,
        clients (
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !quotation) {
    notFound()
  }

  // 2. Proyectos disponibles
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

  // 3. Catálogo de items
  const { data: catalogItems } = await supabase
    .from('catalog_items')
    .select('id, description, item_type, unit, unit_price')
    .eq('is_active', true)
    .order('description', { ascending: true })

  // Mapear items ordenados
  const formattedQuotation = {
    ...quotation,
    items: (quotation.quotation_items || []).sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
  }

  return (
    <div className="space-y-6">
      <QuotationEditor
        initialQuotation={formattedQuotation}
        projectId={quotation.project_id}
        projects={projects}
        catalogItems={catalogItems || []}
      />
    </div>
  )
}
