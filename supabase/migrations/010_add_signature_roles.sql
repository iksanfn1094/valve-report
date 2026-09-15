ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS inspector_role text;
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS engineering_role text;
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS review_role text;
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS acknowledge_role text;
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS witness_role text;