-- Split report_documentation into two groups: minor and major repairs
-- Rows that existed before this migration default to 'minor'
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS doc_type text NOT NULL DEFAULT 'minor';