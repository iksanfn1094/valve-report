ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_i_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_i_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_i_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_i_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_i_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_i_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_i_remark text;

ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_ii_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_ii_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_ii_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_ii_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_ii_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_ii_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS hp_closure_seat_test_ii_remark text;