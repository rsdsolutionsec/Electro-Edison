'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const visitSchema = z.object({
  work_order_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  address_snapshot: z.string().trim().max(500).optional().nullable(),
  instructions: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  technician_ids: z.array(z.string().uuid()).default([]),
  allow_conflict_override: z.boolean().default(false),
})

export async function checkConflictsAction(
  technicianIds: string[],
  startAt: string,
  endAt: string,
  excludeVisitId?: string
) {
  if (!technicianIds.length) return { conflicts: [] }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_technician_conflicts', {
    p_technician_ids: technicianIds,
    p_start_at: startAt,
    p_end_at: endAt,
    p_exclude_visit_id: excludeVisitId || undefined,
  })

  if (error) {
    return { error: `Error al comprobar conflictos: ${error.message}` }
  }

  return { conflicts: data || [] }
}

export async function createVisitAction(payload: z.infer<typeof visitSchema>) {
  const supabase = await createClient()

  const parsed = visitSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de visita no válidos' }
  }

  const { work_order_id, start_at, end_at, address_snapshot, instructions, notes, technician_ids, allow_conflict_override } =
    parsed.data

  // 1. Validar solapamientos técnicos si no se autorizó anulación
  if (technician_ids.length > 0 && !allow_conflict_override) {
    const { data: conflicts, error: conflictErr } = await supabase.rpc('check_technician_conflicts', {
      p_technician_ids: technician_ids,
      p_start_at: start_at,
      p_end_at: end_at,
    })

    if (conflictErr) {
      return { error: `Error al verificar agenda: ${conflictErr.message}` }
    }

    if (conflicts && conflicts.length > 0) {
      return {
        hasConflict: true,
        conflicts,
        error: `Conflicto de agenda: el técnico ${conflicts[0].technician_name} ya tiene la visita ${conflicts[0].conflict_order_number} (${conflicts[0].conflict_project_title}) asignada en ese rango horario.`,
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Insertar visita
  const { data: newVisit, error: insertError } = await supabase
    .from('visits')
    .insert({
      work_order_id,
      start_at,
      end_at,
      address_snapshot: address_snapshot || null,
      instructions: instructions || null,
      notes: notes || null,
      allow_conflict_override,
      status: 'scheduled',
      created_by: user?.id || null,
    })
    .select('id')
    .single()

  if (insertError || !newVisit) {
    return { error: `Error al agendar la visita: ${insertError?.message || 'desconocido'}` }
  }

  // 3. Asignar técnicos a la visita
  if (technician_ids.length > 0) {
    const techRows = technician_ids.map((techId) => ({
      visit_id: newVisit.id,
      user_id: techId,
      assigned_by: user?.id || null,
    }))

    const { error: techErr } = await supabase.from('visit_technicians').insert(techRows)
    if (techErr) {
      console.error('Error al asociar técnicos a la visita:', techErr)
    }
  }

  // 4. Si la orden estaba en 'pending_schedule', moverla a 'scheduled'
  await supabase
    .from('work_orders')
    .update({ status: 'scheduled' })
    .eq('id', work_order_id)
    .eq('status', 'pending_schedule')

  revalidatePath('/agenda')
  revalidatePath('/ordenes')
  revalidatePath(`/ordenes/${work_order_id}`)
  revalidatePath('/tecnico')
  revalidatePath('/dashboard')

  return { success: true, visitId: newVisit.id }
}

export async function updateVisitStatusAction(
  visitId: string,
  status: 'scheduled' | 'in_progress' | 'completed' | 'rescheduled' | 'cancelled',
  notes?: string | null
) {
  const supabase = await createClient()

  const updateData: {
    status: 'scheduled' | 'in_progress' | 'completed' | 'rescheduled' | 'cancelled'
    updated_at: string
    notes?: string | null
  } = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (notes !== undefined) {
    updateData.notes = notes
  }

  const { error } = await supabase.from('visits').update(updateData).eq('id', visitId)

  if (error) {
    return { error: `Error al cambiar estado de la visita: ${error.message}` }
  }

  revalidatePath('/agenda')
  revalidatePath('/ordenes')
  revalidatePath('/tecnico')
  revalidatePath('/dashboard')

  return { success: true }
}
