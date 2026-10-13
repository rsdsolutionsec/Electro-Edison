import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database.types'

export type AppRole = 'admin' | 'operations' | 'technician'

export interface AuthUserProfile {
  id: string
  email: string | null
  full_name: string
  phone: string | null
  is_active: boolean
  roles: AppRole[]
}

/**
 * Obtiene la sesión autenticada actual y sus roles confiables desde PostgreSQL.
 */
export async function getCurrentUser(): Promise<AuthUserProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Consultar perfil y roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, is_active')
    .eq('id', user.id)
    .single()

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const roles = (userRoles || []).map((r) => r.role as AppRole)

  return {
    id: user.id,
    email: profile?.email || user.email || null,
    full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
    phone: profile?.phone || null,
    is_active: profile?.is_active ?? true,
    roles,
  }
}

/**
 * Exige sesión activa; redirige a /login si no existe.
 */
export async function requireUser(): Promise<AuthUserProfile> {
  const user = await getCurrentUser()
  if (!user || !user.is_active) {
    redirect('/login')
  }
  return user
}

/**
 * Exige roles operativos o de administrador (staff).
 */
export async function requireStaff(): Promise<AuthUserProfile> {
  const user = await requireUser()
  const isStaff = user.roles.includes('admin') || user.roles.includes('operations')
  if (!isStaff) {
    redirect('/acceso-denegado')
  }
  return user
}

/**
 * Exige rol de administrador exclusivo.
 */
export async function requireAdmin(): Promise<AuthUserProfile> {
  const user = await requireUser()
  if (!user.roles.includes('admin')) {
    redirect('/acceso-denegado')
  }
  return user
}

/**
 * Verifica si el usuario tiene permiso para un módulo determinado.
 */
export function hasModulePermission(
  roles: AppRole[],
  module: 'dashboard' | 'clients' | 'projects' | 'quotations' | 'orders' | 'agenda' | 'stages' | 'users' | 'settings'
): boolean {
  if (roles.includes('admin')) return true

  switch (module) {
    case 'dashboard':
    case 'clients':
    case 'projects':
    case 'quotations':
    case 'orders':
    case 'agenda':
    case 'stages':
      return roles.includes('operations') || roles.includes('admin')
    case 'users':
    case 'settings':
      return roles.includes('admin')
    default:
      return false
  }
}
