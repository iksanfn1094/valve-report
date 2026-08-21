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
const LABEL_C: [number, number, number] = [100, 100, 100]
const GRID: [number, number, number] = [180, 180, 180]

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatTanggal(val: string | null): string {
  if (!val) return ''
  // coba parse "YYYY-MM-DD" atau format lain
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

function drawField(
  doc: jsPDF, label: string, value: string,
  x: number, y: number, w: number, h: number, labelW: number
) {
  doc.setFillColor(245, 245, 245)
  doc.rect(x, y, w, h, 'F')
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.2)
  doc.rect(x, y, w, h, 'S')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...LABEL_C)
  doc.text(label, x + 1.5, y + h - 1.7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(value || '-', x + labelW, y + h - 1.7)
}

export async function exportReportPDF(
  report: ReportData,
  items: ItemData[],
  bomItems: BomData[],
  photos: PhotoData[]
) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const PW = 210, PH = 297, M = 10, CW = PW - M * 2
  let y = M

  function np(need: number) {
    if (y + need > PH - M) { doc.addPage(); y = M }
  }

  // ========== HEADER ==========
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, PW, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INSPECTION REPORT', PW / 2, 9, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('PT. VALVINDO MEGAH', PW / 2, 16, { align: 'center' })

  // Logo di kiri atas
  try {
    doc.addImage('/logo.png', 'PNG', 2, 1, 22, 18)
  } catch { /* ignore if logo not found */ }

  y = 25

  // ========== JOB INFORMATION ==========
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('JOB INFORMATION', M, y)
  y += 3

  const thirdW = CW / 3
  const jobRows = [
    [
      { l: 'CUSTOMER', v: report.customer || '' },
      { l: 'RO NO.', v: report.ro_no || '' },
      { l: 'REPORT NO.', v: report.report_no || '' },
    ],
    [
      { l: 'PROJECT', v: report.project || '' },
      { l: 'EX STATION & P/F', v: report.ex_station || '' },
      { l: 'REPORT DATE', v: formatTanggal(report.report_date) },
    ],
  ]

  jobRows.forEach((row) => {
    row.forEach((f, ci) => {
      const cx = M + ci * thirdW
      drawField(doc, f.l, f.v, cx, y, thirdW, 5.5, thirdW / 2 + 2)
    })
    y += 5.5
  })
  y += 5

  // ========== CONSTRUCTION (AS FOUND) ==========
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CONSTRUCTION (AS FOUND)', M, y)
  y += 3

  const leftW = CW * 0.6, rightW = CW * 0.4, rightX = M + leftW

  // Customer dihapus dari sini
  const leftFields: [string, string | null][] = [
    ['Valve Id', report.job_number],
    ['Valve Type', report.valve_type], ['Manufacture', report.manufacture],
    ['Size (in.)', report.size], ['Class', report.class],
    ['S/N', report.serial_no], ['End Connection', report.end_connection],
    ['Operated', report.operated],
  ]

  const startY = y
  leftFields.forEach(([label, val]) => {
    drawField(doc, label, val || '', M, y, leftW, 5.5, 35)
    y += 5.5
  })

  // Right panel: Repair Category + Recommendation legend (compact)
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.3)
  doc.rect(rightX, startY, rightW, y - startY, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Repair Category', rightX + 3, startY + 5)

  doc.setFontSize(7)
  ;['Inspection', 'Minor', 'Major'].forEach((cat, i) => {
    const cy = startY + 9 + i * 5
    doc.setDrawColor(150, 150, 150)
    doc.setFillColor(255, 255, 255)
    doc.rect(rightX + 3, cy - 3, 3, 3, 'FD')
    const matchCat = report.category || ''
    if (matchCat.toLowerCase().includes(cat.toLowerCase())) {
      doc.setDrawColor(25, 60, 120)
      doc.setLineWidth(0.4)
      doc.line(rightX + 3.5, cy - 1.2, rightX + 4.5, cy)
      doc.line(rightX + 4.5, cy, rightX + 5.5, cy - 2.5)
      doc.setLineWidth(0.2)
    }
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(cat, rightX + 8, cy - 0.5)
  })

  const recY = startY + 25
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Recommendation', rightX + 3, recY)

  ;[
    { code: 'C', label: 'Cleaning' },
    { code: 'RP', label: 'Repair' },
    { code: 'RE', label: 'Replace' },
  ].forEach((r, i) => {
    const ry = recY + 5 + i * 4.5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(r.code, rightX + 6, ry)
    doc.setFont('helvetica', 'normal')
    doc.text(r.label, rightX + 13, ry)
  })

  y += 5

  // ========== INSPECTION ITEMS TABLE ==========
  np(30)
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INCOMING INSP. CHECK (CONDITION AS FOUND)', M, y)
  y += 3

  const base64Map = new Map<string, string>()
  await Promise.all(photos.map(async (p) => {
    if (!p.url) return
    const b = await fetchImageAsBase64(p.url)
    if (b) base64Map.set(p.item_id, b)
  }))

  if (items.length === 0) {
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(8)
    doc.text('No items recorded.', M, y + 5)
    y += 10
  } else {
    const PHOTO_SZ = 40
    const COL_W = [6, 24, 7, 20, 8, 8, 8, 14, 22, 44, 29]

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [
        [
          { content: 'No', rowSpan: 2 },
          { content: 'Component / Part Description', rowSpan: 2 },
          { content: 'Qty', rowSpan: 2 },
          { content: 'Condition', rowSpan: 2 },
          { content: 'Recommendation', colSpan: 3, styles: { halign: 'center' as const } },
          { content: 'Repair\nCategory', rowSpan: 2 },
          { content: 'Comment / Notes / Dimension', rowSpan: 2 },
          { content: 'Foto', rowSpan: 2 },
          { content: 'Spek Material', rowSpan: 2 },
        ],
        ['C', 'RP', 'RE'],
      ],
      body: items.map((it) => [
        String(it.item_no),
        it.component_name || '-',
        it.qty != null ? String(it.qty) : '-',
        it.condition_note || '-',
        it.recommendation.includes('C') ? '\u2713' : '',
        it.recommendation.includes('RP') ? '\u2713' : '',
        it.recommendation.includes('RE') ? '\u2713' : '',
        (it as unknown as { repair_category?: string }).repair_category || '-',
        it.comment || '-',
        '',
        it.spec_material || '-',
      ]),
      styles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        minCellHeight: PHOTO_SZ + 4,
        lineColor: GRID,
        lineWidth: 0.2,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: BLUE,
        textColor: [255, 255, 255],
        fontSize: 6.5,
        fontStyle: 'bold',
        halign: 'center',
        minCellHeight: 6,
        cellPadding: 1,
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: COL_W[0], halign: 'center' },
        1: { cellWidth: COL_W[1], halign: 'left' },
        2: { cellWidth: COL_W[2], halign: 'center' },
        3: { cellWidth: COL_W[3], halign: 'left' },
        4: { cellWidth: COL_W[4], halign: 'center' },
        5: { cellWidth: COL_W[5], halign: 'center' },
        6: { cellWidth: COL_W[6], halign: 'center' },
        7: { cellWidth: COL_W[7], halign: 'center' },
        8: { cellWidth: COL_W[8], halign: 'left' },
        9: { cellWidth: COL_W[9], halign: 'center', valign: 'middle' },
        10: { cellWidth: COL_W[10], halign: 'left' },
      },
      didDrawCell: (data) => {
        if (data.section !== 'body') return
        const c = data.cell
        const item = items[data.row.index]
        if (!item) return

        // C/RP/RE checkmarks - centang biru kecil
        if (data.column.index >= 4 && data.column.index <= 6) {
          const val = c.raw as string
          if (val === '\u2713') {
            const cx = c.x + c.width / 2
            const cy = c.y + c.height / 2
            doc.setDrawColor(25, 60, 120)
            doc.setLineWidth(0.4)
            doc.line(cx - 2, cy, cx - 0.5, cy + 1.5)
            doc.line(cx - 0.5, cy + 1.5, cx + 2, cy - 1.5)
            doc.setLineWidth(0.2)
          }
        }

        // Foto - diperbesar
        if (data.column.index === 9 && item?.id) {
          const b64 = base64Map.get(item.id)
          if (!b64) return
          const pad = 3, sz = PHOTO_SZ - pad * 2
          try {
            doc.addImage(b64, 'JPEG', c.x + (c.width - sz) / 2, c.y + (c.height - sz) / 2, sz, sz)
          } catch { /* skip */ }
        }
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7
  }

  // ========== BOM ==========
  if (bomItems.length > 0) {
    np(30)
    doc.setTextColor(...BLUE)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('BILL OF MATERIAL', M, y)
    y += 2

    const sL: Record<string, string> = { valve: 'Valve Parts', machining: 'Machining', coating: 'Coating' }
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
      styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak' },
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 22, halign: 'left' },
        1: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 10, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 38, halign: 'left' },
        5: { cellWidth: 32, halign: 'left' },
        6: { cellWidth: 34, halign: 'left' },
        7: { cellWidth: 34, halign: 'left' },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
  }

  // ========== SIGNATURE (5 boxes) ==========
  np(55)
  y += 6

  const sigBoxW = (CW - 12) / 5
  const sigBoxH = 32
  const sigBoxes = [
    { title: 'INSPECTED BY', role: 'QC INSPECTED', name: report.inspector_name || '-' },
    { title: 'CHECKED BY', role: 'ENGINEERING', name: (report as unknown as { engineering_name?: string }).engineering_name || '-' },
    { title: 'REVIEW BY', role: 'WORKSHOP COORDINATOR', name: 'WISTANTO' },
    { title: 'ACKNOWLEDGE BY', role: 'PROJECT MANAGER', name: 'FN IKSAN' },
    { title: 'WITNESS AND APPROVED BY', role: 'QC REP. PHE-ONWJ', name: 'HERI DIAN' },
  ]

  sigBoxes.forEach((sb, i) => {
    const sx = M + i * (sigBoxW + 3)
    doc.setDrawColor(...GRID)
    doc.setLineWidth(0.3)
    doc.rect(sx, y, sigBoxW, sigBoxH, 'S')

    // Title
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(sb.title, sx + sigBoxW / 2, y + 5, { align: 'center' })

    // Nama (signature) - tepat di atas garis
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(sb.name, sx + sigBoxW / 2, y + sigBoxH - 9, { align: 'center' })

    // Garis tanda tangan
    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.2)
    doc.line(sx + 2, y + sigBoxH - 7, sx + sigBoxW - 2, y + sigBoxH - 7)

    // Jabatan di bawah garis
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(sb.role, sx + sigBoxW / 2, y + sigBoxH - 3, { align: 'center' })
  })
  y += sigBoxH

  // ========== FOOTER ==========
  const tp = doc.getNumberOfPages()
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Inspection Report - ${report.job_number} | Page ${i} of ${tp}`, PW / 2, PH - 5, { align: 'center' })
  }

  const fn = `IR-${report.job_number}${report.report_no ? '-' + report.report_no : ''}.pdf`
  doc.save(fn)
}
