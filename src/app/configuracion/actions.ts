'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const companySettingsSchema = z.object({
  legal_name: z.string().trim().min(3).max(200),
  trade_name: z.string().trim().min(3).max(200),
  tax_id: z.string().trim().min(10).max(20),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  default_payment_terms: z.string().trim().max(1000).optional().nullable(),
  default_commercial_terms: z.string().trim().max(1000).optional().nullable(),
})

export async function updateCompanySettingsAction(
  payload: z.infer<typeof companySettingsSchema>
) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = companySettingsSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos no válidos' }
  }

  const { error } = await supabase
    .from('company_settings')
    .update({
      legal_name: parsed.data.legal_name,
      trade_name: parsed.data.trade_name,
      tax_id: parsed.data.tax_id,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      city: parsed.data.city,
      default_payment_terms: parsed.data.default_payment_terms,
      default_commercial_terms: parsed.data.default_commercial_terms,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    return { error: `Error al guardar configuración: ${error.message}` }
  }

  revalidatePath('/configuracion')
  revalidatePath('/cotizaciones')
  return { success: true }
}
