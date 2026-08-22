'use client'

import { useState } from 'react'
import { ORING_SIZES } from '@/lib/oring-data'

type TabKey = 'oring' | 'calc'
type CalcType = 'seat' | 'stem' | 'back'

const CalcFormulas: Record<CalcType, { label: string; formula: string; fields: string[] }> = {
  seat: { label: 'Seat Ring', formula: 'Compression = (GROOVE DEPTH - O-RING CS) / O-RING CS × 100%', fields: ['Groove Depth (mm)', 'O-Ring CS (mm)'] },
  stem: { label: 'Stem Seal', formula: 'Compression = (GROOVE WIDTH - O-RING ID) / O-RING ID × 100%', fields: ['Groove Width (mm)', 'O-Ring ID (mm)'] },
  back: { label: 'Back Ring', formula: 'Compression = (GROOVE DEPTH - O-RING CS) / O-RING CS × 100%', fields: ['Groove Depth (mm)', 'O-Ring CS (mm)'] },
}

export default function EngineeringHubPage() {
  const [tab, setTab] = useState<TabKey>('oring')
  const [search, setSearch] = useState('')
  const [csFilter, setCsFilter] = useState<string>('all')
  const [calcType, setCalcType] = useState<CalcType>('seat')
  const [calcVals, setCalcVals] = useState(['', ''])
  const [calcResult, setCalcResult] = useState<number | null>(null)

  const csGroups = [
    { label: 'All', value: 'all' },
    { label: 'CS 1.02mm (-001)', value: '1.02' },
    { label: 'CS 1.27mm (-002)', value: '1.27' },
    { label: 'CS 1.52mm (-003)', value: '1.52' },
    { label: 'CS 1.78mm (0xx)', value: '1.78' },
    { label: 'CS 2.62mm (1xx)', value: '2.62' },
    { label: 'CS 3.53mm (2xx)', value: '3.53' },
    { label: 'CS 5.33mm (3xx)', value: '5.33' },
    { label: 'CS 6.99mm (4xx)', value: '6.99' },
  ]

  const filtered = ORING_SIZES.filter(o => {
    const matchSearch = !search || o.id.toString().includes(search) || o.cs.toString().includes(search)
    const matchCs = csFilter === 'all' || o.cs.toString() === csFilter
    return matchSearch && matchCs
  })

  function runCalc() {
    const a = parseFloat(calcVals[0])
    const b = parseFloat(calcVals[1])
    if (!isNaN(a) && !isNaN(b) && b > 0) setCalcResult(((a - b) / b) * 100)
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
      <h1 className="text-xl font-bold text-teal-700">Engineering Hub</h1>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {([['oring', 'Standard O-Ring'], ['calc', 'Calculation']] as [TabKey, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === k ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'oring' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Search by ID, CS..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            <select value={csFilter} onChange={e => setCsFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
              {csGroups.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500">ISO 3601-1 Class A / AS568 (USA) — {filtered.length} sizes</p>
          <div className="flex gap-6 items-start">
            {/* Table */}
            <div className="overflow-auto max-h-[500px] border rounded-lg" style={{ minWidth: 0, flex: '0 0 auto' }}>
              <table className="text-sm" style={{ width: 'auto' }}>
                <thead className="bg-teal-600 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-1.5 text-right text-xs">CS (mm)</th>
                    <th className="px-4 py-1.5 text-right text-xs">Inner Diameter (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-1 text-right text-xs">{o.cs.toFixed(2)}</td>
                      <td className="px-4 py-1 text-right text-xs">{o.id.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Illustration */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2" style={{ width: 220 }}>
              <svg viewBox="0 0 220 220" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                {/* O-ring outer circle */}
                <circle cx="110" cy="110" r="85" fill="none" stroke="#999" strokeWidth="1.5" strokeDasharray="4,3" />
                {/* O-ring body (donut) */}
                <circle cx="110" cy="110" r="75" fill="#6ee7b7" stroke="#059669" strokeWidth="2" />
                <circle cx="110" cy="110" r="50" fill="white" stroke="#059669" strokeWidth="2" />

                {/* ID dimension line (horizontal through center) */}
                <line x1="60" y1="110" x2="160" y2="110" stroke="#2563eb" strokeWidth="1" strokeDasharray="3,2" />
                <line x1="60" y1="105" x2="60" y2="115" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="160" y1="105" x2="160" y2="115" stroke="#2563eb" strokeWidth="1.5" />
                <text x="110" y="107" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="bold">ID</text>

                {/* CS dimension line (vertical, right side of ring body) */}
                <line x1="190" y1="35" x2="190" y2="75" stroke="#dc2626" strokeWidth="1" />
                <line x1="186" y1="35" x2="194" y2="35" stroke="#dc2626" strokeWidth="1.5" />
                <line x1="186" y1="75" x2="194" y2="75" stroke="#dc2626" strokeWidth="1.5" />
                <line x1="183" y1="55" x2="197" y2="55" stroke="none" />
                <rect x="181" y="46" width="22" height="13" rx="2" fill="white" fillOpacity="0.85" />
                <text x="192" y="56" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="bold">CS</text>

                {/* OD dimension line (bottom) */}
                <line x1="25" y1="195" x2="195" y2="195" stroke="#7c3aed" strokeWidth="1" strokeDasharray="3,2" />
                <line x1="25" y1="190" x2="25" y2="200" stroke="#7c3aed" strokeWidth="1.5" />
                <line x1="195" y1="190" x2="195" y2="200" stroke="#7c3aed" strokeWidth="1.5" />
                <text x="110" y="208" textAnchor="middle" fill="#7c3aed" fontSize="10" fontWeight="bold">OD = ID + 2×CS</text>

                {/* Connector lines from ring to dimension lines */}
                <line x1="60" y1="110" x2="35" y2="110" stroke="#2563eb" strokeWidth="0.7" strokeDasharray="2,2" />
                <line x1="160" y1="110" x2="185" y2="110" stroke="#2563eb" strokeWidth="0.7" strokeDasharray="2,2" />
              </svg>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-gray-700">O-Ring Dimensions</p>
                <p className="text-xs text-blue-600"><b>ID</b> = Inner Diameter</p>
                <p className="text-xs text-red-600"><b>CS</b> = Cross Section</p>
                <p className="text-xs text-purple-600"><b>OD</b> = Outer Diameter</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'calc' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(Object.keys(CalcFormulas) as CalcType[]).map(ct => (
              <button key={ct} onClick={() => { setCalcType(ct); setCalcVals(['', '']); setCalcResult(null) }} className={`px-3 py-1.5 text-sm rounded-lg transition ${calcType === ct ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {CalcFormulas[ct].label}
              </button>
            ))}
          </div>
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-md">
            <p className="text-sm text-gray-500">{CalcFormulas[calcType].formula}</p>
            {CalcFormulas[calcType].fields.map((f, i) => (
              <div key={i}>
                <label className="text-xs text-gray-500">{f}</label>
                <input type="number" step="0.01" value={calcVals[i]} onChange={e => { const next = [...calcVals]; next[i] = e.target.value; setCalcVals(next) }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
            ))}
            <button onClick={runCalc} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition">Calculate</button>
            {calcResult !== null && (
              <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm font-semibold text-teal-800">Result: {calcResult.toFixed(2)}% compression</p>
                <p className="text-xs text-gray-500 mt-1">
                  {calcResult >= 10 && calcResult <= 25 ? 'Optimal range (10-25%)' : calcResult < 10 ? 'Below optimal — may leak' : 'Above optimal — may cause extrusion'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
