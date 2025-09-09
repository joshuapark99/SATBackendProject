-- Migration: Create initial tables for SAT Backend Project
-- Created: 2024-01-XX
-- Description: Creates the core tables for tests, modules, questions and their relationships

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(6) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    time_limit INTEGER NOT NULL, -- time limit in minutes
    subject_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alt_id VARCHAR(8) UNIQUE NOT NULL, -- predetermined 8 character alphanumeric identifier
    test_type TEXT NOT NULL,
    question_subject TEXT NOT NULL,
    question_domain TEXT NOT NULL,
    question_skill TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    question_prompt TEXT NOT NULL,
    question_choices TEXT NOT NULL,
    question_rationale TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create test_modules junction table (many-to-many relationship between tests and modules)
CREATE TABLE IF NOT EXISTS test_modules (
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (test_id, module_id)
);

-- Create module_questions junction table (many-to-many relationship between modules and questions)
CREATE TABLE IF NOT EXISTS module_questions (
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (module_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tests_code ON tests(code);
CREATE INDEX IF NOT EXISTS idx_questions_alt_id ON questions(alt_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(question_subject);
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(question_domain);
CREATE INDEX IF NOT EXISTS idx_questions_skill ON questions(question_skill);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_modules_subject ON modules(subject_name);
CREATE INDEX IF NOT EXISTS idx_test_modules_test_id ON test_modules(test_id);
CREATE INDEX IF NOT EXISTS idx_test_modules_module_id ON test_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_module_questions_module_id ON module_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_questions_question_id ON module_questions(question_id); 