import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  ClipboardList,
  Search,
  FileText,
  Calendar,
  UserCheck,
  Building2,
  Download,
  ExternalLink,
} from 'lucide-react'

export default async function OrdenesTrabajoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('work_orders')
    .select(`
      id,
      order_number,
      status,
      created_at,
      closed_at,
      responsible_user_id,
      projects (
        id,
        project_code,
        title,
        clients (
          id,
          name,
          phone
        )
      ),
      responsible:profiles!work_orders_responsible_user_id_fkey (
        id,
        full_name
      ),
      visits (
        id,
        start_at,
        end_at,
        status
      )
    `)
    .order('created_at', { ascending: false })

  if (q && q.trim()) {
    query = query.ilike('order_number', `%${q.trim()}%`)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: workOrders } = await query

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Órdenes de Trabajo Técnicas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión operativa, cronograma en campo y asignación de técnicos de Eléctrico Edison Pino.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q || ''}
                placeholder="Buscar por número de orden (ej: OT-2026-0001)..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <select
              name="status"
              defaultValue={status || 'all'}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 w-full sm:w-52 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="pending_schedule">Pendiente Agendar</option>
              <option value="scheduled">Agendada</option>
              <option value="in_progress">En Ejecución</option>
              <option value="paused">En Pausa</option>
              <option value="action_required">Acción Requerida</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <Button type="submit" variant="secondary" className="w-full sm:w-auto">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Listado de Órdenes */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100">
          <CardTitle className="text-base text-slate-800">
            Total Órdenes: {workOrders?.length ?? 0}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!workOrders || workOrders.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No se encontraron órdenes de trabajo
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Las órdenes de trabajo se originan automáticamente al aprobar una cotización o desde proyectos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Orden</th>
                    <th className="px-6 py-3 font-semibold">Proyecto & Cliente</th>
                    <th className="px-6 py-3 font-semibold">Responsable</th>
                    <th className="px-6 py-3 font-semibold">Visitas</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workOrders.map((wo: any) => {
                    const upcomingVisits = (wo.visits || []).filter(
                      (v: any) => v.status !== 'cancelled'
                    )
                    return (
                      <tr key={wo.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/ordenes/${wo.id}`}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                          >
                            <ClipboardList className="h-4 w-4" />
                            {wo.order_number}
                          </Link>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            Creada:{' '}
                            {new Date(wo.created_at).toLocaleDateString('es-EC', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 line-clamp-1">
                            {wo.projects?.title || 'Sin proyecto'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span>{wo.projects?.clients?.name || 'Cliente no asignado'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {wo.responsible?.full_name ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                              <span>{wo.responsible.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin responsable</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {upcomingVisits.length}{' '}
                              {upcomingVisits.length === 1 ? 'visita' : 'visitas'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={wo.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/api/pdf/work-order/${wo.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
                              title="Descargar Orden Técnica en PDF"
                            >
                              <Download className="h-3.5 w-3.5 text-slate-500" />
                              PDF
                            </a>
                            <Link href={`/ordenes/${wo.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                Gestionar
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
