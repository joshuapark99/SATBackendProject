-- Migration: Add order_number columns to junction tables
-- Created: 2024-01-XX
-- Description: Adds order_number columns to test_modules and module_questions junction tables
--              to specify the order of modules within tests and questions within modules

-- Add order_number column to test_modules junction table
ALTER TABLE test_modules 
ADD COLUMN IF NOT EXISTS order_number INTEGER NOT NULL DEFAULT 0;

-- Add order_number column to module_questions junction table  
ALTER TABLE module_questions 
ADD COLUMN IF NOT EXISTS order_number INTEGER NOT NULL DEFAULT 0;

-- Create indexes for better performance on order queries
CREATE INDEX IF NOT EXISTS idx_test_modules_order ON test_modules(test_id, order_number);
CREATE INDEX IF NOT EXISTS idx_module_questions_order ON module_questions(module_id, order_number);

-- Add comments to document the purpose of the order columns
COMMENT ON COLUMN test_modules.order_number IS 'Order of modules within a test (0-based)';
COMMENT ON COLUMN module_questions.order_number IS 'Order of questions within a module (0-based)';
