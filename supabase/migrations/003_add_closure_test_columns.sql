ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_remark text;

ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_remark text;

ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_remark text;

ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_b_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_b_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_b_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_b_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_b_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_b_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_b_remark text;

ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_a_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_a_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_a_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_a_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_a_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_a_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS lp_closure_a_remark text;
