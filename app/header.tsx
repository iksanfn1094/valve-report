'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const [hasActions, setHasActions] = useState(false)

  useEffect(() => {
    const check = () => setHasActions(!!window.__reportActions)
    check()
    const interval = setInterval(check, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="text-xl font-bold tracking-tight">
            Valve Report
          </Link>
          <Link href="/docs" className="text-xl font-bold tracking-tight">
            Documentation
          </Link>
        </div>
        <nav className="flex gap-3 text-sm items-center">
          {hasActions && (
            <>
              <button
                onClick={() => window.__reportActions?.exportPDF()}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
              >
                Export PDF
              </button>
              <button
                onClick={() => window.__reportActions?.exportExcel()}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
              >
                Export Excel
              </button>
            </>
          )}
          <Link href="/reports" className="hover:text-blue-200 transition">
            Reports
          </Link>
        </nav>
      </div>
    </header>
  )
}
