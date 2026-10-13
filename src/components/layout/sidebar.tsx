'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/auth'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileSpreadsheet,
  ClipboardList,
  CalendarDays,
  Wrench,
  ShieldCheck,
  Settings,
  Zap,
  HardHat,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles: AppRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'operations', 'technician'],
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: Users,
    allowedRoles: ['admin', 'operations'],
  },
  {
    name: 'Proyectos',
    href: '/proyectos',
    icon: FolderKanban,
    allowedRoles: ['admin', 'operations'],
  },
  {
    name: 'Técnicos y Cuadrillas',
    href: '/tecnicos',
    icon: HardHat,
    allowedRoles: ['admin', 'operations'],
  },
  {
    name: 'Cotizaciones',
    href: '/cotizaciones',
    icon: FileSpreadsheet,
    allowedRoles: ['admin', 'operations'],
  },
  {
    name: 'Órdenes de Trabajo',
    href: '/ordenes',
    icon: ClipboardList,
    allowedRoles: ['admin', 'operations', 'technician'],
  },
  {
    name: 'Agenda de Visitas',
    href: '/agenda',
    icon: CalendarDays,
    allowedRoles: ['admin', 'operations', 'technician'],
  },
  {
    name: 'Mi Trabajo en Campo',
    href: '/tecnico',
    icon: Wrench,
    allowedRoles: ['technician', 'operations', 'admin'],
  },
  {
    name: 'Usuarios y Roles',
    href: '/usuarios',
    icon: ShieldCheck,
    allowedRoles: ['admin'],
  },
  {
    name: 'Configuración',
    href: '/configuracion',
    icon: Settings,
    allowedRoles: ['admin'],
  },
]

export function Sidebar({
  roles,
  onCloseMobile,
}: {
  roles: AppRole[]
  onCloseMobile?: () => void
}) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.some((role) => roles.includes(role))
  )

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 text-white">
          <Zap className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white text-base leading-tight">
            Eléctrico Edison
          </span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Gestión Técnica
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* System Footer info */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Eléctrico Edison Pino</p>
          <p className="text-[11px] mt-0.5 text-slate-400">Operaciones & Campo v1.0</p>
        </div>
      </div>
    </aside>
  )
}
