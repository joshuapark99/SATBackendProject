-- Step 1: Create a temporary column for the new UUID user_id
ALTER TABLE submissions 
ADD COLUMN user_id_uuid UUID;

-- Step 2: For existing records, you have two options:
DELETE FROM submissions WHERE user_id IS NOT NULL;


-- Step 3: Drop the old TEXT column
ALTER TABLE submissions 
DROP COLUMN user_id;

-- Step 4: Rename the new UUID column to user_id
ALTER TABLE submissions 
RENAME COLUMN user_id_uuid TO user_id;

-- Step 5: Make user_id NOT NULL
ALTER TABLE submissions 
ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Add foreign key constraint to auth.users
-- Note: Supabase stores users in auth.users schema
ALTER TABLE submissions
ADD CONSTRAINT submissions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 7: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id_uuid ON submissions(user_id);

-- Add comment to document the change
COMMENT ON COLUMN submissions.user_id IS 'User ID (UUID) - Foreign key to auth.users table';

