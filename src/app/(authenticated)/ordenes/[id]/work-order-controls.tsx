'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateWorkOrderStatusAction,
  assignTechnicianToWorkOrderAction,
  removeTechnicianFromWorkOrderAction,
} from '@/app/ordenes/actions'
import { createVisitAction, checkConflictsAction } from '@/app/agenda/actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  UserPlus,
  Trash2,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react'

interface WorkOrderControlsProps {
  workOrder: any
  technicians: Array<{ id: string; full_name: string }>
}

export function WorkOrderControls({ workOrder, technicians }: WorkOrderControlsProps) {
  const router = useRouter()

  // Modal Asignar Técnico
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedTechId, setSelectedTechId] = useState('')
  const [techRole, setTechRole] = useState<'lead' | 'technician' | 'assistant'>('technician')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  // Modal Agendar Visita
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false)
  const [visitStartDate, setVisitStartDate] = useState('')
  const [visitEndDate, setVisitEndDate] = useState('')
  const [visitAddress, setVisitAddress] = useState(workOrder.projects?.clients?.address || '')
  const [visitInstructions, setVisitInstructions] = useState('')
  const [selectedVisitTechs, setSelectedVisitTechs] = useState<string[]>(
    workOrder.work_order_technicians?.map((t: any) => t.user_id) || []
  )
  const [allowConflictOverride, setAllowConflictOverride] = useState(false)
  const [visitConflictWarning, setVisitConflictWarning] = useState<string | null>(null)
  const [visitLoading, setVisitLoading] = useState(false)
  const [visitError, setVisitError] = useState<string | null>(null)

  // Estado OT
  const [statusLoading, setStatusLoading] = useState(false)

  // Manejar cambio de estado
  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true)
    const res = await updateWorkOrderStatusAction(workOrder.id, newStatus as any)
    setStatusLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  // Asignar técnico a OT
  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTechId) return
    setAssignLoading(true)
    setAssignError(null)

    const res = await assignTechnicianToWorkOrderAction(workOrder.id, selectedTechId, techRole)
    setAssignLoading(false)

    if (res.error) {
      setAssignError(res.error)
    } else {
      setIsAssignModalOpen(false)
      setSelectedTechId('')
      router.refresh()
    }
  }

  // Remover técnico
  const handleRemoveTechnician = async (userId: string) => {
    if (!confirm('¿Deseas desasignar a este técnico de la orden?')) return
    const res = await removeTechnicianFromWorkOrderAction(workOrder.id, userId)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  // Agendar Visita
  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitStartDate || !visitEndDate) {
      setVisitError('Debes ingresar la fecha y hora de inicio y finalización.')
      return
    }

    setVisitLoading(true)
    setVisitError(null)
    setVisitConflictWarning(null)

    const res = await createVisitAction({
      work_order_id: workOrder.id,
      start_at: new Date(visitStartDate).toISOString(),
      end_at: new Date(visitEndDate).toISOString(),
      address_snapshot: visitAddress,
      instructions: visitInstructions,
      notes: null,
      technician_ids: selectedVisitTechs,
      allow_conflict_override: allowConflictOverride,
    })

    setVisitLoading(false)

    if (res.hasConflict) {
      setVisitConflictWarning(res.error || 'Conflicto detectado')
    } else if (res.error) {
      setVisitError(res.error)
    } else {
      setIsVisitModalOpen(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Estado Rápido */}
      <Card className="bg-slate-900 text-white border-0">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
              Estado Operativo Actual
            </span>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={workOrder.status} />
              {workOrder.closed_at && (
                <span className="text-xs text-slate-400">
                  Cerrada el {new Date(workOrder.closed_at).toLocaleDateString('es-EC')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-300">Cambiar estado:</span>
            <select
              value={workOrder.status}
              disabled={statusLoading}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 rounded-lg bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            >
              <option value="pending_schedule">Pendiente Agendar</option>
              <option value="scheduled">Agendada</option>
              <option value="in_progress">En Ejecución</option>
              <option value="paused">Pausada</option>
              <option value="action_required">Acción Requerida</option>
              <option value="completed">Completada (Cerrar)</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsVisitModalOpen(true)}
              className="gap-1.5"
            >
              <CalendarPlus className="h-4 w-4" />
              Agendar Visita
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cuadrícula: Técnicos Asignados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <CardTitle className="text-base text-slate-800">Técnicos Asignados</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="gap-1 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Asignar Colaborador
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {(!workOrder.work_order_technicians || workOrder.work_order_technicians.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No hay técnicos colaboradores asignados a esta orden todavía.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {workOrder.work_order_technicians.map((t: any) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{t.profiles?.full_name}</p>
                      <span className="text-xs text-slate-500 capitalize">
                        Rol: {t.assignment_role === 'lead' ? 'Líder Técnico' : t.assignment_role === 'technician' ? 'Técnico' : 'Ayudante'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTechnician(t.user_id)}
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      title="Desasignar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alcance y Notas Técnicas */}
        <Card>
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base text-slate-800">Alcance de Trabajos Pactado</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-200">
              {workOrder.scope_snapshot || 'Sin especificación detallada en la cotización.'}
            </div>
            {workOrder.notes && (
              <div className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded border border-amber-200">
                <span className="font-bold text-amber-900 block">Notas de Coordinación:</span>
                {workOrder.notes}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Asignar Técnico */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Asignar Técnico a la Orden"
      >
        <form onSubmit={handleAssignTechnician} className="space-y-4">
          {assignError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {assignError}
            </div>
          )}

          <Select
            label="Seleccionar Técnico o Cuadrilla"
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            required
            options={[
              { value: '', label: 'Seleccionar técnico...' },
              ...technicians.map((t) => ({ value: t.id, label: t.full_name })),
            ]}
          />

          <Select
            label="Rol Operativo en la Orden"
            value={techRole}
            onChange={(e) => setTechRole(e.target.value as any)}
            options={[
              { value: 'lead', label: 'Líder Técnico / Responsable' },
              { value: 'technician', label: 'Técnico Instalador' },
              { value: 'assistant', label: 'Ayudante Técnico' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={assignLoading}>
              {assignLoading ? 'Asignando...' : 'Guardar Asignación'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Agendar Visita Técnica */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => {
          setIsVisitModalOpen(false)
          setVisitConflictWarning(null)
          setAllowConflictOverride(false)
        }}
        title="Programar Visita Operativa en Campo"
      >
        <form onSubmit={handleScheduleVisit} className="space-y-4">
          {visitError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {visitError}
            </div>
          )}

          {visitConflictWarning && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{visitConflictWarning}</span>
              </div>
              <label className="flex items-center gap-2 pt-2 cursor-pointer font-semibold text-amber-900">
                <input
                  type="checkbox"
                  checked={allowConflictOverride}
                  onChange={(e) => setAllowConflictOverride(e.target.checked)}
                  className="rounded border-amber-400 text-blue-600 focus:ring-blue-500"
                />
                Autorizar anulación de conflicto y agendar de todos modos
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha y Hora de Inicio"
              type="datetime-local"
              value={visitStartDate}
              onChange={(e) => setVisitStartDate(e.target.value)}
              required
            />
            <Input
              label="Fecha y Hora Estimada de Fin"
              type="datetime-local"
              value={visitEndDate}
              onChange={(e) => setVisitEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Dirección o Punto de Encuentro"
            value={visitAddress}
            onChange={(e) => setVisitAddress(e.target.value)}
            placeholder="Ej: Av. Amazonas N35-102 y Pereira, Edificio..."
          />

          <Textarea
            label="Instrucciones para la Cuadrilla"
            value={visitInstructions}
            onChange={(e) => setVisitInstructions(e.target.value)}
            rows={3}
            placeholder="Ej: Llevar escalera dieléctrica, multímetro True-RMS, desconectar breaker principal previo a intervención..."
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Técnicos que asistirán a la visita
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              {technicians.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedVisitTechs.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVisitTechs([...selectedVisitTechs, t.id])
                      } else {
                        setSelectedVisitTechs(selectedVisitTechs.filter((id) => id !== t.id))
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{t.full_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsVisitModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={visitLoading}>
              {visitLoading ? 'Verificando y Agendando...' : 'Confirmar Visita'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
