'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientAction } from '@/app/clientes/actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react'

export default function NuevoClientePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await createClientAction(formData)

    if (result.error) {
      setErrorMessage(result.error)
      setIsLoading(false)
      return
    }

    if (result.clientId) {
      router.push(`/clientes/${result.clientId}`)
    } else {
      router.push('/clientes')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clientes" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registrar Nuevo Cliente
          </h1>
          <p className="text-sm text-slate-500">
            Cree una ficha comercial y configure su primera ubicación de servicio.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información General del Cliente</CardTitle>
            <CardDescription>Datos fiscales y de contacto comercial.</CardDescription>
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
                  placeholder="Ej: Comercial Las Acacias S.A. o Juan Pérez"
                  required
                />
              </div>

              <div>
                <Input
                  name="identification"
                  label="Identificación Fiscal (RUC o Cédula)"
                  placeholder="0999999999001 o 0912345678"
                  helperText="Opcional. Clave tributaria para proformas y cotizaciones."
                />
              </div>

              <div>
                <Select name="client_type" label="Tipo de Cliente" required defaultValue="residential">
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
                  placeholder="0991234567"
                  helperText="Número para contacto y coordinación de visitas."
                />
              </div>

              <div>
                <Input
                  name="email"
                  type="email"
                  label="Correo Electrónico"
                  placeholder="contacto@cliente.com"
                  helperText="Opcional. Para envío de cotizaciones en PDF."
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  name="notes"
                  label="Observaciones Comerciales"
                  placeholder="Condiciones particulares, horarios de atención, persona de contacto..."
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Ubicación Inicial del Servicio (Opcional)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Si conoce la dirección donde se realizará la instalación eléctrica, regístrela ahora.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    name="initial_address"
                    label="Dirección de la Instalación"
                    placeholder="Av. Principal y Calle Secundaria #123"
                  />
                </div>
                <div>
                  <Input
                    name="initial_city"
                    label="Ciudad"
                    defaultValue="Guayaquil"
                  />
                </div>
                <div>
                  <Input
                    name="initial_reference"
                    label="Referencia de Llegada"
                    placeholder="Frente a la plaza central, portón negro"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-5">
            <Link href="/clientes">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isLoading} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Guardar Cliente
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
