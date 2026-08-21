'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase'
import { exportTimesheetPDF } from '@/lib/export-timesheet-pdf'

type TimesheetEntry = {
  id?: string
  entry_date: string
  time_start: string
  time_end: string
  overtime: string
  description: string
}

type Timesheet = {
  id: string
  customer: string
  internal_so_no: string
  customer_po: string
  letter_of_assignment: string
  end_user_project: string
  allowance: string
  assign_date: string
  assign_role: string
  location: string
  service_person: string
  attachment: string
  mobilization_date: string
  worksite_office: boolean
  worksite_plant: boolean
  worksite_onshore: boolean
  worksite_offshore: boolean
  brief_scope: string
  service_workshop: boolean
  service_field: boolean
  service_eng: boolean
  service_other: boolean
  service_other_text: string
  summary_of_service: string
  status_service: string
  nonconformance: boolean | null
  incident_spill: boolean | null
  tools_damage: boolean | null
  packing_list_no: string
  demobilization_date: string
  service_person_name: string
  customer_rep_name: string
  status: string
}

const emptyTs: Omit<Timesheet, 'id'> = {
  customer: '', internal_so_no: '', customer_po: '', letter_of_assignment: '',
  end_user_project: '', allowance: '', assign_date: '', assign_role: '',
  location: '', service_person: '', attachment: '', mobilization_date: '',
  worksite_office: false, worksite_plant: false, worksite_onshore: false, worksite_offshore: false,
  brief_scope: '',
  service_workshop: false, service_field: false, service_eng: false, service_other: false, service_other_text: '',
  summary_of_service: '', status_service: '', nonconformance: null, incident_spill: null, tools_damage: null,
  packing_list_no: '', demobilization_date: '', service_person_name: '', customer_rep_name: '',
  status: 'draft',
}

function makeEntry(): TimesheetEntry {
  return { entry_date: '', time_start: '', time_end: '', overtime: '', description: '' }
}

export default function TimesheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ts, setTs] = useState<Omit<Timesheet, 'id'> & { id?: string }>(emptyTs)
  const [entries, setEntries] = useState<TimesheetEntry[]>([makeEntry()])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tsId, setTsId] = useState<string | null>(id)

  const loadExisting = useCallback(async () => {
    const { data } = await supabase.from('timesheet').select('*').eq('id', id).single()
    if (data) {
      setTs(data)
      setTsId(data.id)
      const { data: eData } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('timesheet_id', data.id)
        .order('sort_order')
      if (eData && eData.length > 0) setEntries(eData)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadExisting() }, [loadExisting])

  function setField<K extends keyof Timesheet>(key: K, val: Timesheet[K]) {
    setTs((prev) => ({ ...prev, [key]: val }))
  }

  function setEntry(idx: number, key: keyof TimesheetEntry, val: string) {
    setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e))
  }

  function addEntry() { setEntries([...entries, makeEntry()]) }
  function removeEntry(idx: number) { setEntries(entries.filter((_, i) => i !== idx)) }

  async function save() {
    setSaving(true)
    const payload = { ...ts }
    delete (payload as Record<string, unknown>).id
    for (const k of ['assign_date', 'mobilization_date', 'demobilization_date']) {
      if ((payload as unknown as Record<string, string>)[k] === '') (payload as unknown as Record<string, string | null>)[k] = null
    }
    if (payload.allowance === '') (payload as unknown as Record<string, string | null>).allowance = null

    let id = tsId
    if (id) {
      await supabase.from('timesheet').update(payload).eq('id', id)
    } else {
      const { data } = await supabase.from('timesheet').insert(payload).select().single()
      if (data) { id = data.id; setTsId(data.id) }
    }
    if (!id) { setSaving(false); return }

    await supabase.from('timesheet_entries').delete().eq('timesheet_id', id)
    const rows = entries
      .filter((e) => e.entry_date || e.time_start || e.description)
      .map((e, i) => ({
        timesheet_id: id,
        entry_date: e.entry_date || null,
        time_start: e.time_start || null,
        time_end: e.time_end || null,
        overtime: e.overtime || null,
        description: e.description || null,
        sort_order: i,
      }))
    if (rows.length > 0) {
      await supabase.from('timesheet_entries').insert(rows)
    }

    setSaving(false)
    alert('Tersimpan!')
  }

  useEffect(() => {
    window.__timesheetActions = {
      exportPDF: () => exportTimesheetPDF(ts, entries),
    }
    return () => { delete window.__timesheetActions }
  }, [ts, entries])

  if (loading) return <p className="text-gray-500 py-10 text-center">Loading...</p>

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-2 sm:p-0">
      <h1 className="text-xl font-bold text-blue-900">Timesheet</h1>

      {/* Header Info */}
      <Section title="Project Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Customer" value={ts.customer} onChange={(v) => setField('customer', v)} />
          <Field label="Internal S/O No." value={ts.internal_so_no} onChange={(v) => setField('internal_so_no', v)} />
          <Field label="Customer PO" value={ts.customer_po} onChange={(v) => setField('customer_po', v)} />
          <Field label="Letter Of Assignment" value={ts.letter_of_assignment} onChange={(v) => setField('letter_of_assignment', v)} />
          <Field label="End-User/Project" value={ts.end_user_project} onChange={(v) => setField('end_user_project', v)} />
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Allowance</label>
            <div className="flex gap-4 items-center h-9">
              <CheckRadio label="Chargeable" checked={ts.allowance === 'chargeable'} onChange={() => setField('allowance', 'chargeable')} />
              <CheckRadio label="Non Chargeable" checked={ts.allowance === 'non_chargeable'} onChange={() => setField('allowance', 'non_chargeable')} />
            </div>
          </div>
          <Field label="Date" type="date" value={ts.assign_date} onChange={(v) => setField('assign_date', v)} />
          <Field label="Assign Role" value={ts.assign_role} onChange={(v) => setField('assign_role', v)} />
          <Field label="Location" value={ts.location} onChange={(v) => setField('location', v)} />
          <Field label="Service Person" value={ts.service_person} onChange={(v) => setField('service_person', v)} />
          <Field label="Attachment" value={ts.attachment} onChange={(v) => setField('attachment', v)} />
          <Field label="Mobilization Date" type="date" value={ts.mobilization_date} onChange={(v) => setField('mobilization_date', v)} />
        </div>
      </Section>

      {/* Worksite Type */}
      <Section title="Type of Worksite">
        <div className="grid grid-cols-2 gap-2">
          <Check label="Office" checked={ts.worksite_office} onChange={(v) => setField('worksite_office', v)} />
          <Check label="Plant/Workshop" checked={ts.worksite_plant} onChange={(v) => setField('worksite_plant', v)} />
          <Check label="Onshore" checked={ts.worksite_onshore} onChange={(v) => setField('worksite_onshore', v)} />
          <Check label="Offshore" checked={ts.worksite_offshore} onChange={(v) => setField('worksite_offshore', v)} />
        </div>
      </Section>

      {/* Scope & Service Type */}
      <Section title="Scope & Type of Service">
        <Field label="Brief Scope of Work" value={ts.brief_scope} onChange={(v) => setField('brief_scope', v)} textarea />
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Check label="Workshop" checked={ts.service_workshop} onChange={(v) => setField('service_workshop', v)} />
          <Check label="Field Service" checked={ts.service_field} onChange={(v) => setField('service_field', v)} />
          <Check label="ENG./Inspection" checked={ts.service_eng} onChange={(v) => setField('service_eng', v)} />
          <Check label="Other" checked={ts.service_other} onChange={(v) => setField('service_other', v)} />
        </div>
        {ts.service_other && (
          <div className="mt-2">
            <Field label="Other (specify)" value={ts.service_other_text} onChange={(v) => setField('service_other_text', v)} />
          </div>
        )}
      </Section>

      {/* Timesheet Table */}
      <Section title="Timesheet">
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border px-2 py-2 text-xs w-8">No</th>
                <th className="border px-2 py-2 text-xs">Date</th>
                <th className="border px-2 py-2 text-xs">Time In</th>
                <th className="border px-2 py-2 text-xs">Time Out</th>
                <th className="border px-2 py-2 text-xs">Overtime</th>
                <th className="border px-2 py-2 text-xs">Description of Work</th>
                <th className="border px-2 py-2 text-xs w-8"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-center text-xs text-gray-400">{idx + 1}</td>
                  <td className="border px-1 py-1">
                    <input type="date" className="w-full border-0 bg-transparent text-xs focus:outline-none"
                      value={e.entry_date} onChange={(ev) => setEntry(idx, 'entry_date', ev.target.value)} />
                  </td>
                  <td className="border px-1 py-1">
                    <input type="time" className="w-full border-0 bg-transparent text-xs focus:outline-none"
                      value={e.time_start} onChange={(ev) => setEntry(idx, 'time_start', ev.target.value)} />
                  </td>
                  <td className="border px-1 py-1">
                    <input type="time" className="w-full border-0 bg-transparent text-xs focus:outline-none"
                      value={e.time_end} onChange={(ev) => setEntry(idx, 'time_end', ev.target.value)} />
                  </td>
                  <td className="border px-1 py-1">
                    <input type="text" className="w-full border-0 bg-transparent text-xs focus:outline-none" placeholder="e.g. 2h"
                      value={e.overtime} onChange={(ev) => setEntry(idx, 'overtime', ev.target.value)} />
                  </td>
                  <td className="border px-1 py-1">
                    <input type="text" className="w-full border-0 bg-transparent text-xs focus:outline-none"
                      style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                      value={e.description} onChange={(ev) => setEntry(idx, 'description', ev.target.value)} />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => removeEntry(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold">x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addEntry} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Row</button>
      </Section>

      {/* Summary */}
      <Section title="Summary of Service">
        <Field label="Summary of Service" value={ts.summary_of_service} onChange={(v) => setField('summary_of_service', v)} textarea />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Status of Service</label>
            <div className="flex gap-4 items-center h-9">
              <CheckRadio label="Close" checked={ts.status_service === 'close'} onChange={() => setField('status_service', 'close')} />
              <CheckRadio label="Follow-up required" checked={ts.status_service === 'followup'} onChange={() => setField('status_service', 'followup')} />
            </div>
          </div>
          <YesNoField label="Nonconformance found?" value={ts.nonconformance} onChange={(v) => setField('nonconformance', v)} />
          <YesNoField label="Any incident/spill?" value={ts.incident_spill} onChange={(v) => setField('incident_spill', v)} />
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Any tools/equip. damage?</label>
            <div className="flex gap-3 items-center h-9">
              <CheckRadio label="Yes" checked={ts.tools_damage === true} onChange={() => setField('tools_damage', true)} />
              <CheckRadio label="No" checked={ts.tools_damage === false} onChange={() => setField('tools_damage', false)} />
              <CheckRadio label="N/A" checked={ts.tools_damage === null} onChange={() => setField('tools_damage', null)} />
            </div>
          </div>
          <Field label="Packing List No. (if any)" value={ts.packing_list_no} onChange={(v) => setField('packing_list_no', v)} />
          <Field label="Demobilization Date" type="date" value={ts.demobilization_date} onChange={(v) => setField('demobilization_date', v)} />
        </div>
      </Section>

      {/* Statement */}
      <Section title="Statement of Completeness">
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          The service has been completed and to the best of my knowledge and belief, is in substantial compliance
          with the provisions of the Purchase Order. The service is completed without safety incident and has
          satisfied Customer in terms of quality of service. The worksite is left in clean and deemed safe.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Service Person (name/sign/date)" value={ts.service_person_name} onChange={(v) => setField('service_person_name', v)} />
          <Field label="Customer Representative (name/sign/date)" value={ts.customer_rep_name} onChange={(v) => setField('customer_rep_name', v)} />
        </div>
      </Section>

      {/* Save */}
      <div className="flex gap-3 pb-6">
        <button onClick={save} disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <h2 className="text-sm font-bold text-blue-900 mb-3 uppercase">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean
}) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      {textarea ? (
        <textarea className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 resize-y min-h-[60px]"
          value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function CheckRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="radio" className="w-3.5 h-3.5 accent-blue-600" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}

function YesNoField({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex gap-4 items-center h-9">
        <CheckRadio label="Yes" checked={value === true} onChange={() => onChange(true)} />
        <CheckRadio label="No" checked={value === false} onChange={() => onChange(false)} />
      </div>
    </div>
  )
}
