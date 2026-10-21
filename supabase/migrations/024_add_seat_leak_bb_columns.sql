-- Add SEAT LEAK TEST (BB/MENIT) columns to report_valve_test
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_bb_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_bb_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_bb_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_bb_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_bb_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_bb_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS seat_leak_bb_remark text;