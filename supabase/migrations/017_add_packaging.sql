ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS packaging jsonb;
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS packaging_photos text;