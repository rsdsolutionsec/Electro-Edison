'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateClientAction, toggleClientStatusAction } from '@/app/clientes/actions'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, AlertCircle, Archive, RotateCcw } from 'lucide-react'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id as string

  const [client, setClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single()
      if (error || !data) {
        setErrorMessage('No se pudo cargar el cliente.')
      } else {
        setClient(data)
      }
      setIsLoading(false)
    }
    load()
  }, [clientId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const res = await updateClientAction(clientId, formData)
    if (res.error) {
      setErrorMessage(res.error)
      setIsSaving(false)
      return
    }

    router.push(`/clientes/${clientId}`)
  }

  async function handleToggleStatus() {
    if (!client) return
    const newStatus = !client.is_active
    const ok = window.confirm(
      newStatus
        ? '¿Desea reactivar este cliente?'
        : '¿Desea archivar este cliente? (No se borrarán sus proyectos históricos).'
    )
    if (!ok) return

    setIsSaving(true)
    const res = await toggleClientStatusAction(clientId, newStatus)
    if (res.error) {
      setErrorMessage(res.error)
    } else {
      setClient({ ...client, is_active: newStatus })
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Cargando datos del cliente...</div>
  }

  if (!client) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Cliente no encontrado.{' '}
        <Link href="/clientes" className="text-blue-600 underline">
          Volver a la lista
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/clientes/${clientId}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Editar Ficha de Cliente</h1>
        </div>

        <Button
          type="button"
          variant={client.is_active ? 'destructive' : 'secondary'}
          size="sm"
          onClick={handleToggleStatus}
          className="gap-1.5"
        >
          {client.is_active ? (
            <>
              <Archive className="h-4 w-4" />
              Archivar Cliente
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Reactivar Cliente
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actualizar Datos Comerciales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  name="name"
                  label="Nombre o Razón Social"
                  defaultValue={client.name}
                  required
                />
              </div>

              <div>
                <Input
                  name="identification"
                  label="Identificación Fiscal"
                  defaultValue={client.identification || ''}
                />
              </div>

              <div>
                <Select
                  name="client_type"
                  label="Tipo de Cliente"
                  defaultValue={client.client_type}
                  required
                >
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="institutional">Institucional</option>
                  <option value="other">Otro</option>
                </Select>
              </div>

              <div>
                <Input
                  name="phone"
                  type="tel"
                  label="Teléfono / Celular"
                  defaultValue={client.phone || ''}
                />
              </div>

              <div>
                <Input
                  name="email"
                  type="email"
                  label="Correo Electrónico"
                  defaultValue={client.email || ''}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  name="notes"
                  label="Observaciones Comerciales"
                  defaultValue={client.notes || ''}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-5">
            <Link href={`/clientes/${clientId}`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar Cambios
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
