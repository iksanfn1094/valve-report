import { NextResponse } from 'next/server'

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1xBsjNoPVCxRLDnr_HXX1c6hIzLNKVqjcopJNJ2NhrjM/export?format=csv&gid=1991402545'

export async function GET() {
  try {
    const res = await fetch(SHEETS_URL, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch spreadsheet' }, { status: 502 })
    const csv = await res.text()
    const lines = csv.split('\n')

    // Header row is line 3 (0-indexed): No, Palette Member, ..., New Valve ID (col4), ..., Valve Type (col7), Size (col8), Class (col9)
    const valves: Record<string, { valve_type: string; size: string; class: string }> = {}

    for (const line of lines) {
      const cols = parseCSVLine(line)
      const newId = (cols[4] || '').trim().toUpperCase()
      if (!newId || newId === 'NEW VALVE ID' || newId === 'NEW ID VALVE') continue
      const vt = (cols[7] || '').trim()
      const sz = (cols[8] || '').trim()
      const cl = (cols[9] || '').trim()
      if (vt || sz || cl) {
        valves[newId] = { valve_type: vt, size: sz, class: cl }
      }
    }

    return NextResponse.json(valves)
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'; i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current); current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}
