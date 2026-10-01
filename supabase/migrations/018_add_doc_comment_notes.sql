-- Add comment_notes column to report_documentation
-- Holds the "Comment / Notes" text entered next to the Photo After column
ALTER TABLE report_documentation ADD COLUMN IF NOT EXISTS comment_notes text;