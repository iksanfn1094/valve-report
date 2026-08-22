-- Add description, photo_before, photo_after columns to report_documentation
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS photo_before text;
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS photo_after text;
