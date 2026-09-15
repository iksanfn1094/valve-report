ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS review_name text;
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS acknowledge_name text;