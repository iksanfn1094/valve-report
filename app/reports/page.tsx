'use client'

export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { exportReportPDF } from '@/lib/export-pdf'

type Report = {
  id: string
  job_number: string
  report_no: string | null
  project: string | null
  customer: string | null
  valve_type: string | null
  size: string | null
  class: string | null
  category: string | null
  status: string
  report_date: string | null
  created_at: string
  end_connection: string | null
  manufacture: string | null
  serial_no: string | null
  location: string | null
  ex_station: string | null
  ro_no: string | null
}

export default function ReportsList() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('report_inspection')
      .select('*')
      .order('created_at', { ascending: false })
      .then(async ({ data, error }) => {
        if (!error) setReports(data ?? [])
        setLoading(false)

        if (!error && data && data.length > 0) {
          try {
            const needsCustomerFix = data.filter((r) => r.customer !== 'PHE ONWJ')
            if (needsCustomerFix.length > 0) {
              await supabase.from('report_inspection').update({ customer: 'PHE ONWJ' }).in('id', needsCustomerFix.map((r) => r.id))
              setReports((prev) => prev.map((r) => r.customer !== 'PHE ONWJ' ? { ...r, customer: 'PHE ONWJ' } : r))
            }

            const res = await fetch('/api/valve-lookup')
            const valveData: Record<string, { valve_type: string; size: string; class: string; end_connection: string; manufacture: string; serial_no: string; location: string; ex_station: string; project: string; ro_no: string }> = await res.json()
            let hasUpdate = false
            const updates = data.map((r) => {
              const key = (r.job_number || '').trim().toUpperCase()
              const match = valveData[key]
              if (!match) return null
              const patch: Record<string, string> = {}
              const fieldMap: [string, string, string | null][] = [
                ['valve_type', match.valve_type, r.valve_type],
                ['size', match.size, r.size],
                ['class', match.class, r.class],
                ['end_connection', match.end_connection, r.end_connection],
                ['manufacture', match.manufacture, r.manufacture],
                ['serial_no', match.serial_no, r.serial_no],
                ['ex_station', match.ex_station, r.ex_station],
                ['project', match.project, r.project],
                ['ro_no', match.ro_no, r.ro_no],
              ]
              for (const [field, sheetVal, dbVal] of fieldMap) {
                if (sheetVal && dbVal !== sheetVal) { hasUpdate = true; patch[field] = sheetVal }
              }
              return Object.keys(patch).length > 0 ? { id: r.id, ...patch } : null
            }).filter(Boolean) as { id: string }[]

            if (hasUpdate && updates.length > 0) {
              for (const u of updates) {
                const { id: uid, ...fields } = u
                await supabase.from('report_inspection').update(fields).eq('id', uid)
              }
              setReports((prev) => prev.map((r) => {
                const u = updates.find((x) => x.id === r.id)
                return u ? { ...r, ...u } : r
              }))
            }
          } catch { /* ignore sync error */ }
        }
      })
  }, [])

  async function deleteReport(reportId: string) {
    if (!confirm('Delete this report? All related data (items, BOM, photos) will also be deleted.')) return
    const { error } = await supabase.from('report_inspection').delete().eq('id', reportId)
    if (error) return alert('Delete failed: ' + error.message)
    setReports(reports.filter((r) => r.id !== reportId))
  }

  async function generatePdf(reportId: string) {
    setGeneratingPdf(reportId)
    try {
      const [reportRes, itemsRes, bomRes, testRes, docRes, photoRes] = await Promise.all([
        supabase.from('report_inspection').select('*').eq('id', reportId).single(),
        supabase.from('report_inspection_items').select('*').eq('report_id', reportId).order('sort_order'),
        supabase.from('report_bom_items').select('*').eq('report_id', reportId).order('sort_order'),
        supabase.from('report_valve_test').select('*').eq('report_id', reportId).single(),
        supabase.from('report_documentation').select('*').eq('report_id', reportId).order('sort_order'),
        supabase.from('report_photos').select('*').eq('report_id', reportId).order('uploaded_at'),
      ])

      if (!reportRes.data) return alert('Report tidak ditemukan')

      const report = reportRes.data
      const items = (itemsRes.data ?? []).map((it: Record<string, unknown>) => ({
        id: it.id as string,
        item_no: it.item_no as number,
        component_name: (it.component_name as string) || '',
        qty: it.qty as number | null,
        condition_note: (it.condition_note as string) || '',
        recommendation: (it.recommendation as string[]) || [],
        comment: (it.comment as string) || '',
        spec_material: (it.spec_material as string) || '',
      }))
      const bomItems = (bomRes.data ?? []).map((b: Record<string, unknown>) => ({
        section: (b.section as string) || '',
        item_no: b.item_no as number,
        qty: b.qty as number | null,
        unit: (b.unit as string) || '',
        description: (b.description as string) || '',
        specification: (b.specification as string) || '',
        dimension: (b.dimension as string) || '',
        keterangan: (b.keterangan as string) || '',
      }))

      let valveTest: Record<string, unknown> | undefined
      if (testRes.data) {
        const t = testRes.data
        valveTest = {
          spec_api6d: t.spec_api6d ?? false, spec_api598: t.spec_api598 ?? false, spec_fci70_2: t.spec_fci70_2 ?? false, spec_3_15_psi: t.spec_3_15_psi ?? false, spec_sop_no: t.spec_sop_no ?? '', spec_others: t.spec_others ?? '', spec_cv: t.spec_cv?.toString() ?? '',
          shell_pressure_psi: t.shell_pressure_psi?.toString() ?? '', shell_duration_min: t.shell_duration_min?.toString() ?? '', shell_acceptance: t.shell_acceptance ?? 'NO VISIBLE LEAKAGE & PRESSURE DROP', shell_start_test: t.shell_start_test ?? '', shell_finish_test: t.shell_finish_test ?? '', shell_result: t.shell_result ?? '', shell_remark: t.shell_remark ?? '',
          hp_seat_pressure_psi: t.hp_seat_pressure_psi?.toString() ?? '', hp_seat_duration_min: t.hp_seat_duration_min?.toString() ?? '', hp_seat_acceptance: t.hp_seat_acceptance ?? '', hp_seat_start_test: t.hp_seat_start_test ?? '', hp_seat_finish_test: t.hp_seat_finish_test ?? '', hp_seat_result: t.hp_seat_result ?? '', hp_seat_remark: t.hp_seat_remark ?? '',
          hp_closure_a_pressure_psi: t.hp_closure_a_pressure_psi?.toString() ?? '', hp_closure_a_duration_min: t.hp_closure_a_duration_min?.toString() ?? '', hp_closure_a_acceptance: t.hp_closure_a_acceptance ?? '', hp_closure_a_start_test: t.hp_closure_a_start_test ?? '', hp_closure_a_finish_test: t.hp_closure_a_finish_test ?? '', hp_closure_a_result: t.hp_closure_a_result ?? '', hp_closure_a_remark: t.hp_closure_a_remark ?? '',
          lp_closure_b_pressure_psi: t.lp_closure_b_pressure_psi?.toString() ?? '', lp_closure_b_duration_min: t.lp_closure_b_duration_min?.toString() ?? '', lp_closure_b_acceptance: t.lp_closure_b_acceptance ?? '', lp_closure_b_start_test: t.lp_closure_b_start_test ?? '', lp_closure_b_finish_test: t.lp_closure_b_finish_test ?? '', lp_closure_b_result: t.lp_closure_b_result ?? '', lp_closure_b_remark: t.lp_closure_b_remark ?? '',
          lp_seat_pressure_psi: t.lp_seat_pressure_psi?.toString() ?? '', lp_seat_duration_min: t.lp_seat_duration_min?.toString() ?? '', lp_seat_acceptance: t.lp_seat_acceptance ?? '', lp_seat_start_test: t.lp_seat_start_test ?? '', lp_seat_finish_test: t.lp_seat_finish_test ?? '', lp_seat_result: t.lp_seat_result ?? '', lp_seat_remark: t.lp_seat_remark ?? '',
          seat_leak_pressure_psi: t.seat_leak_pressure_psi?.toString() ?? '', seat_leak_duration_min: t.seat_leak_duration_min?.toString() ?? '', seat_leak_acceptance: t.seat_leak_acceptance ?? '', seat_leak_start_test: t.seat_leak_start_test ?? '', seat_leak_finish_test: t.seat_leak_finish_test ?? '', seat_leak_result: t.seat_leak_result ?? '', seat_leak_remark: t.seat_leak_remark ?? '',
          hp_closure_pressure_psi: t.hp_closure_pressure_psi?.toString() ?? '', hp_closure_duration_min: t.hp_closure_duration_min?.toString() ?? '', hp_closure_acceptance: t.hp_closure_acceptance ?? '', hp_closure_start_test: t.hp_closure_start_test ?? '', hp_closure_finish_test: t.hp_closure_finish_test ?? '', hp_closure_result: t.hp_closure_result ?? '', hp_closure_remark: t.hp_closure_remark ?? '',
          lp_closure_pressure_psi: t.lp_closure_pressure_psi?.toString() ?? '', lp_closure_duration_min: t.lp_closure_duration_min?.toString() ?? '', lp_closure_acceptance: t.lp_closure_acceptance ?? '', lp_closure_start_test: t.lp_closure_start_test ?? '', lp_closure_finish_test: t.lp_closure_finish_test ?? '', lp_closure_result: t.lp_closure_result ?? '', lp_closure_remark: t.lp_closure_remark ?? '',
          hp_closure_b_pressure_psi: t.hp_closure_b_pressure_psi?.toString() ?? '', hp_closure_b_duration_min: t.hp_closure_b_duration_min?.toString() ?? '', hp_closure_b_acceptance: t.hp_closure_b_acceptance ?? '', hp_closure_b_start_test: t.hp_closure_b_start_test ?? '', hp_closure_b_finish_test: t.hp_closure_b_finish_test ?? '', hp_closure_b_result: t.hp_closure_b_result ?? '', hp_closure_b_remark: t.hp_closure_b_remark ?? '',
          lp_closure_a_pressure_psi: t.lp_closure_a_pressure_psi?.toString() ?? '', lp_closure_a_duration_min: t.lp_closure_a_duration_min?.toString() ?? '', lp_closure_a_acceptance: t.lp_closure_a_acceptance ?? '', lp_closure_a_start_test: t.lp_closure_a_start_test ?? '', lp_closure_a_finish_test: t.lp_closure_a_finish_test ?? '', lp_closure_a_result: t.lp_closure_a_result ?? '', lp_closure_a_remark: t.lp_closure_a_remark ?? '',
          actuator_pressure_psi: t.actuator_pressure_psi?.toString() ?? '', actuator_duration_min: t.actuator_duration_min?.toString() ?? '', actuator_acceptance: t.actuator_acceptance ?? '', actuator_start_test: t.actuator_start_test ?? '', actuator_finish_test: t.actuator_finish_test ?? '', actuator_result: t.actuator_result ?? '', actuator_remark: t.actuator_remark ?? '',
          seat_pressure_psi: t.seat_pressure_psi?.toString() ?? '', seat_duration_min: t.seat_duration_min?.toString() ?? '', seat_acceptance: t.seat_acceptance ?? 'ALLOWABLE LEAK 0.00 SCFH', seat_start_test: t.seat_start_test ?? '', seat_finish_test: t.seat_finish_test ?? '', seat_result: t.seat_result ?? '', seat_remark: t.seat_remark ?? '',
          func0_pressure_psi: t.func0_pressure_psi?.toString() ?? '', func0_duration_min: t.func0_duration_min?.toString() ?? '', func0_acceptance: t.func0_acceptance ?? 'SMOOTH and LINEAR', func0_start_test: t.func0_start_test ?? '', func0_finish_test: t.func0_finish_test ?? '', func0_result: t.func0_result ?? '', func0_remark: t.func0_remark ?? '',
          func25_pressure_psi: t.func25_pressure_psi?.toString() ?? '', func25_duration_min: t.func25_duration_min?.toString() ?? '', func25_acceptance: t.func25_acceptance ?? '', func25_start_test: t.func25_start_test ?? '', func25_finish_test: t.func25_finish_test ?? '', func25_result: t.func25_result ?? '', func25_remark: t.func25_remark ?? '',
          func50_pressure_psi: t.func50_pressure_psi?.toString() ?? '', func50_duration_min: t.func50_duration_min?.toString() ?? '', func50_acceptance: t.func50_acceptance ?? 'SMOOTH and LINEAR', func50_start_test: t.func50_start_test ?? '', func50_finish_test: t.func50_finish_test ?? '', func50_result: t.func50_result ?? '', func50_remark: t.func50_remark ?? '',
          func75_pressure_psi: t.func75_pressure_psi?.toString() ?? '', func75_duration_min: t.func75_duration_min?.toString() ?? '', func75_acceptance: t.func75_acceptance ?? '', func75_start_test: t.func75_start_test ?? '', func75_finish_test: t.func75_finish_test ?? '', func75_result: t.func75_result ?? '', func75_remark: t.func75_remark ?? '',
          func100_pressure_psi: t.func100_pressure_psi?.toString() ?? '', func100_duration_min: t.func100_duration_min?.toString() ?? '', func100_acceptance: t.func100_acceptance ?? 'SMOOTH and LINEAR', func100_start_test: t.func100_start_test ?? '', func100_finish_test: t.func100_finish_test ?? '', func100_result: t.func100_result ?? '', func100_remark: t.func100_remark ?? '',
          test_rows: t.test_rows ?? '[]',
          test_photos: t.test_photos ?? '[]',
        }
      }

      const docItems = (docRes.data ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        component_name: (d.component_name as string) ?? '',
        photo_before: (() => { try { return JSON.parse((d.photo_before as string) || '[]') } catch { return [] as string[] } })(),
        photo_after: (() => { try { return JSON.parse((d.photo_after as string) || '[]') } catch { return [] as string[] } })(),
      }))

      const photos = (photoRes.data ?? []).map((p: Record<string, unknown>) => {
        const { data: urlData } = supabase.storage.from('report-photos').getPublicUrl(p.storage_path as string)
        return { item_id: p.item_id as string, caption: p.caption as string | null, url: urlData.publicUrl }
      })

      await exportReportPDF(report, items, bomItems, photos, 'all', valveTest as never, docItems)
    } catch (e: unknown) {
      alert('Gagal generate PDF: ' + (e instanceof Error ? e.message : String(e)))
    }
    setGeneratingPdf(null)
  }

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase()
    return (
      !q ||
      r.job_number?.toLowerCase().includes(q) ||
      r.report_no?.toLowerCase().includes(q) ||
      r.project?.toLowerCase().includes(q) ||
      r.customer?.toLowerCase().includes(q)
    )
  })

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'submitted': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const catColor = (c: string | null) => {
    switch (c) {
      case 'major': return 'bg-red-100 text-red-700'
      case 'minor': return 'bg-orange-100 text-orange-700'
      case 'inspection': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Report</h1>
        <Link
          href="/reports/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + New Report
        </Link>
      </div>

      <input
        type="text"
        placeholder="Cari berdasarkan job number, project, customer..."
        className="w-full border rounded-lg px-4 py-2 mb-4 text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-10">Belum ada report. Klik &quot;+ New Report&quot; untuk membuat.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border px-3 py-2">Valve Id</th>
                <th className="border px-3 py-2">Report No</th>
                <th className="border px-3 py-2">Date</th>
                <th className="border px-3 py-2">Project</th>
                <th className="border px-3 py-2">Customer</th>
                <th className="border px-3 py-2">Valve Type</th>
                <th className="border px-3 py-2">Size (in.)</th>
                <th className="border px-3 py-2">Class</th>
                <th className="border px-3 py-2">Category</th>
                <th className="border px-3 py-2">Status</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 font-medium">{r.job_number}</td>
                  <td className="border px-3 py-2">{r.report_no || '-'}</td>
                  <td className="border px-3 py-2">{r.report_date || '-'}</td>
                  <td className="border px-3 py-2">{r.project || '-'}</td>
                  <td className="border px-3 py-2">{r.customer || '-'}</td>
                  <td className="border px-3 py-2">{r.valve_type || '-'}</td>
                  <td className="border px-3 py-2">{r.size || '-'}</td>
                  <td className="border px-3 py-2">{r.class || '-'}</td>
                  <td className="border px-3 py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${catColor(r.category)}`}>
                      {r.category || '-'}
                    </span>
                  </td>
                  <td className="border px-3 py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="flex gap-2">
                      <Link href={`/reports/${r.id}`} className="text-blue-600 hover:underline text-sm">
                        Open
                      </Link>
                      <button
                        onClick={() => generatePdf(r.id)}
                        disabled={generatingPdf === r.id}
                        className="text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
                      >
                        {generatingPdf === r.id ? 'Generating...' : 'PDF'}
                      </button>
                      <button
                        onClick={() => deleteReport(r.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
