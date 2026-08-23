import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type ReportData = {
  job_number: string
  report_no: string | null
  customer: string | null
  project: string | null
  ex_station: string | null
  report_date: string | null
  valve_type: string | null
  size: string | null
  class: string | null
  manufacture: string | null
  serial_no: string | null
  end_connection: string | null
  operated: string | null
  inspector_name: string | null
  ro_no: string | null
  category: string | null
  findings: string | null
  recommendations: string | null
  conclusion: string | null
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
  repair_category?: string
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

type DocData = {
  id?: string
  component_name: string
  photo_before: string[]
  photo_after: string[]
}

export type ValveTestData = {
  spec_api6d: boolean; spec_api598: boolean; spec_fci70_2: boolean; spec_3_15_psi: boolean; spec_sop_no: string; spec_others: string; spec_cv: string
  [key: string]: boolean | string
}

const TEST_LABELS: Record<string, string> = {
  actuator: 'ACTUATOR LEAK TEST', shell: 'HYDROSTATIC SHELL TEST', hp_seat: 'HIGH-PRESSURE SEAT TEST',
  hp_closure_a: 'HIGH PRESSURE CLOSURE TEST A', lp_closure_b: 'LOW PRESSURE CLOSURE TEST B',
  seat: 'LOW-PRESSURE SEAT LEAK TEST', func0: 'FUNCTION TEST 0%', func25: 'FUNCTION TEST 25%',
  func50: 'FUNCTION TEST 50%', func75: 'FUNCTION TEST 75%', func100: 'FUNCTION TEST 100%',
}

const TEST_CRITERIA: Record<string, string> = {
  actuator: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  shell: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  hp_seat: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  hp_closure_a: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  lp_closure_b: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  seat: '',
  func0: 'SMOOTH and LINEAR', func25: 'SMOOTH and LINEAR',
  func50: 'SMOOTH and LINEAR', func75: 'SMOOTH and LINEAR', func100: 'SMOOTH and LINEAR',
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
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatTanggal(val: string | null): string {
  if (!val) return ''
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

function drawHeader(doc: jsPDF, title: string, PW: number) {
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, PW, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, PW / 2, 9, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('PT. VALVINDO MEGAH', PW / 2, 16, { align: 'center' })
  try { doc.addImage('/logo.png', 'PNG', 2, 1, 22, 18) } catch { /* ignore */ }
}

function drawValveInfo(doc: jsPDF, report: ReportData, M: number, CW: number, startY: number): number {
  let y = startY
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('VALVE INFORMATION', M, y)
  y += 3
  const qtrW = CW / 4
  const testInfoRow: [string, string | null][] = [
    ['Valve Id', report.job_number],
    ['Valve Type', report.valve_type],
    ['Size (in.)', report.size],
    ['Rating Class', report.class],
  ]
  testInfoRow.forEach(([label, val], ci) => {
    drawField(doc, label, val || '', M + ci * qtrW, y, qtrW, 5.5, qtrW / 2 + 2)
  })
  y += 5.5
  return y + 5
}

function drawSignature(doc: jsPDF, report: ReportData, M: number, CW: number, startY: number, PW: number, PH: number) {
  let y = startY
  if (y + 55 > PH - M) { doc.addPage(); y = M }
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
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(sb.title, sx + sigBoxW / 2, y + 5, { align: 'center' })
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(sb.name, sx + sigBoxW / 2, y + sigBoxH - 9, { align: 'center' })
    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.2)
    doc.line(sx + 2, y + sigBoxH - 7, sx + sigBoxW - 2, y + sigBoxH - 7)
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(sb.role, sx + sigBoxW / 2, y + sigBoxH - 3, { align: 'center' })
  })
  return y + sigBoxH
}

function drawFooter(doc: jsPDF, report: ReportData, tabLabel: string, PW: number, PH: number) {
  const tp = doc.getNumberOfPages()
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`${tabLabel} - ${report.job_number} | Page ${i} of ${tp}`, PW / 2, PH - 5, { align: 'center' })
  }
}

function drawJobInfo(doc: jsPDF, report: ReportData, M: number, CW: number, startY: number): number {
  let y = startY
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('JOB INFORMATION', M, y)
  y += 3
  const thirdW = CW / 3
  const jobRows: [string, string | null][][] = [
    [
      ['CUSTOMER', report.customer],
      ['RO NO.', report.ro_no],
      ['REPORT NO.', report.report_no],
    ],
    [
      ['PROJECT', report.project],
      ['EX STATION & P/F', report.ex_station],
      ['REPORT DATE', formatTanggal(report.report_date)],
    ],
  ]
  jobRows.forEach((row) => {
    row.forEach(([label, val], ci) => {
      const cx = M + ci * thirdW
      drawField(doc, label, val || '', cx, y, thirdW, 5.5, thirdW / 2 + 2)
    })
    y += 5.5
  })
  return y + 5
}

function drawConstruction(doc: jsPDF, report: ReportData, M: number, CW: number, startY: number): number {
  let y = startY
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CONSTRUCTION (AS FOUND)', M, y)
  y += 3
  const leftW = CW * 0.6, rightX = M + leftW, rightW = CW * 0.4
  const leftFields: [string, string | null][] = [
    ['Valve Id', report.job_number],
    ['Valve Type', report.valve_type], ['Manufacture', report.manufacture],
    ['Size (in.)', report.size], ['Class', report.class],
    ['S/N', report.serial_no], ['End Connection', report.end_connection],
    ['Operated', report.operated],
  ]
  leftFields.forEach(([label, val]) => {
    drawField(doc, label, val || '', M, y, leftW, 5.5, 35)
    y += 5.5
  })
  const boxH = 44
  const startY2 = startY + 3
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.3)
  doc.rect(rightX, startY2, rightW, boxH, 'S')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Repair Category', rightX + 2, startY2 + 7)
  const cats: [string, boolean][] = [
    ['Inspection', report.category === 'inspection'],
    ['Minor', report.category === 'minor'],
    ['Major', report.category === 'major'],
  ]
  cats.forEach(([label, checked], ci) => {
    const cy = startY2 + 10 + ci * 5
    doc.setDrawColor(0)
    doc.setLineWidth(0.3)
    doc.rect(rightX + 3, cy, 3, 3, 'S')
    if (checked) {
      doc.setLineWidth(0.5)
      doc.line(rightX + 3.5, cy + 1.5, rightX + 4.2, cy + 2.5)
      doc.line(rightX + 4.2, cy + 2.5, rightX + 5.5, cy + 0.5)
      doc.setLineWidth(0.2)
    }
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(label, rightX + 9, cy + 2.8)
  })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Recommendation', rightX + 2, startY2 + 28)
  const recs: [string, string][] = [['C', 'Cleaning'], ['RP', 'Repair'], ['RE', 'Replace']]
  recs.forEach(([code, label], ci) => {
    const cy = startY2 + 31 + ci * 4
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(code, rightX + 3, cy + 1.5)
    doc.setFont('helvetica', 'normal')
    doc.text(label, rightX + 10, cy + 1.5)
  })
  return Math.max(y, startY2 + boxH + 5)
}

function drawResumeSection(doc: jsPDF, report: ReportData, M: number, CW: number, startY: number): number {
  let y = startY

  const rows: [string, string | null][] = [
    ['FINDINGS', report.findings],
    ['RECOMMENDATIONS', report.recommendations?.replace(/\b(C\s+Cleaning|RP\s+Repair|RE\s+Replace)\b/g, '').replace(/\s{2,}/g, ' ').trim() || null],
    ['CONCLUSION', report.conclusion],
  ]

  const labelW = 35
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [],
    body: rows.map(([label, content]) => [label, content || '-']),
    styles: { fontSize: 8, cellPadding: 4, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak', minCellHeight: 30 },
    columnStyles: {
      0: { cellWidth: labelW, fontStyle: 'bold', fillColor: BLUE, textColor: [255, 255, 255], halign: 'center', valign: 'middle' },
      1: { cellWidth: CW - labelW },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

  return y
}

async function drawItemsTable(doc: jsPDF, items: ItemData[], photos: PhotoData[], M: number, CW: number, PW: number, PH: number, startY: number): Promise<number> {
  let y = startY
  if (items.length === 0) return y

  const photosByItem = new Map<string, PhotoData[]>()
  for (const p of photos) {
    if (!photosByItem.has(p.item_id)) photosByItem.set(p.item_id, [])
    photosByItem.get(p.item_id)!.push(p)
  }

  const photosBase64 = new Map<string, string[]>()
  for (const [itemId, itemPhotos] of photosByItem) {
    const b64s: string[] = []
    for (const p of itemPhotos) {
      if (p.url) {
        const b64 = await fetchImageAsBase64(p.url)
        if (b64) b64s.push(b64)
      }
    }
    photosBase64.set(itemId, b64s)
  }

  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INCOMING INSP. CHECK (CONDITION AS FOUND)', M, y)
  y += 3

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [
      [
        { content: 'No', rowSpan: 2 },
        { content: 'Component / Part Description', rowSpan: 2 },
        { content: 'Qty', rowSpan: 2 },
        { content: 'Condition', rowSpan: 2 },
        { content: 'Recommendation', colSpan: 3 },
        { content: 'Repair Category', rowSpan: 2 },
        { content: 'Comment / Notes / Dimension', rowSpan: 2 },
        { content: 'Photo', rowSpan: 2 },
        { content: 'Material Spec.', rowSpan: 2 },
      ],
      ['C', 'RP', 'RE'],
    ],
    body: items.map((it) => [
      String(it.item_no),
      it.component_name || '-',
      it.qty?.toString() || '-',
      it.condition_note || '-',
      '',
      '',
      '',
      it.repair_category || '-',
      it.comment || '-',
      '',
      it.spec_material || '-',
    ]),
    styles: { fontSize: 6, cellPadding: 1, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 30, halign: 'left' },
      2: { cellWidth: 8, halign: 'center' },
      3: { cellWidth: 30, halign: 'left' },
      4: { cellWidth: 7, halign: 'center' },
      5: { cellWidth: 7, halign: 'center' },
      6: { cellWidth: 7, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 26, halign: 'left' },
      9: { cellWidth: 32, halign: 'center', valign: 'middle' },
      10: { cellWidth: 20, halign: 'left' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const item = items[data.row.index]
      if (!item) return
      const b64s = photosBase64.get(item.id || '') || []
      if (b64s.length > 0) {
        data.cell.styles.minCellHeight = 34
        if (data.column.index === 9) {
          data.cell.styles.cellPadding = { top: 2, bottom: 2, left: 1, right: 1 }
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return
      const item = items[data.row.index]
      if (!item) return
      if (data.column.index === 4 && item.recommendation.includes('C')) {
        const cx = data.cell.x + data.cell.width / 2, cy = data.cell.y + data.cell.height / 2
        doc.setDrawColor(0); doc.setLineWidth(0.4)
        doc.line(cx - 1.5, cy - 0.3, cx - 0.3, cy + 0.8)
        doc.line(cx - 0.3, cy + 0.8, cx + 2, cy - 1.2)
        doc.setLineWidth(0.2)
      }
      if (data.column.index === 5 && item.recommendation.includes('RP')) {
        const cx = data.cell.x + data.cell.width / 2, cy = data.cell.y + data.cell.height / 2
        doc.setDrawColor(0); doc.setLineWidth(0.4)
        doc.line(cx - 1.5, cy - 0.3, cx - 0.3, cy + 0.8)
        doc.line(cx - 0.3, cy + 0.8, cx + 2, cy - 1.2)
        doc.setLineWidth(0.2)
      }
      if (data.column.index === 6 && item.recommendation.includes('RE')) {
        const cx = data.cell.x + data.cell.width / 2, cy = data.cell.y + data.cell.height / 2
        doc.setDrawColor(0); doc.setLineWidth(0.4)
        doc.line(cx - 1.5, cy - 0.3, cx - 0.3, cy + 0.8)
        doc.line(cx - 0.3, cy + 0.8, cx + 2, cy - 1.2)
        doc.setLineWidth(0.2)
      }
      if (data.column.index === 9) {
        const b64s = photosBase64.get(item.id || '') || []
        if (b64s.length > 0) {
          const photoSize = 30
          b64s.slice(0, 1).forEach((b64) => {
            const px = data.cell.x + (data.cell.width - photoSize) / 2
            const py = data.cell.y + (data.cell.height - photoSize) / 2
            try { doc.addImage(b64, 'JPEG', px, py, photoSize, photoSize) } catch { /* skip */ }
          })
        }
      }
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  return y
}

function drawBomTable(doc: jsPDF, bomItems: BomData[], M: number, CW: number, startY: number): number {
  let y = startY
  if (bomItems.length === 0) return y
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL OF MATERIAL', M, y)
  y += 3
  const colW3 = [10, 16, 12, 38, 22, 12, 24, 38, 16]
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['No', 'Item', 'Qty', 'Description', 'Specification', 'Unit', 'Dimension', 'Keterangan', 'Section']],
    body: bomItems.map((b) => [
      String(b.item_no),
      b.description || '-',
      b.qty?.toString() || '-',
      b.description || '-',
      b.specification || '-',
      b.unit || '-',
      b.dimension || '-',
      b.keterangan || '-',
      b.section || '-',
    ]),
    styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: GRID, lineWidth: 0.2 },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: colW3[0], halign: 'center' },
      1: { cellWidth: colW3[1], halign: 'left' },
      2: { cellWidth: colW3[2], halign: 'center' },
      3: { cellWidth: colW3[3], halign: 'left' },
      4: { cellWidth: colW3[4], halign: 'left' },
      5: { cellWidth: colW3[5], halign: 'center' },
      6: { cellWidth: colW3[6], halign: 'left' },
      7: { cellWidth: colW3[7], halign: 'left' },
      8: { cellWidth: colW3[8], halign: 'center' },
    },
  })
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
}

async function drawTestSection(doc: jsPDF, report: ReportData, valveTest: ValveTestData, M: number, CW: number, PW: number, PH: number, startY: number): Promise<number> {
  let y = startY

  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('VALVE TESTED ACCORDANCE WITH', M, y)
  y += 3
  const specs: string[] = []
  if (valveTest.spec_api6d) specs.push('API 6D')
  if (valveTest.spec_api598) specs.push('API 598')
  if (valveTest.spec_fci70_2) specs.push('FCI-70-2')
  if (valveTest.spec_3_15_psi) specs.push('3-15 PSI')
  if (valveTest.spec_cv && parseFloat(String(valveTest.spec_cv)) > 0) specs.push(`CV: ${valveTest.spec_cv}`)
  if (valveTest.spec_sop_no) specs.push(`SOP NO: ${valveTest.spec_sop_no}`)
  if (valveTest.spec_others) specs.push(`OTHERS: ${valveTest.spec_others}`)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(specs.join('  |  ') || '-', M, y)
  y += 6

  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ACCEPTANCE STANDARD', M, y)
  y += 3

  const testColW = [42, 18, 14, 48, 18, 18, 12, 20]
  const testHeaders = ['DESCRIPTION TEST', 'PRESSURE (Psi)', 'TIME (Min)', 'ACCEPTANCE CRITERIA', 'START', 'FINISH', 'RESULT', 'REMARK']
  let testRows: string[] = []
  try { testRows = JSON.parse(String(valveTest.test_rows || '[]')) } catch { /* empty */ }

  const testBody = testRows.map(key => {
    const p = (field: string) => ((valveTest as unknown as Record<string, string>)[`${key}_${field}`]) || '-'
    const cv = parseFloat(String(valveTest.spec_cv)) || 0
    const isSeat = key === 'seat'
    const acceptance = isSeat
      ? (cv ? `ALLOWABLE LEAK ${(cv * 0.186).toFixed(2)} SCFH` : 'ALLOWABLE LEAK 0.00 SCFH')
      : (TEST_CRITERIA[key] || '')
    return [
      TEST_LABELS[key] || key,
      p('pressure_psi'), p('duration_min'), acceptance,
      p('start_test'), p('finish_test'), p('result'), p('remark'),
    ]
  })

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [testHeaders],
    body: testBody,
    styles: { fontSize: 6, cellPadding: 1, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak' },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: testColW[0], halign: 'left' },
      1: { cellWidth: testColW[1], halign: 'center' },
      2: { cellWidth: testColW[2], halign: 'center' },
      3: { cellWidth: testColW[3], halign: 'left' },
      4: { cellWidth: testColW[4], halign: 'center' },
      5: { cellWidth: testColW[5], halign: 'center' },
      6: { cellWidth: testColW[6], halign: 'center' },
      7: { cellWidth: testColW[7], halign: 'left' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7

  let testPhotos: { test_type: string; description: string; photos: string[] }[] = []
  try { testPhotos = JSON.parse(String(valveTest.test_photos || '[]')) } catch { /* empty */ }
  if (testPhotos.length > 0) {
    doc.setTextColor(...BLUE)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('VALVE TEST PHOTO RECORDS', M, y)
    y += 5
    const IMG_SZ = 40
    const GAP = 3
    const maxPerRow = Math.floor(CW / (IMG_SZ + GAP))
    for (const row of testPhotos) {
      if (row.photos.length === 0) continue
      const label = TEST_LABELS[row.test_type] || row.test_type || '-'
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`${label}${row.description ? ' - ' + row.description : ''}`, M, y)
      y += 3
      const b64s: string[] = []
      for (const url of row.photos) {
        const b64 = await fetchImageAsBase64(url)
        if (b64) b64s.push(b64)
      }
      for (let j = 0; j < b64s.length; j += maxPerRow) {
        const chunk = b64s.slice(j, j + maxPerRow)
        if (y + IMG_SZ + 3 > PH - M) { doc.addPage(); y = M }
        chunk.forEach((b64, ci) => {
          try { doc.addImage(b64, 'JPEG', M + ci * (IMG_SZ + GAP), y, IMG_SZ, IMG_SZ) } catch { /* skip */ }
        })
        y += IMG_SZ + 3
      }
      y += 2
    }
  }
  return y
}

async function drawDocumentationSection(doc: jsPDF, docItems: DocData[], M: number, CW: number, startY: number): Promise<number> {
  let y = startY
  if (docItems.length === 0) return y
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DOCUMENTATION', M, y)
  y += 3

  const allBefore: (string | null)[][] = []
  const allAfter: (string | null)[][] = []
  for (const d of docItems) {
    const bArr: (string | null)[] = []
    for (const url of (d.photo_before || [])) { bArr.push(await fetchImageAsBase64(url)) }
    allBefore.push(bArr)
    const aArr: (string | null)[] = []
    for (const url of (d.photo_after || [])) { aArr.push(await fetchImageAsBase64(url)) }
    allAfter.push(aArr)
  }

  const maxPhotos = Math.max(1, ...docItems.map(d => Math.max(d.photo_before?.length || 0, d.photo_after?.length || 0)))
  const IMG_SZ = 22
  const GAP = 2
  const photoColW = Math.min(90, maxPhotos * (IMG_SZ + GAP) + 4)

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['No', 'Component', 'Photo Before', 'Photo After']],
    body: docItems.map((d, i) => [
      String(i + 1),
      d.component_name || '-',
      ' ',
      ' ',
    ]),
    styles: { fontSize: 6, cellPadding: 1, lineColor: GRID, lineWidth: 0.2 },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', valign: 'middle' },
      1: { cellWidth: 30, halign: 'center', valign: 'middle' },
      2: { cellWidth: photoColW, halign: 'center', minCellHeight: IMG_SZ + 4 },
      3: { cellWidth: photoColW, halign: 'center', minCellHeight: IMG_SZ + 4 },
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return
      const col = data.column.index
      const rowIdx = data.row.index
      const arr = col === 2 ? allBefore[rowIdx] : col === 3 ? allAfter[rowIdx] : null
      if (arr && arr.length > 0) {
        const maxPerRow = Math.floor(data.cell.width / (IMG_SZ + GAP))
        arr.forEach((b64, ci) => {
          if (!b64) return
          const row = Math.floor(ci / maxPerRow)
          const c = ci % maxPerRow
          const totalInRow = Math.min(maxPerRow, arr.length - row * maxPerRow)
          const offsetX = (data.cell.width - totalInRow * (IMG_SZ + GAP)) / 2
          const x = data.cell.x + offsetX + c * (IMG_SZ + GAP)
          const y2 = data.cell.y + (data.cell.height - IMG_SZ) / 2 + row * (IMG_SZ + GAP)
          try { doc.addImage(b64, 'JPEG', x, y2, IMG_SZ, IMG_SZ) } catch { /* skip */ }
        })
      } else if (col === 2 || col === 3) {
        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150, 150, 150)
        doc.text('N/A', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center' })
      }
    },
  })
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7
}

export async function exportReportPDF(
  report: ReportData,
  items: ItemData[],
  bomItems: BomData[],
  photos: PhotoData[],
  tab: string = 'all',
  valveTest?: ValveTestData,
  docItems: DocData[] = []
) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const PW = 210, PH = 297, M = 10, CW = PW - M * 2

  if (tab === 'all') {
    // ========== INSPECTION SECTION ==========
    if (items.length > 0) {
      drawHeader(doc, 'INSPECTION REPORT', PW)
      let y = 25
      y = drawJobInfo(doc, report, M, CW, y)
      y = drawConstruction(doc, report, M, CW, y)
      y = await drawItemsTable(doc, items, photos, M, CW, PW, PH, y)
      drawSignature(doc, report, M, CW, y, PW, PH)
    }

    // ========== DOCUMENTATION SECTION ==========
    if (docItems.length > 0) {
      doc.addPage()
      drawHeader(doc, 'DOCUMENTATION REPORT', PW)
      let y = 25
      y = drawValveInfo(doc, report, M, CW, y)
      y = await drawDocumentationSection(doc, docItems, M, CW, y)
      drawSignature(doc, report, M, CW, y, PW, PH)
    }

    // ========== TEST SECTION ==========
    if (valveTest) {
      doc.addPage()
      drawHeader(doc, 'TEST REPORT', PW)
      let y = 25
      y = drawValveInfo(doc, report, M, CW, y)
      y = await drawTestSection(doc, report, valveTest, M, CW, PW, PH, y)
      drawSignature(doc, report, M, CW, y, PW, PH)
    }

    // ========== BOM SECTION ==========
    if (bomItems.length > 0) {
      doc.addPage()
      drawHeader(doc, 'BILL OF MATERIAL', PW)
      let y = 25
      y = drawValveInfo(doc, report, M, CW, y)
      y = drawBomTable(doc, bomItems, M, CW, y)
      drawSignature(doc, report, M, CW, y, PW, PH)
    }

    drawFooter(doc, report, 'Full Report', PW, PH)
  } else {
    // Single tab mode
    if (tab === 'resume') {
      drawHeader(doc, 'RESUME REPORT', PW)
      let y = 25
      y = drawJobInfo(doc, report, M, CW, y)
      y = drawConstruction(doc, report, M, CW, y)
      y = drawResumeSection(doc, report, M, CW, y)
      drawSignature(doc, report, M, CW, y, PW, PH)
      drawFooter(doc, report, 'Resume', PW, PH)
    } else {
    drawHeader(doc, tab === 'test' ? 'TEST REPORT' : tab === 'documentation' ? 'DOCUMENTATION REPORT' : 'INSPECTION REPORT', PW)
    let y = 25

    if (tab === 'test' || tab === 'documentation') {
      y = drawValveInfo(doc, report, M, CW, y)
    } else {
      y = drawJobInfo(doc, report, M, CW, y)
    }

    if (tab === 'inspection') {
      y = drawConstruction(doc, report, M, CW, y)
      y = await drawItemsTable(doc, items, photos, M, CW, PW, PH, y)
    }
    if (tab === 'documentation') {
      y = await drawDocumentationSection(doc, docItems, M, CW, y)
    }
    if (tab === 'test' && valveTest) {
      y = await drawTestSection(doc, report, valveTest, M, CW, PW, PH, y)
    }
    if (tab === 'bom') {
      y = drawBomTable(doc, bomItems, M, CW, y)
    }

    drawSignature(doc, report, M, CW, y, PW, PH)
    drawFooter(doc, report, tab.charAt(0).toUpperCase() + tab.slice(1), PW, PH)
    }
  }

  const fn = `IR-${report.job_number}${report.report_no ? '-' + report.report_no : ''}.pdf`
  doc.save(fn)
}
