'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Zap, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage(
          error.message === 'Invalid login credentials'
            ? 'Credenciales incorrectas. Verifique su correo o contraseña.'
            : error.message
        )
        return
      }

      if (data?.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Brand Logo & Name */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/25 text-white">
          <Zap className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Eléctrico Edison Pino
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Sistema Integral de Gestión de Instalaciones Eléctricas
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-950/80 text-slate-100 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Iniciar Sesión</CardTitle>
            <CardDescription className="text-slate-400">
              Ingrese con su cuenta autorizada para acceder al sistema.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Contraseña</label>
                  <Link
                    href="/recuperar-password"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300"
                  >
                    ¿Olvidó su contraseña?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
                Ingresar al Sistema
              </Button>

              <p className="text-center text-xs text-slate-500">
                Acceso restringido para personal técnico y administrativo autorizado.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
