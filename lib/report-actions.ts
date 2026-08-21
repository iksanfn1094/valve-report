export type ReportActions = {
  exportPDF: () => void
  exportExcel: () => void
}

export type TimesheetActions = {
  exportPDF: () => void
}

declare global {
  interface Window {
    __reportActions?: ReportActions
    __timesheetActions?: TimesheetActions
  }
}
