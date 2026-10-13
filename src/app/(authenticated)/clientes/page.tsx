import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Phone, Mail, MapPin, Search } from 'lucide-react'

const CLIENT_TYPE_LABELS: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  institutional: 'Institucional',
  other: 'Otro',
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const { q, type } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select(`
      id,
      name,
      identification,
      client_type,
      phone,
      email,
      is_active,
      created_at,
      client_locations (count)
    `)
    .order('created_at', { ascending: false })

  if (q && q.trim()) {
    query = query.or(`name.ilike.%${q.trim()}%,identification.ilike.%${q.trim()}%`)
  }

  if (type && type !== 'all') {
    query = query.eq('client_type', type)
  }

  const { data: clients, error } = await query

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clientes y Cuentas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Directorio de clientes residenciales, comerciales e industriales y sus ubicaciones.
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button variant="primary" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Registrar Cliente
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
                placeholder="Buscar por nombre, razón social o identificación..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <select
              name="type"
              defaultValue={type || 'all'}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 w-full sm:w-48 cursor-pointer"
            >
              <option value="all">Todos los tipos</option>
              <option value="residential">Residencial</option>
              <option value="commercial">Comercial</option>
              <option value="industrial">Industrial</option>
              <option value="institutional">Institucional</option>
            </select>
            <Button type="submit" variant="secondary" className="w-full sm:w-auto">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100">
          <CardTitle className="text-base text-slate-800">
            Total Clientes Registrados: {clients?.length ?? 0}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clients && clients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Cliente / Razón Social</th>
                    <th className="px-6 py-3.5">Identificación</th>
                    <th className="px-6 py-3.5">Tipo</th>
                    <th className="px-6 py-3.5">Contacto</th>
                    <th className="px-6 py-3.5 text-center">Ubicaciones</th>
                    <th className="px-6 py-3.5 text-center">Estado</th>
                    <th className="px-6 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((c: any) => {
                    const locationsCount = c.client_locations?.[0]?.count ?? 0

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <Link href={`/clientes/${c.id}`} className="hover:text-blue-600 transition-colors">
                            {c.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {c.identification || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {CLIENT_TYPE_LABELS[c.client_type] || c.client_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 space-y-0.5">
                          {c.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{c.email}</span>
                            </div>
                          )}
                          {!c.phone && !c.email && <span className="text-slate-400">Sin contacto</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {locationsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={c.is_active ? 'success' : 'default'}>
                            {c.is_active ? 'Activo' : 'Archivado'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/clientes/${c.id}`}
                            className="inline-flex text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Ver Ficha →
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
              <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">No se encontraron clientes registrados.</p>
              <Link href="/clientes/nuevo" className="mt-3 inline-block">
                <Button variant="primary" size="sm">
                  Registrar el Primer Cliente
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
