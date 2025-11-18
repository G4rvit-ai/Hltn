/*
  # Add SOS Flag to Issues Table

  This migration adds an SOS flag to the issues table to mark urgent security/safety issues.

  ## Changes
  - Add `is_sos` boolean column to issues table (default: false)
  - Add index on is_sos for faster filtering of SOS issues
  - SOS issues are automatically marked as high priority and require immediate attention
*/

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS is_sos boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_issues_is_sos ON issues(is_sos)
WHERE is_sos = true;