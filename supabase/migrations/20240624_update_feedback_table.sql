-- Add an official_response column to the feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS official_response TEXT;

-- Add an updated_at column to the feedback table if it doesn't exist
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create an index on project_id for faster queries
CREATE INDEX IF NOT EXISTS feedback_project_id_idx ON feedback(project_id);

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback(status);

-- Update RLS policies if needed for the new column
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow viewers to see approved feedback
CREATE POLICY IF NOT EXISTS "Viewers can see approved feedback" 
ON feedback
FOR SELECT
USING (
  status = 'approved' OR
  (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE id = auth.uid()
    )
  )
);

-- Log the migration in a comment
COMMENT ON TABLE feedback IS 'Community feedback on projects with official response capability added in 20240624_update_feedback_table.sql'; 