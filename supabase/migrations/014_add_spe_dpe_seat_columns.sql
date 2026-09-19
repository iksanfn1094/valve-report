ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS dpe_seat_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS dpe_seat_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS dpe_seat_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS dpe_seat_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS dpe_seat_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS dpe_seat_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS dpe_seat_remark text;

ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spe_seat_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spe_seat_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spe_seat_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spe_seat_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spe_seat_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spe_seat_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS spe_seat_remark text;