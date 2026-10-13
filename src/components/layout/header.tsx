'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOutAction } from '@/app/auth/actions'
import type { AuthUserProfile } from '@/lib/auth'
import { Menu, LogOut, ChevronRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  nuevo: 'Nuevo',
  editar: 'Editar',
  proyectos: 'Proyectos',
  cotizaciones: 'Cotizaciones',
  ordenes: 'Órdenes de Trabajo',
  agenda: 'Agenda de Visitas',
  tecnico: 'Mi Trabajo en Campo',
  usuarios: 'Usuarios y Roles',
  configuracion: 'Configuración',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  operations: 'Operaciones',
  technician: 'Técnico',
}

export function Header({
  user,
  onOpenMobile,
}: {
  user: AuthUserProfile
  onOpenMobile: () => void
}) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
            Inicio
          </Link>
          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join('/')}`
            const isLast = index === segments.length - 1
            const label = ROUTE_LABELS[segment] || (segment.length > 20 ? `${segment.slice(0, 10)}...` : segment)

            return (
              <React.Fragment key={href}>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                {isLast ? (
                  <span className="font-semibold text-slate-900 capitalize">{label}</span>
                ) : (
                  <Link href={href} className="hover:text-slate-900 transition-colors capitalize">
                    {label}
                  </Link>
                )}
              </React.Fragment>
            )
          })}
        </nav>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-right">
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">{user.full_name}</p>
            <div className="flex gap-1 justify-end mt-0.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-sm bg-blue-50 px-1.5 py-0.2 text-[10px] font-medium text-blue-700 border border-blue-200"
                >
                  {ROLE_LABELS[role] || role}
                </span>
              ))}
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <User className="h-4 w-4" />
          </div>
        </div>

        <form action={signOutAction}>
          <Button variant="ghost" size="icon" type="submit" title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4 text-slate-600 hover:text-rose-600" />
          </Button>
        </form>
      </div>
    </header>
  )
}
