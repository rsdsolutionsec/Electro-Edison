'use client'

import React, { useState } from 'react'
import { addClientLocationAction } from '@/app/clientes/actions'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, MapPin, AlertCircle } from 'lucide-react'

export function AddLocationModal({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.append('client_id', clientId)

    const res = await addClientLocationAction(formData)
    if (res.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Añadir Ubicación
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Registrar Nueva Ubicación de Servicio"
        description="Añada una dirección física donde se realizarán instalaciones o visitas técnicas."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <p>{errorMessage}</p>
            </div>
          )}

          <Input
            name="label"
            label="Etiqueta / Identificador"
            placeholder="Ej: Sucursal Norte, Local 14, Taller Principal"
          />

          <Input
            name="address"
            label="Dirección Completa"
            placeholder="Av. 9 de Octubre y Pichincha #405"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input name="city" label="Ciudad" defaultValue="Guayaquil" />
            <Input name="reference" label="Referencia" placeholder="Junto a la gasolinera" />
          </div>

          <Textarea
            name="notes"
            label="Indicaciones de acceso"
            placeholder="Horarios permitidos para técnicos, portería, contacto en sitio..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="gap-1.5">
              <MapPin className="h-4 w-4" />
              Guardar Ubicación
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
