import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccesoDenegadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Acceso No Autorizado</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Su cuenta no dispone de los permisos o roles necesarios para acceder a este módulo del sistema de Eléctrico Edison Pino.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard">
          <Button variant="primary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Panel Principal
          </Button>
        </Link>
      </div>
    </div>
  )
}
