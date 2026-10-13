import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ConfigForm } from './config-form'

export default async function ConfiguracionPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configuración de la Empresa
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Parámetros legales, fiscales, IVA y condiciones comerciales de Eléctrico Edison Pino.
        </p>
      </div>

      <ConfigForm initialSettings={settings} />
    </div>
  )
}
