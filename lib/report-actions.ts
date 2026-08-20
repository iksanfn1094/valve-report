export type ReportActions = {
  exportPDF: () => void
  exportExcel: () => void
}

declare global {
  interface Window {
    __reportActions?: ReportActions
  }
}
