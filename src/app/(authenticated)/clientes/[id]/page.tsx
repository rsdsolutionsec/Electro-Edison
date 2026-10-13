import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { AddLocationModal } from './add-location-modal'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  FolderKanban,
  FileText,
  Clock,
  Plus,
} from 'lucide-react'

const CLIENT_TYPE_LABELS: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  institutional: 'Institucional',
  other: 'Otro',
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Consultar ficha del cliente con ubicaciones y proyectos asociados
  const [
    { data: client, error: clientError },
    { data: locations },
    { data: projects },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('client_locations').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])

  if (clientError || !client) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header Ficha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{client.name}</h1>
              <Badge variant={client.is_active ? 'success' : 'default'}>
                {client.is_active ? 'Activo' : 'Archivado'}
              </Badge>
              <Badge variant="primary">{CLIENT_TYPE_LABELS[client.client_type] || client.client_type}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificación: {client.identification || 'No registrada'} • Creado el{' '}
              {new Date(client.created_at).toLocaleDateString('es-EC')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/clientes/${client.id}/editar`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar Ficha
            </Button>
          </Link>
          <Link href={`/proyectos/nuevo?client_id=${client.id}`}>
            <Button variant="primary" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Crear Proyecto
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Información de Contacto & Ubicaciones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna Izquierda: Datos de Contacto y Notas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Datos de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Teléfono</p>
                <p className="font-medium text-slate-900">{client.phone || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Correo Electrónico</p>
                <p className="font-medium text-slate-900">{client.email || 'No registrado'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Observaciones</p>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {client.notes || 'Sin observaciones registradas.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Ubicaciones de Servicio */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Ubicaciones de Servicio ({locations?.length ?? 0})</CardTitle>
              <p className="text-xs text-slate-500">Direcciones registradas para instalaciones y visitas.</p>
            </div>
            <AddLocationModal clientId={client.id} />
          </CardHeader>
          <CardContent>
            {locations && locations.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {locations.map((loc: any) => (
                  <div
                    key={loc.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-sm">
                        <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>{loc.label || 'Ubicación'}</span>
                      </div>
                      <p className="text-xs text-slate-700">{loc.address}</p>
                      {loc.city && <p className="text-[11px] text-slate-500">Ciudad: {loc.city}</p>}
                      {loc.reference && (
                        <p className="text-[11px] text-slate-400 italic">Ref: {loc.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay ubicaciones registradas para este cliente.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Proyectos Asociados al Cliente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">Proyectos de Instalaciones Eléctricas ({projects?.length ?? 0})</CardTitle>
            <p className="text-xs text-slate-500">Historial de encargos e instalaciones del cliente.</p>
          </div>
          <Link href={`/proyectos/nuevo?client_id=${client.id}`}>
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {projects && projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Código</th>
                    <th className="px-6 py-3.5">Título del Proyecto</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5">Prioridad</th>
                    <th className="px-6 py-3.5">Fecha Prevista</th>
                    <th className="px-6 py-3.5 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-blue-700">
                        <Link href={`/proyectos/${p.id}`} className="hover:underline">
                          {p.project_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <Link href={`/proyectos/${p.id}`} className="hover:text-blue-600 transition-colors">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.priority} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {p.target_end_date ? new Date(p.target_end_date).toLocaleDateString('es-EC') : 'Sin fecha'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/proyectos/${p.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Ver Proyecto →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              Este cliente aún no tiene proyectos de instalaciones registradas.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
