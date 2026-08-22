import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type TimesheetData = {
  customer: string; internal_so_no: string; customer_po: string
  letter_of_assignment: string; end_user_project: string; allowance: string
  assign_date: string; assign_role: string; location: string; service_person: string
  attachment: string; mobilization_date: string
  worksite_office: boolean; worksite_plant: boolean
  worksite_onshore: boolean; worksite_offshore: boolean; brief_scope: string
  service_workshop: boolean; service_field: boolean; service_eng: boolean
  service_other: boolean; service_other_text: string; summary_of_service: string
  status_service: string; nonconformance: boolean | null; incident_spill: boolean | null
  tools_damage: boolean | null; packing_list_no: string; demobilization_date: string
  service_person_name: string; customer_rep_name: string
}

type EntryData = {
  entry_date: string; time_start: string; time_end: string
  overtime: string; description: string
}

const BLUE: [number, number, number] = [25, 60, 120]
const GRID: [number, number, number] = [180, 180, 180]
const LABEL_C: [number, number, number] = [100, 100, 100]

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
  doc.text(value || '', x + labelW, y + h - 1.7)
}

function cb(doc: jsPDF, x: number, y: number, checked: boolean) {
  doc.setDrawColor(150, 150, 150)
  doc.setFillColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.rect(x, y - 3, 3, 3, 'FD')
  if (checked) {
    doc.setDrawColor(25, 60, 120)
    doc.setLineWidth(0.4)
    doc.line(x + 0.5, y - 1.5, x + 1.2, y - 0.3)
    doc.line(x + 1.2, y - 0.3, x + 2.5, y - 2.8)
    doc.setLineWidth(0.2)
  }
}

export function exportTimesheetPDF(ts: TimesheetData, entries: EntryData[]) {
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
  doc.text('SERVICE TIMESHEET', PW / 2, 9, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('PT. VALVINDO MEGAH', PW / 2, 16, { align: 'center' })

  try { doc.addImage('/logo.png', 'PNG', 2, 1, 22, 18) } catch {}

  y = 25

  // ========== PROJECT INFORMATION ==========
  const halfW = CW / 2
  const FH = 5.5

  // Row 1: Customer | Internal S/O No.
  drawField(doc, 'Customer', ts.customer, M, y, halfW, FH, 30)
  drawField(doc, 'Internal S/O No.', ts.internal_so_no, M + halfW, y, halfW, FH, 35)
  y += FH

  // Row 2: Customer PO | Letter Of Assignment
  drawField(doc, 'Customer PO', ts.customer_po, M, y, halfW, FH, 30)
  drawField(doc, 'Letter Of Assignment', ts.letter_of_assignment, M + halfW, y, halfW, FH, 35)
  y += FH

  // Row 3: End-User/Project | Allowance (checkboxes)
  drawField(doc, 'End-User/Project', ts.end_user_project, M, y, halfW, FH, 30)
  doc.setFillColor(245, 245, 245)
  doc.rect(M + halfW, y, halfW, FH, 'F')
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.2)
  doc.rect(M + halfW, y, halfW, FH, 'S')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...LABEL_C)
  doc.text('Allowance', M + halfW + 1.5, y + FH - 1.7)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  cb(doc, M + halfW + 25, y + FH - 0.2, ts.allowance === 'chargeable')
  doc.text('Chargeable', M + halfW + 29, y + FH - 0.5)
  cb(doc, M + halfW + 55, y + FH - 0.2, ts.allowance === 'non_chargeable')
  doc.text('Non Chargeable', M + halfW + 59, y + FH - 0.5)
  y += FH

  // Row 4: Date | Assign Role | Mobilization Date
  const thirdW = CW / 3
  drawField(doc, 'Date', ts.assign_date, M, y, thirdW, FH, 15)
  drawField(doc, 'Assign Role', ts.assign_role, M + thirdW, y, thirdW, FH, 25)
  drawField(doc, 'Mobilization Date', ts.mobilization_date, M + thirdW * 2, y, thirdW, FH, 35)
  y += FH

  // Row 5: Location | Service Person
  drawField(doc, 'Location', ts.location, M, y, halfW, FH, 25)
  drawField(doc, 'Service Person', ts.service_person, M + halfW, y, halfW, FH, 30)
  y += FH

  // Row 6: Attachment (full width)
  drawField(doc, 'Attachment', ts.attachment, M, y, CW, FH, 25)
  y += FH + 3

  // ========== TYPE OF WORKSITE & BRIEF SCOPE (side by side) ==========
  const leftCol = CW * 0.5
  const rightCol = CW * 0.5
  const rightX = M + leftCol

  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.2)
  doc.rect(M, y, leftCol, 20, 'S')
  doc.rect(rightX, y, rightCol, 20, 'S')

  // Left: Type of Worksite
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE)
  doc.text('Type of Worksite', M + 2, y + 4)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('(check all that apply)', M + 2, y + 7.5)

  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  const wsY = y + 12
  cb(doc, M + 2, wsY, ts.worksite_office)
  doc.text('Office', M + 6, wsY - 0.5)
  cb(doc, M + 30, wsY, ts.worksite_plant)
  doc.text('Plant/Workshop', M + 34, wsY - 0.5)
  cb(doc, M + 2, wsY + 5, ts.worksite_onshore)
  doc.text('Onshore', M + 6, wsY + 4.5)
  cb(doc, M + 30, wsY + 5, ts.worksite_offshore)
  doc.text('Offshore', M + 34, wsY + 4.5)

  // Right: Brief Scope of Work
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE)
  doc.text('Brief Scope of Work', rightX + 2, y + 4)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const scopeLines = doc.splitTextToSize(ts.brief_scope || '', rightCol - 6)
  doc.text(scopeLines, rightX + 3, y + 10)

  y += 23

  // ========== TYPE OF SERVICE ==========
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.2)
  doc.rect(M, y, CW, 12, 'S')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE)
  doc.text('Type of Service', M + 2, y + 4)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const svY = y + 10
  cb(doc, M + 2, svY, ts.service_workshop)
  doc.text('Workshop', M + 6, svY - 0.5)
  cb(doc, M + 35, svY, ts.service_field)
  doc.text('Field Service', M + 39, svY - 0.5)
  cb(doc, M + 70, svY, ts.service_eng)
  doc.text('ENG./Inspection', M + 74, svY - 0.5)
  cb(doc, M + 115, svY, ts.service_other)
  doc.text('Other', M + 119, svY - 0.5)
  if (ts.service_other && ts.service_other_text) {
    doc.setFontSize(6)
    doc.text('(' + ts.service_other_text + ')', M + 135, svY - 0.5)
  }

  y += 15

  // ========== TIMESHEET TABLE ==========
  np(30)
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TIMESHEET', M, y)
  y += 2

  const bodyRows: string[][] = []
  for (let i = 0; i < 20; i++) {
    const e = entries[i]
    bodyRows.push([
      String(i + 1),
      e?.entry_date || '',
      e ? (e.time_start || '') + (e.time_end ? ' - ' + e.time_end : '') : '',
      e?.overtime || '',
      e?.description || '',
    ])
  }

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['No', 'Date', 'Time', 'Over time', 'Description of Work']],
    body: bodyRows,
    styles: {
      fontSize: 7, cellPadding: 2, lineColor: GRID, lineWidth: 0.2,
      overflow: 'linebreak', valign: 'middle',
    },
    headStyles: {
      fillColor: BLUE, textColor: [255, 255, 255], fontSize: 7,
      fontStyle: 'bold', halign: 'center', minCellHeight: 6,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: CW - 90, halign: 'left' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

  // ========== SUMMARY OF SERVICE ==========
  np(50)
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary of Service', M, y)
  y += 3

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const summaryLines = doc.splitTextToSize(ts.summary_of_service || '', CW * 0.55)
  doc.text(summaryLines, M + 2, y)
  const summaryBottom = y + summaryLines.length * 3

  // Right side: Status checkboxes
  const rsx = M + CW * 0.55
  const rsy = y - 3

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Status of Service?', rsx, rsy + 2)
  cb(doc, rsx, rsy + 7, ts.status_service === 'close')
  doc.text('Close', rsx + 4, rsy + 6.5)
  cb(doc, rsx + 25, rsy + 7, ts.status_service === 'followup')
  doc.text('Follow-up required', rsx + 29, rsy + 6.5)

  doc.text('Nonconformance found?', rsx, rsy + 13)
  cb(doc, rsx, rsy + 18, ts.nonconformance === true)
  doc.text('Yes', rsx + 4, rsy + 17.5)
  cb(doc, rsx + 18, rsy + 18, ts.nonconformance === false)
  doc.text('No', rsx + 22, rsy + 17.5)

  doc.text('Any incident/spill?', rsx, rsy + 24)
  cb(doc, rsx, rsy + 29, ts.incident_spill === true)
  doc.text('Yes', rsx + 4, rsy + 28.5)
  cb(doc, rsx + 18, rsy + 29, ts.incident_spill === false)
  doc.text('No', rsx + 22, rsy + 28.5)

  doc.text('Any tools/equip. damage?', rsx, rsy + 35)
  cb(doc, rsx, rsy + 40, ts.tools_damage === true)
  doc.text('Yes', rsx + 4, rsy + 39.5)
  cb(doc, rsx + 18, rsy + 40, ts.tools_damage === false)
  doc.text('No', rsx + 22, rsy + 39.5)
  cb(doc, rsx + 35, rsy + 40, ts.tools_damage === null)
  doc.text('N/A', rsx + 39, rsy + 39.5)

  y = Math.max(summaryBottom, rsy + 45) + 3

  // Packing List & Demob Date
  drawField(doc, 'Packing List No. (if any)', ts.packing_list_no, M, y, halfW, FH, 40)
  drawField(doc, 'Demobilization Date', ts.demobilization_date, M + halfW, y, halfW, FH, 35)
  y += FH + 4

  // ========== STATEMENT ==========
  np(35)
  doc.setTextColor(...BLUE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Statement of completeness of the work:', M, y)
  y += 3

  const stmtW = CW * 0.65
  const sigBoxW = CW * 0.35 - 2

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const stmt = 'The service has been completed and to the best of my knowledge and belief, is in substantial compliance with the provisions of the Purchase Order. The service is completed without safety incident and has satisfied Customer in terms of quality of service. The worksite is left in clean and deemed safe.'
  const stmtLines = doc.splitTextToSize(stmt, stmtW - 4)
  doc.text(stmtLines, M + 2, y)

  const stmtBottom = y + stmtLines.length * 3

  // Signature boxes (right side)
  const sigX = M + stmtW + 2
  const sigH = 28
  const sigY = y - 3

  // Service Person sig
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.3)
  doc.rect(sigX, sigY, sigBoxW, sigH / 2 - 1, 'S')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.text('Service Person', sigX + sigBoxW / 2, sigY + 3, { align: 'center' })
  doc.setFontSize(6.5)
  doc.text(ts.service_person_name || '-', sigX + sigBoxW / 2, sigY + 8, { align: 'center' })
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.2)
  doc.line(sigX + 3, sigY + sigH / 2 - 4, sigX + sigBoxW - 3, sigY + sigH / 2 - 4)
  doc.setFontSize(4.5)
  doc.setTextColor(140, 140, 140)
  doc.text('(name/sign/date)', sigX + sigBoxW / 2, sigY + sigH / 2 - 2, { align: 'center' })

  // Customer Rep sig
  const crSigY = sigY + sigH / 2 + 1
  doc.setDrawColor(...GRID)
  doc.setLineWidth(0.3)
  doc.rect(sigX, crSigY, sigBoxW, sigH / 2 - 1, 'S')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Customer Representative', sigX + sigBoxW / 2, crSigY + 3, { align: 'center' })
  doc.setFontSize(6.5)
  doc.text(ts.customer_rep_name || '-', sigX + sigBoxW / 2, crSigY + 8, { align: 'center' })
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.2)
  doc.line(sigX + 3, crSigY + sigH / 2 - 4, sigX + sigBoxW - 3, crSigY + sigH / 2 - 4)
  doc.setFontSize(4.5)
  doc.setTextColor(140, 140, 140)
  doc.text('(name/sign/date)', sigX + sigBoxW / 2, crSigY + sigH / 2 - 2, { align: 'center' })

  y = Math.max(stmtBottom, crSigY + sigH / 2) + 6

  // ========== FOOTER ==========
  const tp = doc.getNumberOfPages()
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Service Timesheet - ${ts.customer || 'Draft'} | Page ${i} of ${tp}`, PW / 2, PH - 5, { align: 'center' })
  }

  doc.save(`Service-Timesheet-${ts.customer || 'Draft'}.pdf`)
}
