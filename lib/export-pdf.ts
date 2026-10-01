import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { SubDatasheet, DatasheetGroupKey, datasheetLabels, DATASHEET_GROUPS, datasheetGroupTitle } from './datasheet'

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
  sub_datasheet: SubDatasheet | null
  visual_dimensional?: VisualDimensionalData | null
  packaging?: PackagingData | null
  packaging_photos?: string | null
}

type ItemData = {
  id?: string
  item_no: number
  component_name: string
  qty: number | null
  condition_note: string
  condition: string[]
  recommendation: string[]
  comment: string
  spec_material: string
  repair_category?: string
}

type VisualDimensionalData = {
  visual_acc?: boolean
  visual_failed?: boolean
  dims?: {
    name?: string
    ref?: string
    spec?: string
    actual?: string
    result?: 'ACC' | 'FAILED' | '' | null
  }[]
}

type PackagingData = {
  qty?: string | null
  weight?: string | null
}

type PackagingPhotoData = {
  id?: string
  photos?: string[]
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
  comment_before: string
  comment_after: string
}

export type ValveTestData = {
  spec_api6d: boolean; spec_api598: boolean; spec_fci70_2: boolean; spec_3_15_psi: boolean; spec_sop_no: string; spec_others: string; spec_cv: string
  [key: string]: boolean | string
}

const TEST_LABELS: Record<string, string> = {
  actuator: 'ACTUATOR LEAK TEST', backseat: 'BACKSEAT TEST', shell: 'HYDROSTATIC SHELL TEST', shell_test_i: 'SHELL TEST I', shell_test_ii: 'SHELL TEST II', hp_seat: 'HIGH-PRESSURE SEAT TEST',
  seat_leak: 'SEAT LEAK TEST', hp_closure: 'HIGH PRESSURE CLOSURE TEST', lp_closure: 'LOW PRESSURE CLOSURE TEST',
  hp_closure_b: 'HIGH PRESSURE CLOSURE TEST B', lp_closure_a: 'LOW PRESSURE CLOSURE TEST A',
  hp_closure_a: 'HIGH PRESSURE CLOSURE TEST A', lp_closure_b: 'LOW PRESSURE CLOSURE TEST B',
  hp_closure_seat_test_i: 'HIGH PRESSURE CLOSURE SEAT TEST I', hp_closure_seat_test_ii: 'HIGH PRESSURE CLOSURE SEAT TEST II',
  dpe_seat: 'DPE SEAT TEST', spe_seat: 'SPE SEAT TEST',
  seat: 'LOW-PRESSURE SEAT LEAK TEST', lp_seat: 'LOW PRESSURE SEAT TEST',
  func0: 'FUNCTION TEST 0%', func25: 'FUNCTION TEST 25%',
  func50: 'FUNCTION TEST 50%', func75: 'FUNCTION TEST 75%', func100: 'FUNCTION TEST 100%',
}

const TEST_CRITERIA: Record<string, string> = {
  actuator: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  backseat: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  shell: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  shell_test_i: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  shell_test_ii: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  hp_seat: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  seat_leak: '',
  hp_closure: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  hp_closure_seat_test_i: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  hp_closure_seat_test_ii: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  lp_closure: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  hp_closure_b: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  lp_closure_a: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  hp_closure_a: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  lp_closure_b: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  lp_seat: 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  seat: '',
  dpe_seat: '', spe_seat: '',
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

// height of a single drawField row, shared so the repeated inspection
// header height below can never drift from the real blocks
const FIELD_H = 5.5
// drawJobInfo: title(3) + 2 field rows + trailing gap(5)
const JOB_INFO_BLOCK_H = 3 + FIELD_H * 2 + 5
// drawConstruction: title(3) + 8 field rows (== boxH 44) + trailing gap(5)
const CONSTRUCTION_BLOCK_H = 3 + FIELD_H * 8 + 5
// JOB INFORMATION + CONSTRUCTION (AS FOUND), redrawn on every page break
const REPEAT_BLOCK_H = JOB_INFO_BLOCK_H + CONSTRUCTION_BLOCK_H
// the blue band at the top of a report page (logo, section title, company)
const HEADER_H = 20
// first usable y below that band
const CONTENT_TOP = HEADER_H + 5
const INSPECTION_TITLE = 'INSPECTION REPORT'
const RESUME_TITLE = 'RESUME REPORT'
const PACKAGING_TITLE = 'PACKAGING REPORT'
const DOCUMENTATION_TITLE = 'DOCUMENTATION REPORT'
// height of one signature box, used to reserve the bottom strip that repeats
// on every inspection page
const SIG_BOX_H = 32

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

function drawSignatureBoxes(doc: jsPDF, report: ReportData, M: number, CW: number, y: number): number {
  const sigBoxW = (CW - 12) / 5
  const sigBoxH = SIG_BOX_H
  const rep = report as unknown as { engineering_name?: string; witness_name?: string; review_name?: string; acknowledge_name?: string; inspector_role?: string; engineering_role?: string; review_role?: string; acknowledge_role?: string; witness_role?: string }
  const sigBoxes = [
    { title: 'INSPECTED BY', role: rep.inspector_role || 'QC', name: report.inspector_name || '-' },
    { title: 'CHECKED BY', role: rep.engineering_role || 'ENGINEERING', name: rep.engineering_name || '-' },
    { title: 'REVIEW BY', role: rep.review_role || 'WORKSHOP CO.', name: rep.review_name || 'WISTANTO' },
    { title: 'ACKNOWLEDGE BY', role: rep.acknowledge_role || 'PROJECT MANAGER', name: rep.acknowledge_name || 'FN IKSAN' },
    { title: 'WITNESS AND APPROVED BY', role: rep.witness_role || 'QC REP. PHE-ONWJ', name: rep.witness_name || 'HERI DIAN' },
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

function drawSignature(doc: jsPDF, report: ReportData, M: number, CW: number, startY: number, PW: number, PH: number) {
  let y = startY
  if (y + 6 + SIG_BOX_H > PH - M) { doc.addPage(); y = M }
  return drawSignatureBoxes(doc, report, M, CW, y + 6)
}

// Stamps the signature strip at an explicit y on the given pages, then returns
// the cursor to the last page so following sections keep appending correctly.
function stampSignaturesAt(doc: jsPDF, report: ReportData, M: number, CW: number, y: number, pages: number[]) {
  for (const p of pages) {
    doc.setPage(p)
    drawSignatureBoxes(doc, report, M, CW, y)
  }
  doc.setPage(doc.getNumberOfPages())
}

// Stamps the strip across a whole section. Every page in [fromPage, end] gets one
// at the bottom, except the page a block was pushed onto, where it sits directly
// under that block instead. Pages the pushed block later spills onto are still
// covered, which a simple from..movedToPage-1 range would have missed.
function stampSectionSignatures(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  PH: number,
  fromPage: number,
  movedToPage: number | null,
  blockEndY: number
) {
  const total = doc.getNumberOfPages()
  const rest: number[] = []
  for (let p = fromPage; p <= total; p++) if (p !== movedToPage) rest.push(p)
  stampSignaturesAt(doc, report, M, CW, PH - M - SIG_BOX_H, rest)
  if (movedToPage !== null) stampSignaturesAt(doc, report, M, CW, blockEndY, [movedToPage])
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
      drawField(doc, label, val || '', cx, y, thirdW, FIELD_H, thirdW / 2 + 2)
    })
    y += FIELD_H
  })
  return y + 5
}

function drawConstruction(doc: jsPDF, report: ReportData, M: number, CW: number, startY: number, showRecommendation = true): number {
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
    drawField(doc, label, val || '', M, y, leftW, FIELD_H, 35)
    y += FIELD_H
  })
  const boxH = FIELD_H * 8
  const startY2 = startY + 3
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.3)
  doc.rect(rightX, startY2, rightW, boxH, 'S')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Repair Category', rightX + 2, startY2 + 5)
  const catLevel: number = { inspection: 0, minor: 1, major: 2, junk: 3 }[report.category || ''] ?? -1
  const cats: [string, boolean][] = [
    ['Inspection', catLevel === 0 || catLevel === 1 || catLevel === 2],
    ['Minor', catLevel === 1 || catLevel === 2],
    ['Major', catLevel === 2],
    ['Junk', catLevel === 3],
  ]
  cats.forEach(([label, checked], ci) => {
    const cy = startY2 + 6.5 + ci * 5
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
    doc.text(label, rightX + 9, cy + 2.5)
  })
  if (showRecommendation) {
    const midX = rightX + rightW / 2
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Condition', rightX + 2, startY2 + 29)
    doc.text('Recommendation', midX + 2, startY2 + 29)
    const conds: [string, string][] = [
      ['G', 'Good'],
      ['R', 'Need Repair'],
      ['U', 'Unrepairable'],
      ['M', 'Missing/NA'],
    ]
    conds.forEach(([code, label], ci) => {
      const cy = startY2 + 32.5 + ci * 3.3
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text(code, rightX + 2, cy)
      doc.setFont('helvetica', 'normal')
      doc.text(': ' + label, rightX + 5.5, cy)
    })
    const recs: [string, string][] = [['C', 'Cleaning'], ['RP', 'Repair'], ['RE', 'Replace']]
    recs.forEach(([code, label], ci) => {
      const cy = startY2 + 32.5 + ci * 3.3
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text(code, midX + 2, cy)
      doc.setFont('helvetica', 'normal')
      doc.text(label, midX + 9, cy)
    })
  }
  return Math.max(y, startY2 + boxH + 5)
}

// Redraws the top of a continuation page: the blue band with the logo, section
// title and company name, followed by the repeated JOB INFORMATION and
// CONSTRUCTION (AS FOUND) blocks.
function drawSectionContinuationHeader(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  PW: number,
  title: string,
  showRecommendation = true
) {
  drawHeader(doc, title, PW)
  const ry = drawJobInfo(doc, report, M, CW, CONTENT_TOP)
  drawConstruction(doc, report, M, CW, ry, showRecommendation)
}

// Measures a block on a throwaway doc, then draws it, first pushing it to a
// fresh page when the remaining room is too small. Returning the page it landed
// on lets the caller place the signature strip under it instead of at the very
// bottom. A block that cannot fit an empty page is still pushed (a clean start
// beats a cramped one) and simply flows from there.
function drawKeepTogetherBlock(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  PW: number,
  PH: number,
  startY: number,
  title: string,
  showRecommendation: boolean,
  draw: (d: jsPDF, y: number) => number
): { y: number; movedToPage: number | null } {
  const probe = new jsPDF('p', 'mm', 'a4')
  const h = draw(probe, 0)
  // a block that already needed more than one probe page can never fit the
  // remaining room, so the exact height no longer matters
  const cannotFitAnywhere = probe.getNumberOfPages() > 1
  const bottomLimit = PH - (M + SIG_BOX_H)

  let y = startY
  let movedToPage: number | null = null
  if (cannotFitAnywhere || y + h > bottomLimit) {
    doc.addPage()
    drawSectionContinuationHeader(doc, report, M, CW, PW, title, showRecommendation)
    y = CONTENT_TOP + REPEAT_BLOCK_H
    movedToPage = doc.getNumberOfPages()
  }
  return { y: draw(doc, y), movedToPage }
}

// Letterhead context shared by every resume block, so a page break can rebuild
// the same header the next block will sit under.
type ResumeBlockCtx = { PW: number }

// One titled text box (FINDINGS / RECOMMENDATIONS / CONCLUSION).
function drawResumeTextBlock(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  title: string,
  content: string | null,
  startY: number,
  ctx: ResumeBlockCtx
): number {
  let y = startY
  const firstPage = doc.getNumberOfPages()
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(title, M, y)
  y += 2

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: CONTENT_TOP + REPEAT_BLOCK_H, bottom: M + SIG_BOX_H },
    // safety net in case one box is long enough to overflow on its own
    willDrawPage: (data) => {
      if (data.pageNumber <= 1 && data.doc.getNumberOfPages() === firstPage) return
      drawSectionContinuationHeader(data.doc, report, M, CW, ctx.PW, RESUME_TITLE, false)
    },
    body: [[content || '-']],
    styles: { fontSize: 8, cellPadding: 4, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak', minCellHeight: 30 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
  return y
}

// The DATASHEET group grid, kept as one block so its title never ends up
// stranded at the foot of a page with the grid itself overleaf.
function drawResumeDatasheetBlock(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  startY: number,
  ctx: ResumeBlockCtx
): number {
  let y = startY
  {
    const ds = report.sub_datasheet!

    const label = (ds.type || '').toUpperCase() === 'CHOKE' ? 'CHOKE VALVE'
      : (ds.type || '').toUpperCase() === 'BALL' ? 'BALL VALVE'
      : (ds.type || '').toUpperCase() === 'CHECK' ? 'CHECK VALVE'
      : (ds.type || '').toUpperCase() === 'CONTROL' ? 'CONTROL VALVE'
      : (ds.type || '').toUpperCase() === 'SDV' ? 'SHUTDOWN VALVE'
      : (ds.type || '').toUpperCase() === 'BDV' ? 'BLOWDOWN VALVE'
      : (report.valve_type ?? '').toUpperCase().includes('CHOKE') ? 'CHOKE VALVE'
      : (report.valve_type ?? '').toUpperCase().includes('BALL') ? 'BALL VALVE'
      : (report.valve_type ?? '').toUpperCase().includes('CHECK') ? 'CHECK VALVE'
      : (report.valve_type ?? '').toUpperCase().includes('CONTROL') ? 'CONTROL VALVE'
      : (report.valve_type ?? '').toUpperCase().includes('SDV') || (report.valve_type ?? '').toUpperCase().includes('SHUT') ? 'SHUTDOWN VALVE' : (report.valve_type ?? '').toUpperCase().includes('BDV') || (report.valve_type ?? '').toUpperCase().includes('BLOW') ? 'BLOWDOWN VALVE' : 'DATASHEET'
    doc.setTextColor(...BLUE)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DATASHEET - ' + label, M, y)
    y += 6

    const nonEmptyGroups = DATASHEET_GROUPS.filter(g => Object.keys((ds[g] as Record<string, string>) || {}).length > 0)

    function drawDsRow(groups: DatasheetGroupKey[], topY: number): number {
      doc.setTextColor(...BLUE)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      const gap = 4
      const colCount = groups.length * 2
      const labelW = groups.length === 3 ? 30 : 50
      const valueW = (CW - groups.length * labelW - (groups.length - 1) * gap) / groups.length
      const groupRows = groups.map(g => {
        const entries = datasheetLabels(ds.type, g)
        const keys = Object.keys((ds[g] as Record<string, string>) || {})
        return keys.map(k => [entries[k] || k, ds[g][k] || '-'])
      })
      const maxRows = Math.max(...groupRows.map(r => r.length))
      const body: string[][] = []
      for (let r = 0; r < maxRows; r++) {
        const row: string[] = []
        groups.forEach((_, i) => {
          const src = groupRows[i]
          row.push(r < src.length ? src[r][0] : '', r < src.length ? src[r][1] : '')
        })
        body.push(row)
      }

      groups.forEach((g, i) => {
        const x = M + i * (labelW + valueW + gap)
        doc.text(datasheetGroupTitle(g), x, topY)
      })
      topY += 1.5

      const columnStyles: Record<string, { cellWidth: number; halign: 'left'; fontStyle?: 'bold'; textColor?: [number, number, number] }> = {}
      for (let i = 0; i < groups.length; i++) {
        columnStyles[i * 2] = { cellWidth: labelW, halign: 'left', fontStyle: 'bold', textColor: [70, 90, 120] }
        columnStyles[i * 2 + 1] = { cellWidth: valueW, halign: 'left' }
      }
      const dsFirstPage = doc.getNumberOfPages()
      autoTable(doc, {
        startY: topY,
        margin: { left: M, right: M, top: CONTENT_TOP + REPEAT_BLOCK_H, bottom: M + SIG_BOX_H },
        willDrawPage: (data) => {
          if (data.pageNumber <= 1 && data.doc.getNumberOfPages() === dsFirstPage) return
          drawSectionContinuationHeader(data.doc, report, M, CW, ctx.PW, RESUME_TITLE, false)
        },
        body,
        styles: { fontSize: 6, cellPadding: 1, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak' },
        columnStyles,
      })
      return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
    }

    if (nonEmptyGroups.length > 0) {
      const row1 = nonEmptyGroups.slice(0, 3)
      const row2 = nonEmptyGroups.slice(3, 5)
      if (row1.length > 0) y = drawDsRow(row1, y)
      if (row2.length > 0) y = drawDsRow(row2, y)
    }
  }

  return y
}

// Renders FINDINGS, RECOMMENDATIONS, CONCLUSION and DATASHEET, each treated as
// an atomic block: it moves to the next page rather than being split across the
// boundary. Reports the last page a block was pushed onto, if any, so the
// signature strip can sit directly under it.
function drawResumeSection(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  PW: number,
  PH: number,
  startY: number
): { y: number; lastMovedPage: number | null } {
  const ctx: ResumeBlockCtx = { PW }
  let y = startY
  let lastMovedPage: number | null = null

  const sections: [string, string | null][] = [
    ['FINDINGS', report.findings],
    ['RECOMMENDATIONS', report.recommendations?.replace(/\b(C\s+Cleaning|RP\s+Repair|RE\s+Replace)\b/g, '').replace(/\s{2,}/g, ' ').trim() || null],
    ['CONCLUSION', report.conclusion],
  ]

  for (const [title, content] of sections) {
    const r = drawKeepTogetherBlock(doc, report, M, CW, PW, PH, y, RESUME_TITLE, false, (d, sy) =>
      drawResumeTextBlock(d, report, M, CW, title, content, sy, ctx)
    )
    y = r.y
    if (r.movedToPage !== null) lastMovedPage = r.movedToPage
  }

  if (report.sub_datasheet) {
    const r = drawKeepTogetherBlock(doc, report, M, CW, PW, PH, y, RESUME_TITLE, false, (d, sy) =>
      drawResumeDatasheetBlock(d, report, M, CW, sy, ctx)
    )
    y = r.y
    if (r.movedToPage !== null) lastMovedPage = r.movedToPage
  }

  return { y, lastMovedPage }
}

async function drawItemsTable(doc: jsPDF, report: ReportData, items: ItemData[], photos: PhotoData[], M: number, CW: number, PW: number, PH: number, startY: number): Promise<number> {
  let y = startY
  if (items.length === 0) return y
  void photos

  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INCOMING INSP. CHECK (CONDITION AS FOUND)', M, y)
  y += 3

  const firstPage = doc.getNumberOfPages()
  autoTable(doc, {
    startY: y,
    // top margin reserves room for the repeated JOB INFORMATION +
    // CONSTRUCTION (AS FOUND) block drawn by willDrawPage below
    margin: { left: M, right: M, top: CONTENT_TOP + REPEAT_BLOCK_H, bottom: M + SIG_BOX_H },
    willDrawPage: (data) => {
      // repeat on any page the table starts on that is not the page the
      // table began on (covers both real page breaks and a forced break
      // pushed by a startY near the page bottom)
      if (data.pageNumber <= 1 && data.doc.getNumberOfPages() === firstPage) return
      drawSectionContinuationHeader(doc, report, M, CW, PW, INSPECTION_TITLE)
    },
    head: [
      [
        { content: 'No', rowSpan: 2 },
        { content: 'Component / Part Description', rowSpan: 2 },
        { content: 'Qty', rowSpan: 2 },
        { content: 'Condition', colSpan: 4 },
        { content: 'Recommendation', colSpan: 3 },
        { content: 'Repair Category', rowSpan: 2 },
        { content: 'Comment / Notes / Dimension', rowSpan: 2 },
        { content: 'Material Spec.', rowSpan: 2 },
      ],
      ['G', 'R', 'U', 'M', 'C', 'RP', 'RE'],
    ],
    body: items.map((it) => [
      String(it.item_no),
      it.component_name || '-',
      it.qty?.toString() || '-',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      it.repair_category || '-',
      [it.comment, it.condition_note].filter(Boolean).join(' | ') || '-',
      it.spec_material || '-',
    ]),
    styles: { fontSize: 6, cellPadding: 1, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 34, halign: 'left' },
      2: { cellWidth: 8, halign: 'center' },
      3: { cellWidth: 7, halign: 'center' },
      4: { cellWidth: 7, halign: 'center' },
      5: { cellWidth: 7, halign: 'center' },
      6: { cellWidth: 7, halign: 'center' },
      7: { cellWidth: 7, halign: 'center' },
      8: { cellWidth: 7, halign: 'center' },
      9: { cellWidth: 7, halign: 'center' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 46, halign: 'left' },
      12: { cellWidth: 30, halign: 'left' },
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return
      const item = items[data.row.index]
      if (!item) return
      const drawCheck = (col: number) => {
        const cx = data.cell.x + data.cell.width / 2, cy = data.cell.y + data.cell.height / 2
        doc.setDrawColor(0); doc.setLineWidth(0.4)
        doc.line(cx - 1.5, cy - 0.3, cx - 0.3, cy + 0.8)
        doc.line(cx - 0.3, cy + 0.8, cx + 2, cy - 1.2)
        doc.setLineWidth(0.2)
      }
      if (data.column.index === 3 && item.condition.includes('G')) drawCheck(3)
      if (data.column.index === 4 && item.condition.includes('R')) drawCheck(4)
      if (data.column.index === 5 && item.condition.includes('U')) drawCheck(5)
      if (data.column.index === 6 && item.condition.includes('M')) drawCheck(6)
      if (data.column.index === 7 && item.recommendation.includes('C')) drawCheck(7)
      if (data.column.index === 8 && item.recommendation.includes('RP')) drawCheck(8)
      if (data.column.index === 9 && item.recommendation.includes('RE')) drawCheck(9)
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  return y
}

// Draws the whole VISUAL INSPECTION & DIMENSIONAL CHECK RESULT block with no
// page handling of its own, so it can also be measured on a throwaway doc.
// `repeatHeader` is set only for the real render. The throwaway probe used to
// measure the block height must not reserve the header space, otherwise the
// measured height would be inflated by it.
function drawVisualDimensionalBody(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  startY: number,
  repeatHeader?: { PW: number }
): number {
  let y = startY
  const bodyFirstPage = doc.getNumberOfPages()
  const vd = report.visual_dimensional
  const dims = vd?.dims && vd.dims.length > 0 ? vd.dims : [
    { name: 'FACE TO FACE', ref: '', spec: '', actual: '', result: '' },
    { name: 'FLANGE OD', ref: '', spec: '', actual: '', result: '' },
    { name: 'FLANGE THK', ref: '', spec: '', actual: '', result: '' },
  ]

  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('VISUAL INSPECTION & DIMENSIONAL CHECK RESULT', M, y)
  y += 6

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('VISUAL INSPECTION RESULT:', M, y)
  y += 4

  const drawVisualItem = (label: string, checked: boolean) => {
    doc.setDrawColor(0)
    doc.setLineWidth(0.3)
    doc.rect(M, y - 3, 3, 3, 'S')
    if (checked) {
      doc.setLineWidth(0.5)
      doc.line(M + 0.5, y - 1.5, M + 1.2, y - 0.5)
      doc.line(M + 1.2, y - 0.5, M + 2.5, y - 2.5)
      doc.setLineWidth(0.2)
    }
    doc.setFont('helvetica', 'normal')
    doc.text(label, M + 5, y)
  }
  drawVisualItem('ACC', !!vd?.visual_acc)
  doc.text('FAILED', M + 40, y)
  if (!!vd?.visual_failed) {
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(M + 40, y - 1.5, M + 40.5, y - 0.5)
    doc.line(M + 40.5, y - 0.5, M + 41.7, y - 2.5)
    doc.setLineWidth(0.2)
  }
  y += 5
  doc.setLineWidth(0.2)

  autoTable(doc, {
    startY: y,
    margin: repeatHeader
      ? { left: M, right: M, top: CONTENT_TOP + REPEAT_BLOCK_H, bottom: M + SIG_BOX_H }
      : { left: M, right: M, top: M, bottom: M + SIG_BOX_H },
    // safety net: the wrapper normally keeps this block on one page, but if a
    // report carries enough dimension rows to overflow, continuation pages still
    // get the letterhead and start below it instead of colliding with the band
    ...(repeatHeader
      ? {
          willDrawPage: (data: { pageNumber: number; doc: jsPDF }) => {
            if (data.pageNumber <= 1 && data.doc.getNumberOfPages() === bodyFirstPage) return
            drawSectionContinuationHeader(doc, report, M, CW, repeatHeader.PW, INSPECTION_TITLE)
          },
        }
      : {}),
    head: [['No', 'ITEM', 'REF. STANDARD/CODE', 'SPEC. (mm)', 'ACTUAL (mm)', 'RESULT']],
    body: dims.map((d, i) => [
      String(i + 1),
      d.name || '',
      d.ref || '',
      d.spec || '',
      d.actual || '',
      d.result || '',
    ]),
    styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: GRID, lineWidth: 0.2, valign: 'middle' },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6.5, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 30, halign: 'left' },
      2: { cellWidth: CW - 8 - 30 - 22 - 22 - 20, halign: 'left' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  return y
}

// Keeps VISUAL INSPECTION & DIMENSIONAL CHECK RESULT on a single page: when the
// remaining room is too small the whole block is pushed to the next page
// (together with the repeated JOB INFORMATION / CONSTRUCTION header) instead of
// being split across the page boundary. Returns the y right after the block and
// the page it was moved to (null when it stayed on the current page).
function drawVisualDimensionalTable(
  doc: jsPDF,
  report: ReportData,
  M: number,
  CW: number,
  PW: number,
  PH: number,
  startY: number
): { y: number; movedToPage: number | null } {
  const bottomLimit = PH - (M + SIG_BOX_H)
  // measure the real rendered height on a throwaway doc so it stays exact even
  // when a dimension cell wraps onto extra lines
  const probe = new jsPDF('p', 'mm', 'a4')
  const blockH = drawVisualDimensionalBody(probe, report, M, CW, 0)

  let y = startY
  let movedToPage: number | null = null
  if (y + blockH > bottomLimit) {
    doc.addPage()
    drawSectionContinuationHeader(doc, report, M, CW, PW, INSPECTION_TITLE)
    y = CONTENT_TOP + REPEAT_BLOCK_H
    movedToPage = doc.getNumberOfPages()
  }
  return { y: drawVisualDimensionalBody(doc, report, M, CW, y, { PW }), movedToPage }
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
  if (valveTest.spec_api6a) specs.push('API 6A')
  if (valveTest.spec_fci70_2) specs.push('FCI-70-2')
  if (valveTest.spec_isa_75_19_01) specs.push('ISA-75.19.01')
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
    let acceptance = TEST_CRITERIA[key] || ''
    if (key === 'seat' || key === 'seat_leak') {
      acceptance = cv ? `ALLOWABLE LEAK ${(cv * 0.186).toFixed(3)} SCFH` : 'ALLOWABLE LEAK 0.000 SCFH'
    }
    if (key === 'dpe_seat' || key === 'spe_seat') {
      acceptance = p('acceptance') || '-'
    }
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
    const GAP = 3
    const maxPerRow = 4
    const LABEL_H = 6
    const INNER_PAD = 2
    const innerW = CW - INNER_PAD * 2
    const IMG_SZ = (innerW - (maxPerRow - 1) * GAP) / maxPerRow
    for (const row of testPhotos) {
      if (row.photos.length === 0) continue
      const label = TEST_LABELS[row.test_type] || row.test_type || '-'
      const b64s: string[] = []
      for (const url of row.photos) {
        const b64 = await fetchImageAsBase64(url)
        if (b64) b64s.push(b64)
      }
      const rowsNeeded = Math.ceil(Math.max(b64s.length, 1) / maxPerRow)
      const photoAreaH = rowsNeeded * IMG_SZ + (rowsNeeded - 1) * GAP
      const blockH = LABEL_H + INNER_PAD * 2 + photoAreaH
      if (y + blockH > PH - M) { doc.addPage(); y = M }
      const labelTop = y
      const photoTop = labelTop + LABEL_H
      doc.setDrawColor(...GRID)
      doc.setLineWidth(0.3)
      doc.rect(M, labelTop, CW, LABEL_H, 'S')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`${label}${row.description ? ' - ' + row.description : ''}`, M + 2, labelTop + LABEL_H / 2 + 0.8)
      for (let j = 0; j < b64s.length; j += maxPerRow) {
        const chunk = b64s.slice(j, j + maxPerRow)
        chunk.forEach((b64, ci) => {
          const px = M + INNER_PAD + ci * (IMG_SZ + GAP)
          const py = photoTop + INNER_PAD + Math.floor(j / maxPerRow) * (IMG_SZ + GAP)
          try { doc.addImage(b64, 'JPEG', px, py, IMG_SZ, IMG_SZ) } catch { /* skip */ }
        })
      }
      doc.rect(M, photoTop, CW, INNER_PAD * 2 + photoAreaH, 'S')
      y = photoTop + INNER_PAD * 2 + photoAreaH + GAP
    }
  }
  return y
}

async function drawDocumentationSection(doc: jsPDF, report: ReportData, docItems: DocData[], M: number, CW: number, PW: number, PH: number, startY: number): Promise<number> {
  let y = startY
  if (docItems.length === 0) return y
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DOCUMENTATION', M, y)
  y += 4

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

  const colNo = 8
  const colComp = 28
  const halfW = (CW - colNo - colComp) / 2
  const GAP = 2
  const colsPerHalf = 2
  const IMG_SZ = (halfW - (colsPerHalf - 1) * GAP) / colsPerHalf
  const RH = IMG_SZ + 2
  const headerH = 6
  // Comment / Notes text sits in its own strip row below the photos of each
  // half; the strip grows with the longest wrapped note instead of clipping it
  const NOTE_LINE_H = 2.1
  const NOTE_PAD = 1.8
  const NOTE_MIN_H = 5
  const rightEdge = M + CW
  // bottom of the usable area; the signature strip is stamped below it and
  // repeated on every page, so the rows must stop above it
  const limit = PH - (M + SIG_BOX_H)
  // top of the content area on a continuation page, below the repeated
  // letterhead + JOB INFORMATION + CONSTRUCTION block
  const freshTop = CONTENT_TOP + REPEAT_BLOCK_H
  const xBefore = M + colNo + colComp
  const xAfter = xBefore + halfW
  const xAfterCenter = xAfter + halfW / 2

  const drawHeader = () => {
    doc.setFillColor(...BLUE)
    doc.setDrawColor(...BLUE)
    doc.setLineWidth(0.2)
    doc.rect(M, y, CW, headerH, 'FD')
    doc.line(M + colNo, y, M + colNo, y + headerH)
    doc.line(M + colNo + colComp, y, M + colNo + colComp, y + headerH)
    doc.line(xBefore + halfW, y, xBefore + halfW, y + headerH)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text('NO', M + colNo / 2, y + headerH / 2, { align: 'center' })
    doc.text('COMPONENT / PART', M + colNo + colComp / 2, y + headerH / 2, { align: 'center' })
    doc.text('PHOTO BEFORE', xBefore + halfW / 2, y + headerH / 2, { align: 'center' })
    doc.text('PHOTO AFTER', xAfterCenter, y + headerH / 2, { align: 'center' })
    y += headerH
  }

  const newPage = () => {
    doc.addPage()
    drawSectionContinuationHeader(doc, report, M, CW, PW, DOCUMENTATION_TITLE, false)
    y = freshTop
    drawHeader()
  }

  drawHeader()
  for (const [i, d] of docItems.entries()) {
    const bImgs = allBefore[i].filter((b): b is string => !!b)
    const aImgs = allAfter[i].filter((b): b is string => !!b)
    const bodyRows = Math.max(Math.ceil(bImgs.length / colsPerHalf), Math.ceil(aImgs.length / colsPerHalf), 1)
    const commentB = (d.comment_before || '').trim()
    const commentA = (d.comment_after || '').trim()
    const hasComment = !!commentB || !!commentA
    // wrap both notes up front so the strip height matches the real text
    const noteLines = (t: string) => (t ? doc.splitTextToSize(t, halfW - 4) as string[] : [])
    const bLines = noteLines(commentB)
    const aLines = noteLines(commentA)
    const noteLinesN = Math.max(bLines.length, aLines.length, 1)
    const COMMENT_H = hasComment ? Math.max(NOTE_MIN_H, noteLinesN * NOTE_LINE_H + NOTE_PAD) : 0
    // the Comment / Notes text sits in its own strip row below the photos of
    // each half, so the block gets one extra row when either note is present
    const totalRows = bodyRows + (hasComment ? 1 : 0)
    const rowH = (gi: number) => (gi < bodyRows ? RH : COMMENT_H)
    const blockH = bodyRows * RH + COMMENT_H
    const heightBefore = (gi: number) => {
      let h = 0
      for (let k = 0; k < gi && k < totalRows; k++) h += rowH(k)
      return h
    }
    const hideRowLines = Math.max(bImgs.length, aImgs.length) >= 3
    const keepTogether = hideRowLines
    const name = d.component_name || '-'

    let globalRow = 0
    while (globalRow < totalRows) {
      // components with 3+ photos move as a whole block to the next page
      // when they cannot fit in remaining space
      if (keepTogether && (blockH - heightBefore(globalRow)) > limit - y) {
        const wholeFitsPage = blockH <= limit - freshTop - headerH
        if (wholeFitsPage) {
          newPage()
        }
      }
      // rows have mixed heights now (photo rows + the comment strip), so fill
      // the page segment row by row instead of dividing the free space
      let rowsHere = 0
      let acc = 0
      while (globalRow + rowsHere < totalRows) {
        const rh = rowH(globalRow + rowsHere)
        if (acc + rh > limit - y) break
        acc += rh
        rowsHere++
      }
      if (rowsHere < 1) {
        newPage()
        continue
      }
      const segTop = y
      // horizontal separator between rows: only the segment's first row gets a
      // separator line when continuing (photos 3+ hide their row lines anyway)
      for (let r = 0; r < rowsHere; r++) {
        const rowTop = y
        if (r > 0 && !hideRowLines) {
          doc.setDrawColor(...GRID)
          doc.setLineWidth(0.2)
          doc.line(M, rowTop, rightEdge, rowTop)
        }
        if (globalRow + r < bodyRows) {
          // Photo Before
          const bStart = (globalRow + r) * colsPerHalf
          const bChunk = bImgs.slice(bStart, bStart + colsPerHalf)
          bChunk.forEach((b64, ci) => {
            const totalInRow = bChunk.length
            const totalW = totalInRow * IMG_SZ + (totalInRow - 1) * GAP
            const offsetX = (halfW - totalW) / 2
            const x = xBefore + offsetX + ci * (IMG_SZ + GAP)
            try { doc.addImage(b64, 'JPEG', x, rowTop + 1, IMG_SZ, IMG_SZ) } catch { /* skip */ }
          })
          // Photo After
          const aStart = (globalRow + r) * colsPerHalf
          const aChunk = aImgs.slice(aStart, aStart + colsPerHalf)
          aChunk.forEach((b64, ci) => {
            const totalInRow = aChunk.length
            const totalW = totalInRow * IMG_SZ + (totalInRow - 1) * GAP
            const offsetX = (halfW - totalW) / 2
            const x = xAfter + offsetX + ci * (IMG_SZ + GAP)
            try { doc.addImage(b64, 'JPEG', x, rowTop + 1, IMG_SZ, IMG_SZ) } catch { /* skip */ }
          })
          y += RH
        } else {
          // Comment / Notes strip under each photo column
          doc.setFillColor(250, 250, 250)
          doc.setDrawColor(...GRID)
          doc.rect(M + colNo + colComp, rowTop, CW - colNo - colComp, COMMENT_H, 'FD')
          doc.setFontSize(5.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...LABEL_C)
          const textH = bLines.length * NOTE_LINE_H
          const startY2 = rowTop + (COMMENT_H - textH) / 2
          const noteOpts = { baseline: 'top' as const, lineHeightFactor: NOTE_LINE_H / 5.5 }
          if (bLines.length) doc.text(bLines, xBefore + 2, startY2, noteOpts)
          if (aLines.length) doc.text(aLines, xAfter + 2, startY2, noteOpts)
          doc.setTextColor(0, 0, 0)
          y += COMMENT_H
        }
      }
      globalRow += rowsHere
      // close this page segment: borders + verticals
      const segBottom = y
      doc.setDrawColor(...GRID)
      doc.setLineWidth(0.2)
      doc.line(M, segBottom, rightEdge, segBottom)
for (const vx of [M, M + colNo, M + colNo + colComp, xBefore, xBefore + halfW, rightEdge]) {
        doc.line(vx, segTop, vx, segBottom)
      }
      // No & Component values centered vertically within this segment's cell
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 70, 90)
      const midY = segTop + (segBottom - segTop) / 2
      doc.text(String(i + 1), M + colNo / 2, midY, { align: 'center', baseline: 'middle' })
      doc.text(name, M + colNo + colComp / 2, midY, { align: 'center', baseline: 'middle' })
      doc.setTextColor(0, 0, 0)
      if (globalRow < totalRows) {
        newPage()
      }
    }
  }
  y += 5

  return y
}

async function drawPackagingSection(doc: jsPDF, report: ReportData, M: number, CW: number, PW: number, PH: number, startY: number): Promise<number> {
  let y = startY
  const pk = report.packaging
  const qty = pk?.qty?.trim() || ''
  const weight = pk?.weight?.trim() || ''

  let photoRows: PackagingPhotoData[] = []
  try {
    const parsed = JSON.parse(String(report.packaging_photos || '[]'))
    if (Array.isArray(parsed)) photoRows = parsed
  } catch { photoRows = [] }
  const hasAny = !!qty || !!weight || photoRows.length > 0
  if (!hasAny) return y

  // ========== DATA PACKAGE ==========
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DATA PACKAGE', M, y)
  y += 3

  const h = 7
  const labelW = 58
  const valW = CW - labelW

  const dataRow = (rowY: number, label: string, value: string) => {
    doc.setFillColor(245, 245, 245)
    doc.setDrawColor(...GRID)
    doc.setLineWidth(0.2)
    doc.rect(M, rowY, labelW, h, 'FD')
    doc.rect(M + labelW, rowY, valW, h, 'S')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LABEL_C)
    doc.text(label, M + 2, rowY + h / 2, { baseline: 'middle' })
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.text(value || '-', M + labelW + valW / 2, rowY + h / 2, { align: 'center', baseline: 'middle' })
  }

  dataRow(y, 'QTY (EA)', qty)
  y += h
  dataRow(y, 'WEIGHT/ITEM (KG)', weight)
  y += h + 6

  // ========== PACKAGING PHOTO RECORDS ==========
  if (photoRows.length === 0) return y

  const rowsB64: (string | null)[][] = []
  for (const r of photoRows) {
    const arr: (string | null)[] = []
    for (const url of (r.photos || [])) { arr.push(await fetchImageAsBase64(url)) }
    rowsB64.push(arr)
  }

  const GAP = 2
  const maxPerRow = 4
  const INNER_PAD = 2
  const innerW = CW - INNER_PAD * 2
  const IMG_SZ = (innerW - (maxPerRow - 1) * GAP) / maxPerRow

  // keep the heading with at least its first photo group, otherwise the heading
  // can end up alone at the bottom of a page with every group overleaf
  const firstImgs = rowsB64[0] ? rowsB64[0].filter((b): b is string => !!b) : []
  const firstRows = Math.max(Math.ceil(firstImgs.length / maxPerRow), 1)
  const firstBlockH = INNER_PAD * 2 + firstRows * IMG_SZ + (firstRows - 1) * GAP
  if (y + 4 + firstBlockH > PH - (M + SIG_BOX_H)) {
    doc.addPage()
    drawSectionContinuationHeader(doc, report, M, CW, PW, PACKAGING_TITLE, false)
    y = CONTENT_TOP + REPEAT_BLOCK_H
  }

  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PACKAGING PHOTO RECORDS', M, y)
  y += 4

  for (const b64s of rowsB64) {
    const imgs = b64s.filter((b): b is string => !!b)
    const totalRows = Math.max(Math.ceil(imgs.length / maxPerRow), 1)
    const photoAreaH = totalRows * IMG_SZ + (totalRows - 1) * GAP
    const blockH = INNER_PAD * 2 + photoAreaH

    if (y + blockH > PH - (M + SIG_BOX_H)) {
      doc.addPage()
      drawSectionContinuationHeader(doc, report, M, CW, PW, PACKAGING_TITLE, false)
      y = CONTENT_TOP + REPEAT_BLOCK_H
    }

    imgs.slice(0, totalRows * maxPerRow).forEach((b64, j) => {
      const ci = j % maxPerRow
      const ri = Math.floor(j / maxPerRow)
      const px = M + INNER_PAD + ci * (IMG_SZ + GAP)
      const py = y + INNER_PAD + ri * (IMG_SZ + GAP)
      try { doc.addImage(b64, 'JPEG', px, py, IMG_SZ, IMG_SZ) } catch { /* skip */ }
    })
    doc.setDrawColor(...GRID)
    doc.setLineWidth(0.2)
    doc.rect(M, y, CW, INNER_PAD * 2 + photoAreaH, 'S')
    y += INNER_PAD * 2 + photoAreaH + GAP
  }

  return y
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
    // ========== 1. RESUME SECTION ==========
    {
      drawHeader(doc, RESUME_TITLE, PW)
      const sigFrom = doc.getNumberOfPages()
      let y = CONTENT_TOP
      y = drawJobInfo(doc, report, M, CW, y)
      y = drawConstruction(doc, report, M, CW, y, false)
      const rs = drawResumeSection(doc, report, M, CW, PW, PH, y)
      stampSectionSignatures(doc, report, M, CW, PH, sigFrom, rs.lastMovedPage, rs.y + 6)
    }

    // ========== 2. INSPECTION SECTION ==========
    if (items.length > 0) {
      doc.addPage()
      drawHeader(doc, INSPECTION_TITLE, PW)
      const sigFrom = doc.getNumberOfPages()
      let y = CONTENT_TOP
      y = drawJobInfo(doc, report, M, CW, y)
      y = drawConstruction(doc, report, M, CW, y)
      y = await drawItemsTable(doc, report, items, photos, M, CW, PW, PH, y)
      const vd = drawVisualDimensionalTable(doc, report, M, CW, PW, PH, y)
      // the visual section may have been pushed to its own page, where the
      // strip belongs directly beneath it rather than at the very bottom
      stampSectionSignatures(doc, report, M, CW, PH, sigFrom, vd.movedToPage, vd.y + 6)
    }

    // ========== 3. BOM SECTION ==========
    if (bomItems.length > 0) {
      doc.addPage()
      drawHeader(doc, 'BILL OF MATERIAL', PW)
      let y = 25
      y = drawValveInfo(doc, report, M, CW, y)
      y = drawBomTable(doc, bomItems, M, CW, y)
      drawSignature(doc, report, M, CW, y, PW, PH)
    }

    // ========== 4. DOCUMENTATION SECTION ==========
    if (docItems.length > 0) {
      doc.addPage()
      drawHeader(doc, DOCUMENTATION_TITLE, PW)
      const sigFrom = doc.getNumberOfPages()
      let y = CONTENT_TOP
      y = drawJobInfo(doc, report, M, CW, y)
      y = drawConstruction(doc, report, M, CW, y, false)
      y = await drawDocumentationSection(doc, report, docItems, M, CW, PW, PH, y)
      stampSectionSignatures(doc, report, M, CW, PH, sigFrom, null, y + 6)
    }

    // ========== 5. LIQUID PENETRANT (placeholder) ==========

    // ========== 6. TORQUE & ANTI-STATIC (placeholder) ==========

    // ========== 7. TEST SECTION ==========
    if (valveTest) {
      doc.addPage()
      drawHeader(doc, 'TEST REPORT', PW)
      let y = 25
      y = drawValveInfo(doc, report, M, CW, y)
      y = await drawTestSection(doc, report, valveTest, M, CW, PW, PH, y)
      drawSignature(doc, report, M, CW, y, PW, PH)
    }

    // ========== 8. PACKAGING SECTION ==========
    if (report.packaging || report.packaging_photos) {
      const hasPkg = !!(report.packaging?.qty?.trim() || report.packaging?.weight?.trim() || (report.packaging_photos && report.packaging_photos !== '[]'))
      if (hasPkg) {
        doc.addPage()
        drawHeader(doc, PACKAGING_TITLE, PW)
        const sigFrom = doc.getNumberOfPages()
        let y = CONTENT_TOP
        y = drawJobInfo(doc, report, M, CW, y)
        y = drawConstruction(doc, report, M, CW, y, false)
        y = await drawPackagingSection(doc, report, M, CW, PW, PH, y)
        stampSectionSignatures(doc, report, M, CW, PH, sigFrom, null, y + 6)
      }
    }

    drawFooter(doc, report, 'Full Report', PW, PH)
  } else {
    // Single tab mode
    if (tab === 'resume') {
      drawHeader(doc, RESUME_TITLE, PW)
      const sigFrom = doc.getNumberOfPages()
      let y = CONTENT_TOP
      y = drawJobInfo(doc, report, M, CW, y)
      y = drawConstruction(doc, report, M, CW, y, false)
      const rs = drawResumeSection(doc, report, M, CW, PW, PH, y)
      stampSectionSignatures(doc, report, M, CW, PH, sigFrom, rs.lastMovedPage, rs.y + 6)
      drawFooter(doc, report, 'Resume', PW, PH)
    } else {
    drawHeader(doc, tab === 'test' ? 'TEST REPORT' : tab === 'documentation' ? 'DOCUMENTATION REPORT' : tab === 'packaging' ? PACKAGING_TITLE : tab === 'documentation' ? DOCUMENTATION_TITLE : INSPECTION_TITLE, PW)
    let y = CONTENT_TOP
    const sigFrom = doc.getNumberOfPages()

    if (tab === 'packaging' || tab === 'documentation') {
      y = drawJobInfo(doc, report, M, CW, y)
      y = drawConstruction(doc, report, M, CW, y, false)
    } else if (tab === 'test') {
      y = drawValveInfo(doc, report, M, CW, y)
    } else {
      y = drawJobInfo(doc, report, M, CW, y)
    }

    if (tab === 'inspection') {
      y = drawConstruction(doc, report, M, CW, y)
      y = await drawItemsTable(doc, report, items, photos, M, CW, PW, PH, y)
      const vd = drawVisualDimensionalTable(doc, report, M, CW, PW, PH, y)
      // the visual section may have been pushed to its own page, where the
      // strip belongs directly beneath it rather than at the very bottom
      stampSectionSignatures(doc, report, M, CW, PH, sigFrom, vd.movedToPage, vd.y + 6)
    }
    if (tab === 'documentation') {
      y = await drawDocumentationSection(doc, report, docItems, M, CW, PW, PH, y)
    }
    if (tab === 'test' && valveTest) {
      y = await drawTestSection(doc, report, valveTest, M, CW, PW, PH, y)
    }
    if (tab === 'packaging') {
      y = await drawPackagingSection(doc, report, M, CW, PW, PH, y)
    }
    if (tab === 'bom') {
      y = drawBomTable(doc, bomItems, M, CW, y)
    }

    // inspection and packaging stamp the strip on every page of the section;
    // the other tabs keep the single strip at the end
    if (tab === 'packaging' || tab === 'documentation') stampSectionSignatures(doc, report, M, CW, PH, sigFrom, null, y + 6)
    else if (tab !== 'inspection') drawSignature(doc, report, M, CW, y, PW, PH)
    drawFooter(doc, report, tab.charAt(0).toUpperCase() + tab.slice(1), PW, PH)
    }
  }

  const fn = `${report.job_number}-FinalReport.pdf`
  doc.save(fn)
}
