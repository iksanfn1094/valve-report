-- Add blasting & painting report data to report_inspection
-- Stores surface preparation, environmental condition, paint application,
-- DFT inspection results, and DFT measurement photo records as JSONB
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS blasting_painting jsonb;