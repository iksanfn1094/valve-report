-- Add description and photos columns to report_documentation
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS photos text;
