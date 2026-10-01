-- Add comment_before and comment_after columns to report_documentation
-- Each holds the "Comment / Notes" text entered beside its photo column
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS comment_before text;
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS comment_after text;