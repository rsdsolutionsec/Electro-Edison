'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateVisitStatusAction } from '@/app/agenda/actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import {
  Wrench,
  Clock,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  PlayCircle,
  FileText,
  User,
  AlertCircle,
  FolderKanban,
} from 'lucide-react'

interface TecnicoViewProps {
  currentUserId: string
  userName: string
  assignedVisits: any[]
}

export function TecnicoView({
  currentUserId,
  userName,
  assignedVisits,
}: TecnicoViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today')

  // Modal para completar visita con notas
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todayEnd = todayStart + 24 * 60 * 60 * 1000

  const filteredVisits = assignedVisits.filter((v) => {
    if (activeTab === 'today') {
      const vTime = new Date(v.start_at).getTime()
      return vTime >= todayStart - 4 * 60 * 60 * 1000 && vTime < todayEnd + 4 * 60 * 60 * 1000
    }
    return true
  })

  const handleStartVisit = async (visitId: string) => {
    const res = await updateVisitStatusAction(visitId, 'in_progress')
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  const handleOpenCompleteModal = (visitId: string) => {
    setSelectedVisitId(visitId)
    setCompletionNotes('')
    setCompleteModalOpen(true)
  }

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVisitId) return
    setIsSubmitting(true)

    const res = await updateVisitStatusAction(
      selectedVisitId,
      'completed',
      completionNotes || undefined
    )
    setIsSubmitting(false)

    if (res.error) {
      alert(res.error)
    } else {
      setCompleteModalOpen(false)
      setSelectedVisitId(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Banner de Bienvenida Técnico */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Panel de Campo</h1>
            <p className="text-xs text-blue-100 mt-0.5">
              Bienvenido, <span className="font-semibold">{userName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Pestaña */}
      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'today'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Visitas de Hoy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todas mis asignaciones
        </button>
      </div>

      {/* Lista de Visitas */}
      {filteredVisits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <p className="mt-2 text-sm font-semibold text-slate-800">
              No tienes visitas pendientes programadas
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Todas tus tareas asignadas están al día. ¡Buen trabajo!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
            const start = new Date(visit.start_at)
            const client = visit.work_orders?.projects?.clients
            const address = visit.address_snapshot || client?.address || ''
            const mapsUrl = address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
              : null

            return (
              <Card
                key={visit.id}
                className="overflow-hidden border-slate-200 shadow-sm hover:border-blue-300 transition-all"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({start.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })})
                    </span>
                  </div>
                  <StatusBadge status={visit.status} />
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Proyecto y Orden */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Orden: {visit.work_orders?.order_number}
                    </span>
                    <h3 className="font-semibold text-slate-900 text-sm mt-0.5">
                      {visit.work_orders?.projects?.title}
                    </h3>
                  </div>

                  {/* Datos del Cliente */}
                  <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        {client?.name || 'Cliente no especificado'}
                      </span>
                      {client?.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100"
                        >
                          <Phone className="h-3 w-3" />
                          Llamar
                        </a>
                      )}
                    </div>

                    {address && (
                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <p className="text-xs text-slate-600 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span>{address}</span>
                        </p>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 shrink-0"
                          >
                            <Navigation className="h-3 w-3" />
                            GPS
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Instrucciones de Cuadrilla */}
                  {visit.instructions && (
                    <div className="text-xs text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-0.5">
                        Instrucciones de la Visita:
                      </span>
                      {visit.instructions}
                    </div>
                  )}

                  {/* Botones de Acción Móvil */}
                  <div className="pt-2 flex items-center gap-2">
                    {visit.status === 'scheduled' && (
                      <Button
                        variant="primary"
                        onClick={() => handleStartVisit(visit.id)}
                        className="w-full gap-2 text-xs py-2.5"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Marcar En Camino / Iniciar
                      </Button>
                    )}

                    {visit.status === 'in_progress' && (
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenCompleteModal(visit.id)}
                        className="w-full gap-2 text-xs py-2.5 bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Completar Visita
                      </Button>
                    )}

                    <Link
                      href={`/proyectos/${visit.work_orders?.projects?.id}`}
                      className="inline-flex items-center justify-center p-2.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 border border-slate-200"
                      title="Ver Etapas del Proyecto"
                    >
                      <FolderKanban className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal para Registrar Observaciones al Completar */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Finalizar Visita Técnica"
      >
        <form onSubmit={handleConfirmCompletion} className="space-y-4">
          <p className="text-xs text-slate-600">
            Registra las observaciones técnicas o trabajos ejecutados para el informe de obra:
          </p>

          <Textarea
            label="Reporte Técnico / Observaciones"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            rows={4}
            placeholder="Ej: Se instalaron 4 circuitos derivados, se realizaron pruebas de continuidad y aislamiento satisfactorias..."
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCompleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar Finalización'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
