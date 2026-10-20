-- Add liquid penetrant (dye penetrant test) data to report_inspection
-- Stores DPT condition, penetrant materials, inspection results/judgement,
-- overall summary, and sketch/photo records as JSONB
ALTER TABLE report_inspection ADD COLUMN IF NOT EXISTS liquid_penetrant jsonb;