import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  console.log('--- Creación de Usuarios de Demostración y Operación ---')

  const usersToCreate = [
    {
      email: 'admin@electricopino.ec',
      password: 'EdisonAdmin2026!',
      fullName: 'Edison Pino',
      phone: '+593 99 123 4567',
      roles: ['admin', 'operations'],
    },
    {
      email: 'coordinador@electricopino.ec',
      password: 'Coordinador2026!',
      fullName: 'Carlos Mendoza (Coordinador Operativo)',
      phone: '+593 98 765 4321',
      roles: ['operations'],
    },
  ]

  for (const item of usersToCreate) {
    console.log(`\nProcesando usuario: ${item.email}...`)

    // 1. Verificar si ya existe en auth.users
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) {
      console.error('Error listando usuarios:', listErr)
      return
    }

    const existing = listData.users.find((u) => u.email?.toLowerCase() === item.email.toLowerCase())
    let userId = existing?.id

    if (!existing) {
      const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
        email: item.email,
        password: item.password,
        email_confirm: true,
        user_metadata: {
          full_name: item.fullName,
        },
      })

      if (createErr || !createData.user) {
        console.error(`Error creando usuario ${item.email}:`, createErr)
        continue
      }

      userId = createData.user.id
      console.log(`✓ Usuario Auth creado exitosamente (ID: ${userId})`)
    } else if (userId) {
      console.log(`ℹ El usuario ya existe en Auth (ID: ${userId}), actualizando password y metadatos...`)
      await supabase.auth.admin.updateUserById(userId, {
        password: item.password,
        email_confirm: true,
        user_metadata: {
          full_name: item.fullName,
        },
      })
    }

    if (!userId) continue

    // 2. Asegurar que profiles esté actualizado
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: item.fullName,
        email: item.email,
        phone: item.phone,
        is_active: true,
      })

    if (profileErr) {
      console.error(`Error actualizando perfil para ${item.email}:`, profileErr)
    } else {
      console.log(`✓ Perfil sincronizado en public.profiles`)
    }

    // 3. Asignar roles en public.user_roles
    // Eliminar roles existentes previos
    await supabase.from('user_roles').delete().eq('user_id', userId)

    // Insertar roles nuevos
    for (const r of item.roles) {
      const { error: roleErr } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: r,
      })

      if (roleErr) {
        console.error(`Error asignando rol ${r} a ${item.email}:`, roleErr)
      } else {
        console.log(`✓ Rol asignado: ${r}`)
      }
    }
  }

  console.log('\n=========================================')
  console.log('USUARIOS CREADOS Y ACTIVOS LISTOS PARA USAR:')
  console.log('1. Administrador:')
  console.log('   Email:    admin@electricopino.ec')
  console.log('   Password: EdisonAdmin2026!')
  console.log('   Roles:    admin, operations')
  console.log('2. Coordinador:')
  console.log('   Email:    coordinador@electricopino.ec')
  console.log('   Password: Coordinador2026!')
  console.log('   Roles:    operations')
  console.log('=========================================')
}

main().catch(console.error)
