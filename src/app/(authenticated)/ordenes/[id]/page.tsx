import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { WorkOrderControls } from './work-order-controls'
import {
  ClipboardList,
  Download,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react'

export default async function OrdenTrabajoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Obtener la orden de trabajo con todas sus relaciones
  const { data: workOrder, error } = await supabase
    .from('work_orders')
    .select(`
      *,
      projects (
        id,
        project_code,
        title,
        status,
        clients (
          id,
          name,
          phone,
          email,
          identification
        ),
        client_locations (
          id,
          address,
          city,
          reference
        )
      ),
      quotations (
        id,
        quotation_number,
        total,
        deposit_amount
      ),
      responsible:profiles!work_orders_responsible_user_id_fkey (
        id,
        full_name,
        email
      ),
      work_order_technicians (
        id,
        user_id,
        assignment_role,
        assigned_at,
        profiles (
          id,
          full_name,
          phone
        )
      ),
      visits (
        id,
        start_at,
        end_at,
        status,
        address_snapshot,
        instructions,
        notes,
        visit_technicians (
          id,
          user_id,
          profiles (
            id,
            full_name
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !workOrder) {
    notFound()
  }

  // 2. Obtener lista de perfiles disponibles para asignar
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const client = workOrder.projects?.clients
  const visits = (workOrder.visits || []).sort(
    (a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Botón Volver y Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/ordenes">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" />
              Volver a Órdenes
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {workOrder.order_number}
              </h1>
              <StatusBadge status={workOrder.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Proyecto: {workOrder.projects?.project_code} — {workOrder.projects?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/pdf/work-order/${workOrder.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4 text-blue-600" />
            Descargar Orden PDF
          </a>
        </div>
      </div>

      {/* Tarjeta de Información General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              Datos del Cliente y Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Cliente</span>
              <p className="font-semibold text-slate-900">{client?.name || 'No especificado'}</p>
              {client?.identification && (
                <span className="text-xs text-slate-500">RUC/CI: {client.identification}</span>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Contacto</span>
              <p className="text-slate-800 flex items-center gap-1 text-xs mt-0.5">
                <Phone className="h-3 w-3 text-slate-400" />
                {client?.phone || 'Sin teléfono'}
              </p>
              <p className="text-slate-800 flex items-center gap-1 text-xs mt-0.5">
                <Mail className="h-3 w-3 text-slate-400" />
                {client?.email || 'Sin correo'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs text-slate-400 block">Dirección de Trabajo</span>
              <p className="text-slate-800 flex items-center gap-1 text-xs mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                {workOrder.projects?.client_locations?.address || 'Sin dirección registrada'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resumen Comercial Asociado */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base text-slate-800">Origen Comercial</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Cotización Aprobada</span>
              <Link
                href={`/cotizaciones/${workOrder.quotations?.id}`}
                className="font-mono font-bold text-blue-600 hover:underline block mt-0.5"
              >
                {workOrder.quotations?.quotation_number || 'Ver Cotización'}
              </Link>
            </div>
            <div>
              <span className="text-slate-400 block">Monto Aprobado</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                ${Number(workOrder.quotations?.total || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Anticipo Pactado</span>
              <p className="font-semibold text-emerald-700 mt-0.5">
                ${Number(workOrder.quotations?.deposit_amount || 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Estado, Técnicos y Agendamiento */}
      <WorkOrderControls
        workOrder={workOrder}
        technicians={profiles || []}
      />

      {/* Cronograma de Visitas Operativas */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Visitas Técnicas Programadas ({visits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {visits.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-600">No hay visitas agendadas para esta orden.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Utiliza el botón &quot;Agendar Visita&quot; para coordinar el arribo de la cuadrilla técnica.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((visit: any) => {
                const start = new Date(visit.start_at)
                const end = new Date(visit.end_at)
                const techs = (visit.visit_technicians || []).map((vt: any) => vt.profiles?.full_name).filter(Boolean)

                return (
                  <div
                    key={visit.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {start.toLocaleDateString('es-EC', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <StatusBadge status={visit.status} />
                      </div>

                      {visit.address_snapshot && (
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-400" />
                          {visit.address_snapshot}
                        </p>
                      )}

                      {visit.instructions && (
                        <p className="text-xs text-slate-500 italic mt-0.5">
                          Nota: {visit.instructions}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-1">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>
                          {techs.length > 0 ? techs.join(', ') : 'Sin técnicos especificados'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
