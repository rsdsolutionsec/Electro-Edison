'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const projectSchema = z.object({
  client_id: z.string().uuid('Debe seleccionar un cliente válido'),
  location_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  scope_description: z.string().trim().max(4000).optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  responsible_user_id: z.string().uuid().optional().nullable(),
  start_date: z.string().optional().nullable(),
  target_end_date: z.string().optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
})

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient()

  const raw = {
    client_id: formData.get('client_id') as string,
    location_id: (formData.get('location_id') as string) || null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    scope_description: (formData.get('scope_description') as string) || null,
    priority: (formData.get('priority') as string) || 'normal',
    responsible_user_id: (formData.get('responsible_user_id') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    target_end_date: (formData.get('target_end_date') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de proyecto no válidos' }
  }

  // Insertar proyecto (el trigger de la BD genera el project_code de forma atómica)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      project_code: '',
      client_id: parsed.data.client_id,
      location_id: parsed.data.location_id || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      scope_description: parsed.data.scope_description || null,
      priority: parsed.data.priority,
      responsible_user_id: parsed.data.responsible_user_id || null,
      start_date: parsed.data.start_date || null,
      target_end_date: parsed.data.target_end_date || null,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()

  if (projectError || !project) {
    return { error: projectError?.message || 'Error al crear el proyecto' }
  }

  // Crear etapas estándar recomendadas para el nuevo proyecto
  const defaultStages = [
    { name: '1. Replanteo y canalización', sequence: 1 },
    { name: '2. Tendido y guía de cableado', sequence: 2 },
    { name: '3. Montaje de tableros y protecciones', sequence: 3 },
    { name: '4. Pruebas de aislamiento y balanceo', sequence: 4 },
    { name: '5. Entrega final y conformidad', sequence: 5 },
  ]

  await supabase.from('project_stages').insert(
    defaultStages.map((s) => ({
      project_id: project.id,
      name: s.name,
      sequence: s.sequence,
      status: 'pending',
      is_required_for_closure: true,
    }))
  )

  revalidatePath('/proyectos')
  return { success: true, projectId: project.id }
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const raw = {
    client_id: formData.get('client_id') as string,
    location_id: (formData.get('location_id') as string) || null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    scope_description: (formData.get('scope_description') as string) || null,
    priority: (formData.get('priority') as string) || 'normal',
    responsible_user_id: (formData.get('responsible_user_id') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    target_end_date: (formData.get('target_end_date') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = projectSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos no válidos' }
  }

  const { error } = await supabase
    .from('projects')
    .update({
      location_id: parsed.data.location_id || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      scope_description: parsed.data.scope_description || null,
      priority: parsed.data.priority,
      responsible_user_id: parsed.data.responsible_user_id || null,
      start_date: parsed.data.start_date || null,
      target_end_date: parsed.data.target_end_date || null,
      notes: parsed.data.notes || null,
    })
    .eq('id', projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${projectId}`)
  return { success: true }
}

export async function addProjectStageAction(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const isRequired = formData.get('is_required') === 'true'

  if (!name || name.length < 2) {
    return { error: 'El nombre de la etapa debe tener al menos 2 caracteres' }
  }

  // Obtener la secuencia más alta
  const { data: stages } = await supabase
    .from('project_stages')
    .select('sequence')
    .eq('project_id', projectId)
    .order('sequence', { ascending: false })
    .limit(1)

  const nextSeq = (stages?.[0]?.sequence ?? 0) + 1

  const { error } = await supabase.from('project_stages').insert({
    project_id: projectId,
    name,
    description,
    sequence: nextSeq,
    status: 'pending',
    is_required_for_closure: isRequired,
  })

  if (error) return { error: error.message }

  revalidatePath(`/proyectos/${projectId}`)
  return { success: true }
}

export async function completeStageAction(stageId: string, notes?: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('complete_project_stage', {
    p_stage_id: stageId,
    p_notes: notes || undefined,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function reopenStageAction(stageId: string, reason: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('reopen_project_stage', {
    p_stage_id: stageId,
    p_reason: reason,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function confirmDeliveryAction(
  projectId: string,
  workOrderId: string | null,
  deliveryType: 'partial' | 'final',
  notes: string
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('confirm_project_delivery', {
    p_project_id: projectId,
    p_work_order_id: workOrderId || undefined,
    p_delivery_type: deliveryType,
    p_notes: notes,
  })

  if (error) return { error: error.message }

  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath('/dashboard')
  return { success: true }
}
