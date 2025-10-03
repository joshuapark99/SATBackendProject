-- Migration: Add difficulty column to modules table
-- Created: 2024-01-XX
-- Description: Adds difficulty column to support adaptive module selection

-- Add difficulty column to modules table
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- Add check constraint to ensure valid difficulty values
ALTER TABLE modules
ADD CONSTRAINT modules_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_modules_difficulty ON modules(difficulty);

-- Add comment to document the purpose
COMMENT ON COLUMN modules.difficulty IS 'Difficulty level for adaptive testing: easy, medium, hard. Medium is baseline (Module 1), easy/hard are Module 2 variants.';

-- Update existing modules if any exist (optional - remove if not needed)
-- This assumes module names contain "(Easier)" or "(Harder)" indicators
UPDATE modules 
SET difficulty = CASE 
  WHEN name LIKE '%Module 1%' THEN 'medium'
  WHEN name LIKE '%(Easier)%' THEN 'easy'
  WHEN name LIKE '%(Harder)%' THEN 'hard'
  ELSE 'medium'
END
WHERE difficulty IS NULL;

