'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  createTechnicianAction,
  updateTechnicianAction,
  assignTechnicianToProjectAction,
} from '@/app/tecnicos/actions'
import {
  HardHat,
  Plus,
  Search,
  Phone,
  Mail,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Edit,
  MessageSquare,
  ShieldCheck,
  Wrench,
  Users,
} from 'lucide-react'

interface TechnicianItem {
  id: string
  full_name: string
  identification: string | null
  phone: string | null
  email: string | null
  specialty: string
  category: string
  status: string
  is_active: boolean
  notes: string | null
  created_at: string
  project_technicians?: {
    id: string
    role: string
    assigned_at: string
    projects?: {
      id: string
      project_code: string
      title: string
      status: string
    } | null
  }[]
}

interface ActiveProject {
  id: string
  project_code: string
  title: string
  status: string
}

export function TechniciansView({
  technicians,
  activeProjects,
}: {
  technicians: TechnicianItem[]
  activeProjects: ActiveProject[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  const [selectedTech, setSelectedTech] = useState<TechnicianItem | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [assignRole, setAssignRole] = useState<'lead' | 'technician' | 'assistant'>('technician')
  const [assignNotes, setAssignNotes] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // KPIs
  const totalTechs = technicians.length
  const availableTechs = technicians.filter((t) => t.status === 'available' && t.is_active).length
  const assignedTechs = technicians.filter((t) => t.status === 'assigned' && t.is_active).length
  const leadTechs = technicians.filter((t) => t.category === 'lead' && t.is_active).length

  // Filtrado
  const filteredTechs = technicians.filter((tech) => {
    const matchesSearch =
      tech.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tech.identification && tech.identification.includes(searchTerm)) ||
      (tech.phone && tech.phone.includes(searchTerm))

    const matchesStatus = statusFilter === 'all' || tech.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || tech.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Handlers
  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const res = await createTechnicianAction(formData)

    if (res.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
      return
    }

    setSuccessMessage('Técnico registrado correctamente')
    setIsLoading(false)
    setCreateModalOpen(false)
    setTimeout(() => setSuccessMessage(null), 3500)
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedTech) return

    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const res = await updateTechnicianAction(selectedTech.id, formData)

    if (res.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
      return
    }

    setSuccessMessage('Datos del técnico actualizados correctamente')
    setIsLoading(false)
    setEditModalOpen(false)
    setSelectedTech(null)
    setTimeout(() => setSuccessMessage(null), 3500)
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTech || !selectedProjectId) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await assignTechnicianToProjectAction(
      selectedProjectId,
      selectedTech.id,
      assignRole,
      assignNotes
    )

    if (res.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
      return
    }

    setSuccessMessage(`Técnico asignado exitosamente al proyecto`)
    setIsLoading(false)
    setAssignModalOpen(false)
    setSelectedTech(null)
    setSelectedProjectId('')
    setAssignNotes('')
    setTimeout(() => setSuccessMessage(null), 3500)
  }

  function getCategoryLabel(category: string) {
    switch (category) {
      case 'lead':
        return { label: 'Líder de Cuadrilla', color: 'bg-purple-100 text-purple-800 border-purple-200' }
      case 'technician':
        return { label: 'Técnico Especialista', color: 'bg-blue-100 text-blue-800 border-blue-200' }
      case 'assistant':
        return { label: 'Ayudante Eléctrico', color: 'bg-amber-100 text-amber-800 border-amber-200' }
      default:
        return { label: 'Técnico', color: 'bg-slate-100 text-slate-800 border-slate-200' }
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'available':
        return { label: 'Disponible', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'assigned':
        return { label: 'En Proyecto', color: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'on_leave':
        return { label: 'En Licencia', color: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 'inactive':
        return { label: 'Inactivo', color: 'bg-rose-50 text-rose-700 border-rose-200' }
      default:
        return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Notificaciones */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-50 p-4 text-sm text-rose-800 shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Técnicos y Cuadrillas de Campo
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Plantilla de electricistas, especialidades y asignación directa a proyectos.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMessage(null)
            setCreateModalOpen(true)
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo Técnico
        </Button>
      </div>

      {/* Métricas / KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Plantilla</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalTechs}</p>
              <p className="text-[11px] text-slate-400">Electricistas registrados</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700">Disponibles</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{availableTechs}</p>
              <p className="text-[11px] text-emerald-600">Para nuevas obras</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700">En Proyecto</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{assignedTechs}</p>
              <p className="text-[11px] text-blue-600">En faenas activas</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FolderKanban className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-700">Líderes Cuadrilla</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{leadTechs}</p>
              <p className="text-[11px] text-purple-600">Jefes de cuadrilla</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar técnico por nombre, especialidad, cédula o teléfono..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 w-full sm:w-44 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="available">Disponibles</option>
              <option value="assigned">En Proyecto</option>
              <option value="on_leave">En Licencia</option>
              <option value="inactive">Inactivos</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 w-full sm:w-44 cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              <option value="lead">Líderes de Cuadrilla</option>
              <option value="technician">Técnicos Instaladores</option>
              <option value="assistant">Ayudantes</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Técnicos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTechs.map((tech) => {
          const categoryStyle = getCategoryLabel(tech.category)
          const statusStyle = getStatusBadge(tech.status)
          const cleanPhone = tech.phone ? tech.phone.replace(/[^0-9]/g, '') : ''
          const projectsAssigned = tech.project_technicians || []

          return (
            <Card key={tech.id} className="hover:border-slate-300 transition-shadow hover:shadow-sm">
              <CardContent className="p-5 space-y-4">
                {/* Cabecera Tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200">
                      {tech.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {tech.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Wrench className="h-3 w-3 text-slate-400" />
                        {tech.specialty}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusStyle.color}`}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                {/* Categoría y Cédula */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${categoryStyle.color}`}>
                    {categoryStyle.label}
                  </span>
                  {tech.identification && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                      C.I: {tech.identification}
                    </span>
                  )}
                </div>

                {/* Contacto Directo */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {tech.phone ? (
                    <div className="flex items-center justify-between">
                      <a
                        href={`tel:${tech.phone}`}
                        className="inline-flex items-center gap-1.5 hover:text-blue-600 font-medium"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {tech.phone}
                      </a>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                      >
                        <MessageSquare className="h-3 w-3" /> WhatsApp
                      </a>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Sin teléfono registrado</p>
                  )}

                  {tech.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{tech.email}</span>
                    </div>
                  )}
                </div>

                {/* Proyectos Asignados */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Proyectos Asignados ({projectsAssigned.length}):
                    </span>
                  </div>

                  {projectsAssigned.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {projectsAssigned.slice(0, 3).map((pt) => (
                        <Link
                          key={pt.id}
                          href={`/proyectos/${pt.projects?.id}`}
                          className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-[11px] hover:bg-blue-50 border border-slate-100 transition-colors"
                        >
                          <span className="font-mono font-bold text-blue-700">
                            {pt.projects?.project_code}
                          </span>
                          <span className="truncate max-w-[170px] text-slate-600">
                            {pt.projects?.title}
                          </span>
                        </Link>
                      ))}
                      {projectsAssigned.length > 3 && (
                        <p className="text-[10px] text-slate-400 text-right">
                          + {projectsAssigned.length - 3} proyecto(s) más
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No tiene proyectos asignados actualmente.</p>
                  )}
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTech(tech)
                      setSelectedProjectId('')
                      setAssignRole((tech.category as any) || 'technician')
                      setAssignModalOpen(true)
                    }}
                    className="flex-1 text-xs gap-1"
                  >
                    <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                    Asignar Obra
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedTech(tech)
                      setEditModalOpen(true)
                    }}
                    className="text-xs gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTechs.length === 0 && (
        <Card className="py-12 text-center text-slate-500">
          <HardHat className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-medium">No se encontraron técnicos con los filtros aplicados.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setCategoryFilter('all')
            }}
            className="mt-3"
          >
            Limpiar Filtros
          </Button>
        </Card>
      )}

      {/* Modal: Registrar Nuevo Técnico */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Registrar Nuevo Técnico de Campo"
        description="Agregue un electricista a la plantilla operativa para asignarlo a proyectos y citas."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Nombre Completo *"
            name="full_name"
            placeholder="Ej: Ing. Jorge Morales"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Cédula / DNI"
              name="identification"
              placeholder="Ej: 0912345678"
            />
            <Input
              label="Teléfono Celular"
              name="phone"
              placeholder="Ej: +593 99 123 4567"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Correo Electrónico (opcional)"
              name="email"
              type="email"
              placeholder="Ej: jorge@electricopino.ec"
            />
            <Select label="Categoría Operativa *" name="category" defaultValue="technician">
              <option value="lead">Líder de Cuadrilla (Supervisor)</option>
              <option value="technician">Técnico Electricista (Especialista)</option>
              <option value="assistant">Ayudante Técnico</option>
            </Select>
          </div>

          <Input
            label="Especialidad Técnica *"
            name="specialty"
            defaultValue="Instalaciones Eléctricas Generales"
            placeholder="Ej: Media Tensión, Montaje de Tableros, Tendido de Cableado"
            required
          />

          <Select label="Estado Inicial *" name="status" defaultValue="available">
            <option value="available">Disponible para Obras</option>
            <option value="assigned">En Proyecto Activo</option>
            <option value="on_leave">En Licencia / Permiso</option>
            <option value="inactive">Inactivo</option>
          </Select>

          <Textarea
            label="Notas / Certificaciones / Observaciones"
            name="notes"
            placeholder="Certificaciones SEC / riesgo eléctrico, años de experiencia, etc."
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Registrar Técnico
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Técnico */}
      {selectedTech && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedTech(null)
          }}
          title={`Editar Técnico: ${selectedTech.full_name}`}
          description="Actualice los datos de contacto, especialidad o estado del electricista."
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Nombre Completo *"
              name="full_name"
              defaultValue={selectedTech.full_name}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Cédula / DNI"
                name="identification"
                defaultValue={selectedTech.identification || ''}
              />
              <Input
                label="Teléfono Celular"
                name="phone"
                defaultValue={selectedTech.phone || ''}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Correo Electrónico"
                name="email"
                type="email"
                defaultValue={selectedTech.email || ''}
              />
              <Select label="Categoría Operativa *" name="category" defaultValue={selectedTech.category}>
                <option value="lead">Líder de Cuadrilla (Supervisor)</option>
                <option value="technician">Técnico Electricista (Especialista)</option>
                <option value="assistant">Ayudante Técnico</option>
              </Select>
            </div>

            <Input
              label="Especialidad Técnica *"
              name="specialty"
              defaultValue={selectedTech.specialty}
              required
            />

            <Select label="Estado *" name="status" defaultValue={selectedTech.status}>
              <option value="available">Disponible para Obras</option>
              <option value="assigned">En Proyecto Activo</option>
              <option value="on_leave">En Licencia / Permiso</option>
              <option value="inactive">Inactivo</option>
            </Select>

            <Textarea
              label="Notas / Certificaciones"
              name="notes"
              defaultValue={selectedTech.notes || ''}
              rows={2}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false)
                  setSelectedTech(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Asignar Técnico a Proyecto */}
      {selectedTech && (
        <Modal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false)
            setSelectedTech(null)
          }}
          title={`Asignar a Proyecto: ${selectedTech.full_name}`}
          description="Incorpore este técnico a la cuadrilla operativa de un proyecto activo."
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seleccione el Proyecto de Obra *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">-- Seleccionar proyecto --</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} — {p.title}
                  </option>
                ))}
              </select>
            </div>

            <Select
              label="Rol del Técnico en esta Obra"
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value as any)}
            >
              <option value="lead">Líder de Cuadrilla (Responsable técnico en sitio)</option>
              <option value="technician">Técnico Instalador (Ejecución de partidas)</option>
              <option value="assistant">Ayudante de Cuadrilla (Soporte)</option>
            </Select>

            <Textarea
              label="Instrucciones o Notas de Asignación (opcional)"
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Ej: Asignado para la etapa de tendido de alimentadores y montaje de bandejas."
              rows={2}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssignModalOpen(false)
                  setSelectedTech(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!selectedProjectId}
              >
                Confirmar Asignación
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
