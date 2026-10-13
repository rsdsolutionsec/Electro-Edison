import { requireAdmin, getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { UserManagement } from './user-management'

export default async function UsuariosPage() {
  await requireAdmin()
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  // 1. Obtener todos los perfiles
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      is_active,
      created_at,
      user_roles (
        role
      )
    `)
    .order('created_at', { ascending: true })

  // 2. Mapear usuarios con sus roles
  const users = (rawProfiles || []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    email: null, // Los emails están en auth.users por seguridad RLS
    phone: p.phone,
    is_active: p.is_active,
    created_at: p.created_at,
    roles: (p.user_roles || []).map((r: any) => r.role),
  }))

  return (
    <div className="space-y-6">
      <UserManagement
        currentAdminId={currentUser?.id || ''}
        users={users}
      />
    </div>
  )
}
