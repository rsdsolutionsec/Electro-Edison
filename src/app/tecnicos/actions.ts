'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const technicianSchema = z.object({
  full_name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  identification: z.string().trim().max(30).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email('Correo electrónico no válido').optional().nullable().or(z.literal('')),
  specialty: z.string().trim().min(2, 'Especifique la especialidad técnica').max(150),
  category: z.enum(['lead', 'technician', 'assistant']),
  status: z.enum(['available', 'assigned', 'on_leave', 'inactive']),
  notes: z.string().trim().max(1000).optional().nullable(),
})

/**
 * Crear un nuevo técnico de campo
 */
export async function createTechnicianAction(formData: FormData) {
  await requireStaff()
  const supabase = await createClient()

  const emailRaw = formData.get('email') as string
  const raw = {
    full_name: formData.get('full_name') as string,
    identification: (formData.get('identification') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: emailRaw && emailRaw.trim() ? emailRaw.trim() : null,
    specialty: (formData.get('specialty') as string) || 'Instalaciones Eléctricas Generales',
    category: (formData.get('category') as string) || 'technician',
    status: (formData.get('status') as string) || 'available',
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = technicianSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos del técnico no válidos' }
  }

  const { data: tech, error } = await supabase
    .from('technicians')
    .insert({
      full_name: parsed.data.full_name,
      identification: parsed.data.identification,
      phone: parsed.data.phone,
      email: parsed.data.email,
      specialty: parsed.data.specialty,
      category: parsed.data.category,
      status: parsed.data.status,
      notes: parsed.data.notes,
      is_active: parsed.data.status !== 'inactive',
    })
    .select('id')
    .single()

  if (error || !tech) {
    console.error('Error creating technician:', error)
    return { error: error?.message || 'Error al registrar el técnico' }
  }

  revalidatePath('/tecnicos')
  revalidatePath('/proyectos')
  revalidatePath('/agenda')
  return { success: true, technicianId: tech.id }
}

/**
 * Actualizar datos o estado de un técnico
 */
export async function updateTechnicianAction(technicianId: string, formData: FormData) {
  await requireStaff()
  const supabase = await createClient()

  const emailRaw = formData.get('email') as string
  const raw = {
    full_name: formData.get('full_name') as string,
    identification: (formData.get('identification') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: emailRaw && emailRaw.trim() ? emailRaw.trim() : null,
    specialty: (formData.get('specialty') as string) || 'Instalaciones Eléctricas Generales',
    category: (formData.get('category') as string) || 'technician',
    status: (formData.get('status') as string) || 'available',
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = technicianSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos del técnico no válidos' }
  }

  const { error } = await supabase
    .from('technicians')
    .update({
      full_name: parsed.data.full_name,
      identification: parsed.data.identification,
      phone: parsed.data.phone,
      email: parsed.data.email,
      specialty: parsed.data.specialty,
      category: parsed.data.category,
      status: parsed.data.status,
      notes: parsed.data.notes,
      is_active: parsed.data.status !== 'inactive',
    })
    .eq('id', technicianId)

  if (error) {
    console.error('Error updating technician:', error)
    return { error: error.message }
  }

  revalidatePath('/tecnicos')
  revalidatePath('/proyectos')
  revalidatePath('/agenda')
  return { success: true }
}

/**
 * Asignar un técnico a la cuadrilla de un proyecto
 */
export async function assignTechnicianToProjectAction(
  projectId: string,
  technicianId: string,
  role: 'lead' | 'technician' | 'assistant' = 'technician',
  notes?: string
) {
  const user = await requireStaff()
  const supabase = await createClient()

  const { error } = await supabase.from('project_technicians').upsert(
    {
      project_id: projectId,
      technician_id: technicianId,
      role,
      assigned_by: user.id,
      notes: notes || null,
    },
    { onConflict: 'project_id,technician_id' }
  )

  if (error) {
    console.error('Error assigning technician to project:', error)
    return { error: error.message }
  }

  // Actualizar estado del técnico a 'assigned' si estaba 'available'
  await supabase
    .from('technicians')
    .update({ status: 'assigned' })
    .eq('id', technicianId)
    .eq('status', 'available')

  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath('/proyectos')
  revalidatePath('/tecnicos')
  return { success: true }
}

/**
 * Remover un técnico de la cuadrilla de un proyecto
 */
export async function removeTechnicianFromProjectAction(projectId: string, technicianId: string) {
  await requireStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_technicians')
    .delete()
    .eq('project_id', projectId)
    .eq('technician_id', technicianId)

  if (error) {
    console.error('Error removing technician from project:', error)
    return { error: error.message }
  }

  // Verificar si aún tiene otros proyectos asignados
  const { data: remaining } = await supabase
    .from('project_technicians')
    .select('id')
    .eq('technician_id', technicianId)

  if (!remaining || remaining.length === 0) {
    // Si no le quedan proyectos, ponerlo de nuevo en 'available'
    await supabase
      .from('technicians')
      .update({ status: 'available' })
      .eq('id', technicianId)
      .eq('status', 'assigned')
  }

  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath('/proyectos')
  revalidatePath('/tecnicos')
  return { success: true }
}
