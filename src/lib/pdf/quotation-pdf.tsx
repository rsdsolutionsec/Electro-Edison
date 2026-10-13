import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from './document-styles'
import { formatCurrency } from '../quotation-calculator'

export interface QuotationPdfProps {
  documentType: 'quotation' | 'proforma'
  company: {
    tradeName: string
    legalName?: string | null
    taxId?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    city?: string | null
  }
  quotation: {
    number: string
    version: number
    issueDate: string
    validUntil: string | null
    scopeDescription: string | null
    subtotal: number
    discountTotal: number
    taxTotal: number
    total: number
    depositAmount: number
    estimatedBalance: number
    depositValue: number
    depositType: string
    paymentTerms: string | null
    executionTimeDescription: string | null
    commercialTerms: string | null
    notes: string | null
  }
  client: {
    name: string
    identification?: string | null
    phone?: string | null
    email?: string | null
  }
  location?: {
    address: string
    city?: string | null
    reference?: string | null
  } | null
  project: {
    code: string
    title: string
  }
  items: Array<{
    id: string
    description: string
    item_type: string
    unit: string
    quantity: number
    unit_price: number
    line_total: number
  }>
}

export function QuotationPdfDocument({
  documentType,
  company,
  quotation,
  client,
  location,
  project,
  items,
}: QuotationPdfProps) {
  const isProforma = documentType === 'proforma'
  const title = isProforma ? 'PROFORMA COMERCIAL' : 'COTIZACIÓN COMERCIAL'

  return (
    <Document title={`${title} - ${quotation.number} v${quotation.version}`}>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header Corporativo */}
        <View style={pdfStyles.headerContainer}>
          <View>
            <Text style={pdfStyles.companyName}>{company.tradeName || 'Eléctrico Edison Pino'}</Text>
            <Text style={pdfStyles.companySubtitle}>Instalaciones Eléctricas Profesionales</Text>
            <Text style={pdfStyles.companyDetails}>
              {[
                company.legalName,
                company.taxId ? `RUC: ${company.taxId}` : null,
                company.phone ? `Telf: ${company.phone}` : null,
                company.email,
                company.address ? `${company.address}${company.city ? `, ${company.city}` : ''}` : null,
              ]
                .filter(Boolean)
                .join(' • ')}
            </Text>
          </View>

          <View style={pdfStyles.docMetaBox}>
            <View style={pdfStyles.docTitleBadge}>
              <Text style={pdfStyles.docTitleText}>{title}</Text>
            </View>
            <Text style={pdfStyles.docNumber}>
              {quotation.number} <Text style={{ fontSize: 9, color: '#64748b' }}>v{quotation.version}</Text>
            </Text>
            <Text style={pdfStyles.docDate}>Emisión: {quotation.issueDate}</Text>
            {quotation.validUntil && (
              <Text style={pdfStyles.docDate}>Válido hasta: {quotation.validUntil}</Text>
            )}
          </View>
        </View>

        {/* Bloque de Información del Cliente y Ubicación */}
        <View style={pdfStyles.infoGrid}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.sectionTitle}>Datos del Cliente</Text>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Cliente:</Text>
              <Text style={pdfStyles.infoValue}>{client.name}</Text>
            </View>
            {client.identification && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>RUC / C.I.:</Text>
                <Text style={pdfStyles.infoValue}>{client.identification}</Text>
              </View>
            )}
            {client.phone && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Teléfono:</Text>
                <Text style={pdfStyles.infoValue}>{client.phone}</Text>
              </View>
            )}
            {client.email && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Correo:</Text>
                <Text style={pdfStyles.infoValue}>{client.email}</Text>
              </View>
            )}
          </View>

          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.sectionTitle}>Proyecto e Instalación</Text>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Proyecto:</Text>
              <Text style={pdfStyles.infoValue}>
                [{project.code}] {project.title}
              </Text>
            </View>
            {location && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Ubicación:</Text>
                <Text style={pdfStyles.infoValue}>
                  {location.address}
                  {location.city ? `, ${location.city}` : ''}
                  {location.reference ? ` (${location.reference})` : ''}
                </Text>
              </View>
            )}
            {quotation.executionTimeDescription && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Tiempo Est.:</Text>
                <Text style={pdfStyles.infoValue}>{quotation.executionTimeDescription}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Alcance General */}
        {quotation.scopeDescription && (
          <View style={pdfStyles.scopeBox}>
            <Text style={pdfStyles.scopeTitle}>Alcance de los Trabajos</Text>
            <Text style={pdfStyles.scopeText}>{quotation.scopeDescription}</Text>
          </View>
        )}

        {/* Tabla de Partidas */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.th, pdfStyles.colDesc]}>Descripción del Concepto</Text>
            <Text style={[pdfStyles.th, pdfStyles.colType]}>Tipo</Text>
            <Text style={[pdfStyles.th, pdfStyles.colQty]}>Cant.</Text>
            <Text style={[pdfStyles.th, pdfStyles.colPrice]}>P. Unit.</Text>
            <Text style={[pdfStyles.th, pdfStyles.colTotal]}>Total</Text>
          </View>

          {items.map((item, idx) => {
            const typeLabel =
              item.item_type === 'material'
                ? 'Material'
                : item.item_type === 'labor'
                ? 'Mano Obra'
                : item.item_type === 'service'
                ? 'Servicio'
                : 'Otro'

            return (
              <View
                key={item.id || idx}
                style={[
                  pdfStyles.tableRow,
                  idx % 2 === 1 ? { backgroundColor: '#f8fafc' } : {},
                ]}
              >
                <Text style={[pdfStyles.td, pdfStyles.colDesc]}>{item.description}</Text>
                <Text style={[pdfStyles.td, pdfStyles.colType]}>{typeLabel}</Text>
                <Text style={[pdfStyles.td, pdfStyles.colQty]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={[pdfStyles.td, pdfStyles.colPrice]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[pdfStyles.td, pdfStyles.colTotal]}>
                  {formatCurrency(item.line_total)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Resumen Económico */}
        <View style={pdfStyles.totalsContainer}>
          <View style={pdfStyles.totalsBox}>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Subtotal Partidas:</Text>
              <Text style={pdfStyles.totalValue}>{formatCurrency(quotation.subtotal)}</Text>
            </View>
            {quotation.discountTotal > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Descuento Aplicado:</Text>
                <Text style={[pdfStyles.totalValue, { color: '#e11d48' }]}>
                  - {formatCurrency(quotation.discountTotal)}
                </Text>
              </View>
            )}
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>IVA (15% Configurado):</Text>
              <Text style={pdfStyles.totalValue}>{formatCurrency(quotation.taxTotal)}</Text>
            </View>
            <View style={pdfStyles.grandTotalRow}>
              <Text style={pdfStyles.grandTotalLabel}>TOTAL ACORDADO:</Text>
              <Text style={pdfStyles.grandTotalValue}>{formatCurrency(quotation.total)}</Text>
            </View>

            {/* Desglose de Anticipo y Saldo */}
            <View style={{ marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#cbd5e1' }}>
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>
                  Anticipo Requerido ({quotation.depositType === 'percentage' ? `${quotation.depositValue}%` : 'Fijo'}):
                </Text>
                <Text style={[pdfStyles.totalValue, { color: '#0369a1' }]}>
                  {formatCurrency(quotation.depositAmount)}
                </Text>
              </View>
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Saldo Estimado a la Entrega:</Text>
                <Text style={pdfStyles.totalValue}>{formatCurrency(quotation.estimatedBalance)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Condiciones Comerciales y Notas */}
        <View style={pdfStyles.termsBox}>
          <Text style={pdfStyles.sectionTitle}>Condiciones Comerciales y de Pago</Text>
          <Text style={[pdfStyles.scopeText, { marginBottom: 3 }]}>
            • <Text style={{ fontFamily: 'Helvetica-Bold' }}>Forma de Pago:</Text>{' '}
            {quotation.paymentTerms || '50% de anticipo para inicio de compras y 50% contra entrega final.'}
          </Text>
          {quotation.commercialTerms && (
            <Text style={[pdfStyles.scopeText, { marginBottom: 3 }]}>
              • <Text style={{ fontFamily: 'Helvetica-Bold' }}>Términos:</Text> {quotation.commercialTerms}
            </Text>
          )}
          {quotation.notes && (
            <Text style={pdfStyles.scopeText}>
              • <Text style={{ fontFamily: 'Helvetica-Bold' }}>Observaciones:</Text> {quotation.notes}
            </Text>
          )}
          <Text style={[pdfStyles.scopeText, { marginTop: 4, fontSize: 7, color: '#64748b' }]}>
            Nota: Este documento constituye una propuesta técnica y económica comercial independiente y no reemplaza a un comprobante tributario electrónico autorizado.
          </Text>
        </View>

        {/* Footer con Paginación */}
        <View style={pdfStyles.footer} fixed>
          <Text>Eléctrico Edison Pino • Documento generado por el sistema de gestión técnica</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
