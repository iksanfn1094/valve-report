'use client'

import { useState } from 'react'
import { ORING_SIZES } from '@/lib/oring-data'

type TabKey = 'oring' | 'api6d' | 'calc'

const API6D_TESTS = [
  { no: 1, name: 'Hydrostatic Shell Test', medium: 'Water', pressureFormula: '≥ 1.5 × PR', holdingFn: (sz: number) => sz <= 4 ? '2 min' : sz <= 10 ? '5 min' : sz <= 18 ? '15 min' : '30 min', criteria: 'No visible leakage dari pressure-containing parts' },
  { no: 2, name: 'Hydrostatic Seat Test', medium: 'Water', pressureFormula: '≥ 1.1 × PR', holdingFn: (sz: number) => sz <= 4 ? '2 min' : sz <= 18 ? '5 min' : '10 min', criteria: 'Soft seat: ISO 5208 Rate A\nMetal seat: ISO 5208 Rate CD' },
  { no: 3, name: 'High-Pressure Gas Seat Test', medium: 'Inert gas (N₂)', pressureFormula: '≥ 1.1 × PR', holdingFn: (sz: number) => sz <= 18 ? '15 min' : '30 min', criteria: 'Sesuai API 6D gas seat test criteria' },
  { no: 4, name: 'Low-Pressure Gas Seat Test', medium: 'Air / inert gas', pressureFormula: '87–102 psi\n(0.6–0.7 MPa)', holdingFn: (sz: number) => sz <= 18 ? '15 min' : '30 min', criteria: 'Soft seat: ISO 5208 Rate A\nMetal seat: mengikuti API 6D' },
  { no: 5, name: 'Backseat Test', medium: 'Water', pressureFormula: 'Sesuai PR', holdingFn: (sz: number) => sz <= 4 ? '2 min' : '5 min', criteria: 'No visible leakage' },
]

export default function EngineeringHubPage() {
  const [tab, setTab] = useState<TabKey>('oring')
  const [search, setSearch] = useState('')
  const [csFilter, setCsFilter] = useState<string>('all')
  const [calcVals, setCalcVals] = useState([''])
  const [calcResult, setCalcResult] = useState<number | null>(null)
  const [pr, setPr] = useState('')
  const [valveSize, setValveSize] = useState('')

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
    const cv = parseFloat(calcVals[0])
    if (!isNaN(cv)) setCalcResult(cv * 3.1 * 0.001 * 60)
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
      <h1 className="text-xl font-bold text-teal-700">Engineering Hub</h1>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {([['oring', 'Standard O-Ring'], ['api6d', 'API 6D Pressure Test'], ['calc', 'Seat Leak Test']] as [TabKey, string][]).map(([k, label]) => (
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
            <div className="flex-shrink-0 flex flex-col items-center gap-2" style={{ width: 280 }}>
              <svg viewBox="0 0 280 238" width="280" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="oringBodyGrad" cx="35%" cy="30%" r="80%">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="45%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#047857" />
                  </radialGradient>
                  <radialGradient id="oringHoleGrad" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stopColor="#eef1f4" />
                    <stop offset="70%" stopColor="#e2e6ea" />
                    <stop offset="100%" stopColor="#c8cdd3" />
                  </radialGradient>
                  <radialGradient id="oringShadowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.28" />
                    <stop offset="70%" stopColor="#000000" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Soft shadow beneath the ring */}
                <ellipse cx="125" cy="191" rx="84" ry="12" fill="url(#oringShadowGrad)" />

                {/* Engineering centerlines */}
                <line x1="40" y1="105" x2="210" y2="105" stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="10,4,2,4" opacity="0.8" />
                <line x1="125" y1="20" x2="125" y2="187" stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="10,4,2,4" opacity="0.8" />

                {/* O-ring body (donut) */}
                <circle cx="125" cy="105" r="75" fill="url(#oringBodyGrad)" stroke="#065f46" strokeWidth="2" />

                {/* Glossy highlight along top-left of the ring */}
                <path d="M82 62 A61 61 0 0 1 168 62" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.45" />

                {/* Inner hole */}
                <circle cx="125" cy="105" r="48" fill="url(#oringHoleGrad)" stroke="#9ca3af" strokeWidth="1.5" />
                {/* Subtle shadow cast inside the hole */}
                <path d="M96 76 A41 41 0 0 1 154 76" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" opacity="0.35" />

                {/* ID dimension (blue, horizontal through center) */}
                <line x1="77" y1="99" x2="77" y2="111" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="173" y1="99" x2="173" y2="111" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="85" y1="105" x2="165" y2="105" stroke="#2563eb" strokeWidth="1.2" />
                <polygon points="77,105 85,101.5 85,108.5" fill="#2563eb" />
                <polygon points="173,105 165,101.5 165,108.5" fill="#2563eb" />
                <rect x="111" y="97" width="28" height="16" rx="3" fill="white" fillOpacity="0.9" />
                <text x="125" y="109" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="bold">ID</text>

                {/* CS dimension (red, vertical, right side showing ring thickness) */}
                <line x1="127" y1="30" x2="220" y2="30" stroke="#dc2626" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="127" y1="57" x2="220" y2="57" stroke="#dc2626" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="212" y1="38" x2="212" y2="49" stroke="#dc2626" strokeWidth="1.2" />
                <polygon points="212,30 208.5,38 215.5,38" fill="#dc2626" />
                <polygon points="212,57 208.5,49 215.5,49" fill="#dc2626" />
                <rect x="198" y="37" width="28" height="13" rx="3" fill="white" fillOpacity="0.9" />
                <text x="212" y="47" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="bold">CS</text>

                {/* OD dimension (purple, bottom) */}
                <line x1="50" y1="112" x2="50" y2="212" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="200" y1="112" x2="200" y2="212" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="58" y1="206" x2="192" y2="206" stroke="#7c3aed" strokeWidth="1.2" />
                <polygon points="50,206 58,202.5 58,209.5" fill="#7c3aed" />
                <polygon points="200,206 192,202.5 192,209.5" fill="#7c3aed" />
                <rect x="71" y="199" width="108" height="15" rx="3" fill="white" fillOpacity="0.9" />
                <text x="125" y="210.5" textAnchor="middle" fill="#7c3aed" fontSize="11" fontWeight="bold">OD = ID + 2×CS</text>
              </svg>
              <p className="text-xs font-semibold text-gray-700">O-Ring Dimensions</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span className="text-xs text-gray-600"><b>ID</b> = Inner Diameter</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span className="text-xs text-gray-600"><b>CS</b> = Cross Section</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span className="text-xs text-gray-600"><b>OD</b> = Outer Diameter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'api6d' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">API 6D — Pipeline and Piping Valve Standard — Pressure Test Requirements</p>

          {/* Reference Table */}
          <div className="overflow-auto border rounded-lg">
            <table className="text-sm w-full">
              <thead className="bg-teal-600 text-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center text-xs w-8">No</th>
                  <th className="px-3 py-2 text-left text-xs">Pressure Test</th>
                  <th className="px-3 py-2 text-left text-xs">Test Medium</th>
                  <th className="px-3 py-2 text-left text-xs">Min Test Pressure</th>
                  <th className="px-3 py-2 text-left text-xs">Holding Time</th>
                  <th className="px-3 py-2 text-left text-xs">Leakage / Acceptance Criteria</th>
                </tr>
              </thead>
              <tbody>
                {API6D_TESTS.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-center text-xs font-semibold">{t.no}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-800">{t.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{t.medium}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 font-mono whitespace-pre-line">{t.pressureFormula}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.holdingFn(99)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculator */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-lg">
            <p className="text-sm font-semibold text-gray-700">Quick Calculator</p>
            <p className="text-xs text-gray-400">Pilih Pressure Class atau input langsung Pressure Rating (bar)</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Pressure Class</label>
                <select value={pr} onChange={e => setPr(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Pilih Class —</option>
                <option value="285">Class 150 (285 psi)</option>
                <option value="740">Class 300 (740 psi)</option>
                <option value="1000">Class 400 (1000 psi)</option>
                <option value="1500">Class 600 (1500 psi)</option>
                <option value="2250">Class 900 (2250 psi)</option>
                <option value="3750">Class 1500 (3750 psi)</option>
                <option value="6250">Class 2500 (6250 psi)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Pressure Rating (psi)</label>
                <input type="number" step="1" value={pr} onChange={e => setPr(e.target.value)} placeholder="e.g. 1500" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Valve Size (inch)</label>
                <input type="number" step="1" value={valveSize} onChange={e => setValveSize(e.target.value)} placeholder="e.g. 6" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
            </div>
            {pr && valveSize && (
              <div className="mt-2 overflow-auto">
                <table className="text-xs w-full">
                  <thead className="bg-teal-100 text-teal-800">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Test</th>
                      <th className="px-2 py-1.5 text-right">Test Pressure</th>
                      <th className="px-2 py-1.5 text-left">Holding Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {API6D_TESTS.map((t, i) => {
                      const prVal = parseFloat(pr)
                      const sz = parseFloat(valveSize)
                      let pressure = '-'
                      if (t.no === 1) pressure = `${(prVal * 1.5).toFixed(0)} psi`
                      else if (t.no <= 3) pressure = `${(prVal * 1.1).toFixed(0)} psi`
                      else if (t.no === 4) pressure = '87–102 psi (0.6–0.7 MPa)'
                      else pressure = `${prVal.toFixed(0)} psi`
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1.5 font-semibold">{t.name}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{pressure}</td>
                          <td className="px-2 py-1.5">{t.holdingFn(sz)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'calc' && (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-md">
            <p className="text-sm text-gray-500 font-mono">SCFH = Cv × 3.1 × 0.001 × 60</p>
            <p className="text-xs text-gray-400">3.1 = conversion constant, 0.001 = unit factor, 60 = sec→min</p>
            <div>
              <label className="text-xs text-gray-500">Cv (Flow Coefficient)</label>
              <input type="number" step="0.01" value={calcVals[0]} onChange={e => setCalcVals([e.target.value])} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
            </div>
            <button onClick={runCalc} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition">Calculate</button>
            {calcResult !== null && (
              <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm font-semibold text-teal-800">Result: {calcResult.toFixed(2)} SCFH</p>
                <p className="text-xs text-gray-500 mt-1">Standard Cubic Feet per Hour (seat leak rate)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
