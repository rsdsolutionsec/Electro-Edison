'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Zap, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage(
        'Se ha enviado un enlace de recuperación a su correo electrónico si está registrado.'
      )
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/25 text-white">
          <Zap className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Recuperar Contraseña
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Eléctrico Edison Pino • Gestión Técnica
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-950/80 text-slate-100 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Restablecer Clave</CardTitle>
            <CardDescription className="text-slate-400">
              Ingrese su correo registrado para recibir las instrucciones.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              {successMessage && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <p>{successMessage}</p>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Correo Electrónico</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@electricoedison.ec"
                  required
                  autoComplete="email"
                  className="border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md shadow-blue-600/30"
                isLoading={isLoading}
              >
                Enviar Enlace de Recuperación
              </Button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Regresar al Inicio de Sesión
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
