import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/lib/quotation-calculator'
import { FileSpreadsheet, Plus, Search, FileText } from 'lucide-react'

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('quotations')
    .select(`
      id,
      quotation_number,
      version,
      status,
      issue_date,
      valid_until,
      subtotal,
      total,
      deposit_amount,
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
    .order('created_at', { ascending: false })

  if (q && q.trim()) {
    query = query.ilike('quotation_number', `%${q.trim()}%`)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: quotations } = await query

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cotizaciones y Proformas Comerciales
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Presupuestos con versionado inmutable, desglose de partidas y anticipos.
          </p>
        </div>
        <Link href="/cotizaciones/nueva">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cotización
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
                placeholder="Buscar por número de cotización (ej: COT-2026-0001)..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <select
              name="status"
              defaultValue={status || 'all'}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 w-full sm:w-48 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="expired">Vencida</option>
              <option value="superseded">Sustituida</option>
            </select>
            <Button type="submit" variant="secondary" className="w-full sm:w-auto">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de Cotizaciones */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100">
          <CardTitle className="text-base text-slate-800">
            Total Registros: {quotations?.length ?? 0}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {quotations && quotations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Número</th>
                    <th className="px-6 py-3.5">Versión</th>
                    <th className="px-6 py-3.5">Cliente & Proyecto</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5">Emisión</th>
                    <th className="px-6 py-3.5 text-right">Total Acordado</th>
                    <th className="px-6 py-3.5 text-right">Anticipo</th>
                    <th className="px-6 py-3.5 text-right">Documentos & Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q: any) => {
                    const project = q.projects as any
                    const client = project?.clients as any

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-blue-700">
                          <Link href={`/cotizaciones/${q.id}`} className="hover:underline">
                            {q.quotation_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                            v{q.version}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs space-y-0.5">
                          <p className="font-semibold text-slate-900">{client?.name || 'Cliente no asignado'}</p>
                          <p className="text-slate-500">
                            [{project?.project_code}] {project?.title}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={q.status} />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{q.issue_date}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-sm text-slate-900">
                          {formatCurrency(q.total)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-blue-700">
                          {formatCurrency(q.deposit_amount)}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link
                            href={`/api/pdf/quotation/${q.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                          >
                            <FileText className="h-3.5 w-3.5 text-rose-600" /> Cotización
                          </Link>
                          <Link
                            href={`/api/pdf/proforma/${q.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" /> Proforma
                          </Link>
                          <Link
                            href={`/cotizaciones/${q.id}`}
                            className="inline-flex text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Abrir →
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
              <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">No se encontraron cotizaciones.</p>
              <Link href="/cotizaciones/nueva" className="mt-3 inline-block">
                <Button variant="primary" size="sm">
                  Crear la Primera Cotización
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
