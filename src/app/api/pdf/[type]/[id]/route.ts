import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotationPdfDocument } from '@/lib/pdf/quotation-pdf'
import { WorkOrderPdfDocument } from '@/lib/pdf/work-order-pdf'

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await segmentData.params
  const supabase = await createClient()

  // Verificar sesión activa
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  // Obtener configuración de la empresa
  const { data: companySetting } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 1)
    .single()

  const company = {
    tradeName: companySetting?.trade_name || 'Eléctrico Edison Pino',
    legalName: companySetting?.legal_name,
    taxId: companySetting?.tax_id,
    phone: companySetting?.phone,
    email: companySetting?.email,
    address: companySetting?.address,
    city: companySetting?.city,
  }

  if (type === 'quotation' || type === 'proforma') {
    // Consultar cotización con proyecto, cliente, ubicación y partidas
    const { data: quote, error: quoteError } = await supabase
      .from('quotations')
      .select(`
        *,
        projects (
          id,
          project_code,
          title,
          clients (
            id,
            name,
            identification,
            phone,
            email
          ),
          client_locations (
            id,
            address,
            city,
            reference
          )
        )
      `)
      .eq('id', id)
      .single()

    if (quoteError || !quote) {
      return new NextResponse('Cotización no encontrada', { status: 404 })
    }

    const { data: items } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quote.id)
      .order('sort_order', { ascending: true })

    const projectData = quote.projects as any
    const clientData = projectData?.clients as any
    const locationData = projectData?.client_locations as any

    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotationPdfDocument, {
        documentType: type,
        company,
        quotation: {
          number: quote.quotation_number,
          version: quote.version,
          issueDate: quote.issue_date,
          validUntil: quote.valid_until,
          scopeDescription: quote.scope_description,
          subtotal: Number(quote.subtotal),
          discountTotal: Number(quote.discount_total),
          taxTotal: Number(quote.tax_total),
          total: Number(quote.total),
          depositAmount: Number(quote.deposit_amount),
          estimatedBalance: Number(quote.estimated_balance),
          depositValue: Number(quote.deposit_value),
          depositType: quote.deposit_type,
          paymentTerms: quote.payment_terms,
          executionTimeDescription: quote.execution_time_description,
          commercialTerms: quote.commercial_terms,
          notes: quote.notes,
        },
        client: {
          name: clientData?.name || 'Cliente Particular',
          identification: clientData?.identification,
          phone: clientData?.phone,
          email: clientData?.email,
        },
        location: locationData
          ? {
              address: locationData.address,
              city: locationData.city,
              reference: locationData.reference,
            }
          : null,
        project: {
          code: projectData?.project_code || 'PRY',
          title: projectData?.title || 'Proyecto Eléctrico',
        },
        items: (items || []).map((it) => ({
          id: it.id,
          description: it.description,
          item_type: it.item_type,
          unit: it.unit,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          line_total: Number(it.line_total),
        })),
      }) as any
    )

    const filename = `${type === 'proforma' ? 'Proforma' : 'Cotizacion'}_${quote.quotation_number}_v${quote.version}.pdf`

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } else if (type === 'work_order') {
    // Consultar orden de trabajo
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select(`
        *,
        projects (
          id,
          project_code,
          title,
          clients (
            id,
            name,
            phone,
            email
          ),
          client_locations (
            id,
            address,
            city,
            reference
          )
        ),
        work_order_technicians (
          id,
          assignment_role,
          profiles (
            id,
            full_name
          )
        ),
        visits (
          id,
          start_at,
          end_at,
          status,
          instructions
        )
      `)
      .eq('id', id)
      .single()

    if (woError || !wo) {
      return new NextResponse('Orden de trabajo no encontrada', { status: 404 })
    }

    const projectData = wo.projects as any
    const clientData = projectData?.clients as any
    const locationData = projectData?.client_locations as any

    const technicians = (wo.work_order_technicians || []).map((wot: any) => ({
      id: wot.id,
      name: wot.profiles?.full_name || 'Técnico',
      role: wot.assignment_role,
    }))

    const visits = (wo.visits || []).map((v: any) => ({
      id: v.id,
      startAt: new Date(v.start_at).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }),
      endAt: new Date(v.end_at).toLocaleString('es-EC', { timeStyle: 'short' }),
      instructions: v.instructions,
      status: v.status,
    }))

    const pdfBuffer = await renderToBuffer(
      React.createElement(WorkOrderPdfDocument, {
        company,
        order: {
          orderNumber: wo.order_number,
          status: wo.status,
          scopeSnapshot: wo.scope_snapshot,
          createdAt: new Date(wo.created_at).toLocaleDateString('es-EC'),
          notes: wo.notes,
        },
        client: {
          name: clientData?.name || 'Cliente',
          phone: clientData?.phone,
          email: clientData?.email,
        },
        location: locationData
          ? {
              address: locationData.address,
              city: locationData.city,
              reference: locationData.reference,
            }
          : null,
        project: {
          code: projectData?.project_code || 'PRY',
          title: projectData?.title || 'Instalación Eléctrica',
        },
        technicians,
        visits,
      }) as any
    )

    const filename = `Orden_Trabajo_${wo.order_number}.pdf`

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  }

  return new NextResponse('Tipo de documento no soportado', { status: 400 })
}
