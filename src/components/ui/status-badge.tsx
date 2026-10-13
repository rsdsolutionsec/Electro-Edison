import { Badge } from '@/components/ui/badge'

export type EntityStatusType =
  // Proyectos
  | 'planning'
  | 'approved'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  // Cotizaciones
  | 'draft'
  | 'sent'
  | 'rejected'
  | 'expired'
  | 'superseded'
  // Órdenes de trabajo
  | 'pending_schedule'
  | 'scheduled'
  | 'paused'
  | 'action_required'
  // Etapas
  | 'pending'
  // Prioridad
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' }
> = {
  // Proyectos
  planning: { label: 'Planificación', variant: 'default' },
  in_progress: { label: 'En Ejecución', variant: 'primary' },
  on_hold: { label: 'En Espera', variant: 'warning' },
  completed: { label: 'Finalizado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },

  // Cotizaciones
  draft: { label: 'Borrador', variant: 'default' },
  sent: { label: 'Enviada', variant: 'cyan' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  expired: { label: 'Vencida', variant: 'warning' },
  superseded: { label: 'Sustituida', variant: 'default' },

  // Órdenes
  pending_schedule: { label: 'Por Programar', variant: 'warning' },
  scheduled: { label: 'Programada', variant: 'cyan' },
  paused: { label: 'Pausada', variant: 'warning' },
  action_required: { label: 'Requiere Acción', variant: 'danger' },

  // Etapas / Visitas
  pending: { label: 'Pendiente', variant: 'default' },

  // Prioridad
  low: { label: 'Baja', variant: 'default' },
  normal: { label: 'Normal', variant: 'primary' },
  high: { label: 'Alta', variant: 'warning' },
  urgent: { label: 'Urgente', variant: 'danger' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'default' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
