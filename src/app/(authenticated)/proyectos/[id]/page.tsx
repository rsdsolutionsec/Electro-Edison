import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { EtapasSection } from './etapas-section'
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  FileSpreadsheet,
  ClipboardList,
  Plus,
  TrendingUp,
  FileText,
} from 'lucide-react'

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Cargar expediente completo del proyecto
  const [
    { data: project, error: projectError },
    { data: quotations },
    { data: workOrders },
    { data: stages },
    { data: deliveries },
    { data: activityLogs },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select(`
        *,
        clients (
          id,
          name,
          phone,
          email
        ),
        client_locations (
          id,
          address,
          city,
          reference
        ),
        profiles (
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('quotations')
      .select('*')
      .eq('project_id', id)
      .order('version', { ascending: false }),
    supabase
      .from('work_orders')
      .select(`
        *,
        work_order_technicians (
          id,
          assignment_role,
          profiles (
            id,
            full_name
          )
        ),
        visits (
          id,
          start_at,
          end_at,
          status,
          instructions
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', id)
      .order('sequence', { ascending: true }),
    supabase
      .from('delivery_confirmations')
      .select('*')
      .eq('project_id', id)
      .order('confirmed_at', { ascending: false }),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (projectError || !project) {
    notFound()
  }

  const clientData = project.clients as any
  const locationData = project.client_locations as any
  const responsible = project.profiles as any
  const primaryWorkOrder = workOrders?.[0]

  return (
    <div className="space-y-6">
      {/* Header Expediente */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/proyectos" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {project.project_code}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.title}</h1>
              <StatusBadge status={project.status} />
              <StatusBadge status={project.priority} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cliente:{' '}
              <Link href={`/clientes/${clientData?.id}`} className="font-medium text-slate-700 hover:underline">
                {clientData?.name}
              </Link>{' '}
              • Creado el {new Date(project.created_at).toLocaleDateString('es-EC')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/cotizaciones/nueva?project_id=${project.id}`}>
            <Button variant="primary" size="sm" className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              Nueva Cotización
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Parámetros del Expediente */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>Ubicación de la Obra</span>
            </div>
            <p className="text-sm font-medium text-slate-900">
              {locationData ? `${locationData.address} (${locationData.city})` : 'No asignada'}
            </p>
            {locationData?.reference && (
              <p className="text-xs text-slate-500 italic">Ref: {locationData.reference}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Cronograma Previsto</span>
            </div>
            <p className="text-sm font-medium text-slate-900">
              {project.start_date ? new Date(project.start_date).toLocaleDateString('es-EC') : 'Sin inicio'}
              {' → '}
              {project.target_end_date ? new Date(project.target_end_date).toLocaleDateString('es-EC') : 'Sin fin'}
            </p>
            <p className="text-xs text-slate-500">
              {project.closed_at ? `Cerrado el ${new Date(project.closed_at).toLocaleDateString('es-EC')}` : 'En curso'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Responsable Interno</span>
            </div>
            <p className="text-sm font-medium text-slate-900">
              {responsible?.full_name || 'Sin asignar'}
            </p>
            <p className="text-xs text-slate-500">Coordinación de obra</p>
          </CardContent>
        </Card>
      </div>

      {/* Alcance de los Trabajos */}
      {project.scope_description && (
        <Card>
          <CardHeader className="py-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold">Alcance Técnico Registrado</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {project.scope_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sección 1: Cotizaciones Asociadas y Versiones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">
              Cotizaciones y Proformas del Proyecto ({quotations?.length ?? 0})
            </CardTitle>
            <p className="text-xs text-slate-500">
              Historial de versiones. Solo una versión aprobada genera la orden de trabajo.
            </p>
          </div>
          <Link href={`/cotizaciones/nueva?project_id=${project.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Elaborar Cotización
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {quotations && quotations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Número</th>
                    <th className="px-6 py-3">Versión</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Emisión</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q: any) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-xs text-slate-900">
                        <Link href={`/cotizaciones/${q.id}`} className="hover:text-blue-600">
                          {q.quotation_number}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                          v{q.version}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">{q.issue_date}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs">
                        ${Number(q.subtotal).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-xs text-blue-700">
                        ${Number(q.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2">
                        <Link
                          href={`/api/pdf/quotation/${q.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                        >
                          <FileText className="h-3 w-3" /> PDF
                        </Link>
                        <Link
                          href={`/cotizaciones/${q.id}`}
                          className="inline-flex text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Abrir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No se han emitido cotizaciones para este proyecto aún.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección 2: Órdenes de Trabajo y Asignaciones */}
      {workOrders && workOrders.length > 0 && (
        <Card>
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold">
              Órdenes de Trabajo en Ejecución ({workOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {workOrders.map((wo: any) => {
              const techs = wo.work_order_technicians || []
              const visits = wo.visits || []

              return (
                <div key={wo.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-sm">OT: {wo.order_number}</span>
                      <StatusBadge status={wo.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/api/pdf/work_order/${wo.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <FileText className="h-3 w-3" /> Descargar OT PDF
                      </Link>
                      <Link href={`/ordenes/${wo.id}`}>
                        <Button variant="outline" size="sm">
                          Gestionar Orden
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{wo.scope_snapshot}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">
                        Técnicos Colaboradores ({techs.length}):
                      </p>
                      {techs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {techs.map((t: any) => (
                            <span
                              key={t.id}
                              className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-800"
                            >
                              {t.profiles?.full_name} ({t.assignment_role})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin técnicos asignados</span>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-700 mb-1">
                        Visitas en Agenda ({visits.length}):
                      </p>
                      {visits.length > 0 ? (
                        <p className="text-slate-600">
                          {visits.filter((v: any) => v.status === 'completed').length} de {visits.length} completadas.
                        </p>
                      ) : (
                        <span className="text-slate-400">Sin visitas programadas</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Sección 3: Etapas del Proyecto y Entregas Parciales / Finales */}
      <EtapasSection
        projectId={project.id}
        workOrderId={primaryWorkOrder?.id || null}
        stages={stages || []}
        deliveries={deliveries || []}
        projectStatus={project.status}
      />

      {/* Sección 4: Historial de Auditoría */}
      {activityLogs && activityLogs.length > 0 && (
        <Card>
          <CardHeader className="py-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              Trazabilidad y Registro de Cambios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {activityLogs.map((log: any) => (
              <div key={log.id} className="flex items-start justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">{log.summary || `${log.action} en ${log.entity_type}`}</span>
                <span className="text-slate-400 text-[11px]">
                  {new Date(log.created_at).toLocaleString('es-EC')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
