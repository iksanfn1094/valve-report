'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ReportActions = {
  exportPDF: () => void
  exportExcel: () => void
}

const ReportActionsContext = createContext<ReportActions | null>(null)

export function useReportActions() {
  return useContext(ReportActionsContext)
}

export function ReportActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReportActions | null>(null)

  const register = useCallback((a: ReportActions) => setActions(a), [])

  return (
    <ReportActionsContext.Provider value={actions}>
      {children}
      <input type="hidden" id="report-actions-register" data-registered={actions ? '1' : '0'} />
    </ReportActionsContext.Provider>
  )
}

export { ReportActionsContext }
