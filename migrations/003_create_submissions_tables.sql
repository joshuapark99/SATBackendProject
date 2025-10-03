-- Migration: Create submissions, submission_modules, and submitted_answers tables
-- Created: 2024-01-XX
-- Description: Creates tables for storing test submissions with adaptive module support and answers

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- User identifier (can be updated to UUID when users table is created)
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
    score JSONB, -- Stores score breakdown as JSON (e.g., {"math": 750, "reading": 700, "total": 1450})
    submitted_at TIMESTAMPTZ, -- Timestamp when the test was submitted
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create submission_modules table (tracks which modules were assigned/completed in a submission)
CREATE TABLE IF NOT EXISTS submission_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    order_in_test INTEGER NOT NULL, -- Order of this module in the test (e.g., 1st module, 2nd module)
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score JSONB, -- Module-level score (e.g., {"raw_score": 25, "scaled_score": 750})
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(submission_id, order_in_test) -- Only one module per position in test
);

-- Create submitted_answers table
CREATE TABLE IF NOT EXISTS submitted_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    submission_module_id UUID NOT NULL REFERENCES submission_modules(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    submitted_answer TEXT, -- The answer submitted by the user (can be null if skipped)
    is_correct BOOLEAN, -- Whether the answer is correct (null until graded)
    time_spent_seconds INTEGER, -- Time spent on this question in seconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(submission_id, question_id) -- Prevent duplicate answers for the same question in a submission
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_test_id ON submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submission_modules_submission_id ON submission_modules(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_modules_module_id ON submission_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_submission_modules_status ON submission_modules(status);
CREATE INDEX IF NOT EXISTS idx_submitted_answers_submission_id ON submitted_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_submitted_answers_submission_module_id ON submitted_answers(submission_module_id);
CREATE INDEX IF NOT EXISTS idx_submitted_answers_question_id ON submitted_answers(question_id);

-- Add comments to document the purpose of the tables and columns
COMMENT ON TABLE submissions IS 'Stores test submission records for users';
COMMENT ON TABLE submission_modules IS 'Tracks which modules were assigned/completed in a submission for adaptive testing';
COMMENT ON TABLE submitted_answers IS 'Stores individual answers for each question in a submission';
COMMENT ON COLUMN submissions.status IS 'Submission status: in_progress, submitted, or graded';
COMMENT ON COLUMN submissions.score IS 'JSON object containing overall score breakdown (e.g., {"math": 750, "reading": 700, "total": 1450})';
COMMENT ON COLUMN submissions.submitted_at IS 'Timestamp when the user submitted the entire test (null if in_progress)';
COMMENT ON COLUMN submission_modules.order_in_test IS 'Sequential order of module in test (1st, 2nd, etc.) - used for adaptive module selection';
COMMENT ON COLUMN submission_modules.status IS 'Module completion status: not_started, in_progress, or completed';
COMMENT ON COLUMN submission_modules.score IS 'Module-level score (e.g., {"raw_score": 25, "scaled_score": 750})';
COMMENT ON COLUMN submitted_answers.submission_module_id IS 'References the specific module instance this answer belongs to';
COMMENT ON COLUMN submitted_answers.submitted_answer IS 'The answer submitted by the user (null if question was skipped)';
COMMENT ON COLUMN submitted_answers.is_correct IS 'Whether the answer is correct (null until graded)';
COMMENT ON COLUMN submitted_answers.time_spent_seconds IS 'Time spent on this question in seconds';

