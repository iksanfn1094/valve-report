import * as XLSX from 'xlsx'

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

export function exportReportExcel(
  report: ReportData,
  items: ItemData[],
  bomItems: BomData[]
) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Valve Details
  const detailRows = [
    ['Valve Id', report.job_number],
    ['Report No', report.report_no || '-'],
    ['Report Date', report.report_date || '-'],
    ['Status', report.status.toUpperCase()],
    ['Project', report.project || '-'],
    ['Customer', report.customer || '-'],
    ['Valve Type', report.valve_type || '-'],
    ['Manufacture', report.manufacture || '-'],
    ['Size', report.size || '-'],
    ['Class', report.class || '-'],
    ['Serial No', report.serial_no || '-'],
    ['End Connection', report.end_connection || '-'],
    ['Operated', report.operated || '-'],
    ['Location', report.location || '-'],
    ['EX Station', report.ex_station || '-'],
    ['RO No', report.ro_no || '-'],
    ['Inspector', report.inspector_name || '-'],
    ['Category', report.category || '-'],
  ]
  const wsDetail = XLSX.utils.aoa_to_sheet([['Field', 'Value'], ...detailRows])
  wsDetail['!cols'] = [{ wch: 18 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Valve Details')

  // Sheet 2: Inspection Items
  const itemHeader = ['No', 'Component', 'Qty', 'Condition Note', 'Clean (C)', 'Repair (RP)', 'Replace (RE)', 'Comment', 'Spec Material']
  const itemRows = items.map((it) => [
    it.item_no,
    it.component_name || '-',
    it.qty ?? '-',
    it.condition_note || '-',
    it.recommendation.includes('C') ? 'V' : '',
    it.recommendation.includes('RP') ? 'V' : '',
    it.recommendation.includes('RE') ? 'V' : '',
    it.comment || '-',
    it.spec_material || '-',
  ])
  const wsItems = XLSX.utils.aoa_to_sheet([itemHeader, ...itemRows])
  wsItems['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 6 }, { wch: 25 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Inspection Items')

  // Sheet 3: Summary
  const cC = items.filter((i) => i.recommendation.includes('C')).length
  const cRP = items.filter((i) => i.recommendation.includes('RP')).length
  const cRE = items.filter((i) => i.recommendation.includes('RE')).length
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['Item', 'Count'],
    ['Total Components', items.length],
    ['Clean (C)', cC],
    ['Repair (RP)', cRP],
    ['Replace (RE)', cRE],
  ])
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Sheet 4: BOM (if any)
  if (bomItems.length > 0) {
    const sL: Record<string, string> = { valve: 'Valve Parts', machining: 'Machining', coating: 'Coating' }
    const bomHeader = ['Section', 'No', 'Qty', 'Unit', 'Description', 'Specification', 'Dimension', 'Keterangan']
    const bomRows = bomItems.map((b) => [
      sL[b.section] || b.section,
      b.item_no,
      b.qty ?? '-',
      b.unit,
      b.description || '-',
      b.specification || '-',
      b.dimension || '-',
      b.keterangan || '-',
    ])
    const wsBom = XLSX.utils.aoa_to_sheet([bomHeader, ...bomRows])
    wsBom['!cols'] = [
      { wch: 14 }, { wch: 5 }, { wch: 6 }, { wch: 8 },
      { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 25 },
    ]
    XLSX.utils.book_append_sheet(wb, wsBom, 'BOM')
  }

  const fn = `IR-${report.job_number}${report.report_no ? '-' + report.report_no : ''}.xlsx`
  XLSX.writeFile(wb, fn)
}
