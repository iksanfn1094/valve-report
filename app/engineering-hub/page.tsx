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
            <input type="text" placeholder="Search by Dash No, ID, CS..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            <select value={csFilter} onChange={e => setCsFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
              {csGroups.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500">ISO 3601-1 Class A / AS568 (USA) — {filtered.length} sizes</p>
          <div className="overflow-auto max-h-[500px] border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-teal-600 text-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-right">CS (mm)</th>
                  <th className="px-3 py-2 text-right">Inner Diameter (mm)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-1.5 text-right">{o.cs.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right">{o.id.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
