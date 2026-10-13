'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateStatusSchema = z.object({
  workOrderId: z.string().uuid(),
  status: z.enum([
    'pending_schedule',
    'scheduled',
    'in_progress',
    'paused',
    'action_required',
    'completed',
    'cancelled',
  ]),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export async function updateWorkOrderStatusAction(
  workOrderId: string,
  status: 'pending_schedule' | 'scheduled' | 'in_progress' | 'paused' | 'action_required' | 'completed' | 'cancelled',
  notes?: string | null
) {
  const supabase = await createClient()

  const parsed = updateStatusSchema.safeParse({ workOrderId, status, notes })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de actualización no válidos' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const updatePayload: {
    status:
      | 'pending_schedule'
      | 'scheduled'
      | 'in_progress'
      | 'paused'
      | 'action_required'
      | 'completed'
      | 'cancelled'
    notes?: string | null
    updated_at: string
    closed_at?: string | null
    closed_by?: string | null
  } = {
    status: parsed.data.status,
    notes: parsed.data.notes,
    updated_at: new Date().toISOString(),
    closed_at: parsed.data.status === 'completed' ? new Date().toISOString() : null,
    closed_by: parsed.data.status === 'completed' ? (user?.id || null) : null,
  }

  const { error } = await supabase
    .from('work_orders')
    .update(updatePayload)
    .eq('id', parsed.data.workOrderId)

  if (error) {
    return { error: `Error al actualizar estado de la orden: ${error.message}` }
  }

  revalidatePath('/ordenes')
  revalidatePath(`/ordenes/${parsed.data.workOrderId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function assignTechnicianToWorkOrderAction(
  workOrderId: string,
  userId: string,
  assignmentRole: 'lead' | 'technician' | 'assistant' = 'technician'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('work_order_technicians').upsert(
    {
      work_order_id: workOrderId,
      user_id: userId,
      assignment_role: assignmentRole,
      assigned_by: user?.id || null,
      assigned_at: new Date().toISOString(),
    },
    { onConflict: 'work_order_id,user_id' }
  )

  if (error) {
    return { error: `Error al asignar técnico a la orden: ${error.message}` }
  }

  revalidatePath('/ordenes')
  revalidatePath(`/ordenes/${workOrderId}`)
  return { success: true }
}

export async function removeTechnicianFromWorkOrderAction(
  workOrderId: string,
  userId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('work_order_technicians')
    .delete()
    .eq('work_order_id', workOrderId)
    .eq('user_id', userId)

  if (error) {
    return { error: `Error al desasignar técnico: ${error.message}` }
  }

  revalidatePath('/ordenes')
  revalidatePath(`/ordenes/${workOrderId}`)
  return { success: true }
}
