'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createVisitAction, updateVisitStatusAction } from '@/app/agenda/actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Building2,
  ClipboardList,
} from 'lucide-react'

interface AgendaViewProps {
  initialVisits: any[]
  workOrders: any[]
  technicians: Array<{ id: string; full_name: string }>
}

export function AgendaView({
  initialVisits,
  workOrders,
  technicians,
}: AgendaViewProps) {
  const router = useRouter()

  // Filtros
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'all'>('week')
  const [filterTech, setFilterTech] = useState<string>('all')

  // Modal Agendar Visita
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [address, setAddress] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])
  const [allowConflictOverride, setAllowConflictOverride] = useState(false)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Filtrado de visitas
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todayEnd = todayStart + 24 * 60 * 60 * 1000
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000

  const filteredVisits = initialVisits.filter((v) => {
    const vTime = new Date(v.start_at).getTime()

    if (filterPeriod === 'today') {
      if (vTime < todayStart || vTime >= todayEnd) return false
    } else if (filterPeriod === 'week') {
      if (vTime < todayStart - 24 * 60 * 60 * 1000 || vTime > weekEnd) return false
    }

    if (filterTech !== 'all') {
      const hasTech = (v.visit_technicians || []).some(
        (vt: any) => vt.user_id === filterTech
      )
      if (!hasTech) return false
    }

    return true
  })

  // Cambio de estado rápido
  const handleStatusChange = async (visitId: string, status: any) => {
    const res = await updateVisitStatusAction(visitId, status)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  // Al seleccionar orden, autollenar dirección si la tiene
  const handleSelectWorkOrder = (woId: string) => {
    setSelectedWorkOrderId(woId)
    const found = workOrders.find((w) => w.id === woId)
    if (found?.projects?.clients?.address) {
      setAddress(found.projects.clients.address)
    }
  }

  // Agendar
  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkOrderId || !startDate || !endDate) {
      setFormError('Por favor completa los campos obligatorios.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    setConflictWarning(null)

    const res = await createVisitAction({
      work_order_id: selectedWorkOrderId,
      start_at: new Date(startDate).toISOString(),
      end_at: new Date(endDate).toISOString(),
      address_snapshot: address,
      instructions,
      notes: null,
      technician_ids: selectedTechs,
      allow_conflict_override: allowConflictOverride,
    })

    setIsSubmitting(false)

    if (res.hasConflict) {
      setConflictWarning(res.error || 'Conflicto detectado')
    } else if (res.error) {
      setFormError(res.error)
    } else {
      setIsModalOpen(false)
      setSelectedWorkOrderId('')
      setStartDate('')
      setEndDate('')
      setAddress('')
      setInstructions('')
      setSelectedTechs([])
      setAllowConflictOverride(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Agenda Operativa de Visitas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Planificación y control de intervenciones técnicas en campo con detección de conflictos.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Visita Técnica
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Período:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setFilterPeriod('today')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterPeriod === 'today'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('week')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterPeriod === 'week'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Próximos 7 días
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterPeriod === 'all'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Técnico:
            </span>
            <select
              value={filterTech}
              onChange={(e) => setFilterTech(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
            >
              <option value="all">Todos los técnicos</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Listado de Visitas */}
      <div className="space-y-4">
        {filteredVisits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No hay visitas programadas en este período
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Agenda una nueva visita usando el botón superior.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVisits.map((visit) => {
            const start = new Date(visit.start_at)
            const end = new Date(visit.end_at)
            const techs = (visit.visit_technicians || [])
              .map((vt: any) => vt.profiles?.full_name)
              .filter(Boolean)

            return (
              <Card key={visit.id} className="hover:border-slate-300 transition-all shadow-xs">
                <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="h-3.5 w-3.5" />
                        {start.toLocaleDateString('es-EC', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                        , {start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}{' '}
                        - {end.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <StatusBadge status={visit.status} />
                      {visit.allow_conflict_override && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          Solapamiento Forzado
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Link
                          href={`/ordenes/${visit.work_order_id}`}
                          className="font-mono text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ClipboardList className="h-4 w-4" />
                          {visit.work_orders?.order_number}
                        </Link>
                        <span>—</span>
                        <span>{visit.work_orders?.projects?.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{visit.work_orders?.projects?.clients?.name}</span>
                        {visit.work_orders?.projects?.clients?.phone && (
                          <span className="font-mono ml-2">
                            Tel: {visit.work_orders.projects.clients.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {visit.address_snapshot && (
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span>{visit.address_snapshot}</span>
                      </p>
                    )}

                    {visit.instructions && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-semibold text-slate-700">Instrucciones: </span>
                        {visit.instructions}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-700 pt-1">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-medium">Técnicos: </span>
                      <span>
                        {techs.length > 0 ? techs.join(', ') : 'Ninguno asignado'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Estado */}
                  <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                    {visit.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusChange(visit.id, 'in_progress')}
                        className="gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 w-full"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        En Curso
                      </Button>
                    )}
                    {visit.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusChange(visit.id, 'completed')}
                        className="gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 w-full"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completar
                      </Button>
                    )}
                    {visit.status !== 'completed' && visit.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(visit.id, 'cancelled')}
                        className="gap-1 text-xs text-slate-500 hover:text-red-600 w-full"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Agendar Visita */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setConflictWarning(null)
          setAllowConflictOverride(false)
        }}
        title="Agendar Nueva Visita Operativa"
      >
        <form onSubmit={handleSubmitVisit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          {conflictWarning && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{conflictWarning}</span>
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

          <Select
            label="Orden de Trabajo Asociada"
            value={selectedWorkOrderId}
            onChange={(e) => handleSelectWorkOrder(e.target.value)}
            required
            options={[
              { value: '', label: 'Seleccionar Orden de Trabajo...' },
              ...workOrders.map((wo) => ({
                value: wo.id,
                label: `${wo.order_number} — ${wo.projects?.title} (${wo.projects?.clients?.name})`,
              })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha y Hora de Inicio"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="Fecha y Hora de Fin"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Dirección o Ubicación del Trabajo"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Av. 10 de Agosto y Mariana de Jesús..."
          />

          <Textarea
            label="Instrucciones Técnicas / Requerimientos"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="Ej: Llevar arnés, comprobador de aislamiento, coordinar ingreso con el conserje..."
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Asignar Técnicos
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              {technicians.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedTechs.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTechs([...selectedTechs, t.id])
                      } else {
                        setSelectedTechs(selectedTechs.filter((id) => id !== t.id))
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
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Verificando y Agendando...' : 'Agendar Visita'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
