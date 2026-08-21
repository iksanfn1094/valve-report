'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Timesheet = {
  id: string
  customer: string
  service_person: string
  assign_date: string
  location: string
  status: string
  created_at: string
}

export default function TimesheetListPage() {
  const [list, setList] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('timesheet')
        .select('id, customer, service_person, assign_date, location, status, created_at')
        .order('created_at', { ascending: false })
      if (data) setList(data)
      setLoading(false)
    }
    load()
  }, [])

  async function deleteTs(id: string) {
    if (!confirm('Hapus timesheet ini?')) return
    await supabase.from('timesheet_entries').delete().eq('timesheet_id', id)
    await supabase.from('timesheet').delete().eq('id', id)
    setList((prev) => prev.filter((t) => t.id !== id))
  }

  if (loading) return <p className="text-gray-500 py-10 text-center">Loading...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Daftar Timesheet</h1>
        <Link href="/timesheet/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium">
          + New Timesheet
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-xs text-gray-600">
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Service Person</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Belum ada timesheet.</td></tr>
            )}
            {list.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link href={`/timesheet/${t.id}`} className="text-blue-600 hover:underline font-medium">
                    {t.customer || '-'}
                  </Link>
                </td>
                <td className="px-3 py-2 text-gray-600">{t.service_person || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{t.assign_date || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{t.location || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    t.status === 'approved' ? 'bg-green-100 text-green-700' :
                    t.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{t.status}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => deleteTs(t.id)} className="text-red-400 hover:text-red-600 text-xs">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
