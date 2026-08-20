'use client'

export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Report = {
  id: string
  job_number: string
  report_no: string | null
  project: string | null
  customer: string | null
  valve_type: string | null
  size: string | null
  category: string | null
  status: string
  report_date: string | null
  created_at: string
}

export default function ReportsList() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('report_inspection')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setReports(data ?? [])
        setLoading(false)
      })
  }, [])

  async function deleteReport(reportId: string) {
    if (!confirm('Hapus report ini? Semua data terkait (items, BOM, foto) akan ikut terhapus.')) return
    const { error } = await supabase.from('report_inspection').delete().eq('id', reportId)
    if (error) return alert('Gagal hapus: ' + error.message)
    setReports(reports.filter((r) => r.id !== reportId))
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
        <h1 className="text-2xl font-bold text-gray-800">Daftar Inspection Report</h1>
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
                <th className="border px-3 py-2">Job No</th>
                <th className="border px-3 py-2">Report No</th>
                <th className="border px-3 py-2">Date</th>
                <th className="border px-3 py-2">Project</th>
                <th className="border px-3 py-2">Customer</th>
                <th className="border px-3 py-2">Valve Type</th>
                <th className="border px-3 py-2">Size</th>
                <th className="border px-3 py-2">Category</th>
                <th className="border px-3 py-2">Status</th>
                <th className="border px-3 py-2">Aksi</th>
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
                        Buka
                      </Link>
                      <button
                        onClick={() => deleteReport(r.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Hapus
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
