import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FolderKanban,
  Wrench,
  Truck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireUser()
  const supabase = await createClient()

  // Consultas paralelas reales a la base de datos de Supabase
  const [
    { count: draftQuotesCount },
    { count: sentQuotesCount },
    { count: approvedQuotesCount },
    { count: todayVisitsCount },
    { count: inProgressProjectsCount },
    { count: delayedProjectsCount },
    { count: partialDeliveriesCount },
    { data: upcomingVisits },
    { data: recentActivities },
    { data: techniciansList },
  ] = await Promise.all([
    // 1. Cotizaciones en borrador
    supabase.from('quotations').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    // 2. Cotizaciones enviadas pendientes
    supabase.from('quotations').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    // 3. Cotizaciones aprobadas
    supabase.from('quotations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    // 4. Visitas programadas para hoy
    supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('start_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .lte('start_at', new Date(new Date().setHours(23, 59, 59, 999)).toISOString()),
    // 5. Proyectos en ejecución
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    // 6. Proyectos atrasados (fecha fin vencida y no completados)
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .lt('target_end_date', new Date().toISOString().split('T')[0])
      .not('status', 'in', '("completed","cancelled")'),
    // 7. Entregas parciales
    supabase.from('delivery_confirmations').select('*', { count: 'exact', head: true }).eq('delivery_type', 'partial'),
    // 8. Próximas 5 visitas
    supabase
      .from('visits')
      .select(`
        id,
        start_at,
        end_at,
        status,
        address_snapshot,
        work_orders (
          order_number,
          projects (
            title
          )
        )
      `)
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(5),
    // 9. Actividades recientes
    supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6),
    // 10. Técnicos activos
    supabase
      .from('user_roles')
      .select(`
        user_id,
        profiles (
          id,
          full_name
        )
      `)
      .eq('role', 'technician'),
  ])

  return (
    <div className="space-y-8">
      {/* Saludo y Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Panel de Operaciones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resumen en tiempo real de instalaciones, cotizaciones y trabajos en campo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cotizaciones/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Nueva Cotización
          </Link>
          <Link
            href="/proyectos/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FolderKanban className="h-4 w-4" />
            Nuevo Proyecto
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Comerciales */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Gestión Comercial y Cotizaciones
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/cotizaciones?status=draft" className="block">
            <Card className="hover:border-slate-400 transition-colors cursor-pointer border-slate-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Borradores</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{draftQuotesCount ?? 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">En elaboración interna</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cotizaciones?status=sent" className="block">
            <Card className="hover:border-blue-400 transition-colors cursor-pointer border-slate-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Enviadas Pendientes</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{sentQuotesCount ?? 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Esperando respuesta del cliente</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cotizaciones?status=approved" className="block">
            <Card className="hover:border-emerald-400 transition-colors cursor-pointer border-slate-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Aprobadas</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedQuotesCount ?? 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Listas o convertidas a orden</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Operativas */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Operaciones y Ejecución Técnica
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/agenda" className="block">
            <Card className="hover:border-blue-400 transition-colors cursor-pointer border-slate-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Visitas para Hoy</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{todayVisitsCount ?? 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Programadas en agenda</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/proyectos?status=in_progress" className="block">
            <Card className="hover:border-blue-400 transition-colors cursor-pointer border-slate-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">En Ejecución</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{inProgressProjectsCount ?? 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Proyectos activos</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Wrench className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/proyectos?delayed=true" className="block">
            <Card className="hover:border-rose-400 transition-colors cursor-pointer border-slate-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Atrasados</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{delayedProjectsCount ?? 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Fecha objetivo vencida</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/proyectos" className="block">
            <Card className="hover:border-slate-400 transition-colors cursor-pointer border-slate-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Entregas Parciales</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{partialDeliveriesCount ?? 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Registradas con constancia</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Truck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Grid de 2 Columnas: Próximas Visitas y Actividad Reciente */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximas Visitas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              Próximas Visitas en Agenda
            </CardTitle>
            <Link
              href="/agenda"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Ver agenda completa <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingVisits && upcomingVisits.length > 0 ? (
              <div className="space-y-3">
                {upcomingVisits.map((visit: any) => {
                  const wo = visit.work_orders as any
                  const prj = wo?.projects as any
                  const dateStr = new Date(visit.start_at).toLocaleString('es-EC', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })

                  return (
                    <div
                      key={visit.id}
                      className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {prj?.title || 'Instalación'}
                          </span>
                          <StatusBadge status={visit.status} />
                        </div>
                        <p className="text-xs text-slate-500">
                          OT: <span className="font-medium text-slate-700">{wo?.order_number}</span> • {dateStr}
                        </p>
                        {visit.address_snapshot && (
                          <p className="text-[11px] text-slate-400">{visit.address_snapshot}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                No hay visitas próximas programadas.{' '}
                <Link href="/agenda" className="text-blue-600 underline">
                  Programar una visita
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Actividad Reciente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              Actividad Reciente y Trazabilidad
            </CardTitle>
            <span className="text-xs text-slate-400">Auditoría en vivo</span>
          </CardHeader>
          <CardContent>
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((act: any) => {
                  const dateStr = new Date(act.created_at).toLocaleString('es-EC', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })

                  return (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-semibold text-slate-900">
                          {act.summary || `${act.action} en ${act.entity_type}`}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Entidad: <span className="font-medium text-slate-700">{act.entity_type}</span> • {dateStr}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                Sin registros de actividad recientes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
