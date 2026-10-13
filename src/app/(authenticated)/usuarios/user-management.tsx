'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminSetUserRolesAction, adminToggleUserActiveAction } from '@/app/usuarios/actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Edit,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react'

interface UserManagementProps {
  currentAdminId: string
  users: Array<{
    id: string
    full_name: string
    email: string | null
    phone: string | null
    is_active: boolean
    created_at: string
    roles: string[]
  }>
}

export function UserManagement({ currentAdminId, users }: UserManagementProps) {
  const router = useRouter()

  // Modal Roles
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [rolesDraft, setRolesDraft] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenRoleModal = (u: any) => {
    setSelectedUser(u)
    setRolesDraft([...u.roles])
    setError(null)
  }

  const handleToggleRole = (role: string) => {
    if (rolesDraft.includes(role)) {
      if (rolesDraft.length === 1) return // No permitir 0 roles
      setRolesDraft(rolesDraft.filter((r) => r !== role))
    } else {
      setRolesDraft([...rolesDraft, role])
    }
  }

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsLoading(true)
    setError(null)

    const res = await adminSetUserRolesAction(selectedUser.id, rolesDraft)
    setIsLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSelectedUser(null)
      router.refresh()
    }
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (userId === currentAdminId) {
      alert('No puedes desactivar tu propia cuenta de administrador.')
      return
    }
    const confirmMsg = currentActive
      ? '¿Estás seguro de desactivar a este usuario? Ya no podrá acceder al sistema.'
      : '¿Deseas reactivar el acceso para este usuario?'
    if (!confirm(confirmMsg)) return

    const res = await adminToggleUserActiveAction(userId, !currentActive)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Administración de Usuarios y Roles
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Control centralizado de permisos RLS: Administrador, Operaciones y Técnicos de Campo.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4 border-b border-slate-100">
          <CardTitle className="text-base text-slate-800">
            Usuarios Registrados ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Usuario</th>
                  <th className="px-6 py-3 font-semibold">Contacto</th>
                  <th className="px-6 py-3 font-semibold">Roles Asignados</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                  <th className="px-6 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 font-mono">
                        <Calendar className="h-3 w-3" />
                        Registrado:{' '}
                        {new Date(u.created_at).toLocaleDateString('es-EC', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {u.email || 'Sin correo'}
                      </div>
                      {u.phone && (
                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {u.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant={
                              r === 'admin'
                                ? 'danger'
                                : r === 'operations'
                                ? 'cyan'
                                : 'default'
                            }
                            className="capitalize text-[11px]"
                          >
                            {r === 'admin'
                              ? 'Administrador'
                              : r === 'operations'
                              ? 'Operaciones'
                              : 'Técnico de Campo'}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <UserCheck className="h-3 w-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <UserX className="h-3 w-3" />
                          Desactivado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRoleModal(u)}
                          className="gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Roles
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          className={`text-xs ${
                            u.is_active
                              ? 'text-slate-500 hover:text-rose-600'
                              : 'text-emerald-600 hover:text-emerald-800'
                          }`}
                        >
                          {u.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Editar Roles */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Gestionar Roles: ${selectedUser?.full_name}`}
      >
        <form onSubmit={handleSaveRoles} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-600">
            Selecciona los niveles de acceso asignados a este usuario:
          </p>

          <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
            <label className="flex items-start gap-3 p-2 rounded hover:bg-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={rolesDraft.includes('admin')}
                onChange={() => handleToggleRole('admin')}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-xs text-slate-900 block">
                  Administrador (admin)
                </span>
                <span className="text-[11px] text-slate-500">
                  Control total del sistema, configuración de empresa, tarifas y gestión de usuarios.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2 rounded hover:bg-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={rolesDraft.includes('operations')}
                onChange={() => handleToggleRole('operations')}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-xs text-slate-900 block">
                  Operaciones / Administrativo (operations)
                </span>
                <span className="text-[11px] text-slate-500">
                  Gestión de clientes, proyectos, cotizaciones, órdenes de trabajo y agenda.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2 rounded hover:bg-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={rolesDraft.includes('technician')}
                onChange={() => handleToggleRole('technician')}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-xs text-slate-900 block">
                  Técnico de Campo (technician)
                </span>
                <span className="text-[11px] text-slate-500">
                  Acceso móvil en campo a visitas asignadas, reporte técnico y avance de etapas.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedUser(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Actualizar Permisos'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
