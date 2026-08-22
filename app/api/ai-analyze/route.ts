import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { question } = await req.json()
  const q = question.toLowerCase()

  try {
    if (q.includes('report') || q.includes('inspeksi') || q.includes('valve')) {
      const { data: reports } = await supabase
        .from('report_inspection')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!reports || reports.length === 0) {
        return NextResponse.json({ answer: 'Belum ada data Valve Service Report di database.\n\nUntuk mulai, buka modul **VALVE SERVICE REPORT** dan buat inspeksi baru.' })
      }

      const total = reports.length
      const latest = reports[0]
      const types: Record<string, number> = {}
      const manufacturers: Record<string, number> = {}
      reports.forEach((r: any) => {
        types[r.valve_type || 'Unknown'] = (types[r.valve_type || 'Unknown'] || 0) + 1
        manufacturers[r.manufacturer || 'Unknown'] = (manufacturers[r.manufacturer || 'Unknown'] || 0) + 1
      })

      const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]
      const topMfr = Object.entries(manufacturers).sort((a, b) => b[1] - a[1])[0]

      let answer = `📊 **Analisis Valve Service Report**\n\n`
      answer += `• Total inspeksi: **${total}** record\n`
      answer += `• Inspeksi terakhir: **${latest.valve_id || '-'}** (${latest.created_at ? new Date(latest.created_at).toLocaleDateString('id-ID') : '-'})\n`
      answer += `• Tipe valve terbanyak: **${topType?.[0]}** (${topType?.[1]}x)\n`
      answer += `• Manufacturer terbanyak: **${topMfr?.[0]}** (${topMfr?.[1]}x)\n\n`

      if (q.includes('terakhir') || q.includes('latest') || q.includes('baru')) {
        answer += `**5 Inspeksi Terakhir:**\n`
        reports.slice(0, 5).forEach((r: any, i: number) => {
          answer += `${i + 1}. ${r.valve_id || '-'} | ${r.valve_type || '-'} | ${r.manufacturer || '-'} | ${r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}\n`
        })
      }

      if (q.includes('tipe') || q.includes('type') || q.includes('jenis')) {
        answer += `**Distribusi Tipe Valve:**\n`
        Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
          answer += `• ${t}: ${c}\n`
        })
      }

      return NextResponse.json({ answer })
    }

    if (q.includes('timesheet') || q.includes('timesheet') || q.includes('workforce') || q.includes('timesheet') || q.includes('waktu kerja') || q.includes('lembur')) {
      const { data: timesheets } = await supabase
        .from('timesheet')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      const { data: entries } = await supabase
        .from('timesheet_entries')
        .select('*')
        .limit(200)

      if (!timesheets || timesheets.length === 0) {
        return NextResponse.json({ answer: 'Belum ada data Timesheet di database.\n\nUntuk mulai, buka modul **WORKFORCE** dan isi timesheet baru.' })
      }

      const totalTs = timesheets.length
      const totalEntries = entries?.length || 0
      const latest = timesheets[0]

      let totalJam = 0
      let totalHariKerja = 0
      entries?.forEach((e: any) => {
        if (e.jam_kerja) totalJam += parseFloat(e.jam_kerja)
        if (e.hari_kerja) totalHariKerja += parseInt(e.hari_kerja)
      })

      let answer = `📊 **Analisis Timesheet / Workforce**\n\n`
      answer += `• Total timesheet: **${totalTs}** record\n`
      answer += `• Total entries: **${totalEntries}** baris\n`
      answer += `• Total jam kerja: **${totalJam.toFixed(1)}** jam\n`
      answer += `• Total hari kerja: **${totalHariKerja}** hari\n`
      answer += `• Timesheet terakhir: **${latest.nama || '-'}** (${latest.created_at ? new Date(latest.created_at).toLocaleDateString('id-ID') : '-'})\n`

      return NextResponse.json({ answer })
    }

    if (q.includes('ringkasan') || q.includes('summary') || q.includes('overview') || q.includes('status') || q.includes('semua')) {
      const [reports, timesheets, entries] = await Promise.all([
        supabase.from('report_inspection').select('id', { count: 'exact', head: true }),
        supabase.from('timesheet').select('id', { count: 'exact', head: true }),
        supabase.from('timesheet_entries').select('id', { count: 'exact', head: true }),
      ])

      let answer = `📊 **Ringkasan Sistem V-Transform**\n\n`
      answer += `• Valve Service Report: **${reports.count || 0}** inspeksi\n`
      answer += `• Timesheet: **${timesheets.count || 0}** record\n`
      answer += `• Timesheet Entries: **${entries.count || 0}** baris\n\n`
      answer += `Gunakan prompt spesifik untuk analisis lebih detail, contoh:\n`
      answer += `• "Analisis valve report"\n`
      answer += `• "Timesheet workforce"\n`
      answer += `• "Tipe valve terbanyak"`

      return NextResponse.json({ answer })
    }

    return NextResponse.json({
      answer: `Maaf, saya belum bisa menganalisis pertanyaan itu.\n\n**Yang bisa saya analisis:**\n• "Analisis valve report" — data inspeksi valve\n• "Timesheet workforce" — data timesheet & jam kerja\n• "Ringkasan semua" — overview seluruh data\n• "Tipe valve terbanyak" — distribusi tipe valve\n\nSilakan coba salah satu prompt di atas!`
    })
  } catch (err: any) {
    return NextResponse.json({ answer: `Terjadi error saat mengakses database: ${err.message}` }, { status: 500 })
  }
}
