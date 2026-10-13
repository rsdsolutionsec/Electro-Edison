'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCompanySettingsAction } from '@/app/configuracion/actions'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Save, CheckCircle2, ShieldCheck } from 'lucide-react'

interface ConfigFormProps {
  initialSettings: any
}

export function ConfigForm({ initialSettings }: ConfigFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    legal_name: initialSettings?.legal_name || 'Eléctrico Edison Pino',
    trade_name: initialSettings?.trade_name || 'Eléctrico Edison Pino - Servicios Eléctricos',
    tax_id: initialSettings?.tax_id || '1790012345001',
    email: initialSettings?.email || 'contacto@electricopino.ec',
    phone: initialSettings?.phone || '+593 99 123 4567',
    address: initialSettings?.address || 'Av. Amazonas N35-102 y Pereira',
    city: initialSettings?.city || 'Quito',
    default_payment_terms:
      initialSettings?.default_payment_terms ||
      'Anticipo del 50% al iniciar los trabajos y saldo del 50% contra entrega a satisfacción.',
    default_commercial_terms:
      initialSettings?.default_commercial_terms ||
      'Los precios no incluyen obras civiles ajenas al contrato eléctrico. La garantía de mano de obra es de 12 meses calendario.',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const res = await updateCompanySettingsAction(formData)
    setIsLoading(false)

    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Configuración de la empresa actualizada con éxito.' })
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {message && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Datos Fiscales y de Contacto */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Identificación de la Empresa Emisora
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Razón Social Legal"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              required
            />
            <Input
              label="Nombre Comercial"
              value={formData.trade_name}
              onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="RUC de la Empresa"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              required
            />
            <Input
              label="Correo Electrónico de Contacto"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Teléfono Principal"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Dirección de la Sede / Taller"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            <Input
              label="Ciudad / Cantón"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Parámetros Comerciales por Defecto */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base text-slate-800">
            Condiciones Comerciales y Cobro Predeterminadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea
            label="Términos de Pago por Defecto"
            value={formData.default_payment_terms}
            onChange={(e) => setFormData({ ...formData, default_payment_terms: e.target.value })}
            rows={2}
          />

          <Textarea
            label="Condiciones Comerciales y Garantías por Defecto"
            value={formData.default_commercial_terms}
            onChange={(e) =>
              setFormData({ ...formData, default_commercial_terms: e.target.value })
            }
            rows={3}
          />
        </CardContent>
        <CardFooter className="border-t border-slate-100 px-6 py-4 flex justify-end">
          <Button type="submit" variant="primary" disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
