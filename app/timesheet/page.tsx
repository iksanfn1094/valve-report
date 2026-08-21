'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Timesheet = {
  id: string
  customer: string | null
  service_person: string | null
  assign_date: string | null
  location: string | null
  end_user_project: string | null
  internal_so_no: string | null
  assign_role: string | null
  status: string
  created_at: string
}

export default function TimesheetList() {
  const [list, setList] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('timesheet')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setList(data ?? [])
        setLoading(false)
      })
  }, [])

  async function deleteTs(id: string) {
    if (!confirm('Hapus timesheet ini? Semua data terkait akan ikut terhapus.')) return
    const { error } = await supabase.from('timesheet').delete().eq('id', id)
    if (error) return alert('Gagal hapus: ' + error.message)
    setList(list.filter((t) => t.id !== id))
  }

  const filtered = list.filter((t) => {
    const q = search.toLowerCase()
    return (
      !q ||
      t.customer?.toLowerCase().includes(q) ||
      t.service_person?.toLowerCase().includes(q) ||
      t.location?.toLowerCase().includes(q) ||
      t.end_user_project?.toLowerCase().includes(q) ||
      t.internal_so_no?.toLowerCase().includes(q)
    )
  })

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'submitted': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Timesheet</h1>
        <Link
          href="/timesheet/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + New Timesheet
        </Link>
      </div>

      <input
        type="text"
        placeholder="Cari berdasarkan customer, service person, location, project..."
        className="w-full border rounded-lg px-4 py-2 mb-4 text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-10">Belum ada timesheet. Klik &quot;+ New Timesheet&quot; untuk membuat.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border px-3 py-2">Customer</th>
                <th className="border px-3 py-2">S/O No.</th>
                <th className="border px-3 py-2">Date</th>
                <th className="border px-3 py-2">Project</th>
                <th className="border px-3 py-2">Service Person</th>
                <th className="border px-3 py-2">Location</th>
                <th className="border px-3 py-2">Role</th>
                <th className="border px-3 py-2">Status</th>
                <th className="border px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 font-medium">{t.customer || '-'}</td>
                  <td className="border px-3 py-2">{t.internal_so_no || '-'}</td>
                  <td className="border px-3 py-2">{t.assign_date || '-'}</td>
                  <td className="border px-3 py-2">{t.end_user_project || '-'}</td>
                  <td className="border px-3 py-2">{t.service_person || '-'}</td>
                  <td className="border px-3 py-2">{t.location || '-'}</td>
                  <td className="border px-3 py-2">{t.assign_role || '-'}</td>
                  <td className="border px-3 py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="flex gap-2">
                      <Link href={`/timesheet/${t.id}`} className="text-blue-600 hover:underline text-sm">
                        Buka
                      </Link>
                      <button
                        onClick={() => deleteTs(t.id)}
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
