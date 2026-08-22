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

type ValveTest = {
  id?: string
  spec_api6d: boolean
  spec_api598: boolean
  spec_fci70_2: boolean
  spec_3_15_psi: boolean
  spec_sop_no: string
  spec_others: string
  spec_cv: string
  shell_pressure_psi: string
  shell_duration_min: string
  shell_acceptance: string
  shell_start_test: string
  shell_finish_test: string
  shell_result: string
  shell_remark: string
  hp_seat_pressure_psi: string
  hp_seat_duration_min: string
  hp_seat_acceptance: string
  hp_seat_start_test: string
  hp_seat_finish_test: string
  hp_seat_result: string
  hp_seat_remark: string
  hp_closure_a_pressure_psi: string
  hp_closure_a_duration_min: string
  hp_closure_a_acceptance: string
  hp_closure_a_start_test: string
  hp_closure_a_finish_test: string
  hp_closure_a_result: string
  hp_closure_a_remark: string
  lp_closure_b_pressure_psi: string
  lp_closure_b_duration_min: string
  lp_closure_b_acceptance: string
  lp_closure_b_start_test: string
  lp_closure_b_finish_test: string
  lp_closure_b_result: string
  lp_closure_b_remark: string
  lp_seat_pressure_psi: string
  lp_seat_duration_min: string
  lp_seat_acceptance: string
  lp_seat_start_test: string
  lp_seat_finish_test: string
  lp_seat_result: string
  lp_seat_remark: string
  actuator_pressure_psi: string
  actuator_duration_min: string
  actuator_acceptance: string
  actuator_start_test: string
  actuator_finish_test: string
  actuator_result: string
  actuator_remark: string
  seat_pressure_psi: string
  seat_duration_min: string
  seat_acceptance: string
  seat_start_test: string
  seat_finish_test: string
  seat_result: string
  seat_remark: string
  func0_pressure_psi: string
  func0_duration_min: string
  func0_acceptance: string
  func0_start_test: string
  func0_finish_test: string
  func0_result: string
  func0_remark: string
  func25_pressure_psi: string
  func25_duration_min: string
  func25_acceptance: string
  func25_start_test: string
  func25_finish_test: string
  func25_result: string
  func25_remark: string
  func50_pressure_psi: string
  func50_duration_min: string
  func50_acceptance: string
  func50_start_test: string
  func50_finish_test: string
  func50_result: string
  func50_remark: string
  func75_pressure_psi: string
  func75_duration_min: string
  func75_acceptance: string
  func75_start_test: string
  func75_finish_test: string
  func75_result: string
  func75_remark: string
  func100_pressure_psi: string
  func100_duration_min: string
  func100_acceptance: string
  func100_start_test: string
  func100_finish_test: string
  func100_result: string
  func100_remark: string
  test_rows: string
}

const RECS = [
  { value: 'C', label: 'C (Clean)', desc: 'Bersih, tidak perlu perbaikan' },
  { value: 'RP', label: 'RP (Repair)', desc: 'Perlu perbaikan' },
  { value: 'RE', label: 'RE (Replace)', desc: 'Perlu penggantian' },
]

const TEST_OPTIONS = [
  { key: 'actuator', label: 'ACTUATOR LEAK TEST', criteria: 'NO VISIBLE LEAKAGE & PRESSURE DROP' },
  { key: 'shell', label: 'HYDROSTATIC SHELL TEST', criteria: 'NO VISIBLE LEAKAGE & PRESSURE DROP' },
  { key: 'hp_seat', label: 'HIGH-PRESSURE SEAT TEST', criteria: 'NO VISIBLE LEAKAGE & PRESSURE DROP' },
  { key: 'hp_closure_a', label: 'HIGH PRESSURE CLOSURE TEST A', criteria: '' },
  { key: 'lp_closure_b', label: 'LOW PRESSURE CLOSURE TEST B', criteria: '' },
  { key: 'seat', label: 'LOW-PRESSURE SEAT LEAK TEST', criteria: '' },
  { key: 'func0', label: 'FUNCTION TEST 0%', criteria: 'SMOOTH and LINEAR' },
  { key: 'func25', label: 'FUNCTION TEST 25%', criteria: '' },
  { key: 'func50', label: 'FUNCTION TEST 50%', criteria: 'SMOOTH and LINEAR' },
  { key: 'func75', label: 'FUNCTION TEST 75%', criteria: '' },
  { key: 'func100', label: 'FUNCTION TEST 100%', criteria: 'SMOOTH and LINEAR' },
]

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDateEN(val: string | null): string {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}`
}

const COMPONENTS = [
  'Actuator', 'Ball', 'Backseat', 'Bolt', 'Bonnet', 'Body',
  'Diaphragm', 'Disc', 'Flange And RF', 'Frame', 'Graphite Packing Body Bonnet',
  'Guide', 'Handwheel',   'Holder Valve', 'Lever Arm',
  'Nut', 'O-Ring Body Bonnet', 'O-Ring Stem', 'Other',
  'Packing', 'Plug', 'Retainer', 'Seat', 'Seat Pocket',
  'Spring', 'Stopper', 'Stem', 'Stud Bolt Body Bonnet', 'Stud Bolt Mounting Adaptor',
  'Thrust Bearing', 'Valve Unit', 'Washer Stem', 'Yoke',
]

export default function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [bomItems, setBomItems] = useState<BomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('inspection')
  const [valveTest, setValveTest] = useState<ValveTest>({
    spec_api6d: false, spec_api598: false, spec_fci70_2: false, spec_3_15_psi: false, spec_sop_no: '', spec_others: '', spec_cv: '',
    shell_pressure_psi: '', shell_duration_min: '', shell_acceptance: 'NO VISIBLE LEAKAGE & PRESSURE DROP', shell_start_test: '', shell_finish_test: '', shell_result: '', shell_remark: '',
    hp_seat_pressure_psi: '', hp_seat_duration_min: '', hp_seat_acceptance: '', hp_seat_start_test: '', hp_seat_finish_test: '', hp_seat_result: '', hp_seat_remark: '',
    hp_closure_a_pressure_psi: '', hp_closure_a_duration_min: '', hp_closure_a_acceptance: '', hp_closure_a_start_test: '', hp_closure_a_finish_test: '', hp_closure_a_result: '', hp_closure_a_remark: '',
    lp_closure_b_pressure_psi: '', lp_closure_b_duration_min: '', lp_closure_b_acceptance: '', lp_closure_b_start_test: '', lp_closure_b_finish_test: '', lp_closure_b_result: '', lp_closure_b_remark: '',
    lp_seat_pressure_psi: '', lp_seat_duration_min: '', lp_seat_acceptance: '', lp_seat_start_test: '', lp_seat_finish_test: '', lp_seat_result: '', lp_seat_remark: '',
    actuator_pressure_psi: '', actuator_duration_min: '', actuator_acceptance: '', actuator_start_test: '', actuator_finish_test: '', actuator_result: '', actuator_remark: '',
    seat_pressure_psi: '', seat_duration_min: '', seat_acceptance: 'ALLOWABLE LEAK 0.00 SCFH', seat_start_test: '', seat_finish_test: '', seat_result: '', seat_remark: '',
    func0_pressure_psi: '', func0_duration_min: '', func0_acceptance: 'SMOOTH and LINEAR', func0_start_test: '', func0_finish_test: '', func0_result: '', func0_remark: '',
    func25_pressure_psi: '', func25_duration_min: '', func25_acceptance: '', func25_start_test: '', func25_finish_test: '', func25_result: '', func25_remark: '',
    func50_pressure_psi: '', func50_duration_min: '', func50_acceptance: 'SMOOTH and LINEAR', func50_start_test: '', func50_finish_test: '', func50_result: '', func50_remark: '',
    func75_pressure_psi: '', func75_duration_min: '', func75_acceptance: '', func75_start_test: '', func75_finish_test: '', func75_result: '', func75_remark: '',
      func100_pressure_psi: '', func100_duration_min: '', func100_acceptance: 'SMOOTH and LINEAR', func100_start_test: '', func100_finish_test: '', func100_result: '', func100_remark: '',
      test_rows: '[]',
    })
  const [savingTest, setSavingTest] = useState(false)

  function getTestRows(): string[] {
    try { return JSON.parse(valveTest.test_rows) } catch { return [] }
  }

  function addTestRow() {
    const rows = getTestRows()
    rows.push('')
    setValveTest(prev => ({ ...prev, test_rows: JSON.stringify(rows) }))
  }

  function updateTestRowKey(idx: number, key: string) {
    const rows = getTestRows()
    rows[idx] = key
    setValveTest(prev => ({ ...prev, test_rows: JSON.stringify(rows) }))
  }

  function removeTestRow(idx: number) {
    const rows = getTestRows()
    rows.splice(idx, 1)
    setValveTest(prev => ({ ...prev, test_rows: JSON.stringify(rows) }))
  }

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
      const testRes = await supabase.from('report_valve_test').select('*').eq('report_id', id).single()
      if (testRes.data) {
        const t = testRes.data
        setValveTest({
          spec_api6d: t.spec_api6d ?? false, spec_api598: t.spec_api598 ?? false, spec_fci70_2: t.spec_fci70_2 ?? false, spec_3_15_psi: t.spec_3_15_psi ?? false, spec_sop_no: t.spec_sop_no ?? '', spec_others: t.spec_others ?? '', spec_cv: t.spec_cv?.toString() ?? '',
          shell_pressure_psi: t.shell_pressure_psi?.toString() ?? '', shell_duration_min: t.shell_duration_min?.toString() ?? '', shell_acceptance: t.shell_acceptance ?? 'NO VISIBLE LEAKAGE & PRESSURE DROP', shell_start_test: t.shell_start_test ?? '', shell_finish_test: t.shell_finish_test ?? '', shell_result: t.shell_result ?? '', shell_remark: t.shell_remark ?? '',
          hp_seat_pressure_psi: t.hp_seat_pressure_psi?.toString() ?? '', hp_seat_duration_min: t.hp_seat_duration_min?.toString() ?? '', hp_seat_acceptance: t.hp_seat_acceptance ?? '', hp_seat_start_test: t.hp_seat_start_test ?? '', hp_seat_finish_test: t.hp_seat_finish_test ?? '', hp_seat_result: t.hp_seat_result ?? '', hp_seat_remark: t.hp_seat_remark ?? '',
          hp_closure_a_pressure_psi: t.hp_closure_a_pressure_psi?.toString() ?? '', hp_closure_a_duration_min: t.hp_closure_a_duration_min?.toString() ?? '', hp_closure_a_acceptance: t.hp_closure_a_acceptance ?? '', hp_closure_a_start_test: t.hp_closure_a_start_test ?? '', hp_closure_a_finish_test: t.hp_closure_a_finish_test ?? '', hp_closure_a_result: t.hp_closure_a_result ?? '', hp_closure_a_remark: t.hp_closure_a_remark ?? '',
          lp_closure_b_pressure_psi: t.lp_closure_b_pressure_psi?.toString() ?? '', lp_closure_b_duration_min: t.lp_closure_b_duration_min?.toString() ?? '', lp_closure_b_acceptance: t.lp_closure_b_acceptance ?? '', lp_closure_b_start_test: t.lp_closure_b_start_test ?? '', lp_closure_b_finish_test: t.lp_closure_b_finish_test ?? '', lp_closure_b_result: t.lp_closure_b_result ?? '', lp_closure_b_remark: t.lp_closure_b_remark ?? '',
          lp_seat_pressure_psi: t.lp_seat_pressure_psi?.toString() ?? '', lp_seat_duration_min: t.lp_seat_duration_min?.toString() ?? '', lp_seat_acceptance: t.lp_seat_acceptance ?? '', lp_seat_start_test: t.lp_seat_start_test ?? '', lp_seat_finish_test: t.lp_seat_finish_test ?? '', lp_seat_result: t.lp_seat_result ?? '', lp_seat_remark: t.lp_seat_remark ?? '',
          actuator_pressure_psi: t.actuator_pressure_psi?.toString() ?? '', actuator_duration_min: t.actuator_duration_min?.toString() ?? '', actuator_acceptance: t.actuator_acceptance ?? '', actuator_start_test: t.actuator_start_test ?? '', actuator_finish_test: t.actuator_finish_test ?? '', actuator_result: t.actuator_result ?? '', actuator_remark: t.actuator_remark ?? '',
          seat_pressure_psi: t.seat_pressure_psi?.toString() ?? '', seat_duration_min: t.seat_duration_min?.toString() ?? '', seat_acceptance: t.seat_acceptance ?? 'ALLOWABLE LEAK 0.00 SCFH', seat_start_test: t.seat_start_test ?? '', seat_finish_test: t.seat_finish_test ?? '', seat_result: t.seat_result ?? '', seat_remark: t.seat_remark ?? '',
          func0_pressure_psi: t.func0_pressure_psi?.toString() ?? '', func0_duration_min: t.func0_duration_min?.toString() ?? '', func0_acceptance: t.func0_acceptance ?? 'SMOOTH and LINEAR', func0_start_test: t.func0_start_test ?? '', func0_finish_test: t.func0_finish_test ?? '', func0_result: t.func0_result ?? '', func0_remark: t.func0_remark ?? '',
          func25_pressure_psi: t.func25_pressure_psi?.toString() ?? '', func25_duration_min: t.func25_duration_min?.toString() ?? '', func25_acceptance: t.func25_acceptance ?? '', func25_start_test: t.func25_start_test ?? '', func25_finish_test: t.func25_finish_test ?? '', func25_result: t.func25_result ?? '', func25_remark: t.func25_remark ?? '',
          func50_pressure_psi: t.func50_pressure_psi?.toString() ?? '', func50_duration_min: t.func50_duration_min?.toString() ?? '', func50_acceptance: t.func50_acceptance ?? 'SMOOTH and LINEAR', func50_start_test: t.func50_start_test ?? '', func50_finish_test: t.func50_finish_test ?? '', func50_result: t.func50_result ?? '', func50_remark: t.func50_remark ?? '',
          func75_pressure_psi: t.func75_pressure_psi?.toString() ?? '', func75_duration_min: t.func75_duration_min?.toString() ?? '', func75_acceptance: t.func75_acceptance ?? '', func75_start_test: t.func75_start_test ?? '', func75_finish_test: t.func75_finish_test ?? '', func75_result: t.func75_result ?? '', func75_remark: t.func75_remark ?? '',
          func100_pressure_psi: t.func100_pressure_psi?.toString() ?? '', func100_duration_min: t.func100_duration_min?.toString() ?? '', func100_acceptance: t.func100_acceptance ?? 'SMOOTH and LINEAR', func100_start_test: t.func100_start_test ?? '', func100_finish_test: t.func100_finish_test ?? '', func100_result: t.func100_result ?? '', func100_remark: t.func100_remark ?? '',
          test_rows: t.test_rows ?? '[]',
        })
      }
      setLoading(false)
      await fetchPhotos()

      if (reportRes.data) {
        try {
          const r = reportRes.data
          const key = (r.job_number || '').trim().toUpperCase()
          if (key) {
            const res = await fetch('/api/valve-lookup')
            const valveData: Record<string, { valve_type: string; size: string; class: string; end_connection: string; manufacture: string; serial_no: string; location: string; ex_station: string; project: string; ro_no: string }> = await res.json()
            const match = valveData[key]
            if (match) {
              const patch: Record<string, string | null> = {}
              const fieldMap: [string, string][] = [
                ['valve_type', match.valve_type],
                ['size', match.size],
                ['class', match.class],
                ['end_connection', match.end_connection],
                ['manufacture', match.manufacture],
                ['serial_no', match.serial_no],
                ['ex_station', match.ex_station],
                ['project', match.project],
                ['ro_no', match.ro_no],
              ]
              for (const [field, sheetVal] of fieldMap) {
                if (sheetVal && (r as Record<string, string>)[field] !== sheetVal) {
                  patch[field] = sheetVal
                }
              }
              if (Object.keys(patch).length > 0) {
                await supabase.from('report_inspection').update(patch).eq('id', id)
                setReport((prev) => prev ? { ...prev, ...patch } : prev)
              }
            }
          }
        } catch { /* ignore sync error */ }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, fetchPhotos])

  useEffect(() => {
    window.__reportActions = {
      exportPDF: () => {
        if (!report) return
        exportReportPDF(report, items.map((it) => ({ ...it, id: it.id })), bomItems, photos)
      },
      exportExcel: () => {
        if (!report) return
        exportReportExcel(report, items, bomItems)
      },
    }
    return () => { delete window.__reportActions }
  }, [report, items, bomItems, photos])

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

  async function removeRow(idx: number) {
    const item = items[idx]
    if (item?.id) {
      // Hapus foto terkait dari storage
      const itemPhotos = photos.filter((p) => p.item_id === item.id)
      for (const p of itemPhotos) {
        await supabase.storage.from('report-photos').remove([p.storage_path])
        await supabase.from('report_photos').delete().eq('id', p.id)
      }
      // Hapus item dari database
      await supabase.from('report_inspection_items').delete().eq('id', item.id)
      setPhotos((prev) => prev.filter((p) => p.item_id !== item.id))
    }
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
    const updates: Record<string, string | null> = { [field]: value }
    if (field === 'job_number') {
      const key = value.trim().toUpperCase()
      try {
        const res = await fetch('/api/valve-lookup')
        const freshData: Record<string, { valve_type: string; size: string; class: string; end_connection: string; manufacture: string; serial_no: string; location: string; ex_station: string; project: string; ro_no: string }> = await res.json()
        const match = freshData[key]
        if (match) {
          const fieldMap: [string, string][] = [
            ['valve_type', match.valve_type],
            ['size', match.size],
            ['class', match.class],
            ['end_connection', match.end_connection],
            ['manufacture', match.manufacture],
            ['serial_no', match.serial_no],
            ['ex_station', match.ex_station],
            ['project', match.project],
            ['ro_no', match.ro_no],
          ]
          for (const [f, v] of fieldMap) {
            if (v) updates[f] = v
          }
        }
      } catch { /* ignore fetch error */ }
    }
    const { error } = await supabase
      .from('report_inspection')
      .update(updates)
      .eq('id', id)
    if (error) return alert(error.message)
    setReport((prev) => prev ? { ...prev, ...updates } : prev)
  }

  const BOM_SECTIONS = [
    { value: 'valve', label: 'Valve Parts' },
    { value: 'machining', label: 'Machining' },
    { value: 'coating', label: 'Coating' },
  ]
  const BOM_UNITS = ['pcs', 'set', 'lot', 'kg', 'meter', 'liter', 'pair']

  function addBomRow(section: string) {
    const sectionItems = bomItems.filter((i) => i.section === section)
    setBomItems([
      ...bomItems,
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

  function removeBomRow(idx: number) {
    setBomItems(bomItems.filter((_, i) => i !== idx))
  }

  function updateBomRow(idx: number, field: keyof BomItem, value: unknown) {
    const copy = [...bomItems]
    ;(copy[idx] as Record<string, unknown>)[field] = value
    setBomItems(copy)
  }

  async function saveBom() {
    setSaving(true)
    await supabase.from('report_bom_items').delete().eq('report_id', id)
    const rows = bomItems.map((it, i) => ({
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
      if (error) { setSaving(false); return alert('Error: ' + error.message) }
    }
    setSaving(false)
    alert('BOM tersimpan!')
  }

  function updateTestField(field: keyof ValveTest, value: string | boolean) {
    setValveTest(prev => ({ ...prev, [field]: value }))
  }

  async function saveValveTest() {
    setSavingTest(true)
    const toNum = (v: string) => v ? Number(v) : null
    const payload = {
      report_id: id,
      spec_api6d: valveTest.spec_api6d, spec_api598: valveTest.spec_api598, spec_fci70_2: valveTest.spec_fci70_2, spec_3_15_psi: valveTest.spec_3_15_psi, spec_sop_no: valveTest.spec_sop_no, spec_others: valveTest.spec_others, spec_cv: toNum(valveTest.spec_cv),
      shell_pressure_psi: toNum(valveTest.shell_pressure_psi), shell_duration_min: toNum(valveTest.shell_duration_min), shell_acceptance: valveTest.shell_acceptance, shell_start_test: valveTest.shell_start_test, shell_finish_test: valveTest.shell_finish_test, shell_result: valveTest.shell_result, shell_remark: valveTest.shell_remark,
      hp_seat_pressure_psi: toNum(valveTest.hp_seat_pressure_psi), hp_seat_duration_min: toNum(valveTest.hp_seat_duration_min), hp_seat_acceptance: valveTest.hp_seat_acceptance, hp_seat_start_test: valveTest.hp_seat_start_test, hp_seat_finish_test: valveTest.hp_seat_finish_test, hp_seat_result: valveTest.hp_seat_result, hp_seat_remark: valveTest.hp_seat_remark,
      hp_closure_a_pressure_psi: toNum(valveTest.hp_closure_a_pressure_psi), hp_closure_a_duration_min: toNum(valveTest.hp_closure_a_duration_min), hp_closure_a_acceptance: valveTest.hp_closure_a_acceptance, hp_closure_a_start_test: valveTest.hp_closure_a_start_test, hp_closure_a_finish_test: valveTest.hp_closure_a_finish_test, hp_closure_a_result: valveTest.hp_closure_a_result, hp_closure_a_remark: valveTest.hp_closure_a_remark,
      lp_closure_b_pressure_psi: toNum(valveTest.lp_closure_b_pressure_psi), lp_closure_b_duration_min: toNum(valveTest.lp_closure_b_duration_min), lp_closure_b_acceptance: valveTest.lp_closure_b_acceptance, lp_closure_b_start_test: valveTest.lp_closure_b_start_test, lp_closure_b_finish_test: valveTest.lp_closure_b_finish_test, lp_closure_b_result: valveTest.lp_closure_b_result, lp_closure_b_remark: valveTest.lp_closure_b_remark,
      lp_seat_pressure_psi: toNum(valveTest.lp_seat_pressure_psi), lp_seat_duration_min: toNum(valveTest.lp_seat_duration_min), lp_seat_acceptance: valveTest.lp_seat_acceptance, lp_seat_start_test: valveTest.lp_seat_start_test, lp_seat_finish_test: valveTest.lp_seat_finish_test, lp_seat_result: valveTest.lp_seat_result, lp_seat_remark: valveTest.lp_seat_remark,
      actuator_pressure_psi: toNum(valveTest.actuator_pressure_psi), actuator_duration_min: toNum(valveTest.actuator_duration_min), actuator_acceptance: valveTest.actuator_acceptance, actuator_start_test: valveTest.actuator_start_test, actuator_finish_test: valveTest.actuator_finish_test, actuator_result: valveTest.actuator_result, actuator_remark: valveTest.actuator_remark,
      seat_pressure_psi: toNum(valveTest.seat_pressure_psi), seat_duration_min: toNum(valveTest.seat_duration_min), seat_acceptance: valveTest.seat_acceptance, seat_start_test: valveTest.seat_start_test, seat_finish_test: valveTest.seat_finish_test, seat_result: valveTest.seat_result, seat_remark: valveTest.seat_remark,
      func0_pressure_psi: toNum(valveTest.func0_pressure_psi), func0_duration_min: toNum(valveTest.func0_duration_min), func0_acceptance: valveTest.func0_acceptance, func0_start_test: valveTest.func0_start_test, func0_finish_test: valveTest.func0_finish_test, func0_result: valveTest.func0_result, func0_remark: valveTest.func0_remark,
      func25_pressure_psi: toNum(valveTest.func25_pressure_psi), func25_duration_min: toNum(valveTest.func25_duration_min), func25_acceptance: valveTest.func25_acceptance, func25_start_test: valveTest.func25_start_test, func25_finish_test: valveTest.func25_finish_test, func25_result: valveTest.func25_result, func25_remark: valveTest.func25_remark,
      func50_pressure_psi: toNum(valveTest.func50_pressure_psi), func50_duration_min: toNum(valveTest.func50_duration_min), func50_acceptance: valveTest.func50_acceptance, func50_start_test: valveTest.func50_start_test, func50_finish_test: valveTest.func50_finish_test, func50_result: valveTest.func50_result, func50_remark: valveTest.func50_remark,
      func75_pressure_psi: toNum(valveTest.func75_pressure_psi), func75_duration_min: toNum(valveTest.func75_duration_min), func75_acceptance: valveTest.func75_acceptance, func75_start_test: valveTest.func75_start_test, func75_finish_test: valveTest.func75_finish_test, func75_result: valveTest.func75_result, func75_remark: valveTest.func75_remark,
      func100_pressure_psi: toNum(valveTest.func100_pressure_psi), func100_duration_min: toNum(valveTest.func100_duration_min), func100_acceptance: valveTest.func100_acceptance, func100_start_test: valveTest.func100_start_test, func100_finish_test: valveTest.func100_finish_test, func100_result: valveTest.func100_result, func100_remark: valveTest.func100_remark,
      test_rows: valveTest.test_rows,
    }
    if (valveTest.id) {
      const { error } = await supabase.from('report_valve_test').update(payload).eq('id', valveTest.id)
      if (error) { setSavingTest(false); return alert('Error update: ' + error.message) }
    } else {
      const { data, error } = await supabase.from('report_valve_test').upsert(payload, { onConflict: 'report_id' }).select().single()
      if (error) { setSavingTest(false); return alert('Error save: ' + error.message) }
      if (data) setValveTest(prev => ({ ...prev, id: data.id }))
    }
    setSavingTest(false)
    alert('Valve Test tersimpan!')
  }

  function autoFillStandart(api: 'api6d' | 'api598') {
    if (!report) return
    const classMap: Record<string, number> = { '150': 285, '300': 740, '400': 1000, '600': 1500, '900': 2250, '1500': 3750, '2500': 6250 }
    const classVal = (report.class ?? '').replace(/[^0-9]/g, '')
    const pr = classMap[classVal] ?? (parseFloat(classVal) || 0)
    const sz = parseFloat(report.size ?? '0') || 0
    if (!pr || !sz) return alert('Size atau Class belum terisi di report!')

    let shellPressure = '', shellDuration = ''
    let seatPressure = '', seatDuration = ''

    if (api === 'api6d') {
      shellPressure = String(Math.round(pr * 1.5))
      shellDuration = sz <= 4 ? '2' : sz <= 10 ? '5' : sz <= 18 ? '15' : '30'
      seatPressure = String(Math.round(pr * 1.1))
      seatDuration = sz <= 4 ? '2' : sz <= 18 ? '5' : '10'
    } else {
      shellPressure = String(Math.round(pr * 1.5))
      shellDuration = sz <= 2 ? '0.25' : sz <= 4 ? '1' : sz <= 8 ? '2' : sz <= 14 ? '5' : '10'
      seatPressure = String(Math.round(pr * 1.1))
      seatDuration = sz <= 2 ? '0.25' : sz <= 4 ? '1' : sz <= 8 ? '2' : sz <= 14 ? '5' : '10'
    }

    setValveTest(prev => ({
      ...prev,
      shell_pressure_psi: shellPressure,
      shell_duration_min: shellDuration,
      seat_pressure_psi: seatPressure,
      seat_duration_min: seatDuration,
    }))
  }

  const REPORT_FIELDS: { key: keyof Report; label: string; type?: string }[] = [
    { key: 'report_no', label: 'Report No' },
    { key: 'report_date', label: 'Date' },
    { key: 'project', label: 'Project' },
    { key: 'customer', label: 'Customer' },
    { key: 'valve_type', label: 'Valve Type' },
    { key: 'manufacture', label: 'Manufacture' },
    { key: 'size', label: 'Size (in.)' },
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow border px-4 pt-3">
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'inspection', label: 'Inspection', active: 'bg-blue-600 text-white' },
            { key: 'documentation', label: 'Documentation', href: `/docs?reportId=${id}` },
            { key: 'penetrant', label: 'Liquid Penetrant', active: 'bg-orange-600 text-white' },
            { key: 'torque', label: 'Torque & Anti-static', active: 'bg-purple-600 text-white' },
            { key: 'test', label: 'Test', active: 'bg-red-600 text-white' },
            { key: 'packaging', label: 'Packaging', active: 'bg-green-600 text-white' },
          ].map((t) =>
            t.href ? (
              <Link
                key={t.key}
                href={t.href}
                className="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {t.label}
              </Link>
            ) : (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
                  activeTab === t.key
                    ? t.active
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">{report.job_number}</h2>
        </div>

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
                ) : key === 'report_date' ? (
                  <input
                    className="border-b border-gray-300 bg-transparent text-sm font-medium focus:outline-none focus:border-blue-500 px-1 py-0.5"
                    value={(report[key] as string) || ''}
                    onChange={(e) => updateReportField(key, e.target.value)}
                    onBlur={(e) => updateReportField(key, e.target.value)}
                  />
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
      {activeTab === 'inspection' && (<>
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">Incoming Insp. Check (Condition As Found)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border px-1 py-1 text-xs w-10" rowSpan={2}>No</th>
                <th className="border px-1 py-1 text-xs w-40" rowSpan={2}>Component / Part Description</th>
                <th className="border px-1 py-1 text-xs w-14" rowSpan={2}>Qty</th>
                <th className="border px-1 py-1 text-xs w-56" rowSpan={2}>Condition</th>
                <th className="border px-1 py-1 text-xs" colSpan={3}>Recommendation</th>
                <th className="border px-1 py-1 text-xs w-28" rowSpan={2}>Repair Category</th>
                <th className="border px-1 py-1 text-xs" rowSpan={2}>Comment / Notes / Dimension</th>
                <th className="border px-1 py-1 text-xs w-24" rowSpan={2}>Foto</th>
                <th className="border px-1 py-1 text-xs w-32" rowSpan={2}>Material Specification</th>
                <th className="border px-1 py-1 text-xs w-8" rowSpan={2}></th>
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
                    <td className="border px-1 py-1 text-center text-gray-500 text-xs w-10">{idx + 1}</td>
                    <td className="border px-1 py-1 w-40">
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
                    <td className="border px-1 py-1 w-14">
                      <input
                        type="number"
                        min={0}
                        className="w-full border-0 bg-transparent text-xs text-center focus:outline-none"
                        value={item.qty ?? ''}
                        onChange={(e) => updateRow(idx, 'qty', Number(e.target.value) || null)}
                      />
                    </td>
                    <td className="border px-1 py-1 w-56">
                      <input
                        className="w-full border-0 bg-transparent text-xs focus:outline-none"
                        style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
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
                        style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
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

      {/* BOM Section */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">Bill of Material (BOM)</h3>
          <div className="flex gap-2">
            {BOM_SECTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => addBomRow(s.value)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition"
              >
                + {s.label}
              </button>
            ))}
          </div>
        </div>
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
              {bomItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-center text-gray-500">{idx + 1}</td>
                  <td className="border px-2 py-1">
                    <select
                      className="w-full border-0 bg-transparent text-sm focus:outline-none"
                      value={item.section}
                      onChange={(e) => updateBomRow(idx, 'section', e.target.value)}
                    >
                      {BOM_SECTIONS.map((s) => (
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
                      onChange={(e) => updateBomRow(idx, 'qty', Number(e.target.value) || null)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      className="w-full border-0 bg-transparent text-sm focus:outline-none"
                      value={item.unit}
                      onChange={(e) => updateBomRow(idx, 'unit', e.target.value)}
                    >
                      {BOM_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full border-0 bg-transparent text-sm focus:outline-none"
                      value={item.description}
                      onChange={(e) => updateBomRow(idx, 'description', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full border-0 bg-transparent text-sm focus:outline-none"
                      value={item.specification}
                      onChange={(e) => updateBomRow(idx, 'specification', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full border-0 bg-transparent text-sm focus:outline-none"
                      value={item.dimension}
                      onChange={(e) => updateBomRow(idx, 'dimension', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full border-0 bg-transparent text-sm focus:outline-none"
                      value={item.keterangan}
                      onChange={(e) => updateBomRow(idx, 'keterangan', e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      onClick={() => removeBomRow(idx)}
                      className="text-red-500 hover:text-red-700 font-bold"
                      title="Hapus baris"
                    >
                      x
                    </button>
                  </td>
                </tr>
              ))}
              {bomItems.length === 0 && (
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
            onClick={saveBom}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan BOM'}
          </button>
        </div>
      </div>
      </>)}

      {activeTab === 'test' && (
      <div className="bg-white rounded-lg shadow border p-4 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">VALVE TESTED ACCORDANCE WITH</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={valveTest.spec_api6d} onChange={e => { updateTestField('spec_api6d', e.target.checked); if (e.target.checked) autoFillStandart('api6d') }} className="accent-blue-600" /><span className="font-medium">API 6D</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={valveTest.spec_api598} onChange={e => { updateTestField('spec_api598', e.target.checked); if (e.target.checked) autoFillStandart('api598') }} className="accent-blue-600" /><span className="font-medium">API 598</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={valveTest.spec_fci70_2} onChange={e => updateTestField('spec_fci70_2', e.target.checked)} className="accent-blue-600" /><span className="font-medium">FCI-70-2</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={valveTest.spec_3_15_psi} onChange={e => { updateTestField('spec_3_15_psi', e.target.checked); if (e.target.checked) { setValveTest(prev => ({ ...prev, spec_3_15_psi: true, func0_pressure_psi: '3', func25_pressure_psi: '6', func50_pressure_psi: '9', func75_pressure_psi: '12', func100_pressure_psi: '15' })) } else { setValveTest(prev => ({ ...prev, spec_3_15_psi: false, func0_pressure_psi: '', func25_pressure_psi: '', func50_pressure_psi: '', func75_pressure_psi: '', func100_pressure_psi: '' })) } }} className="accent-blue-600" /><span className="font-medium">3-15 PSI</span></label>
          <div className="flex items-center gap-2"><span className="text-gray-500 text-xs">SOP NO.</span><input type="text" value={valveTest.spec_sop_no} onChange={e => updateTestField('spec_sop_no', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-32" /></div>
          <div className="flex items-center gap-2"><span className="text-gray-500 text-xs">CV</span><input type="number" step="0.01" value={valveTest.spec_cv} onChange={e => updateTestField('spec_cv', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-24" placeholder="0" /></div>
          <div className="flex items-center gap-2"><span className="text-gray-500 text-xs">OTHERS</span><input type="text" value={valveTest.spec_others} onChange={e => updateTestField('spec_others', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-32" /></div>
        </div>

        <h3 className="text-sm font-bold text-gray-700">ACCEPTANCE STANDARD</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border px-2 py-2 text-left" rowSpan={2}>DESCRIPTION TEST</th>
                <th className="border px-2 py-1 text-center" colSpan={2}>STANDART</th>
                <th className="border px-2 py-2 text-center" rowSpan={2}>ACCEPTANCE CRITERIA</th>
                <th className="border px-2 py-2 text-center" rowSpan={2}>START TEST</th>
                <th className="border px-2 py-2 text-center" rowSpan={2}>FINISH TEST</th>
                <th className="border px-2 py-2 text-center" rowSpan={2}>RESULT</th>
                <th className="border px-2 py-2 text-center" rowSpan={2}>REMARK/NOTES</th>
                <th className="border px-2 py-2 text-center" rowSpan={2}></th>
              </tr>
              <tr className="bg-blue-900 text-white">
                <th className="border px-2 py-1 text-center">PRESSURE (Psi)</th>
                <th className="border px-2 py-1 text-center">TIME (Minutes)</th>
              </tr>
            </thead>
            <tbody>
              {getTestRows().map((key, i) => {
                const opt = TEST_OPTIONS.find(t => t.key === key)
                const isSeat = key === 'seat'
                const criteria = isSeat ? (valveTest.spec_cv ? `ALLOWABLE LEAK ${(Number(valveTest.spec_cv) * 0.186).toFixed(2)} SCFH` : 'ALLOWABLE LEAK 0.00 SCFH') : (opt?.criteria ?? '')
                return (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border px-1 py-1 w-52">
                      <select value={key} onChange={e => updateTestRowKey(i, e.target.value)} className="w-full border-0 bg-transparent text-xs focus:outline-none">
                        <option value="">-- Pilih Test --</option>
                        {TEST_OPTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                    </td>
                    <td className="border px-1 py-1"><input type="number" value={(valveTest as any)[`${key}_pressure_psi`] ?? ''} onChange={e => updateTestField(`${key}_pressure_psi` as keyof ValveTest, e.target.value)} className="w-full border-0 bg-transparent text-center text-xs focus:outline-none" placeholder="Psi" disabled={!key} /></td>
                    <td className="border px-1 py-1"><input type="number" value={(valveTest as any)[`${key}_duration_min`] ?? ''} onChange={e => updateTestField(`${key}_duration_min` as keyof ValveTest, e.target.value)} className="w-full border-0 bg-transparent text-center text-xs focus:outline-none" placeholder="min" disabled={!key} /></td>
                    <td className="border px-2 py-1 text-center text-gray-600 text-xs">{criteria}</td>
                    <td className="border px-1 py-1"><input type="text" value={(valveTest as any)[`${key}_start_test`] ?? ''} onChange={e => updateTestField(`${key}_start_test` as keyof ValveTest, e.target.value)} className="w-full border-0 bg-transparent text-center text-xs focus:outline-none" disabled={!key} /></td>
                    <td className="border px-1 py-1"><input type="text" value={(valveTest as any)[`${key}_finish_test`] ?? ''} onChange={e => updateTestField(`${key}_finish_test` as keyof ValveTest, e.target.value)} className="w-full border-0 bg-transparent text-center text-xs focus:outline-none" disabled={!key} /></td>
                    <td className="border px-1 py-1"><input type="text" value={(valveTest as any)[`${key}_result`] ?? ''} onChange={e => updateTestField(`${key}_result` as keyof ValveTest, e.target.value)} className="w-full border-0 bg-transparent text-center text-xs focus:outline-none" placeholder="PASS/FAIL" disabled={!key} /></td>
                    <td className="border px-1 py-1"><input type="text" value={(valveTest as any)[`${key}_remark`] ?? ''} onChange={e => updateTestField(`${key}_remark` as keyof ValveTest, e.target.value)} className="w-full border-0 bg-transparent text-xs focus:outline-none" disabled={!key} /></td>
                    <td className="border px-1 py-1 text-center"><button onClick={() => removeTestRow(i)} className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button></td>
                  </tr>
                )
              })}
              {getTestRows().length === 0 && (
                <tr><td colSpan={9} className="border px-2 py-6 text-center text-gray-400">Belum ada test. Klik &quot;+ Tambah Baris&quot; untuk menambah.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={addTestRow} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition font-medium">+ Tambah Baris</button>
          <button onClick={saveValveTest} disabled={savingTest} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium disabled:opacity-50">
            {savingTest ? 'Menyimpan...' : 'Simpan Valve Test'}
          </button>
        </div>
      </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 'inspection' && activeTab !== 'documentation' && activeTab !== 'test' && (
        <div className="bg-white rounded-lg shadow border p-8 text-center">
          <p className="text-gray-400 text-sm">Fitur ini akan segera tersedia.</p>
        </div>
      )}

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
