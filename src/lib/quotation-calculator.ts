import Decimal from 'decimal.js'

// Configuración de precisión decimal
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export interface ItemCalculationInput {
  quantity: number | string
  unitPrice: number | string
  discountType?: 'percentage' | 'fixed'
  discountValue?: number | string
  taxRate?: number | string
}

export interface ItemCalculationResult {
  lineSubtotal: number
  lineDiscount: number
  taxableBase: number
  lineTax: number
  lineTotal: number
}

export interface QuotationCalculationInput {
  items: ItemCalculationInput[]
  depositType?: 'percentage' | 'fixed'
  depositValue?: number | string
}

export interface QuotationCalculationResult {
  subtotal: number
  discountTotal: number
  taxableBaseTotal: number
  taxTotal: number
  total: number
  depositAmount: number
  estimatedBalance: number
  items: ItemCalculationResult[]
}

/**
 * Calcula una partida individual garantizando precisión decimal.
 */
export function calculateItem(input: ItemCalculationInput): ItemCalculationResult {
  const qty = new Decimal(input.quantity || 0)
  const price = new Decimal(input.unitPrice || 0)
  const lineSubtotal = qty.mul(price).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  const discType = input.discountType || 'percentage'
  const discVal = new Decimal(input.discountValue || 0)

  let lineDiscount = new Decimal(0)
  if (discType === 'percentage') {
    lineDiscount = lineSubtotal.mul(discVal.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  } else {
    lineDiscount = Decimal.min(lineSubtotal, discVal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  }

  const taxableBase = Decimal.max(0, lineSubtotal.sub(lineDiscount)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const taxRate = new Decimal(input.taxRate ?? 15)
  const lineTax = taxableBase.mul(taxRate.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const lineTotal = taxableBase.add(lineTax).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  return {
    lineSubtotal: lineSubtotal.toNumber(),
    lineDiscount: lineDiscount.toNumber(),
    taxableBase: taxableBase.toNumber(),
    lineTax: lineTax.toNumber(),
    lineTotal: lineTotal.toNumber(),
  }
}

/**
 * Calcula los totales de una cotización completa a partir de sus partidas.
 */
export function calculateQuotation(input: QuotationCalculationInput): QuotationCalculationResult {
  const calculatedItems = (input.items || []).map(calculateItem)

  let subtotalAcc = new Decimal(0)
  let discountAcc = new Decimal(0)
  let taxAcc = new Decimal(0)
  let totalAcc = new Decimal(0)

  for (const item of calculatedItems) {
    subtotalAcc = subtotalAcc.add(item.lineSubtotal)
    discountAcc = discountAcc.add(item.lineDiscount)
    taxAcc = taxAcc.add(item.lineTax)
    totalAcc = totalAcc.add(item.lineTotal)
  }

  const subtotal = subtotalAcc.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const discountTotal = discountAcc.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const taxableBaseTotal = Decimal.max(0, subtotal.sub(discountTotal)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const taxTotal = taxAcc.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const total = totalAcc.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  const depType = input.depositType || 'percentage'
  const depVal = new Decimal(input.depositValue ?? 50)

  let depositAmount = new Decimal(0)
  if (depType === 'percentage') {
    depositAmount = total.mul(depVal.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  } else {
    depositAmount = Decimal.min(total, depVal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  }

  const estimatedBalance = Decimal.max(0, total.sub(depositAmount)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  return {
    subtotal: subtotal.toNumber(),
    discountTotal: discountTotal.toNumber(),
    taxableBaseTotal: taxableBaseTotal.toNumber(),
    taxTotal: taxTotal.toNumber(),
    total: total.toNumber(),
    depositAmount: depositAmount.toNumber(),
    estimatedBalance: estimatedBalance.toNumber(),
    items: calculatedItems,
  }
}

/**
 * Formateador de moneda consistente en USD para Ecuador.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const val = Number(amount ?? 0)
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}
