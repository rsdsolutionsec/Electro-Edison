import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createProjectAction } from '@/app/proyectos/actions'
import { ArrowLeft, FolderKanban } from 'lucide-react'

export default async function NuevoProyectoPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const { client_id } = await searchParams
  const supabase = await createClient()

  // Cargar clientes activos y técnicos/responsables
  const [{ data: clients }, { data: profiles }] = await Promise.all([
    supabase.from('clients').select('id, name, identification').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  // Si hay cliente seleccionado, cargar sus ubicaciones
  let locations: any[] = []
  if (client_id) {
    const { data: locs } = await supabase
      .from('client_locations')
      .select('id, label, address, city')
      .eq('client_id', client_id)
    locations = locs || []
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/proyectos" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Crear Proyecto de Instalación Eléctrica
          </h1>
          <p className="text-sm text-slate-500">
            Apertura de expediente técnico. El código se generará automáticamente en el sistema.
          </p>
        </div>
      </div>

      <form action={async (formData: FormData) => {
        'use server'
        const res = await createProjectAction(formData)
        if (res.error) {
          throw new Error(res.error)
        }
        if (res.projectId) {
          const { redirect } = await import('next/navigation')
          redirect(`/proyectos/${res.projectId}`)
        }
      }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del Expediente</CardTitle>
            <CardDescription>Defina el cliente, alcance y parámetros de tiempo del proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Select
                  name="client_id"
                  label="Cliente / Razón Social"
                  required
                  defaultValue={client_id || ''}
                >
                  <option value="" disabled>
                    Seleccione un cliente...
                  </option>
                  {(clients || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.identification ? `(${c.identification})` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              {locations.length > 0 && (
                <div className="sm:col-span-2">
                  <Select name="location_id" label="Ubicación del Servicio">
                    <option value="">Seleccione ubicación registrada (opcional)...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.label ? `${loc.label}: ` : ''}
                        {loc.address} ({loc.city})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="sm:col-span-2">
                <Input
                  name="title"
                  label="Nombre / Título del Proyecto"
                  placeholder="Ej: Instalación de Sistema Eléctrico Trifásico y Tableros"
                  required
                />
              </div>

              <div>
                <Select name="priority" label="Prioridad" defaultValue="normal">
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </Select>
              </div>

              <div>
                <Select name="responsible_user_id" label="Responsable Interno">
                  <option value="">Seleccionar responsable...</option>
                  {(profiles || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Input
                  name="start_date"
                  type="date"
                  label="Fecha Estimada de Inicio"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Input
                  name="target_end_date"
                  type="date"
                  label="Fecha Estimada de Finalización"
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  name="scope_description"
                  label="Alcance General de los Trabajos"
                  placeholder="Descripción técnica del alcance: acometida, canalización, tableros, puntos de iluminación, pruebas de puesta a tierra..."
                  rows={3}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  name="notes"
                  label="Notas y Observaciones de Obra"
                  placeholder="Condiciones de acceso, materiales provistos por cliente, precauciones..."
                  rows={2}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-5">
            <Link href="/proyectos">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Crear Proyecto y Etapas
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
