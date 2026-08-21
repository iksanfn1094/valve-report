import { NextResponse } from 'next/server'

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1xBsjNoPVCxRLDnr_HXX1c6hIzLNKVqjcopJNJ2NhrjM/export?format=csv&gid=1991402545'

export async function GET() {
  try {
    const res = await fetch(SHEETS_URL, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch spreadsheet' }, { status: 502 })
    const csv = await res.text()
    const rows = parseCSV(csv)

    const valves: Record<string, { valve_type: string; size: string; class: string }> = {}

    for (const row of rows) {
      const newId = (row[5] || '').trim().toUpperCase()
      if (!newId || newId === 'NEW VALVE ID' || newId === 'NEW ID VALVE' || newId === 'OLD ID') continue
      const vt = (row[8] || '').trim()
      const sz = (row[9] || '').trim()
      const cl = (row[10] || '').trim()
      if (vt || sz || cl) {
        valves[newId] = { valve_type: vt, size: sz, class: cl }
      }
    }

    return NextResponse.json(valves)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
        continue
      }
      if (ch === ',') {
        current.push(field)
        field = ''
        i++
        continue
      }
      if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++
        current.push(field)
        field = ''
        rows.push(current)
        current = []
        i++
        continue
      }
      field += ch
      i++
    }
  }
  current.push(field)
  if (current.length > 1 || current[0]) rows.push(current)

  return rows
}
