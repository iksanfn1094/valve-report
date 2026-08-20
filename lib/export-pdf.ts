import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type ReportData = {
  job_number: string
  report_no: string | null
  report_date: string | null
  project: string | null
  customer: string | null
  valve_type: string | null
  manufacture: string | null
  size: string | null
  class: string | null
  serial_no: string | null
  end_connection: string | null
  operated: string | null
  location: string | null
  ex_station: string | null
  ro_no: string | null
  inspector_name: string | null
  category: string | null
  status: string
}

type ItemData = {
  id?: string
  item_no: number
  component_name: string
  qty: number | null
  condition_note: string
  recommendation: string[]
  comment: string
  spec_material: string
}

type BomData = {
  section: string
  item_no: number
  qty: number | null
  unit: string
  description: string
  specification: string
  dimension: string
  keterangan: string
}

type PhotoData = {
  item_id: string
  caption: string | null
  url?: string
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const BLUE: [number, number, number] = [25, 60, 120]
const LIGHT_BG: [number, number, number] = [248, 248, 248]
const LABEL_COLOR: [number, number, number] = [100, 100, 100]

export async function exportReportPDF(
  report: ReportData,
  items: ItemData[],
  bomItems: BomData[],
  photos: PhotoData[]
) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const PW = 210
  const PH = 297
  const M = 15
  const CW = PW - M * 2 // 180mm
  let y = M

  function np(need: number) {
    if (y + need > PH - M) { doc.addPage(); y = M }
  }

  // ========== HEADER ==========
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, PW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('INSPECTION REPORT', M, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Job No: ${report.job_number}`, M, 19)
  doc.text(`Report No: ${report.report_no || '-'}`, M, 24)

  const sc: Record<string, [number, number, number]> = { approved: [34, 197, 94], submitted: [234, 179, 8], draft: [156, 163, 175] }
  const s = sc[report.status] || sc.draft
  doc.setFillColor(...s)
  doc.roundedRect(PW - M - 30, 8, 30, 8, 2, 2, 'F')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(report.status.toUpperCase(), PW - M - 15, 13, { align: 'center' })

  y = 35

  // ========== VALVE DETAILS ==========
  doc.setTextColor(...BLUE)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('VALVE DETAILS', M, y)
  y += 6

  const fields: [string, string | null][] = [
    ['Project', report.project], ['Customer', report.customer],
    ['Report Date', report.report_date], ['Valve Type', report.valve_type],
    ['Manufacture', report.manufacture], ['Size', report.size],
    ['Class', report.class], ['Serial No', report.serial_no],
    ['End Connection', report.end_connection], ['Operated', report.operated],
    ['Location', report.location], ['EX Station', report.ex_station],
    ['RO No', report.ro_no], ['Inspector', report.inspector_name],
    ['Category', report.category],
  ]

  const halfW = CW / 2
  for (let i = 0; i < fields.length; i += 2) {
    np(7)
    const L = fields[i]
    const R = fields[i + 1]
    // left cell
    doc.setFillColor(245, 245, 245)
    doc.rect(M, y - 4, halfW - 2, 6, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...LABEL_COLOR)
    doc.text(`${L[0]}:`, M + 2, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(L[1] || '-', M + 28, y)
    // right cell
    if (R) {
      doc.setFillColor(245, 245, 245)
      doc.rect(M + halfW, y - 4, halfW, 6, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...LABEL_COLOR)
      doc.text(`${R[0]}:`, M + halfW + 2, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(R[1] || '-', M + halfW + 28, y)
    }
    y += 6
  }
  y += 4

  // ========== INSPECTION ITEMS ==========
  const base64Map = new Map<string, string>()
  await Promise.all(photos.map(async (p) => {
    if (!p.url) return
    const b = await fetchImageAsBase64(p.url)
    if (b) base64Map.set(p.item_id, b)
  }))

  np(30)
  doc.setTextColor(...BLUE)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('INSPECTION ITEMS', M, y)
  y += 2

  if (items.length === 0) {
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(9)
    doc.text('No items recorded.', M, y + 5)
    y += 10
  } else {
    const PHOTO_SZ = 20
    // Column widths sum to CW (180): 8+24+10+30+18+30+22+20+18 = 180
    const cols: Record<number, { cellWidth: number; halign: 'center' | 'left' | 'right'; valign?: 'middle' }> = {
      0: { cellWidth: 8, halign: 'center' },      // No
      1: { cellWidth: 24, halign: 'left' },        // Component
      2: { cellWidth: 10, halign: 'center' },      // Qty
      3: { cellWidth: 30, halign: 'left' },        // Condition
      4: { cellWidth: 18, halign: 'center' },      // Rec (C / RP / RE checkboxes)
      5: { cellWidth: 30, halign: 'left' },        // Comment
      6: { cellWidth: 22, halign: 'left' },        // Spec
      7: { cellWidth: PHOTO_SZ, halign: 'center', valign: 'middle' }, // Foto
    }

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['No', 'Component', 'Qty', 'Condition', 'Rec.', 'Comment', 'Spec Material', 'Foto']],
      body: items.map((it) => [
        String(it.item_no),
        it.component_name || '-',
        it.qty != null ? String(it.qty) : '-',
        it.condition_note || '-',
        '',
        it.comment || '-',
        it.spec_material || '-',
        '',
      ]),
      styles: {
        fontSize: 7,
        cellPadding: 2,
        minCellHeight: PHOTO_SZ + 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: BLUE,
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        minCellHeight: 8,
        cellPadding: 2,
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: cols,
      didDrawCell: (data) => {
        if (data.section !== 'body') return
        const c = data.cell
        const item = items[data.row.index]

        // Rec column (index 4) - draw checkboxes
        if (data.column.index === 4 && item) {
          const recs = ['C', 'RP', 'RE']
          const boxSize = 3.2
          const gap = 1.5
          const totalW = recs.length * (boxSize + 6) + gap * (recs.length - 1)
          let xStart = c.x + (c.width - totalW) / 2
          const yBox = c.y + (c.height - boxSize) / 2

          recs.forEach((r) => {
            // Draw checkbox
            doc.setDrawColor(150, 150, 150)
            doc.setFillColor(255, 255, 255)
            doc.rect(xStart, yBox, boxSize, boxSize, 'FD')

            // Draw checkmark if selected
            if (item.recommendation.includes(r)) {
              doc.setDrawColor(25, 60, 120)
              doc.setLineWidth(0.5)
              // Draw checkmark (two lines forming a check)
              doc.line(xStart + 0.6, yBox + boxSize / 2, xStart + 1.4, yBox + boxSize - 0.8)
              doc.line(xStart + 1.4, yBox + boxSize - 0.8, xStart + boxSize - 0.5, yBox + 0.6)
              doc.setLineWidth(0.2)
            }

            // Label
            doc.setFillColor(0, 0, 0)
            doc.setFontSize(5)
            doc.setFont('helvetica', 'normal')
            doc.text(r, xStart + boxSize + 0.8, yBox + boxSize - 0.5)

            xStart += boxSize + 6 + gap
          })
        }

        // Foto column (index 7) - draw image
        if (data.column.index === 7 && item?.id) {
          const b64 = base64Map.get(item.id)
          if (!b64) return
          const pad = 2
          const sz = PHOTO_SZ - pad * 2
          try {
            doc.addImage(b64, 'JPEG', c.x + (c.width - sz) / 2, c.y + (c.height - sz) / 2, sz, sz)
          } catch { /* skip */ }
        }
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ========== SUMMARY ==========
  np(25)
  doc.setTextColor(...BLUE)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('SUMMARY', M, y)
  y += 6

  const cC = items.filter((i) => i.recommendation.includes('C')).length
  const cRP = items.filter((i) => i.recommendation.includes('RP')).length
  const cRE = items.filter((i) => i.recommendation.includes('RE')).length

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Item', 'Count']],
    body: [
      ['Total Components', String(items.length)],
      ['Clean (C)', String(cC)],
      ['Repair (RP)', String(cRP)],
      ['Replace (RE)', String(cRE)],
    ],
    styles: { fontSize: 9, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.2 },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ========== BOM ==========
  if (bomItems.length > 0) {
    np(30)
    doc.setTextColor(...BLUE)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('BILL OF MATERIAL', M, y)
    y += 2

    const sL: Record<string, string> = { valve: 'Valve Parts', machining: 'Machining', coating: 'Coating' }
    // BOM columns sum to 180: 22+8+10+12+34+28+30+36 = 180
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Section', 'No', 'Qty', 'Unit', 'Description', 'Specification', 'Dimension', 'Keterangan']],
      body: bomItems.map((b) => [
        sL[b.section] || b.section,
        String(b.item_no),
        b.qty != null ? String(b.qty) : '-',
        b.unit,
        b.description || '-',
        b.specification || '-',
        b.dimension || '-',
        b.keterangan || '-',
      ]),
      styles: { fontSize: 7, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.2 },
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 22, halign: 'left' },
        1: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 10, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 34, halign: 'left' },
        5: { cellWidth: 28, halign: 'left' },
        6: { cellWidth: 30, halign: 'left' },
        7: { cellWidth: 36, halign: 'left' },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ========== SIGNATURE ==========
  np(40)
  y += 5
  doc.setDrawColor(180, 180, 180)
  doc.line(M, y, PW - M, y)
  y += 10

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)

  // Row 1: Inspector + Date
  doc.setFont('helvetica', 'bold')
  doc.text('Inspector:', M, y)
  doc.setFont('helvetica', 'normal')
  doc.text(report.inspector_name || '-', M + 28, y)

  doc.setFont('helvetica', 'bold')
  doc.text('Date:', PW / 2 + 10, y)
  doc.setFont('helvetica', 'normal')
  doc.text(report.report_date || '-', PW / 2 + 25, y)
  y += 14

  // Row 2: Signature lines side by side
  const sigW = (CW - 20) / 2
  doc.setFont('helvetica', 'bold')
  doc.text('Inspector Signature:', M, y)
  doc.line(M, y + 3, M + sigW - 10, y + 3)

  doc.text('Approved By:', PW / 2 + 10, y)
  doc.line(PW / 2 + 10, y + 3, PW - M, y + 3)

  // ========== FOOTER ==========
  const tp = doc.getNumberOfPages()
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Inspection Report - ${report.job_number} | Page ${i} of ${tp}`, PW / 2, PH - 8, { align: 'center' })
  }

  const fn = `IR-${report.job_number}${report.report_no ? '-' + report.report_no : ''}.pdf`
  doc.save(fn)
}
