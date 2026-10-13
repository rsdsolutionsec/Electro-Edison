'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  saveQuotationAction,
  createNewVersionAction,
  approveQuotationAction,
  markAsSentAction,
  rejectQuotationAction,
  convertToWorkOrderAction,
} from '@/app/cotizaciones/actions'
import { calculateQuotation, formatCurrency } from '@/lib/quotation-calculator'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Copy,
  CheckCircle2,
  Send,
  XCircle,
  Briefcase,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

interface EditorItem {
  id?: string
  description: string
  item_type: 'material' | 'labor' | 'service' | 'other'
  unit: string
  quantity: number
  unit_price: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  tax_rate: number
}

interface QuotationEditorProps {
  initialQuotation?: any
  projectId?: string
  projects: Array<{ id: string; project_code: string; title: string; client_name?: string }>
  catalogItems: Array<{ id: string; description: string; item_type: string; unit: string; unit_price: number }>
}

export function QuotationEditor({
  initialQuotation,
  projectId: defaultProjectId,
  projects,
  catalogItems,
}: QuotationEditorProps) {
  const router = useRouter()
  const isEditing = Boolean(initialQuotation?.id)
  const isDraft = !initialQuotation || initialQuotation.status === 'draft'

  const [projectId, setProjectId] = useState<string>(
    initialQuotation?.project_id || defaultProjectId || projects[0]?.id || ''
  )
  const [scopeDescription, setScopeDescription] = useState<string>(
    initialQuotation?.scope_description || ''
  )
  const [validUntil, setValidUntil] = useState<string>(
    initialQuotation?.valid_until || ''
  )
  const [depositType, setDepositType] = useState<'percentage' | 'fixed'>(
    initialQuotation?.deposit_type || 'percentage'
  )
  const [depositValue, setDepositValue] = useState<number>(
    initialQuotation?.deposit_value ? Number(initialQuotation.deposit_value) : 50
  )
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialQuotation?.payment_terms || '50% de anticipo y 50% contra entrega final.'
  )
  const [executionTimeDescription, setExecutionTimeDescription] = useState<string>(
    initialQuotation?.execution_time_description || '5 días laborables'
  )
  const [commercialTerms, setCommercialTerms] = useState<string>(
    initialQuotation?.commercial_terms || 'Precios vigentes por 15 días.'
  )
  const [notes, setNotes] = useState<string>(initialQuotation?.notes || '')

  // Partidas
  const [items, setItems] = useState<EditorItem[]>(
    initialQuotation?.quotation_items?.length
      ? initialQuotation.quotation_items.map((it: any) => ({
          id: it.id,
          description: it.description,
          item_type: it.item_type,
          unit: it.unit,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          discount_type: it.discount_type || 'percentage',
          discount_value: Number(it.discount_value || 0),
          tax_rate: Number(it.tax_rate ?? 15),
        }))
      : [
          {
            description: 'Canalización y tubería EMT con accesorios',
            item_type: 'material',
            unit: 'tramo',
            quantity: 10,
            unit_price: 8.5,
            discount_type: 'percentage',
            discount_value: 0,
            tax_rate: 15,
          },
        ]
  )

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Cálculo en tiempo real
  const calculation = useMemo(() => {
    return calculateQuotation({
      items: items.map((it) => ({
        quantity: it.quantity,
        unitPrice: it.unit_price,
        discountType: it.discount_type,
        discountValue: it.discount_value,
        taxRate: it.tax_rate,
      })),
      depositType,
      depositValue,
    })
  }, [items, depositType, depositValue])

  function handleAddItem() {
    setItems([
      ...items,
      {
        description: '',
        item_type: 'material',
        unit: 'u',
        quantity: 1,
        unit_price: 0,
        discount_type: 'percentage',
        discount_value: 0,
        tax_rate: 15,
      },
    ])
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, idx) => idx !== index))
  }

  function handleItemChange(index: number, field: keyof EditorItem, value: any) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  function handleAddFromCatalog(catItem: any) {
    setItems([
      ...items,
      {
        description: catItem.description,
        item_type: catItem.item_type,
        unit: catItem.unit,
        quantity: 1,
        unit_price: Number(catItem.unit_price),
        discount_type: 'percentage',
        discount_value: 0,
        tax_rate: 15,
      },
    ])
  }

  async function handleSave() {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const payload = {
      project_id: projectId,
      valid_until: validUntil || null,
      scope_description: scopeDescription || null,
      deposit_type: depositType,
      deposit_value: depositValue,
      payment_terms: paymentTerms || null,
      execution_time_description: executionTimeDescription || null,
      commercial_terms: commercialTerms || null,
      notes: notes || null,
      items: items.map((it, idx) => ({
        ...it,
        sort_order: idx + 1,
      })),
    }

    const res = await saveQuotationAction(initialQuotation?.id || null, payload)
    if (res.error) {
      setErrorMessage(res.error)
      setIsSaving(false)
      return
    }

    setSuccessMessage('Cotización guardada exitosamente.')
    setIsSaving(false)
    if (!isEditing && res.quotationId) {
      router.push(`/cotizaciones/${res.quotationId}`)
    } else {
      router.refresh()
    }
  }

  async function handleCreateNewVersion() {
    if (!initialQuotation?.id) return
    const ok = window.confirm(
      '¿Desea crear una nueva versión de esta cotización? La versión actual quedará archivada como respaldo inmutable.'
    )
    if (!ok) return

    setIsSaving(true)
    const res = await createNewVersionAction(initialQuotation.id)
    if (res.error) {
      setErrorMessage(res.error)
      setIsSaving(false)
      return
    }
    router.push(`/cotizaciones/${res.newVersionId}`)
  }

  async function handleMarkAsSent() {
    if (!initialQuotation?.id) return
    setIsSaving(true)
    const res = await markAsSentAction(initialQuotation.id, 'WhatsApp')
    if (res.error) setErrorMessage(res.error)
    setIsSaving(false)
    router.refresh()
  }

  async function handleApprove() {
    if (!initialQuotation?.id) return
    const ok = window.confirm('¿Confirmar aprobación formal de esta cotización por parte del cliente?')
    if (!ok) return

    setIsSaving(true)
    const res = await approveQuotationAction(initialQuotation.id)
    if (res.error) setErrorMessage(res.error)
    setIsSaving(false)
    router.refresh()
  }

  async function handleConvertToWorkOrder() {
    if (!initialQuotation?.id) return
    setIsSaving(true)
    const res = await convertToWorkOrderAction(initialQuotation.id)
    if (res.error) {
      setErrorMessage(res.error)
      setIsSaving(false)
      return
    }
    if (res.workOrder?.id) {
      router.push(`/ordenes/${res.workOrder.id}`)
    } else {
      router.push('/ordenes')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Acciones del Ciclo de Vida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/cotizaciones" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isEditing ? `Cotización ${initialQuotation.quotation_number}` : 'Nueva Cotización'}
              </h1>
              {isEditing && (
                <>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    v{initialQuotation.version}
                  </span>
                  <StatusBadge status={initialQuotation.status} />
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Presupuesto técnico con desglose de materiales, mano de obra y condiciones de anticipo.
            </p>
          </div>
        </div>

        {/* Botonera de Transiciones Comerciales */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditing && (
            <>
              <Link
                href={`/api/pdf/quotation/${initialQuotation.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <FileText className="h-4 w-4 text-rose-600" /> Ver Cotización PDF
              </Link>
              <Link
                href={`/api/pdf/proforma/${initialQuotation.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <FileText className="h-4 w-4 text-blue-600" /> Ver Proforma PDF
              </Link>
            </>
          )}

          {isEditing && !isDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCreateNewVersion}
              isLoading={isSaving}
              className="gap-1.5"
              title="Genera una nueva versión editable sin alterar esta versión inmutable"
            >
              <Copy className="h-3.5 w-3.5" />
              Nueva Versión
            </Button>
          )}

          {isEditing && isDraft && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMarkAsSent}
              isLoading={isSaving}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Registrar Envío
            </Button>
          )}

          {isEditing && ['draft', 'sent'].includes(initialQuotation.status) && (
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={handleApprove}
              isLoading={isSaving}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Registrar Aprobación
            </Button>
          )}

          {isEditing && initialQuotation.status === 'approved' && (
            <Button
              type="button"
              variant="amber"
              size="sm"
              onClick={handleConvertToWorkOrder}
              isLoading={isSaving}
              className="gap-1.5"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Convertir a Orden de Trabajo
            </Button>
          )}

          {isDraft && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar Cotización
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>{successMessage}</p>
        </div>
      )}

      {!isDraft && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50/70 p-3 text-xs text-amber-800">
          <strong>Versión Inmutable:</strong> Esta cotización se encuentra en estado{' '}
          <strong>{initialQuotation.status.toUpperCase()}</strong>. Para realizar modificaciones de precio o
          alcance, pulse en <strong>"Nueva Versión"</strong> arriba.
        </div>
      )}

      {/* Datos del Proyecto & Fechas */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100">
          <CardTitle className="text-base">Expediente y Parámetros Comerciales</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Select
                label="Proyecto Asociado"
                value={projectId}
                disabled={!isDraft || isEditing}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Seleccione un proyecto...
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.project_code}] {p.title}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Input
                label="Válido Hasta"
                type="date"
                disabled={!isDraft}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Tiempo Estimado de Ejecución"
                disabled={!isDraft}
                value={executionTimeDescription}
                onChange={(e) => setExecutionTimeDescription(e.target.value)}
                placeholder="Ej: 8 días laborables"
              />
            </div>

            <div className="sm:col-span-3">
              <Textarea
                label="Descripción y Alcance de la Propuesta"
                disabled={!isDraft}
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                placeholder="Detalle el alcance de los trabajos eléctricos cotizados..."
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Partidas */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-slate-100 gap-2">
          <div>
            <CardTitle className="text-base">Partidas de la Cotización ({items.length})</CardTitle>
            <p className="text-xs text-slate-500">
              Desglose de materiales, mano de obra técnica y servicios de instalación.
            </p>
          </div>
          {isDraft && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Partida Libre
              </Button>
            </div>
          )}
        </CardHeader>

        {/* Ayuda opcional del catálogo */}
        {isDraft && catalogItems.length > 0 && (
          <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Catálogo rápido (opcional):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {catalogItems.slice(0, 5).map((ci) => (
                <button
                  key={ci.id}
                  type="button"
                  onClick={() => handleAddFromCatalog(ci)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  + {ci.description.slice(0, 28)}... (${ci.unit_price})
                </button>
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Descripción del Concepto</th>
                <th className="px-3 py-3 w-28">Tipo</th>
                <th className="px-3 py-3 w-20">Unidad</th>
                <th className="px-3 py-3 w-24">Cant.</th>
                <th className="px-3 py-3 w-28 text-right">P. Unit. ($)</th>
                <th className="px-3 py-3 w-28 text-right">Desc. (%)</th>
                <th className="px-3 py-3 w-20 text-right">IVA (%)</th>
                <th className="px-4 py-3 w-32 text-right">Total ($)</th>
                {isDraft && <th className="px-2 py-3 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const itemCalc = calculation.items[idx]

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={!isDraft}
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Descripción del material o trabajo..."
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        disabled={!isDraft}
                        value={item.item_type}
                        onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      >
                        <option value="material">Material</option>
                        <option value="labor">Mano de Obra</option>
                        <option value="service">Servicio</option>
                        <option value="other">Otro</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={!isDraft}
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        placeholder="u, m, rollo"
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        disabled={!isDraft}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 text-right focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={!isDraft}
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 text-right focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={!isDraft}
                        value={item.discount_value}
                        onChange={(e) => handleItemChange(idx, 'discount_value', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 text-right focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={!isDraft}
                        value={item.tax_rate}
                        onChange={(e) => handleItemChange(idx, 'tax_rate', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 text-right focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(itemCalc?.lineTotal ?? 0)}
                    </td>
                    {isDraft && (
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          title="Eliminar partida"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Resumen Económico y Condiciones de Pago */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Condiciones de Pago y Anticipo */}
        <Card>
          <CardHeader className="py-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold">Condiciones de Pago y Anticipo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Tipo de Anticipo"
                disabled={!isDraft}
                value={depositType}
                onChange={(e) => setDepositType(e.target.value as 'percentage' | 'fixed')}
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </Select>
              <Input
                label={depositType === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'}
                type="number"
                min="0"
                step="any"
                disabled={!isDraft}
                value={depositValue}
                onChange={(e) => setDepositValue(Number(e.target.value))}
              />
            </div>

            <Textarea
              label="Forma y Plazos de Pago"
              disabled={!isDraft}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={2}
            />

            <Textarea
              label="Condiciones Comerciales y Validez"
              disabled={!isDraft}
              value={commercialTerms}
              onChange={(e) => setCommercialTerms(e.target.value)}
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Resumen de Totales Calculados */}
        <Card>
          <CardHeader className="py-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold">Liquidación Económica Garantizada</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal Partidas:</span>
              <span className="font-mono font-medium">{formatCurrency(calculation.subtotal)}</span>
            </div>

            {calculation.discountTotal > 0 && (
              <div className="flex justify-between text-sm text-rose-600">
                <span>Descuento Total:</span>
                <span className="font-mono font-medium">- {formatCurrency(calculation.discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-slate-600">
              <span>Base Imponible Sujeta a IVA:</span>
              <span className="font-mono font-medium">{formatCurrency(calculation.taxableBaseTotal)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>IVA (15% Configurado):</span>
              <span className="font-mono font-medium">{formatCurrency(calculation.taxTotal)}</span>
            </div>

            <div className="flex justify-between border-t-2 border-blue-600 pt-2 text-base font-bold text-slate-900">
              <span>TOTAL DE LA COTIZACIÓN:</span>
              <span className="font-mono text-lg text-blue-700">{formatCurrency(calculation.total)}</span>
            </div>

            <div className="rounded-lg bg-blue-50/70 p-3 mt-3 space-y-1.5 border border-blue-100 text-xs">
              <div className="flex justify-between text-blue-900 font-semibold">
                <span>Anticipo Requerido:</span>
                <span className="font-mono">{formatCurrency(calculation.depositAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Saldo Estimado a la Entrega:</span>
                <span className="font-mono">{formatCurrency(calculation.estimatedBalance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
