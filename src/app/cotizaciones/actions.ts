'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateQuotation } from '@/lib/quotation-calculator'
import { z } from 'zod'

const itemSchema = z.object({
  id: z.string().optional(),
  description: z.string().trim().min(2, 'La descripción de la partida es obligatoria').max(500),
  item_type: z.enum(['material', 'labor', 'service', 'other']),
  unit: z.string().trim().min(1).max(20),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unit_price: z.number().min(0, 'El precio no puede ser negativo'),
  discount_type: z.enum(['percentage', 'fixed']).default('percentage'),
  discount_value: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(15),
  sort_order: z.number().int().default(0),
})

const quotationSaveSchema = z.object({
  project_id: z.string().uuid(),
  valid_until: z.string().optional().nullable(),
  scope_description: z.string().trim().max(4000).optional().nullable(),
  deposit_type: z.enum(['percentage', 'fixed']).default('percentage'),
  deposit_value: z.number().min(0).default(50),
  payment_terms: z.string().trim().max(2000).optional().nullable(),
  execution_time_description: z.string().trim().max(200).optional().nullable(),
  commercial_terms: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(itemSchema).min(1, 'La cotización debe tener al menos una partida'),
})

export async function saveQuotationAction(
  quotationId: string | null,
  payload: z.infer<typeof quotationSaveSchema>
) {
  const supabase = await createClient()

  const parsed = quotationSaveSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de cotización no válidos' }
  }

  // Cálculos garantizados en servidor con decimal.js
  const calc = calculateQuotation({
    items: parsed.data.items.map((it) => ({
      quantity: it.quantity,
      unitPrice: it.unit_price,
      discountType: it.discount_type,
      discountValue: it.discount_value,
      taxRate: it.tax_rate,
    })),
    depositType: parsed.data.deposit_type,
    depositValue: parsed.data.deposit_value,
  })

  let targetId = quotationId

  if (!targetId) {
    // Crear cotización borrador inicial
    const { data: newQuote, error: quoteError } = await supabase
      .from('quotations')
      .insert({
        quotation_number: '',
        project_id: parsed.data.project_id,
        status: 'draft',
        valid_until: parsed.data.valid_until || null,
        scope_description: parsed.data.scope_description || null,
        subtotal: calc.subtotal,
        discount_total: calc.discountTotal,
        tax_total: calc.taxTotal,
        total: calc.total,
        deposit_type: parsed.data.deposit_type,
        deposit_value: parsed.data.deposit_value,
        deposit_amount: calc.depositAmount,
        estimated_balance: calc.estimatedBalance,
        payment_terms: parsed.data.payment_terms || null,
        execution_time_description: parsed.data.execution_time_description || null,
        commercial_terms: parsed.data.commercial_terms || null,
        notes: parsed.data.notes || null,
      })
      .select('id')
      .single()

    if (quoteError || !newQuote) {
      return { error: quoteError?.message || 'Error al crear cotización' }
    }
    targetId = newQuote.id
  } else {
    // Actualizar cotización existente (solo si está en borrador)
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        valid_until: parsed.data.valid_until || null,
        scope_description: parsed.data.scope_description || null,
        subtotal: calc.subtotal,
        discount_total: calc.discountTotal,
        tax_total: calc.taxTotal,
        total: calc.total,
        deposit_type: parsed.data.deposit_type,
        deposit_value: parsed.data.deposit_value,
        deposit_amount: calc.depositAmount,
        estimated_balance: calc.estimatedBalance,
        payment_terms: parsed.data.payment_terms || null,
        execution_time_description: parsed.data.execution_time_description || null,
        commercial_terms: parsed.data.commercial_terms || null,
        notes: parsed.data.notes || null,
      })
      .eq('id', targetId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Limpiar partidas anteriores para reemplazarlas
    await supabase.from('quotation_items').delete().eq('quotation_id', targetId)
  }

  // Insertar partidas con valores calculados por servidor
  const itemsToInsert = parsed.data.items.map((it, idx) => {
    const itemCalc = calc.items[idx]
    return {
      quotation_id: targetId!,
      description: it.description,
      item_type: it.item_type,
      unit: it.unit,
      quantity: it.quantity,
      unit_price: it.unit_price,
      discount_type: it.discount_type,
      discount_value: it.discount_value,
      tax_rate: it.tax_rate,
      line_subtotal: itemCalc.lineSubtotal,
      line_discount: itemCalc.lineDiscount,
      line_tax: itemCalc.lineTax,
      line_total: itemCalc.lineTotal,
      sort_order: idx + 1,
    }
  })

  const { error: itemsError } = await supabase.from('quotation_items').insert(itemsToInsert)
  if (itemsError) {
    return { error: itemsError.message }
  }

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${targetId}`)
  revalidatePath(`/proyectos/${parsed.data.project_id}`)
  return { success: true, quotationId: targetId }
}

export async function createNewVersionAction(quotationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('create_quotation_version', {
    p_quotation_id: quotationId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${data}`)
  return { success: true, newVersionId: data }
}

export async function markAsSentAction(quotationId: string, channel: string = 'WhatsApp') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('quotations')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_via: channel,
    })
    .eq('id', quotationId)

  if (error) return { error: error.message }

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${quotationId}`)
  return { success: true }
}

export async function approveQuotationAction(quotationId: string, notes?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('approve_quotation', {
    p_quotation_id: quotationId,
    p_notes: notes || 'Aprobado por el cliente.',
  })

  if (error) return { error: error.message }

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${quotationId}`)
  revalidatePath('/proyectos')
  return { success: true, quotation: data }
}

export async function rejectQuotationAction(quotationId: string, reason?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('quotations')
    .update({
      status: 'rejected',
      response_at: new Date().toISOString(),
      response_notes: reason || 'Propuesta rechazada por el cliente.',
    })
    .eq('id', quotationId)

  if (error) return { error: error.message }

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${quotationId}`)
  return { success: true }
}

export async function convertToWorkOrderAction(quotationId: string, responsibleUserId?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('convert_quotation_to_work_order', {
    p_quotation_id: quotationId,
    p_responsible_user_id: responsibleUserId || undefined,
  })

  if (error) return { error: error.message }

  revalidatePath('/ordenes')
  revalidatePath(`/cotizaciones/${quotationId}`)
  revalidatePath('/proyectos')
  return { success: true, workOrder: data }
}
