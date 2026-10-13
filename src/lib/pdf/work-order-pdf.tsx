import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from './document-styles'

export interface WorkOrderPdfProps {
  company: {
    tradeName: string
    legalName?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
  }
  order: {
    orderNumber: string
    status: string
    scopeSnapshot: string
    createdAt: string
    notes?: string | null
  }
  client: {
    name: string
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
  technicians: Array<{
    id: string
    name: string
    role: string
  }>
  visits: Array<{
    id: string
    startAt: string
    endAt: string
    instructions?: string | null
    status: string
  }>
}

export function WorkOrderPdfDocument({
  company,
  order,
  client,
  location,
  project,
  technicians,
  visits,
}: WorkOrderPdfProps) {
  return (
    <Document title={`ORDEN DE TRABAJO - ${order.orderNumber}`}>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header Corporativo */}
        <View style={pdfStyles.headerContainer}>
          <View>
            <Text style={pdfStyles.companyName}>{company.tradeName || 'Eléctrico Edison Pino'}</Text>
            <Text style={pdfStyles.companySubtitle}>Gestión de Instalaciones en Campo</Text>
            <Text style={pdfStyles.companyDetails}>
              {[company.phone ? `Telf: ${company.phone}` : null, company.email, company.address]
                .filter(Boolean)
                .join(' • ')}
            </Text>
          </View>

          <View style={pdfStyles.docMetaBox}>
            <View style={[pdfStyles.docTitleBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <Text style={[pdfStyles.docTitleText, { color: '#b45309' }]}>ORDEN DE TRABAJO</Text>
            </View>
            <Text style={pdfStyles.docNumber}>{order.orderNumber}</Text>
            <Text style={pdfStyles.docDate}>Fecha: {order.createdAt}</Text>
          </View>
        </View>

        {/* Información del Proyecto y Cliente */}
        <View style={pdfStyles.infoGrid}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.sectionTitle}>Datos del Cliente</Text>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Cliente:</Text>
              <Text style={pdfStyles.infoValue}>{client.name}</Text>
            </View>
            {client.phone && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Teléfono:</Text>
                <Text style={pdfStyles.infoValue}>{client.phone}</Text>
              </View>
            )}
            {location && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Dirección:</Text>
                <Text style={pdfStyles.infoValue}>
                  {location.address}
                  {location.city ? `, ${location.city}` : ''}
                </Text>
              </View>
            )}
            {location?.reference && (
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Referencia:</Text>
                <Text style={pdfStyles.infoValue}>{location.reference}</Text>
              </View>
            )}
          </View>

          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.sectionTitle}>Proyecto Asignado</Text>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Proyecto:</Text>
              <Text style={pdfStyles.infoValue}>
                [{project.code}] {project.title}
              </Text>
            </View>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Estado:</Text>
              <Text style={pdfStyles.infoValue}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Alcance Autorizado */}
        <View style={pdfStyles.scopeBox}>
          <Text style={pdfStyles.scopeTitle}>Alcance Técnico y Especificaciones Aprobadas</Text>
          <Text style={pdfStyles.scopeText}>{order.scopeSnapshot || 'Sin especificaciones registradas.'}</Text>
        </View>

        {/* Personal Técnico Asignado */}
        <View style={{ marginBottom: 14 }}>
          <Text style={pdfStyles.sectionTitle}>Técnicos Colaboradores Asignados</Text>
          <View style={[pdfStyles.table, { marginBottom: 0 }]}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.th, { width: '60%' }]}>Nombre del Técnico</Text>
              <Text style={[pdfStyles.th, { width: '40%' }]}>Rol en el Trabajo</Text>
            </View>
            {technicians.length > 0 ? (
              technicians.map((t, idx) => (
                <View key={t.id || idx} style={pdfStyles.tableRow}>
                  <Text style={[pdfStyles.td, { width: '60%' }]}>{t.name}</Text>
                  <Text style={[pdfStyles.td, { width: '40%' }]}>
                    {t.role === 'lead' ? 'Líder Técnico' : t.role === 'assistant' ? 'Ayudante' : 'Técnico'}
                  </Text>
                </View>
              ))
            ) : (
              <View style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.td, { width: '100%', color: '#94a3b8' }]}>
                  Sin técnicos asignados por el momento.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Visitas de Programación */}
        {visits.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={pdfStyles.sectionTitle}>Visitas Programadas</Text>
            <View style={[pdfStyles.table, { marginBottom: 0 }]}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.th, { width: '35%' }]}>Horario de Visita</Text>
                <Text style={[pdfStyles.th, { width: '20%' }]}>Estado</Text>
                <Text style={[pdfStyles.th, { width: '45%' }]}>Instrucciones de Campo</Text>
              </View>
              {visits.map((v, idx) => (
                <View key={v.id || idx} style={pdfStyles.tableRow}>
                  <Text style={[pdfStyles.td, { width: '35%' }]}>
                    {v.startAt} - {v.endAt}
                  </Text>
                  <Text style={[pdfStyles.td, { width: '20%' }]}>{v.status}</Text>
                  <Text style={[pdfStyles.td, { width: '45%' }]}>{v.instructions || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Firmas de Entrega / Conformidad Interna */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
          <View style={{ width: '45%', borderTopWidth: 1, borderTopColor: '#0f172a', paddingTop: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Responsable Técnico / Eléctrico Edison Pino</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Firma y Fecha de Entrega</Text>
          </View>
          <View style={{ width: '45%', borderTopWidth: 1, borderTopColor: '#0f172a', paddingTop: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Conformidad del Cliente</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Recepción de Trabajos</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text>Eléctrico Edison Pino • Orden de Trabajo Técnica</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
