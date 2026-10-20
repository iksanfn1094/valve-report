-- Add torque test & anti-static test data to report_inspection
-- Stores torque test standard, torque test report rows, torque photo records,
-- anti-static test results, and anti-static photo records as JSONB
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS torque_anti_static jsonb;