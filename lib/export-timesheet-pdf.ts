import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type TimesheetData = {
  customer: string
  internal_so_no: string
  customer_po: string
  letter_of_assignment: string
  end_user_project: string
  allowance: string
  assign_date: string
  assign_role: string
  location: string
  service_person: string
  attachment: string
  mobilization_date: string
  worksite_office: boolean
  worksite_plant: boolean
  worksite_onshore: boolean
  worksite_offshore: boolean
  brief_scope: string
  service_workshop: boolean
  service_field: boolean
  service_eng: boolean
  service_other: boolean
  service_other_text: string
  summary_of_service: string
  status_service: string
  nonconformance: boolean | null
  incident_spill: boolean | null
  tools_damage: boolean | null
  packing_list_no: string
  demobilization_date: string
  service_person_name: string
  customer_rep_name: string
}

type EntryData = {
  entry_date: string
  time_start: string
  time_end: string
  overtime: string
  description: string
}

const BLUE: [number, number, number] = [25, 60, 120]
const GRID: [number, number, number] = [180, 180, 180]
const LABEL_C: [number, number, number] = [100, 100, 100]

function drawField(doc: jsPDF, label: string, value: string, x: number, y: number, w: number, h: number, labelW: number) {
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

function checkLabel(val: boolean | null): string {
  if (val === true) return '[x] Yes  [ ] No'
  if (val === false) return '[ ] Yes  [x] No'
  return '[ ] Yes  [ ] No'
}

export function exportTimesheetPDF(ts: TimesheetData, entries: EntryData[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const PW = 210, PH = 297, M = 10, CW = PW - M * 2
  let y = M

  function np(need: number) {
    if (y + need > PH - M) { doc.addPage(); y = M }
  }

  // Header
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, PW, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TIMESHEET', PW / 2, 8, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('PT. VALVINDO MEGAH', PW / 2, 14, { align: 'center' })

  y = 23

  // Project Information
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJECT INFORMATION', M, y)
  y += 3

  const thirdW = CW / 3
  const halfW = CW / 2
  const qtrW = CW / 4

  // Row 1
  drawField(doc, 'Customer', ts.customer, M, y, halfW, 5.5, 35)
  drawField(doc, 'Internal S/O No.', ts.internal_so_no, M + halfW, y, halfW, 5.5, 35)
  y += 5.5

  // Row 2
  drawField(doc, 'Customer PO', ts.customer_po, M, y, halfW, 5.5, 35)
  drawField(doc, 'Letter Of Assignment', ts.letter_of_assignment, M + halfW, y, halfW, 5.5, 35)
  y += 5.5

  // Row 3
  drawField(doc, 'End-User/Project', ts.end_user_project, M, y, halfW, 5.5, 35)
  drawField(doc, 'Allowance', ts.allowance === 'chargeable' ? 'Chargeable' : ts.allowance === 'non_chargeable' ? 'Non Chargeable' : '', M + halfW, y, halfW, 5.5, 35)
  y += 5.5

  // Row 4
  drawField(doc, 'Date', ts.assign_date, M, y, thirdW, 5.5, 20)
  drawField(doc, 'Assign Role', ts.assign_role, M + thirdW, y, thirdW, 5.5, 25)
  drawField(doc, 'Mobilization Date', ts.mobilization_date, M + thirdW * 2, y, thirdW, 5.5, 35)
  y += 5.5

  // Row 5
  drawField(doc, 'Location', ts.location, M, y, halfW, 5.5, 25)
  drawField(doc, 'Service Person', ts.service_person, M + halfW, y, halfW, 5.5, 30)
  y += 5.5

  // Row 6
  drawField(doc, 'Attachment', ts.attachment, M, y, CW, 5.5, 25)
  y += 7

  // Type of Worksite
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TYPE OF WORKSITE', M, y)
  y += 3

  const ws: string[] = []
  if (ts.worksite_office) ws.push('[x] Office')
  else ws.push('[ ] Office')
  if (ts.worksite_plant) ws.push('[x] Plant/Workshop')
  else ws.push('[ ] Plant/Workshop')
  if (ts.worksite_onshore) ws.push('[x] Onshore')
  else ws.push('[ ] Onshore')
  if (ts.worksite_offshore) ws.push('[x] Offshore')
  else ws.push('[ ] Offshore')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(ws.join('     '), M + 2, y)
  y += 6

  // Brief Scope
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('BRIEF SCOPE OF WORK', M, y)
  y += 3
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const scopeLines = doc.splitTextToSize(ts.brief_scope || '-', CW - 4)
  doc.text(scopeLines, M + 2, y)
  y += scopeLines.length * 3.5 + 3

  // Type of Service
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TYPE OF SERVICE', M, y)
  y += 3

  const sv: string[] = []
  if (ts.service_workshop) sv.push('[x] Workshop')
  else sv.push('[ ] Workshop')
  if (ts.service_field) sv.push('[x] Field Service')
  else sv.push('[ ] Field Service')
  if (ts.service_eng) sv.push('[x] ENG./Inspection')
  else sv.push('[ ] ENG./Inspection')
  if (ts.service_other) sv.push('[x] Other')
  else sv.push('[ ] Other')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(sv.join('     '), M + 2, y)
  if (ts.service_other && ts.service_other_text) {
    y += 4
    doc.text('(' + ts.service_other_text + ')', M + 2, y)
  }
  y += 6

  // Timesheet Table
  np(30)
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TIMESHEET', M, y)
  y += 2

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['No', 'Date', 'Time In', 'Time Out', 'Overtime', 'Description of Work']],
    body: entries.map((e, i) => [
      String(i + 1),
      e.entry_date || '-',
      e.time_start || '-',
      e.time_end || '-',
      e.overtime || '-',
      e.description || '-',
    ]),
    styles: { fontSize: 7, cellPadding: 2, lineColor: GRID, lineWidth: 0.2, overflow: 'linebreak' },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: CW - 97, halign: 'left' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // Summary
  np(40)
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('SUMMARY OF SERVICE', M, y)
  y += 3

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const summaryLines = doc.splitTextToSize(ts.summary_of_service || '-', CW - 4)
  doc.text(summaryLines, M + 2, y)
  y += summaryLines.length * 3.5 + 4

  doc.text('Status of Service:          ' + (ts.status_service === 'close' ? '[x] Close' : ts.status_service === 'followup' ? '[x] Follow-up required' : '[ ] Close  [ ] Follow-up required'), M + 2, y)
  y += 4
  doc.text('Nonconformance found?     ' + checkLabel(ts.nonconformance), M + 2, y)
  y += 4
  doc.text('Any incident/spill?       ' + checkLabel(ts.incident_spill), M + 2, y)
  y += 4

  const tdText = ts.tools_damage === true ? '[x] Yes  [ ] No  [ ] N/A' :
    ts.tools_damage === false ? '[ ] Yes  [x] No  [ ] N/A' :
    '[ ] Yes  [ ] No  [x] N/A'
  doc.text('Any tools/equip. damage?  ' + tdText, M + 2, y)
  y += 4
  doc.text('Packing List No.: ' + (ts.packing_list_no || '-'), M + 2, y)
  y += 4
  doc.text('Demobilization Date: ' + (ts.demobilization_date || '-'), M + 2, y)
  y += 8

  // Statement
  np(35)
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('STATEMENT OF COMPLETENESS', M, y)
  y += 3

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const stmt = 'The service has been completed and to the best of my knowledge and belief, is in substantial compliance with the provisions of the Purchase Order. The service is completed without safety incident and has satisfied Customer in terms of quality of service. The worksite is left in clean and deemed safe.'
  const stmtLines = doc.splitTextToSize(stmt, CW - 4)
  doc.text(stmtLines, M + 2, y)
  y += stmtLines.length * 3 + 6

  // Signature boxes
  const sigW = CW / 2 - 2
  const sigH = 22

  // Service Person
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.3)
  doc.rect(M, y, sigW, sigH, 'S')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.text('Service Person', M + sigW / 2, y + 4, { align: 'center' })
  doc.setFontSize(7)
  doc.text(ts.service_person_name || '-', M + sigW / 2, y + 12, { align: 'center' })
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.2)
  doc.line(M + 3, y + sigH - 5, M + sigW - 3, y + sigH - 5)
  doc.setFontSize(5)
  doc.setTextColor(140, 140, 140)
  doc.text('Name / Sign / Date', M + sigW / 2, y + sigH - 2, { align: 'center' })

  // Customer Rep
  const crx = M + sigW + 4
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.3)
  doc.rect(crx, y, sigW, sigH, 'S')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Customer Representative', crx + sigW / 2, y + 4, { align: 'center' })
  doc.setFontSize(7)
  doc.text(ts.customer_rep_name || '-', crx + sigW / 2, y + 12, { align: 'center' })
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.2)
  doc.line(crx + 3, y + sigH - 5, crx + sigW - 3, y + sigH - 5)
  doc.setFontSize(5)
  doc.setTextColor(140, 140, 140)
  doc.text('Name / Sign / Date', crx + sigW / 2, y + sigH - 2, { align: 'center' })

  y += sigH

  // Footer
  const tp = doc.getNumberOfPages()
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Timesheet - ${ts.customer || 'Draft'} | Page ${i} of ${tp}`, PW / 2, PH - 5, { align: 'center' })
  }

  doc.save(`Timesheet-${ts.customer || 'Draft'}.pdf`)
}
