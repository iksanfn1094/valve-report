'use client'

export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Report = {
  id: string
  job_number: string
  report_no: string | null
  customer: string | null
  valve_type: string | null
}

type DocItem = {
  id?: string
  report_id: string
  component_name: string
  condition_before: string
  condition_after: string
  photo_before_url: string
  photo_after_url: string
  notes: string
}

const COMPONENTS = [
  'Body', 'Bonnet', 'Stem', 'Seat', 'Disc', 'Ball', 'Plug',
  'Packing', 'Gasket', 'Bolt', 'Nut', 'Spring', 'Diaphragm',
  'Actuator', 'Handwheel', 'Yoke', 'Backseat', 'Guide',
  'Thrust Bearing', 'Retainer', 'O-Ring', 'Other'
]

export default function DocsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [docItems, setDocItems] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingBefore, setUploadingBefore] = useState<number | null>(null)
  const [uploadingAfter, setUploadingAfter] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reportId = params.get('reportId')
    supabase
      .from('report_inspection')
      .select('id, job_number, report_no, customer, valve_type')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data ?? [])
        if (reportId) setSelectedReport(reportId)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedReport) { setDocItems([]); return }
    supabase
      .from('report_documentation')
      .select('*')
      .eq('report_id', selectedReport)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setDocItems(data.map((d) => ({
          ...d,
          photo_before_url: d.photo_before_url || '',
          photo_after_url: d.photo_after_url || '',
        })))
      })
  }, [selectedReport])

  function addDocRow() {
    setDocItems([
      ...docItems,
      {
        report_id: selectedReport,
        component_name: '',
        condition_before: '',
        condition_after: '',
        photo_before_url: '',
        photo_after_url: '',
        notes: '',
      },
    ])
  }

  function removeDocRow(idx: number) {
    setDocItems(docItems.filter((_, i) => i !== idx))
  }

  function updateDocRow(idx: number, field: keyof DocItem, value: string) {
    const copy = [...docItems]
    ;(copy[idx] as Record<string, string>)[field] = value
    setDocItems(copy)
  }

  async function uploadPhoto(file: File, idx: number, side: 'before' | 'after') {
    if (!selectedReport) return
    const setter = side === 'before' ? setUploadingBefore : setUploadingAfter
    setter(idx)
    const path = `${selectedReport}/doc/${side}-${crypto.randomUUID()}-${file.name}`
    const { error } = await supabase.storage.from('report-photos').upload(path, file)
    if (error) {
      alert('Upload gagal: ' + error.message)
      setter(null)
      return
    }
    const { data } = supabase.storage.from('report-photos').getPublicUrl(path)
    const field = side === 'before' ? 'photo_before_url' : 'photo_after_url'
    updateDocRow(idx, field, data.publicUrl)
    setter(null)
  }

  async function saveAllDocs() {
    setSaving(true)
    const existing = docItems.filter((d) => d.id)
    const newDocs = docItems.filter((d) => !d.id)

    for (const d of existing) {
      await supabase.from('report_documentation').update({
        component_name: d.component_name,
        condition_before: d.condition_before,
        condition_after: d.condition_after,
        photo_before_url: d.photo_before_url,
        photo_after_url: d.photo_after_url,
        notes: d.notes,
        sort_order: docItems.indexOf(d),
      }).eq('id', d.id)
    }

    if (newDocs.length > 0) {
      const rows = newDocs.map((d) => ({
        report_id: selectedReport,
        component_name: d.component_name,
        condition_before: d.condition_before,
        condition_after: d.condition_after,
        photo_before_url: d.photo_before_url,
        photo_after_url: d.photo_after_url,
        notes: d.notes,
        sort_order: docItems.indexOf(d),
      }))
      const { data, error } = await supabase.from('report_documentation').insert(rows).select()
      if (error) {
        setSaving(false)
        return alert('Error: ' + error.message)
      }
      if (data) {
        let di = 0
        const merged = docItems.map((d) => {
          if (d.id) return d
          const ins = data[di]; di++
          return { ...d, id: ins.id }
        })
        setDocItems(merged)
      }
    }

    setSaving(false)
    alert('Tersimpan!')
  }

  if (loading) return <p className="text-gray-500 py-10 text-center">Loading...</p>

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Documentation - Kondisi Valve Before &amp; After</h1>
        <Link href="/reports" className="text-blue-600 hover:underline text-sm">&larr; Kembali</Link>
      </div>

      {/* Select Report */}
      <div className="bg-white rounded-lg shadow border p-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Pilih Report:</label>
        <select
          className="border rounded-lg px-3 py-2 text-sm w-full max-w-lg"
          value={selectedReport}
          onChange={(e) => setSelectedReport(e.target.value)}
        >
          <option value="">-- Pilih Report --</option>
          {reports.map((r) => (
            <option key={r.id} value={r.id}>
              {r.job_number} - {r.report_no || 'No Report'} ({r.customer || '-'}) {r.valve_type || ''}
            </option>
          ))}
        </select>
      </div>

      {selectedReport && (
        <>
          {/* Documentation Table */}
          <div className="bg-white rounded-lg shadow border p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Foto Kondisi Before &amp; After</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="border px-2 py-2 text-xs" rowSpan={2}>No</th>
                    <th className="border px-2 py-2 text-xs" rowSpan={2}>Component</th>
                    <th className="border px-2 py-2 text-xs" colSpan={2}>Condition Before</th>
                    <th className="border px-2 py-2 text-xs" colSpan={2}>Condition After</th>
                    <th className="border px-2 py-2 text-xs" rowSpan={2}>Notes</th>
                    <th className="border px-2 py-2 text-xs" rowSpan={2}></th>
                  </tr>
                  <tr className="bg-blue-800 text-white">
                    <th className="border px-2 py-1 text-xs">Foto</th>
                    <th className="border px-2 py-1 text-xs">Keterangan</th>
                    <th className="border px-2 py-1 text-xs">Foto</th>
                    <th className="border px-2 py-1 text-xs">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {docItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-2 py-1 text-center text-gray-500">{idx + 1}</td>
                      <td className="border px-2 py-1">
                        <select
                          className="w-full border-0 bg-transparent text-xs focus:outline-none"
                          value={item.component_name}
                          onChange={(e) => updateDocRow(idx, 'component_name', e.target.value)}
                        >
                          <option value="">-- Pilih --</option>
                          {COMPONENTS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {item.photo_before_url ? (
                          <img src={item.photo_before_url} alt="Before" className="w-12 h-12 object-cover rounded border mx-auto cursor-pointer" />
                        ) : (
                          <label className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer">
                            <input type="file" accept="image/*" capture="environment" className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, idx, 'before') }} />
                            {uploadingBefore === idx ? <span className="text-yellow-600">...</span> : <span>+ Foto</span>}
                          </label>
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        <input className="w-full border-0 bg-transparent text-xs focus:outline-none"
                          value={item.condition_before}
                          placeholder="Kondisi sebelum..."
                          onChange={(e) => updateDocRow(idx, 'condition_before', e.target.value)} />
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {item.photo_after_url ? (
                          <img src={item.photo_after_url} alt="After" className="w-12 h-12 object-cover rounded border mx-auto cursor-pointer" />
                        ) : (
                          <label className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer">
                            <input type="file" accept="image/*" capture="environment" className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, idx, 'after') }} />
                            {uploadingAfter === idx ? <span className="text-yellow-600">...</span> : <span>+ Foto</span>}
                          </label>
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        <input className="w-full border-0 bg-transparent text-xs focus:outline-none"
                          value={item.condition_after}
                          placeholder="Kondisi sesudah..."
                          onChange={(e) => updateDocRow(idx, 'condition_after', e.target.value)} />
                      </td>
                      <td className="border px-2 py-1">
                        <input className="w-full border-0 bg-transparent text-xs focus:outline-none"
                          value={item.notes}
                          placeholder="Catatan..."
                          onChange={(e) => updateDocRow(idx, 'notes', e.target.value)} />
                      </td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => removeDocRow(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold">x</button>
                      </td>
                    </tr>
                  ))}
                  {docItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="border px-2 py-6 text-center text-gray-400">
                        Belum ada data. Klik &quot;+ Tambah Baris&quot; untuk menambah.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addDocRow} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition font-medium">
                + Tambah Baris
              </button>
              <button onClick={saveAllDocs} disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan Semua'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
