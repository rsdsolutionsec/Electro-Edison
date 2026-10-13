import { describe, it, expect } from 'vitest'
import { calculateItem, calculateQuotation, formatCurrency } from '../quotation-calculator'

describe('Quotation Calculator - Precisión Decimal', () => {
  it('calcula partida simple con IVA 15%', () => {
    const item = calculateItem({
      quantity: 3,
      unitPrice: 85.0,
      taxRate: 15,
    })

    expect(item.lineSubtotal).toBe(255.0)
    expect(item.lineDiscount).toBe(0)
    expect(item.taxableBase).toBe(255.0)
    expect(item.lineTax).toBe(38.25)
    expect(item.lineTotal).toBe(293.25)
  })

  it('calcula partida con descuento porcentual', () => {
    const item = calculateItem({
      quantity: 10,
      unitPrice: 20.0, // subtotal 200
      discountType: 'percentage',
      discountValue: 10, // desc 20 => base 180
      taxRate: 15, // tax 27
    })

    expect(item.lineSubtotal).toBe(200.0)
    expect(item.lineDiscount).toBe(20.0)
    expect(item.taxableBase).toBe(180.0)
    expect(item.lineTax).toBe(27.0)
    expect(item.lineTotal).toBe(207.0)
  })

  it('calcula partida con descuento fijo', () => {
    const item = calculateItem({
      quantity: 1,
      unitPrice: 450.0,
      discountType: 'fixed',
      discountValue: 40.0, // base 410
      taxRate: 15, // tax 61.50 => total 471.50
    })

    expect(item.lineSubtotal).toBe(450.0)
    expect(item.lineDiscount).toBe(40.0)
    expect(item.taxableBase).toBe(410.0)
    expect(item.lineTax).toBe(61.5)
    expect(item.lineTotal).toBe(471.5)
  })

  it('calcula totales de cotización completa y anticipo del 50%', () => {
    const quote = calculateQuotation({
      items: [
        { quantity: 3, unitPrice: 85.0, taxRate: 15 }, // total: 293.25
        { quantity: 1, unitPrice: 245.0, taxRate: 15 }, // total: 281.75
        { quantity: 20, unitPrice: 8.5, taxRate: 15 }, // total: 195.50
      ],
      depositType: 'percentage',
      depositValue: 50,
    })

    // Subtotal: 255 + 245 + 170 = 670
    expect(quote.subtotal).toBe(670.0)
    expect(quote.discountTotal).toBe(0)
    expect(quote.taxableBaseTotal).toBe(670.0)
    // Tax: 38.25 + 36.75 + 25.50 = 100.50
    expect(quote.taxTotal).toBe(100.5)
    // Total: 770.50
    expect(quote.total).toBe(770.5)
    // Deposit 50%: 385.25
    expect(quote.depositAmount).toBe(385.25)
    // Estimated balance: 385.25
    expect(quote.estimatedBalance).toBe(385.25)
  })

  it('formatea moneda correctamente', () => {
    expect(formatCurrency(1250.5)).toContain('1.250,50')
  })
})
