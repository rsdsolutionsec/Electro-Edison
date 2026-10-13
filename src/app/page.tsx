import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
import {
  Zap,
  ShieldCheck,
  Building2,
  Factory,
  Home as HomeIcon,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Header Corporativo */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20">
              <Zap className="h-6 w-6 fill-slate-950" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">
                ELÉCTRICO EDISON PINO
              </span>
              <span className="text-xs text-amber-400 tracking-wider font-semibold uppercase block">
                Ingeniería & Servicios Eléctricos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-24 sm:py-32">
          {/* Fondo con resplandor sutil */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,191,36,0.15),rgba(255,255,255,0))]" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>Plataforma Oficial de Gestión Operativa y Técnica</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Control Integral de Obras y Servicios Técnicos
            </h1>

            <p className="max-w-3xl mx-auto text-lg text-slate-300 font-normal leading-relaxed">
              Sistema de gestión interna de <strong>Eléctrico Edison Pino</strong>. Administración
              de clientes, cotizaciones con versionado inmutable, agenda de visitas técnicas con
              detección de conflictos, órdenes de trabajo y actas de entrega en campo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-4 text-base font-bold text-slate-950 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/25 hover:scale-[1.02]"
              >
                Acceso para Personal Autorizado
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Sectores de Intervención */}
        <section className="border-t border-slate-800/80 bg-slate-900/50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <HomeIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Instalaciones Residenciales</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Acometidas monofásicas y bifásicas, tableros de breakers, iluminación LED, puesta
                  a tierra y mantenimiento eléctrico doméstico con los más altos estándares de seguridad.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Edificaciones Comerciales</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Redes para locales, oficinas, bancos de condensadores para corrección de factor de
                  potencia, centros de carga y sistemas de respaldo de energía.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Factory className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Sistemas Industriales</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Tableros de fuerza y control trifásicos, canalizaciones pesadas tipo ducto barra y
                  conduit EMT/RGS, arrancadores suaves y transformadores de distribución.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Eléctrico Edison Pino. Todos los derechos reservados. Quito, Ecuador.</p>
      </footer>
    </div>
  )
}
