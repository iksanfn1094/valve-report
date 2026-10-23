import { NextResponse } from 'next/server'

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1xBsjNoPVCxRLDnr_HXX1c6hIzLNKVqjcopJNJ2NhrjM/export?format=csv&gid=1991402545'

export type ValveInfo = {
  valve_type: string
  size: string
  class: string
  end_connection: string
  manufacture: string
  serial_no: string
  location: string
  ex_station: string
  project: string
  ro_no: string
}

export async function GET() {
  try {
    const res = await fetch(SHEETS_URL, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch spreadsheet' }, { status: 502 })
    const csv = await res.text()
    const rows = parseCSV(csv)

    const valves: Record<string, ValveInfo> = {}

    for (const row of rows) {
      const newId = (row[5] || '').trim().toUpperCase()
      if (!newId || newId === 'NEW VALVE ID' || newId === 'NEW ID VALVE' || newId === 'OLD ID') continue

      valves[newId] = {
        valve_type: (row[7] || '').trim(),
        size: (row[8] || '').trim(),
        class: (row[9] || '').trim(),
        end_connection: (row[10] || '').trim(),
        manufacture: (row[11] || '').trim(),
        serial_no: (row[13] || '').trim(),
        location: (row[16] || '').trim(),
        ex_station: (row[22] || '').trim(),
        project: (row[24] || '').trim(),
        ro_no: (row[31] || '').trim(),
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
