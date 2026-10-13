'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  identification: z.string().trim().max(20).optional().nullable(),
  client_type: z.enum(['residential', 'commercial', 'industrial', 'institutional', 'other']),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email('Correo electrónico no válido').optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().nullable(),
})

const locationSchema = z.object({
  client_id: z.string().uuid(),
  label: z.string().trim().max(80).optional().nullable(),
  address: z.string().trim().min(3, 'La dirección debe tener al menos 3 caracteres').max(300),
  city: z.string().trim().max(60).optional().nullable(),
  reference: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
})

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()

  const raw = {
    name: formData.get('name') as string,
    identification: (formData.get('identification') as string) || null,
    client_type: (formData.get('client_type') as string) || 'residential',
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || '',
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de cliente no válidos' }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: parsed.data.name,
      identification: parsed.data.identification || null,
      client_type: parsed.data.client_type,
      phone: parsed.data.phone || null,
      email: parsed.data.email ? parsed.data.email : null,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  // Si se proporcionó una dirección inicial, crear la ubicación
  const initialAddress = (formData.get('initial_address') as string)?.trim()
  if (initialAddress && data?.id) {
    await supabase.from('client_locations').insert({
      client_id: data.id,
      label: 'Dirección Principal',
      address: initialAddress,
      city: (formData.get('initial_city') as string)?.trim() || 'Guayaquil',
      reference: (formData.get('initial_reference') as string)?.trim() || null,
    })
  }

  revalidatePath('/clientes')
  return { success: true, clientId: data.id }
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient()

  const raw = {
    name: formData.get('name') as string,
    identification: (formData.get('identification') as string) || null,
    client_type: (formData.get('client_type') as string) || 'residential',
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || '',
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos no válidos' }
  }

  const { error } = await supabase
    .from('clients')
    .update({
      name: parsed.data.name,
      identification: parsed.data.identification || null,
      client_type: parsed.data.client_type,
      phone: parsed.data.phone || null,
      email: parsed.data.email ? parsed.data.email : null,
      notes: parsed.data.notes || null,
    })
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}

export async function toggleClientStatusAction(clientId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ is_active: isActive })
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}

export async function addClientLocationAction(formData: FormData) {
  const supabase = await createClient()

  const raw = {
    client_id: formData.get('client_id') as string,
    label: (formData.get('label') as string) || null,
    address: formData.get('address') as string,
    city: (formData.get('city') as string) || null,
    reference: (formData.get('reference') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const parsed = locationSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Ubicación no válida' }
  }

  const { error } = await supabase.from('client_locations').insert({
    client_id: parsed.data.client_id,
    label: parsed.data.label || 'Ubicación de servicio',
    address: parsed.data.address,
    city: parsed.data.city || 'Guayaquil',
    reference: parsed.data.reference || null,
    notes: parsed.data.notes || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/clientes/${parsed.data.client_id}`)
  return { success: true }
}
