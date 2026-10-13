'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function adminSetUserRolesAction(targetUserId: string, roles: string[]) {
  await requireAdmin()
  const supabase = await createClient()

  const validRoles = ['admin', 'operations', 'technician']
  const filtered = roles.filter((r) => validRoles.includes(r))

  if (filtered.length === 0) {
    return { error: 'El usuario debe tener al menos un rol asignado.' }
  }

  const { error } = await supabase.rpc('admin_set_user_roles', {
    p_user_id: targetUserId,
    p_roles: filtered as any,
  })

  if (error) {
    return { error: `Error al actualizar roles: ${error.message}` }
  }

  revalidatePath('/usuarios')
  return { success: true }
}

export async function adminToggleUserActiveAction(targetUserId: string, isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.rpc('admin_toggle_user_active', {
    p_user_id: targetUserId,
    p_is_active: isActive,
  })

  if (error) {
    return { error: `Error al cambiar estado de activación: ${error.message}` }
  }

  revalidatePath('/usuarios')
  return { success: true }
}
