-- Add Resume fields to report_inspection
ALTER TABLE report_inspection
  ADD COLUMN IF NOT EXISTS findings text,
  ADD COLUMN IF NOT EXISTS recommendations text,
  ADD COLUMN IF NOT EXISTS conclusion text;
