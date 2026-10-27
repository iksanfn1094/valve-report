-- Add ACTUATOR FUNCTION TEST (SPRING ENERGIZED / DE-ENERGIZED) columns to report_valve_test
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_energized_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_energized_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_energized_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_energized_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_energized_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_energized_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_energized_remark text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_de_energized_pressure_psi numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_de_energized_duration_min numeric;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_de_energized_acceptance text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_de_energized_start_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_de_energized_finish_test text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_de_energized_result text;
ALTER TABLE report_valve_test ADD COLUMN IF NOT EXISTS actuator_func_spring_de_energized_remark text;
