'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const QUICK_PROMPTS = [
  'Apa saja modul yang tersedia di aplikasi ini?',
  'Bagaimana cara membuat valve inspection report?',
  'Apa itu Engineering Hub?',
  'Bantu saya analisis budget project',
  'Tips keselamatan kerja di workshop',
]

const AI_RESPONSES: Record<string, string> = {
  'modul': 'Aplikasi ini memiliki 7 modul utama:\n\n1. **Field Survey** — Survei lapangan\n2. **Workforce** — Manajemen timesheet\n3. **Valve Service Report** — Inspeksi & pelaporan valve\n4. **Project Cost** — Budgeting & biaya project\n5. **Project Control** — Monitoring progress\n6. **Engineering Hub** — Kalkulasi & tools engineering\n7. **AI Assistant** — Asisten pintar (ini dia!)\n\nGunakan drag & drop di homepage untuk mengatur urutan menu sesuai keinginan Anda.',
  'report': 'Untuk membuat Valve Service Report:\n\n1. Klik **VALVE SERVICE REPORT** di homepage\n2. Klik tombol **+ New Report**\n3. Isi data inspeksi: Valve ID, Type, Size, Manufacturer\n4. Tambahkan item inspeksi dengan kondisi komponen\n5. Upload foto jika diperlukan\n6. Save → Export PDF atau Excel\n\nTip: Masukkan Valve ID dan data akan otomatis terisi dari database!',
  'engineering': '**Engineering Hub** adalah modul untuk:\n\n• Kalkulasi teknikal valve & pipa\n• Verifikasi spesifikasi material\n• Tools desain & analisis\n• Referensi standar industri (API, ASME, ANSI)\n\nModul ini仍在dikembangkan. Stay tuned!',
  'budget': 'Untuk analisis budget project:\n\n1. Klik **PROJECT COST** di homepage\n2. Input data biaya: material, labor, equipment\n3. Gunakan **Project Control** untuk monitoring real-time\n\nTips: Selalu alokasikan 10-15% contingency untuk project valve service.',
  'keselamatan': 'Tips keselamatan kerja di workshop:\n\n1. **PPE Wajib**: Helmet, safety shoes, gloves, safety glasses\n2. **Lockout/Tagout**: Selalu isolasi energi sebelum maintenance\n3. **Tool Inspection**: Cek kondisi tools sebelum digunakan\n4. **Housekeeping**: Jaga area kerja tetap bersih\n5. **Emergency**: Kenali lokasi fire extinguisher & first aid\n6. **Communication**: Selalu koordinasi dengan tim',
}

function findResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key)) return val
  }
  return `Terima kasih atas pertanyaan Anda: "${input}"\n\nSaya adalah AI Assistant untuk aplikasi Project & Service Transformation. Saat ini saya dalam mode demo. Fitur AI lengkap akan segera tersedia untuk menganalisis data valve, budget, dan project secara otomatis.\n\nSementara itu, cobalah:\n• **Valve Service Report** untuk inspeksi valve\n• **Engineering Hub** untuk tools kalkulasi\n• **Workforce** untuk manajemen timesheet`
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya AI Assistant untuk PT. Valvindo Megah. Ada yang bisa saya bantu?\n\nCoba klik salah satu prompt di bawah atau ketik pertanyaan Anda.',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send(text?: string) {
    const q = (text || input).trim()
    if (!q) return
    const userMsg: Message = { role: 'user', content: q, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const response = findResponse(q)
      setMessages((prev) => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }])
      setLoading(false)
    }, 800 + Math.random() * 700)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="bg-indigo-600 text-white rounded-t-xl px-5 py-4">
        <h1 className="text-lg font-bold tracking-wide">AI Assistant</h1>
        <p className="text-xs text-indigo-200">Powered by Valvindo Intelligence</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-200 p-4 space-y-4 rounded-b-xl">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mt-3">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => send(p)}
            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1.5 hover:bg-indigo-100 transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ketik pertanyaan Anda..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40"
        >
          Kirim
        </button>
      </div>
    </div>
  )
}
