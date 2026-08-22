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

type DocData = {
  id?: string
  component_name: string
  description: string
  photo_before: string
  photo_after: string
}

type ValveTestData = {
  spec_api6d: boolean; spec_api598: boolean; spec_fci70_2: boolean; spec_3_15_psi: boolean
  spec_sop_no: string; spec_others: string; spec_cv: string
  shell_pressure_psi: string; shell_duration_min: string; shell_acceptance: string; shell_start_test: string; shell_finish_test: string; shell_result: string; shell_remark: string
  hp_seat_pressure_psi: string; hp_seat_duration_min: string; hp_seat_acceptance: string; hp_seat_start_test: string; hp_seat_finish_test: string; hp_seat_result: string; hp_seat_remark: string
  hp_closure_a_pressure_psi: string; hp_closure_a_duration_min: string; hp_closure_a_acceptance: string; hp_closure_a_start_test: string; hp_closure_a_finish_test: string; hp_closure_a_result: string; hp_closure_a_remark: string
  lp_closure_b_pressure_psi: string; lp_closure_b_duration_min: string; lp_closure_b_acceptance: string; lp_closure_b_start_test: string; lp_closure_b_finish_test: string; lp_closure_b_result: string; lp_closure_b_remark: string
  seat_pressure_psi: string; seat_duration_min: string; seat_acceptance: string; seat_start_test: string; seat_finish_test: string; seat_result: string; seat_remark: string
  func0_pressure_psi: string; func0_duration_min: string; func0_acceptance: string; func0_start_test: string; func0_finish_test: string; func0_result: string; func0_remark: string
  func25_pressure_psi: string; func25_duration_min: string; func25_acceptance: string; func25_start_test: string; func25_finish_test: string; func25_result: string; func25_remark: string
  func50_pressure_psi: string; func50_duration_min: string; func50_acceptance: string; func50_start_test: string; func50_finish_test: string; func50_result: string; func50_remark: string
  func75_pressure_psi: string; func75_duration_min: string; func75_acceptance: string; func75_start_test: string; func75_finish_test: string; func75_result: string; func75_remark: string
  func100_pressure_psi: string; func100_duration_min: string; func100_acceptance: string; func100_start_test: string; func100_finish_test: string; func100_result: string; func100_remark: string
  test_rows: string; test_photos: string
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
  photos: PhotoData[],
  tab: string = 'all',
  valveTest?: ValveTestData,
  docItems: DocData[] = []
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
  const titleText = tab === 'test' ? 'TEST REPORT' : 'INSPECTION REPORT'
  doc.text(titleText, PW / 2, 9, { align: 'center' })
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

  if (tab === 'test') {
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
    y += 5
  } else {

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
  } // end else (non-test tabs)

  // ========== CONSTRUCTION (AS FOUND) ==========
  if (tab !== 'test') {
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
  } // end CONSTRUCTION (non-test tabs)

  // ========== INSPECTION ITEMS TABLE ==========
  if (tab === 'all' || tab === 'inspection') {
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
          { content: 'Material Specification', rowSpan: 2 },
        ],
        ['C', 'RP', 'RE'],
      ],
      body: items.map((it) => [
        String(it.item_no),
        it.component_name || '-',
        it.qty != null ? String(it.qty) : '-',
        it.condition_note || '-',
        '', '', '',
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

        // C/RP/RE - centang biru kecil tanpa teks
        if (data.column.index >= 4 && data.column.index <= 6) {
          const codes = ['C', 'RP', 'RE']
          if (item.recommendation.includes(codes[data.column.index - 4])) {
            const cx = c.x + c.width / 2
            const cy = c.y + c.height / 2
            doc.setDrawColor(25, 60, 120)
            doc.setLineWidth(0.35)
            doc.line(cx - 1.5, cy, cx - 0.3, cy + 1.2)
            doc.line(cx - 0.3, cy + 1.2, cx + 1.5, cy - 1.2)
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
  } // end inspection tab

  // ========== VALVE TEST ==========
  if ((tab === 'all' || tab === 'test') && valveTest) {
    let testRows: string[] = []
    try { testRows = JSON.parse(valveTest.test_rows || '[]') } catch { /* empty */ }
    if (testRows.length > 0) {
      np(20)
      doc.setTextColor(...BLUE)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('VALVE TESTED ACCORDANCE WITH', M, y)
      y += 4

      const specs: string[] = []
      if (valveTest.spec_api6d) specs.push('API 6D')
      if (valveTest.spec_api598) specs.push('API 598')
      if (valveTest.spec_fci70_2) specs.push('FCI-70-2')
      if (valveTest.spec_3_15_psi) specs.push('3-15 PSI')
      if (valveTest.spec_cv && parseFloat(valveTest.spec_cv) > 0) specs.push(`CV: ${valveTest.spec_cv}`)
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

      const testBody = testRows.map(key => {
        const p = (field: string) => ((valveTest as unknown as Record<string, string>)[`${key}_${field}`]) || '-'
        const cv = parseFloat(valveTest.spec_cv) || 0
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
    }

    // Valve Test Photo Records - per test type, photos side by side
    let testPhotos: { test_type: string; description: string; photos: string[] }[] = []
    try { testPhotos = JSON.parse(valveTest.test_photos || '[]') } catch { /* empty */ }
    if (testPhotos.length > 0) {
      np(20)
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

        np(15)
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
          np(IMG_SZ + 3)
          chunk.forEach((b64, ci) => {
            try {
              doc.addImage(b64, 'JPEG', M + ci * (IMG_SZ + GAP), y, IMG_SZ, IMG_SZ)
            } catch { /* skip */ }
          })
          y += IMG_SZ + 3
        }
        y += 2
      }
    }
  } // end test tab

  // ========== BOM ==========
  if ((tab === 'all' || tab === 'bom') && bomItems.length > 0) {
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

  // ========== DOCUMENTATION ==========
  if ((tab === 'all' || tab === 'documentation') && docItems.length > 0) {
    np(20)
    doc.setTextColor(...BLUE)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DOCUMENTATION', M, y)
    y += 3

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['No', 'Component', 'Description', 'Photo Before', 'Photo After']],
      body: docItems.map((d, i) => [
        String(i + 1),
        d.component_name || '-',
        d.description || '-',
        d.photo_before ? '✓' : '-',
        d.photo_after ? '✓' : '-',
      ]),
      styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: GRID, lineWidth: 0.2 },
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40, halign: 'left' },
        2: { cellWidth: 60, halign: 'left' },
        3: { cellWidth: 40, halign: 'center' },
        4: { cellWidth: 40, halign: 'center' },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7

    for (const d of docItems) {
      if (d.photo_before || d.photo_after) {
        const photos = [d.photo_before, d.photo_after].filter(Boolean)
        if (photos.length > 0) {
          np(12)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text(`${d.component_name || '-'}${d.description ? ' - ' + d.description : ''}`, M, y)
          y += 3
          for (const url of photos) {
            const b64 = await fetchImageAsBase64(url)
            if (b64) {
              np(55)
              try {
                const imgW = 50, imgH = 50
                doc.addImage(b64, 'JPEG', M, y, imgW, imgH)
                y += imgH + 3
              } catch { /* skip */ }
            }
          }
          y += 2
        }
      }
    }
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
    const tabLabel = tab === 'all' ? 'Full Report' : tab.charAt(0).toUpperCase() + tab.slice(1)
    doc.text(`${tabLabel} - ${report.job_number} | Page ${i} of ${tp}`, PW / 2, PH - 5, { align: 'center' })
  }

  const fn = `IR-${report.job_number}${report.report_no ? '-' + report.report_no : ''}.pdf`
  doc.save(fn)
}
