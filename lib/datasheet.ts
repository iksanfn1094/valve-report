export type DatasheetGroupKey = 'valve_data' | 'valve_design' | 'job_info' | 'component_part' | 'technical_req'

export type SubDatasheet = {
  type: string
  valve_data: Record<string, string>
  valve_design: Record<string, string>
  job_info: Record<string, string>
  component_part: Record<string, string>
  technical_req: Record<string, string>
}

export const DATASHEET_LABELS: Record<string, Record<string, string>> = {
  valve_data: {
    sn_fig: 'S/N OR FIG.',
    brand: 'BRAND',
    type_model: 'TYPE MODEL',
    size_class: 'SIZE / CLASS',
    end_connection: 'END CONNECTION',
    stem_material: 'STEM MATERIAL',
    body_material: 'BODY MATERIAL',
    ball_disc_plug_material: 'BALL/DISC/PLUG MATERIAL',
    seat_material: 'SEAT MATERIAL',
    operated: 'OPERATED',
  },
  valve_design: {
    sn_fig: 'S/N OR FIG.',
    brand: 'BRAND',
    action: 'ACTION',
    flow_characteristic: 'FLOW CHARACTERISTIC',
    leak_test: 'LEAK TEST',
    port_size: 'PORT SIZE',
    fail_mode: 'FAIL MODE',
    travel: 'TRAVEL',
    cv_rate: 'CV RATE',
    class: 'CLASS',
  },
  job_info: {
    tag_id: 'TAG ID',
    size_class: 'SIZE / CLASS',
    customer: 'CUSTOMER',
    ex_station_pf: 'EX STATION & P/F',
    project: 'PROJECT',
    ro_no: 'RO NO.',
    project_no: 'PROJECT NO.',
    insp_report_no: 'INSP. REPORT NO.',
    insp_report_date: 'INSP. REPORT DATE',
    painting: 'PAINTING',
  },
  component_part: {
    stem_packing: 'STEM PACKING',
    o_ring: 'O-RING',
    stud_bolt: 'STUD BOLT',
    nuts: 'NUTS',
  },
  technical_req: {
    doc_inspection_report: 'INSPECTION REPORT / DRAWING +',
    doc_penetrant: 'PENETRANT REPORT (IF ANY FABRICATED / WELDING)',
    doc_material_certificate: 'MATERIAL CERTIFICATE',
    doc_technical_report: 'TECHNICAL REPORT',
    doc_warranty_letter: 'WARRANTY LETTER',
  },
}

export const DATASHEET_GROUPS: DatasheetGroupKey[] = [
  'valve_data',
  'valve_design',
  'job_info',
  'component_part',
  'technical_req',
]

const GROUP_TITLES: Record<string, string> = {
  valve_data: 'VALVE DATA',
  valve_design: 'VALVE DESIGN',
  job_info: 'JOB INFORMATION',
  component_part: 'COMPONENT / PART DESCRIPTION',
  technical_req: 'TECHNICAL REQUIREMENT',
}

export function datasheetGroupTitle(group: string): string {
  return GROUP_TITLES[group] || group
}

export function defaultChokeDatasheet(): SubDatasheet {
  return {
    type: 'choke',
    valve_data: {
      sn_fig: '',
      brand: '',
      type_model: '',
      size_class: '',
      end_connection: '',
      stem_material: '',
      body_material: '',
      ball_disc_plug_material: '',
      seat_material: '',
      operated: '',
    },
    valve_design: {
      sn_fig: '',
      brand: '',
      action: '',
      flow_characteristic: '',
      leak_test: '',
      port_size: '',
      fail_mode: '',
      travel: '',
      cv_rate: '',
      class: '',
    },
    job_info: {
      tag_id: '',
      size_class: '',
      customer: '',
      ex_station_pf: '',
      project: '',
      ro_no: '',
      project_no: '',
      insp_report_no: '',
      insp_report_date: '',
      painting: '',
    },
    component_part: {
      stem_packing: '',
      o_ring: '',
      stud_bolt: '',
      nuts: '',
    },
    technical_req: {
      doc_inspection_report: 'yes',
      doc_penetrant: 'yes',
      doc_material_certificate: 'yes',
      doc_technical_report: 'yes',
      doc_warranty_letter: 'yes',
    },
  }
}