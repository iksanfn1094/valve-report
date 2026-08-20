'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type BomItem = {
  id?: string
  section: string
  item_no: number
  qty: number | null
  unit: string
  description: string
  specification: string
  dimension: string
  keterangan: string
}

const SECTIONS = [
  { value: 'valve', label: 'Valve Parts' },
  { value: 'machining', label: 'Machining' },
  { value: 'coating', label: 'Coating' },
]

const UNITS = ['pcs', 'set', 'lot', 'kg', 'meter', 'liter', 'pair']

export default function BomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [items, setItems] = useState<BomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('report_bom_items')
      .select('*')
      .eq('report_id', id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setItems(data)
        setLoading(false)
      })
  }, [id])

  function addRow(section: string) {
    const sectionItems = items.filter((i) => i.section === section)
    setItems([
      ...items,
      {
        section,
        item_no: sectionItems.length + 1,
        qty: null,
        unit: 'pcs',
        description: '',
        specification: '',
        dimension: '',
        keterangan: '',
      },
    ])
  }

  function removeRow(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateRow(idx: number, field: keyof BomItem, value: unknown) {
    const copy = [...items]
    ;(copy[idx] as Record<string, unknown>)[field] = value
    setItems(copy)
  }

  async function saveAll() {
    setSaving(true)
    await supabase.from('report_bom_items').delete().eq('report_id', id)
    const rows = items.map((it, i) => ({
      report_id: id,
      section: it.section,
      item_no: it.item_no,
      qty: it.qty,
      unit: it.unit,
      description: it.description,
      specification: it.specification,
      dimension: it.dimension,
      keterangan: it.keterangan,
      sort_order: i,
    }))
    if (rows.length > 0) {
      const { error } = await supabase.from('report_bom_items').insert(rows)
      setSaving(false)
      if (error) return alert('Error: ' + error.message)
    } else {
      setSaving(false)
    }
    alert('BOM tersimpan!')
  }

  const filteredItems = filter === 'all' ? items : items.filter((i) => i.section === filter)

  if (loading) return <p className="text-gray-500 py-10 text-center">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/reports/${id}`} className="text-blue-600 hover:underline text-sm">
            &larr; Kembali ke Report
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Bill of Material (BOM)</h1>
        </div>
        <div className="flex gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => addRow(s.value)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition"
            >
              + {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          All ({items.length})
        </button>
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1 rounded text-sm transition ${filter === s.value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {s.label} ({items.filter((i) => i.section === s.value).length})
          </button>
        ))}
      </div>

      {/* BOM Table */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 w-10">No</th>
                <th className="border px-2 py-1">Section</th>
                <th className="border px-2 py-1 w-16">Qty</th>
                <th className="border px-2 py-1">Unit</th>
                <th className="border px-2 py-1">Description</th>
                <th className="border px-2 py-1">Specification</th>
                <th className="border px-2 py-1">Dimension</th>
                <th className="border px-2 py-1">Keterangan</th>
                <th className="border px-2 py-1 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const globalIdx = items.indexOf(item)
                return (
                  <tr key={globalIdx} className="hover:bg-gray-50">
                    <td className="border px-2 py-1 text-center text-gray-500">{idx + 1}</td>
                    <td className="border px-2 py-1">
                      <select
                        className="w-full border-0 bg-transparent text-sm focus:outline-none"
                        value={item.section}
                        onChange={(e) => updateRow(globalIdx, 'section', e.target.value)}
                      >
                        {SECTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full border-0 bg-transparent text-sm text-center focus:outline-none"
                        value={item.qty ?? ''}
                        onChange={(e) => updateRow(globalIdx, 'qty', Number(e.target.value) || null)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        className="w-full border-0 bg-transparent text-sm focus:outline-none"
                        value={item.unit}
                        onChange={(e) => updateRow(globalIdx, 'unit', e.target.value)}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border-0 bg-transparent text-sm focus:outline-none"
                        value={item.description}
                        onChange={(e) => updateRow(globalIdx, 'description', e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border-0 bg-transparent text-sm focus:outline-none"
                        value={item.specification}
                        onChange={(e) => updateRow(globalIdx, 'specification', e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border-0 bg-transparent text-sm focus:outline-none"
                        value={item.dimension}
                        onChange={(e) => updateRow(globalIdx, 'dimension', e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border-0 bg-transparent text-sm focus:outline-none"
                        value={item.keterangan}
                        onChange={(e) => updateRow(globalIdx, 'keterangan', e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => removeRow(globalIdx)}
                        className="text-red-500 hover:text-red-700 font-bold"
                        title="Hapus baris"
                      >
                        x
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="border px-2 py-6 text-center text-gray-400">
                    Belum ada item BOM. Klik tombol &quot;+ Valve Parts&quot; atau lainnya untuk menambah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={saveAll}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan BOM'}
          </button>
        </div>
      </div>
    </div>
  )
}
