-- ============================================
-- VALVE TEST TABLE
-- Jalankan ini di Supabase SQL Editor
-- ============================================

create table report_valve_test (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade unique,
  -- Spec references
  spec_api6d boolean default false,
  spec_api598 boolean default false,
  spec_fci70_2 boolean default false,
  spec_3_15_psi boolean default false,
  spec_sop_no text,
  spec_cv numeric,
  spec_others text,
  -- Hydrostatic Shell Test
  shell_pressure_psi numeric,
  shell_duration_min numeric,
  shell_acceptance text default 'NO VISIBLE LEAKAGE & PRESSURE DROP',
  shell_start_test text,
  shell_finish_test text,
  shell_result text,
  shell_remark text,
  -- High-Pressure Seat Test
  hp_seat_pressure_psi numeric,
  hp_seat_duration_min numeric,
  hp_seat_acceptance text,
  hp_seat_start_test text,
  hp_seat_finish_test text,
  hp_seat_result text,
  hp_seat_remark text,
  -- Low-Pressure Gas Seat Test
  lp_seat_pressure_psi numeric,
  lp_seat_duration_min numeric,
  lp_seat_acceptance text,
  lp_seat_start_test text,
  lp_seat_finish_test text,
  lp_seat_result text,
  lp_seat_remark text,
  -- Actuator Leak Test
  actuator_pressure_psi numeric,
  actuator_duration_min numeric,
  actuator_acceptance text,
  actuator_start_test text,
  actuator_finish_test text,
  actuator_result text,
  actuator_remark text,
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
  test_rows text default '["actuator","shell","hp_seat","seat","func0","func25","func50","func75","func100"]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_valve_test_report on report_valve_test(report_id);

create trigger trigger_valve_test_updated
  before update on report_valve_test
  for each row execute function update_updated_at();

-- Tambahan: kolom CV (jalankan jika table sudah ada sebelumnya)
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spec_cv numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spec_3_15_psi boolean default false;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_seat_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_seat_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_seat_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_seat_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_seat_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_seat_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_seat_remark text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_seat_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_seat_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_seat_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_seat_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_seat_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_seat_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_seat_remark text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_remark text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS test_rows text default '[]';
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_a_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_a_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_a_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_a_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_a_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_a_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_a_remark text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_b_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_b_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_b_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_b_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_b_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_b_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_b_remark text;
