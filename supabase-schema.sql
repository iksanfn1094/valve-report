-- ============================================
-- INSPECTION REPORT DATABASE SCHEMA
-- Jalankan ini di Supabase SQL Editor
-- ============================================

create table report_inspection (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  report_no text,
  report_date date default current_date,
  ex_station text,
  project text,
  ro_no text,
  customer text,
  valve_type text,
  manufacture text,
  size text,
  class text,
  serial_no text,
  end_connection text,
  operated text,
  location text,
  category text check (category in ('inspection','minor','major')),
  inspector_name text,
  engineering_name text,
  findings text,
  recommendations text,
  conclusion text,
  status text default 'draft' check (status in ('draft','submitted','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table report_inspection_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  item_no int,
  component_name text not null,
  qty int default 1,
  condition_note text,
  recommendation text[],
  repair_category text,
  comment text,
  spec_material text,
  sort_order int
);

create table report_bom_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  section text check (section in ('valve','machining','coating')),
  item_no int,
  qty numeric,
  unit text,
  description text,
  specification text,
  dimension text,
  keterangan text,
  sort_order int
);

create table report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  item_id uuid references report_inspection_items(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_at timestamptz default now()
);

create table report_documentation (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  component_name text,
  condition_before text,
  condition_after text,
  photo_before_url text,
  photo_after_url text,
  notes text,
  description text,
  photos text,
  sort_order int,
  created_at timestamptz default now()
);

-- Indexes untuk performance
create index idx_items_report on report_inspection_items(report_id);
create index idx_bom_report on report_bom_items(report_id);
create index idx_photos_report on report_photos(report_id);
create index idx_photos_item on report_photos(item_id);
create index idx_docs_report on report_documentation(report_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_report_updated
  before update on report_inspection
  for each row execute function update_updated_at();

-- ============================================
-- TIMESHEET DATABASE SCHEMA
-- ============================================

create table timesheet (
  id uuid primary key default gen_random_uuid(),
  -- Header
  customer text,
  internal_so_no text,
  customer_po text,
  letter_of_assignment text,
  end_user_project text,
  allowance text check (allowance in ('chargeable','non_chargeable')),
  assign_date date default current_date,
  assign_role text,
  location text,
  service_person text,
  attachment text,
  mobilization_date date,
  -- Worksite & Service type
  worksite_office boolean default false,
  worksite_plant boolean default false,
  worksite_onshore boolean default false,
  worksite_offshore boolean default false,
  brief_scope text,
  service_workshop boolean default false,
  service_field boolean default false,
  service_eng boolean default false,
  service_other boolean default false,
  service_other_text text,
  -- Summary
  summary_of_service text,
  status_service text check (status_service in ('close','followup')),
  nonconformance boolean,
  incident_spill boolean,
  tools_damage boolean,
  packing_list_no text,
  demobilization_date date,
  -- Statement
  service_person_name text,
  customer_rep_name text,
  -- Meta
  status text default 'draft' check (status in ('draft','submitted','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid references timesheet(id) on delete cascade,
  entry_date date,
  time_start text,
  time_end text,
  overtime text,
  description text,
  sort_order int
);

create index idx_ts_entries on timesheet_entries(timesheet_id);

create trigger trigger_timesheet_updated
  before update on timesheet
  for each row execute function update_updated_at();

-- ============================================
-- VALVE TEST DATABASE SCHEMA
-- ============================================

create table report_valve_test (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade unique,
  -- Spec references
  spec_api6d boolean default false,
  spec_api598 boolean default false,
  spec_fci70_2 boolean default false,
  spec_sop_no text,
  spec_others text,
  -- Hydrostatic Shell Test
  shell_pressure_psi numeric,
  shell_duration_min numeric,
  shell_acceptance text default 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  shell_start_test text,
  shell_finish_test text,
  shell_result text,
  shell_remark text,
  -- Seat Leak Test
  seat_pressure_psi numeric,
  seat_duration_min numeric,
  seat_acceptance text default 'ALLOWABLE LEAK 0.25 SCFH',
  seat_start_test text,
  seat_finish_test text,
  seat_result text,
  seat_remark text,
  -- Function Test 0%
  func0_pressure_psi numeric,
  func0_duration_min numeric,
  func0_acceptance text default 'SMOOTH and LINEAR',
  func0_start_test text,
  func0_finish_test text,
  func0_result text,
  func0_remark text,
  -- Function Test 25%
  func25_pressure_psi numeric,
  func25_duration_min numeric,
  func25_acceptance text,
  func25_start_test text,
  func25_finish_test text,
  func25_result text,
  func25_remark text,
  -- Function Test 50%
  func50_pressure_psi numeric,
  func50_duration_min numeric,
  func50_acceptance text default 'SMOOTH and LINEAR',
  func50_start_test text,
  func50_finish_test text,
  func50_result text,
  func50_remark text,
  -- Function Test 75%
  func75_pressure_psi numeric,
  func75_duration_min numeric,
  func75_acceptance text,
  func75_start_test text,
  func75_finish_test text,
  func75_result text,
  func75_remark text,
  -- Function Test 100%
  func100_pressure_psi numeric,
  func100_duration_min numeric,
  func100_acceptance text default 'SMOOTH and LINEAR',
  func100_start_test text,
  func100_finish_test text,
  func100_result text,
  func100_remark text,
  -- Meta
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_valve_test_report on report_valve_test(report_id);

create trigger trigger_valve_test_updated
  before update on report_valve_test
  for each row execute function update_updated_at();
