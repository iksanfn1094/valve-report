'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const FIELDS = [
  { key: 'job_number', label: 'Valve Id', required: true },
  { key: 'report_no', label: 'Report No' },
  { key: 'report_date', label: 'Report Date', type: 'date' },
  { key: 'project', label: 'Project' },
  { key: 'customer', label: 'Customer' },
  { key: 'ro_no', label: 'RO No' },
  { key: 'ex_station', label: 'EX Station' },
  { key: 'valve_type', label: 'Valve Type' },
  { key: 'manufacture', label: 'Manufacture' },
  { key: 'size', label: 'Size' },
  { key: 'class', label: 'Class' },
  { key: 'serial_no', label: 'Serial No' },
  { key: 'end_connection', label: 'End Connection' },
  { key: 'operated', label: 'Operated' },
  { key: 'location', label: 'Location' },
  { key: 'inspector_name', label: 'Inspector Name' },
]

const CATEGORIES = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'minor', label: 'Minor Repair' },
  { value: 'major', label: 'Major Repair' },
]

export default function NewReport() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    job_number: '',
    report_no: '',
    report_date: new Date().toISOString().split('T')[0],
    project: '',
    customer: '',
    ro_no: '',
    ex_station: '',
    valve_type: '',
    manufacture: '',
    size: '',
    class: '',
    serial_no: '',
    end_connection: '',
    operated: '',
    location: '',
    inspector_name: '',
    category: 'inspection',
  })

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.job_number.trim()) {
      alert('Job Number wajib diisi!')
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('report_inspection')
      .insert({
        job_number: form.job_number,
        report_no: form.report_no || null,
        report_date: form.report_date || null,
        project: form.project || null,
        customer: form.customer || null,
        ro_no: form.ro_no || null,
        ex_station: form.ex_station || null,
        valve_type: form.valve_type || null,
        manufacture: form.manufacture || null,
        size: form.size || null,
        class: form.class || null,
        serial_no: form.serial_no || null,
        end_connection: form.end_connection || null,
        operated: form.operated || null,
        location: form.location || null,
        inspector_name: form.inspector_name || null,
        category: form.category,
        status: 'draft',
      })
      .select()
      .single()
    setSaving(false)
    if (error) return alert('Error: ' + error.message)
    router.push(`/reports/${data.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Buat Inspection Report Baru</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === 'job_number' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={f.type || 'text'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form[f.key] || ''}
                onChange={(e) => updateField(f.key, e.target.value)}
                required={f.required}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan & Lanjut'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
