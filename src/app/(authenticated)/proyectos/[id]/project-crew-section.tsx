'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  assignTechnicianToProjectAction,
  removeTechnicianFromProjectAction,
} from '@/app/tecnicos/actions'
import {
  HardHat,
  UserPlus,
  Phone,
  MessageSquare,
  Wrench,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

interface AssignedTechnician {
  id: string
  role: string
  assigned_at: string
  notes?: string | null
  technician: {
    id: string
    full_name: string
    phone: string | null
    email: string | null
    specialty: string
    category: string
    status: string
  }
}

interface AvailableTechnician {
  id: string
  full_name: string
  specialty: string
  category: string
  phone: string | null
}

export function ProjectCrewSection({
  projectId,
  assignedCrew,
  allTechnicians,
}: {
  projectId: string
  assignedCrew: AssignedTechnician[]
  allTechnicians: AvailableTechnician[]
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTechId, setSelectedTechId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'lead' | 'technician' | 'assistant'>('technician')
  const [notes, setNotes] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // IDs ya asignados
  const assignedIds = new Set(assignedCrew.map((c) => c.technician?.id))
  const unassignedTechs = allTechnicians.filter((t) => !assignedIds.has(t.id))

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTechId) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await assignTechnicianToProjectAction(
      projectId,
      selectedTechId,
      selectedRole,
      notes
    )

    if (res.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
      return
    }

    setSuccessMessage('Técnico asignado a la cuadrilla del proyecto exitosamente')
    setIsLoading(false)
    setModalOpen(false)
    setSelectedTechId('')
    setNotes('')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  async function handleRemove(technicianId: string) {
    if (!confirm('¿Está seguro de desvincular a este técnico de la cuadrilla de este proyecto?')) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const res = await removeTechnicianFromProjectAction(projectId, technicianId)

    if (res.error) {
      setErrorMessage(res.error)
    } else {
      setSuccessMessage('Técnico desvinculado de la cuadrilla')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setIsLoading(false)
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'lead':
        return { label: 'Líder de Cuadrilla', color: 'bg-purple-100 text-purple-800 border-purple-200' }
      case 'assistant':
        return { label: 'Ayudante', color: 'bg-amber-100 text-amber-800 border-amber-200' }
      case 'technician':
      default:
        return { label: 'Técnico Instalador', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Cuadrilla de Técnicos Asignados ({assignedCrew.length})
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Electricistas y personal técnico asignados para la ejecución de este proyecto.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setErrorMessage(null)
            setModalOpen(true)
          }}
          className="gap-1.5 self-start sm:self-auto text-xs"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Asignar Técnico
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-50 p-2.5 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {assignedCrew.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedCrew.map((item) => {
              const tech = item.technician
              if (!tech) return null
              const roleInfo = getRoleBadge(item.role)
              const cleanPhone = tech.phone ? tech.phone.replace(/[^0-9]/g, '') : ''

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                        {tech.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs leading-tight">
                          {tech.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Wrench className="h-3 w-3 text-slate-400" />
                          {tech.specialty}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(tech.id)}
                      disabled={isLoading}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Desvincular técnico de este proyecto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${roleInfo.color}`}
                    >
                      {roleInfo.label}
                    </span>

                    {tech.phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${tech.phone}`}
                          className="text-slate-500 hover:text-blue-600 p-1 rounded-md"
                          title={`Llamar a ${tech.phone}`}
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200"
                        >
                          <MessageSquare className="h-2.5 w-2.5" /> WA
                        </a>
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded-md">
                      Nota: {item.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500 space-y-2">
            <HardHat className="mx-auto h-8 w-8 text-slate-300" />
            <p className="font-medium">No se han asignado técnicos a la cuadrilla de este proyecto aún.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="text-xs"
            >
              + Asignar Primer Técnico
            </Button>
          </div>
        )}
      </CardContent>

      {/* Modal: Asignar Técnico al Proyecto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Asignar Técnico a este Proyecto"
        description="Seleccione un técnico del catálogo para sumarlo a la cuadrilla operativa de esta obra."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seleccione el Técnico de Campo *
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="">-- Seleccionar técnico --</option>
              {unassignedTechs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} — {t.specialty}
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Rol en la Cuadrilla de este Proyecto *"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
          >
            <option value="lead">Líder de Cuadrilla (Supervisor técnico en faena)</option>
            <option value="technician">Técnico Instalador (Ejecutor de partidas)</option>
            <option value="assistant">Ayudante de Cuadrilla (Soporte y logística)</option>
          </Select>

          <Textarea
            label="Notas o Tareas Específicas Asignadas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Encargado del montaje de bandejas portacables y canalizaciones de alimentador."
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!selectedTechId}
            >
              Confirmar Asignación
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
