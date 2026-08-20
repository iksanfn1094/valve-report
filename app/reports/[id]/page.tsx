'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { exportReportPDF } from '@/lib/export-pdf'
import { exportReportExcel } from '@/lib/export-excel'

type Report = {
  id: string
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
  engineering_name: string | null
  category: string | null
  status: string
}

type Item = {
  id?: string
  item_no: number
  component_name: string
  qty: number | null
  condition_note: string
  recommendation: string[]
  repair_category: string
  comment: string
  spec_material: string
}

type Photo = {
  id: string
  item_id: string
  storage_path: string
  caption: string | null
  url?: string
}

type BomItem = {
  section: string
  item_no: number
  qty: number | null
  unit: string
  description: string
  specification: string
  dimension: string
  keterangan: string
}

const RECS = [
  { value: 'C', label: 'C (Clean)', desc: 'Bersih, tidak perlu perbaikan' },
  { value: 'RP', label: 'RP (Repair)', desc: 'Perlu perbaikan' },
  { value: 'RE', label: 'RE (Replace)', desc: 'Perlu penggantian' },
]

const COMPONENTS = [
  'Body', 'Bonnet', 'Stem', 'Seat', 'Disc', 'Ball', 'Plug',
  'Packing', 'Gasket', 'Bolt', 'Nut', 'Spring', 'Diaphragm',
  'Actuator', 'Handwheel', 'Yoke', 'Backseat', 'Guide',
  'Thrust Bearing', 'Retainer', 'O-Ring', 'Other'
]

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [bomItems, setBomItems] = useState<BomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('report_photos')
      .select('*')
      .eq('report_id', id)
      .order('uploaded_at')
    if (!data) return

    const withUrls = await Promise.all(
      data.map(async (p) => {
        const { data: urlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(p.storage_path)
        return { ...p, url: urlData.publicUrl }
      })
    )
    setPhotos(withUrls)
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [reportRes, itemsRes, bomRes] = await Promise.all([
        supabase.from('report_inspection').select('*').eq('id', id).single(),
        supabase.from('report_inspection_items').select('*').eq('report_id', id).order('sort_order'),
        supabase.from('report_bom_items').select('*').eq('report_id', id).order('sort_order'),
      ])
      if (cancelled) return
      if (reportRes.data) setReport(reportRes.data)
      if (itemsRes.data) {
        setItems(itemsRes.data.map((it) => ({
          ...it,
          recommendation: it.recommendation ?? [],
        })))
      }
      if (bomRes.data) setBomItems(bomRes.data)
      setLoading(false)
      await fetchPhotos()
    }
    load()
    return () => { cancelled = true }
  }, [id, fetchPhotos])

  function addRow() {
    setItems([
      ...items,
      {
        item_no: items.length + 1,
        component_name: '',
        qty: 1,
        condition_note: '',
        recommendation: [],
        repair_category: '',
        comment: '',
        spec_material: '',
      },
    ])
  }

  function removeRow(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateRow(idx: number, field: keyof Item, value: unknown) {
    const copy = [...items]
    ;(copy[idx] as Record<string, unknown>)[field] = value
    setItems(copy)
  }

  async function saveAll() {
    setSaving(true)

    // Update items yang sudah ada (punya id), insert yang baru
    const existing = items.filter((it) => it.id)
    const newItems = items.filter((it) => !it.id)

    // Update existing
    for (const it of existing) {
      await supabase
        .from('report_inspection_items')
        .update({
          item_no: items.indexOf(it) + 1,
          component_name: it.component_name,
          qty: it.qty,
          condition_note: it.condition_note,
          recommendation: it.recommendation,
          repair_category: it.repair_category,
          comment: it.comment,
          spec_material: it.spec_material,
          sort_order: items.indexOf(it),
        })
        .eq('id', it.id)
    }

    // Insert baru
    if (newItems.length > 0) {
      const rows = newItems.map((it) => ({
        report_id: id,
        item_no: items.indexOf(it) + 1,
        component_name: it.component_name,
        qty: it.qty,
        condition_note: it.condition_note,
        recommendation: it.recommendation,
        repair_category: it.repair_category,
        comment: it.comment,
        spec_material: it.spec_material,
        sort_order: items.indexOf(it),
      }))
      const { data, error } = await supabase
        .from('report_inspection_items')
        .insert(rows)
        .select()
      if (error) {
        setSaving(false)
        return alert('Error: ' + error.message)
      }
      // Gabungkan: existing tetap pakai id lama, newItems pakai id dari DB
      if (data) {
        let dataIdx = 0
        const merged = items.map((it) => {
          if (it.id) return it
          const inserted = data[dataIdx]
          dataIdx++
          return { ...it, id: inserted.id, recommendation: inserted.recommendation ?? [] }
        })
        setItems(merged)
      }
    }

    setSaving(false)
    await fetchPhotos()
    alert('Tersimpan!')
  }

  async function uploadPhoto(file: File, itemId: string) {
    setUploading(itemId)
    const uniqueId = crypto.randomUUID()
    const path = `${id}/${itemId}/${uniqueId}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(path, file)
    if (uploadError) {
      setUploading(null)
      return alert('Upload gagal: ' + uploadError.message)
    }
    await supabase.from('report_photos').insert({
      report_id: id,
      item_id: itemId,
      storage_path: path,
      caption: file.name,
    })
    await fetchPhotos()
    setUploading(null)
  }

  async function deletePhoto(photoId: string, storagePath: string) {
    if (!confirm('Hapus foto ini?')) return
    await supabase.storage.from('report-photos').remove([storagePath])
    await supabase.from('report_photos').delete().eq('id', photoId)
    await fetchPhotos()
  }

  async function updateStatus(status: string) {
    const { error } = await supabase
      .from('report_inspection')
      .update({ status })
      .eq('id', id)
    if (error) return alert(error.message)
    setReport((prev) => prev ? { ...prev, status } : prev)
  }

  async function updateReportField(field: keyof Report, value: string) {
    const { error } = await supabase
      .from('report_inspection')
      .update({ [field]: value })
      .eq('id', id)
    if (error) return alert(error.message)
    setReport((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const REPORT_FIELDS: { key: keyof Report; label: string; type?: string }[] = [
    { key: 'report_no', label: 'Report No' },
    { key: 'report_date', label: 'Date' },
    { key: 'project', label: 'Project' },
    { key: 'customer', label: 'Customer' },
    { key: 'valve_type', label: 'Valve Type' },
    { key: 'manufacture', label: 'Manufacture' },
    { key: 'size', label: 'Size' },
    { key: 'class', label: 'Class' },
    { key: 'serial_no', label: 'Serial No' },
    { key: 'end_connection', label: 'End Connection' },
    { key: 'operated', label: 'Operated' },
    { key: 'location', label: 'Location' },
    { key: 'ex_station', label: 'EX Station' },
    { key: 'ro_no', label: 'RO No' },
    { key: 'inspector_name', label: 'Inspector' },
    { key: 'category', label: 'Category', type: 'select' },
  ]

  function getPhotosForItem(itemId: string) {
    return photos.filter((p) => p.item_id === itemId)
  }

  if (loading) return <p className="text-gray-500 py-10 text-center">Loading...</p>
  if (!report) return <p className="text-red-500 py-10 text-center">Report tidak ditemukan.</p>

  return (
    <div className="space-y-6">
      {/* Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <img
            src={previewPhoto}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300"
            onClick={() => setPreviewPhoto(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Inspection Report: {report.job_number}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!report) return
                exportReportPDF(
                  report,
                  items.map((it) => ({ ...it, id: it.id })),
                  bomItems,
                  photos
                )
              }}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
            >
              Export PDF
            </button>
            <button
              onClick={() => {
                if (!report) return
                exportReportExcel(report, items, bomItems)
              }}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
            >
              Export Excel
            </button>
            <Link href={`/reports/${id}/bom`} className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition">
              BOM
            </Link>
            <Link href="/docs" className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700 transition">
              Documentation
            </Link>
            <button
              onClick={() => setShowHeader(!showHeader)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition"
            >
              {showHeader ? 'Sembunyikan' : 'Tampilkan'} Header
            </button>
          </div>
        </div>

        {showHeader && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {REPORT_FIELDS.map(({ key, label, type }) => (
              <div key={key} className="flex flex-col">
                <label className="text-gray-500 text-xs">{label}:</label>
                {type === 'select' ? (
                  <select
                    className="border-b border-gray-300 bg-transparent text-sm font-medium focus:outline-none focus:border-blue-500 px-1 py-0.5"
                    value={(report[key] as string) || ''}
                    onChange={(e) => updateReportField(key, e.target.value)}
                  >
                    <option value="">--</option>
                    <option value="inspection">Inspection</option>
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                  </select>
                ) : (
                  <input
                    className="border-b border-gray-300 bg-transparent text-sm font-medium focus:outline-none focus:border-blue-500 px-1 py-0.5"
                    value={(report[key] as string) || ''}
                    onChange={(e) => updateReportField(key, e.target.value)}
                    onBlur={(e) => updateReportField(key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 pt-3 border-t">
          <span className="text-sm text-gray-500">Status:</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            report.status === 'approved' ? 'bg-green-100 text-green-700' :
            report.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {report.status}
          </span>
          {report.status === 'draft' && (
            <button onClick={() => updateStatus('submitted')} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition">
              Submit
            </button>
          )}
          {report.status === 'submitted' && (
            <button onClick={() => updateStatus('approved')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
              Approve
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Incoming Insp. Check (Condition As Found)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border px-1 py-1 text-xs" rowSpan={2}>No</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Component / Part Description</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Qty</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Condition</th>
                <th className="border px-1 py-1 text-xs" colSpan={3}>Recommendation</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Repair Category</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Comment / Notes / Dimension</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Foto</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Spek Material</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}></th>
              </tr>
              <tr className="bg-blue-900 text-white">
                <th className="border px-1 py-1 w-8 text-xs">C</th>
                <th className="border px-1 py-1 w-8 text-xs">RP</th>
                <th className="border px-1 py-1 w-8 text-xs">RE</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const itemPhotos = item.id ? getPhotosForItem(item.id) : []
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border px-1 py-1 text-center text-gray-500 text-xs">{idx + 1}</td>
                    <td className="border px-1 py-1">
                      <select
                        className="w-full border-0 bg-transparent text-xs focus:outline-none"
                        value={item.component_name}
                        onChange={(e) => updateRow(idx, 'component_name', e.target.value)}
                      >
                        <option value="">-- Pilih --</option>
                        {COMPONENTS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="number"
                        min={0}
                        className="w-full border-0 bg-transparent text-xs text-center focus:outline-none"
                        value={item.qty ?? ''}
                        onChange={(e) => updateRow(idx, 'qty', Number(e.target.value) || null)}
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        className="w-full border-0 bg-transparent text-xs focus:outline-none"
                        value={item.condition_note}
                        placeholder="Condition description..."
                        onChange={(e) => updateRow(idx, 'condition_note', e.target.value)}
                      />
                    </td>
                    <td className={`border px-1 py-1 text-center ${item.recommendation.includes('C') ? 'bg-green-100' : ''}`}>
                      <input
                        type="checkbox"
                        checked={item.recommendation.includes('C')}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...item.recommendation, 'C']
                            : item.recommendation.filter((x) => x !== 'C')
                          updateRow(idx, 'recommendation', next)
                        }}
                        className="rounded accent-green-600"
                      />
                    </td>
                    <td className={`border px-1 py-1 text-center ${item.recommendation.includes('RP') ? 'bg-yellow-100' : ''}`}>
                      <input
                        type="checkbox"
                        checked={item.recommendation.includes('RP')}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...item.recommendation, 'RP']
                            : item.recommendation.filter((x) => x !== 'RP')
                          updateRow(idx, 'recommendation', next)
                        }}
                        className="rounded accent-yellow-500"
                      />
                    </td>
                    <td className={`border px-1 py-1 text-center ${item.recommendation.includes('RE') ? 'bg-red-100' : ''}`}>
                      <input
                        type="checkbox"
                        checked={item.recommendation.includes('RE')}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...item.recommendation, 'RE']
                            : item.recommendation.filter((x) => x !== 'RE')
                          updateRow(idx, 'recommendation', next)
                        }}
                        className="rounded accent-red-600"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <select
                        className="w-full border-0 bg-transparent text-xs focus:outline-none"
                        value={item.repair_category || ''}
                        onChange={(e) => updateRow(idx, 'repair_category', e.target.value)}
                      >
                        <option value="">--</option>
                        <option value="Inspection">Inspection</option>
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                      </select>
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        className="w-full border-0 bg-transparent text-xs focus:outline-none"
                        value={item.comment}
                        onChange={(e) => updateRow(idx, 'comment', e.target.value)}
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <div className="flex flex-col gap-1">
                        {itemPhotos.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {itemPhotos.map((p) => (
                              <div key={p.id} className="relative group">
                                <img
                                  src={p.url}
                                  alt={p.caption || ''}
                                  className="w-8 h-8 object-cover rounded cursor-pointer border hover:border-blue-400"
                                  onClick={() => p.url && setPreviewPhoto(p.url)}
                                />
                                <button
                                  onClick={() => deletePhoto(p.id, p.storage_path)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 text-[8px] leading-none opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.id ? (
                          <label className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && item.id) uploadPhoto(file, item.id)
                              }}
                            />
                            {uploading === item.id ? (
                              <span className="text-yellow-600">Uploading...</span>
                            ) : (
                              <span>+ Foto</span>
                            )}
                          </label>
                        ) : (
                          <span className="text-[10px] text-gray-400">Simpan dulu</span>
                        )}
                      </div>
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        className="w-full border-0 bg-transparent text-xs focus:outline-none"
                        value={item.spec_material}
                        onChange={(e) => updateRow(idx, 'spec_material', e.target.value)}
                      />
                    </td>
                    <td className="border px-1 py-1 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                        title="Hapus baris"
                      >
                        x
                      </button>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={12} className="border px-2 py-6 text-center text-gray-400">
                    Belum ada komponen. Klik &quot;+ Tambah Baris&quot; untuk menambah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={addRow}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition font-medium"
          >
            + Tambah Baris
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * Klik &quot;+ Foto&quot; untuk upload foto per komponen. Baris harus disimpan dulu sebelum bisa upload foto.
        </p>
      </div>

      {/* Signature Table */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Signatures</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border px-2 py-2 text-xs">INSPECTED BY</th>
                <th className="border px-2 py-2 text-xs">CHECKED BY</th>
                <th className="border px-2 py-2 text-xs">REVIEW BY</th>
                <th className="border px-2 py-2 text-xs">ACKNOWLEDGE BY</th>
                <th className="border px-2 py-2 text-xs">WITNESS AND APPROVED BY</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-xs font-normal">QC INSPECTED</th>
                <th className="border px-2 py-1 text-xs font-normal">ENGINEERING</th>
                <th className="border px-2 py-1 text-xs font-normal">WORKSHOP CO.</th>
                <th className="border px-2 py-1 text-xs font-normal">PROJECT MANAGER</th>
                <th className="border px-2 py-1 text-xs font-normal">QC REP. PHE-ONWJ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">
                  <input
                    className="w-full border-0 bg-transparent text-sm text-center font-medium focus:outline-none focus:border-b focus:border-blue-500"
                    value={report.inspector_name || ''}
                    placeholder="Nama..."
                    onChange={(e) => updateReportField('inspector_name', e.target.value)}
                    onBlur={(e) => updateReportField('inspector_name', e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    className="w-full border-0 bg-transparent text-sm text-center font-medium focus:outline-none"
                    value={report.engineering_name || ''}
                    placeholder="Nama..."
                    onChange={(e) => updateReportField('engineering_name', e.target.value)}
                    onBlur={(e) => updateReportField('engineering_name', e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1 text-center font-medium">WISTANTO</td>
                <td className="border px-2 py-1 text-center font-medium">FN IKSAN</td>
                <td className="border px-2 py-1 text-center font-medium">HERI DIAN</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Ringkasan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <div className="text-gray-500">Total Komponen</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {items.filter((i) => i.recommendation.includes('C')).length}
            </div>
            <div className="text-gray-500">Clean (C)</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter((i) => i.recommendation.includes('RP')).length}
            </div>
            <div className="text-gray-500">Repair (RP)</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">
              {items.filter((i) => i.recommendation.includes('RE')).length}
            </div>
            <div className="text-gray-500">Replace (RE)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
