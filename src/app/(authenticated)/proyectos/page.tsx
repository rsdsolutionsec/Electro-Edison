import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { FolderKanban, Plus, Search, Calendar, AlertTriangle, HardHat } from 'lucide-react'

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; delayed?: string }>
}) {
  const { q, status, delayed } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select(`
      id,
      project_code,
      title,
      status,
      priority,
      start_date,
      target_end_date,
      created_at,
      clients (
        id,
        name
      ),
      project_stages (
        id,
        status
      ),
      project_technicians (
        id,
        role,
        technicians (
          id,
          full_name,
          specialty
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (q && q.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,project_code.ilike.%${q.trim()}%`)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (delayed === 'true') {
    const today = new Date().toISOString().split('T')[0]
    query = query.lt('target_end_date', today).not('status', 'in', '("completed","cancelled")')
  }

  const { data: projects } = await query

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Proyectos de Instalaciones Eléctricas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Expedientes de obra, etapas de ejecución y entregas por instalación.
          </p>
        </div>
        <Link href="/proyectos/nuevo">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4">
          <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q || ''}
                placeholder="Buscar por código de proyecto o título..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <select
              name="status"
              defaultValue={status || 'all'}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 w-full sm:w-48 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="planning">Planificación</option>
              <option value="approved">Aprobado</option>
              <option value="in_progress">En Ejecución</option>
              <option value="on_hold">En Espera</option>
              <option value="completed">Finalizado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <Button type="submit" variant="secondary" className="w-full sm:w-auto">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de Proyectos */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100">
          <CardTitle className="text-base text-slate-800">
            Total Proyectos: {projects?.length ?? 0}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projects && projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Código</th>
                    <th className="px-6 py-3.5">Proyecto</th>
                    <th className="px-6 py-3.5">Cliente</th>
                    <th className="px-6 py-3.5">Cuadrilla</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5">Prioridad</th>
                    <th className="px-6 py-3.5">Avance Etapas</th>
                    <th className="px-6 py-3.5">Fecha Prevista</th>
                    <th className="px-6 py-3.5 text-right">Expediente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p: any) => {
                    const clientData = p.clients as any
                    const crew = p.project_technicians || []
                    const stages = p.project_stages || []
                    const totalStages = stages.length
                    const completedStages = stages.filter((s: any) => s.status === 'completed').length
                    const percent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0

                    const isDelayed =
                      p.target_end_date &&
                      p.target_end_date < todayStr &&
                      !['completed', 'cancelled'].includes(p.status)

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-blue-700">
                          <Link href={`/proyectos/${p.id}`} className="hover:underline">
                            {p.project_code}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/proyectos/${p.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {p.title}
                          </Link>
                          {isDelayed && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <AlertTriangle className="h-3 w-3" /> Atrasado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          {clientData?.name ? (
                            <Link href={`/clientes/${clientData.id}`} className="hover:underline">
                              {clientData.name}
                            </Link>
                          ) : (
                            'Cliente no asignado'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {crew.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[190px]">
                              {crew.map((c: any) => (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200"
                                  title={`${c.technicians?.full_name || 'Técnico'} (${c.role === 'lead' ? 'Líder' : c.role === 'assistant' ? 'Ayudante' : 'Técnico'})`}
                                >
                                  <HardHat className="h-2.5 w-2.5 text-blue-600" />
                                  {c.technicians?.full_name
                                    ? `${c.technicians.full_name.split(' ')[0]} ${c.technicians.full_name.split(' ')[1]?.[0] || ''}.`
                                    : 'Técnico'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sin cuadrilla</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.priority} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-[11px] font-medium text-slate-600">
                              <span>
                                {completedStages}/{totalStages} etapas
                              </span>
                              <span>{percent}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {p.target_end_date ? (
                            <span className={isDelayed ? 'font-bold text-rose-600' : ''}>
                              {new Date(p.target_end_date).toLocaleDateString('es-EC')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Sin fecha</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/proyectos/${p.id}`}
                            className="inline-flex text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Ver Expediente →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <FolderKanban className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">No se encontraron proyectos registrados.</p>
              <Link href="/proyectos/nuevo" className="mt-3 inline-block">
                <Button variant="primary" size="sm">
                  Crear el Primer Proyecto
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
