ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS backseat_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS backseat_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS backseat_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS backseat_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS backseat_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS backseat_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS backseat_remark text;
