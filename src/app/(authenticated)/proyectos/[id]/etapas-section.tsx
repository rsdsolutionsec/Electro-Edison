'use client'

import React, { useState } from 'react'
import { completeStageAction, reopenStageAction, confirmDeliveryAction } from '@/app/proyectos/actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { CheckCircle2, RotateCcw, AlertCircle, Truck, Check } from 'lucide-react'

export function EtapasSection({
  projectId,
  workOrderId,
  stages,
  deliveries,
  projectStatus,
}: {
  projectId: string
  workOrderId: string | null
  stages: any[]
  deliveries: any[]
  projectStatus: string
}) {
  const [reopenModalOpen, setReopenModalOpen] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [reopenReason, setReopenReason] = useState('')

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'partial' | 'final'>('partial')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const totalStages = stages.length
  const completedStages = stages.filter((s) => s.status === 'completed').length
  const pendingRequiredCount = stages.filter((s) => s.is_required_for_closure && s.status !== 'completed').length
  const percent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0

  async function handleCompleteStage(stageId: string) {
    setIsLoading(true)
    setErrorMessage(null)
    const res = await completeStageAction(stageId)
    if (res?.error) {
      setErrorMessage(res.error)
    }
    setIsLoading(false)
  }

  async function handleReopenSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStageId) return

    setIsLoading(true)
    setErrorMessage(null)
    const res = await reopenStageAction(selectedStageId, reopenReason)
    if (res?.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setReopenModalOpen(false)
    setReopenReason('')
    setSelectedStageId(null)
  }

  async function handleDeliverySubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const res = await confirmDeliveryAction(projectId, workOrderId, deliveryType, deliveryNotes)
    if (res?.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setDeliveryModalOpen(false)
    setDeliveryNotes('')
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Tarjeta de Progreso General */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2">
          <div>
            <CardTitle className="text-base font-bold">Progreso de Etapas Técnicas</CardTitle>
            <p className="text-xs text-slate-500">
              {completedStages} de {totalStages} etapas completadas
              {pendingRequiredCount > 0
                ? ` • ${pendingRequiredCount} etapa(s) obligatoria(s) pendiente(s)`
                : ' • Todas las etapas obligatorias completadas'}
            </p>
          </div>
          {projectStatus !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeliveryModalOpen(true)}
              className="gap-1.5"
            >
              <Truck className="h-4 w-4" />
              Confirmar Entrega
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Avance de Instalación</span>
              <span>{percent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Etapas */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold">Etapas del Proyecto</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {stages.map((stage) => {
              const isCompleted = stage.status === 'completed'

              return (
                <div
                  key={stage.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{stage.name}</span>
                      <StatusBadge status={stage.status} />
                      {stage.is_required_for_closure && (
                        <span className="rounded-xs bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                          Obligatoria
                        </span>
                      )}
                    </div>
                    {stage.description && (
                      <p className="text-xs text-slate-500">{stage.description}</p>
                    )}
                    {stage.completed_at && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Completada el {new Date(stage.completed_at).toLocaleString('es-EC')}
                      </p>
                    )}
                    {stage.notes && (
                      <p className="text-[11px] text-slate-500 italic">Notas: {stage.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isCompleted ? (
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={isLoading}
                        onClick={() => handleCompleteStage(stage.id)}
                        className="gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Completar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStageId(stage.id)
                          setReopenModalOpen(true)
                        }}
                        className="gap-1.5 text-slate-600"
                        title="Reabrir etapa (requiere justificación)"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Entregas Confirmadas */}
      {deliveries.length > 0 && (
        <Card>
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold">Constancias de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {deliveries.map((deliv) => (
              <div
                key={deliv.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Entrega {deliv.delivery_type === 'final' ? 'FINAL DEL PROYECTO' : 'PARCIAL'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(deliv.confirmed_at).toLocaleString('es-EC')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{deliv.notes}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal para Reabrir Etapa */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title="Reabrir Etapa de Instalación"
        description="Esta acción reabre la etapa para modificaciones. Requiere una justificación que quedará auditada."
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4">
          <Textarea
            label="Motivo de la reapertura (mínimo 5 caracteres)"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Ej: Se detectó corrección necesaria en el cableado del alimentador principal tras pruebas."
            required
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setReopenModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={isLoading}
              disabled={reopenReason.trim().length < 5}
            >
              Confirmar Reapertura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para Confirmar Entrega (Parcial o Final) */}
      <Modal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        title="Confirmación de Entrega"
        description="Registre formalmente la entrega parcial o final de los trabajos eléctricos."
      >
        <form onSubmit={handleDeliverySubmit} className="space-y-4">
          <Select
            label="Tipo de Entrega"
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as 'partial' | 'final')}
          >
            <option value="partial">Entrega Parcial (No cierra el proyecto)</option>
            <option value="final">Entrega Final (Cierra proyecto y orden de trabajo)</option>
          </Select>

          {deliveryType === 'final' && pendingRequiredCount > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p>
                <strong>Atención:</strong> Existen {pendingRequiredCount} etapa(s) obligatoria(s) sin completar.
                El sistema bloqueará el cierre definitivo según las reglas de negocio hasta que todas las etapas
                estén completadas.
              </p>
            </div>
          )}

          <Textarea
            label="Observaciones y Acta de Entrega"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="Describa el alcance entregado, pruebas verificadas con el cliente y conformidad..."
            required
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setDeliveryModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Registrar Constancia de Entrega
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
