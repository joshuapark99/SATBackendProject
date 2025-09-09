#!/usr/bin/env node
/**
 * Upload prepared questions to Supabase database.
 * 
 * This script reads the prepared questions from math_questions_prepared.jsonl
 * and uploads them to the Supabase database, creating necessary test and module
 * records first.
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: 'public/math_questions_prepared.jsonl',
    limit: null,
    testName: 'SAT Math Practice Test',
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        options.input = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--test-name':
        options.testName = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        console.log(`
Usage: node scripts/upload_questions.js [options]

Options:
  --input <file>     Input JSONL file path (default: public/math_questions_prepared.jsonl)
  --limit <number>   Limit number of questions to upload
  --test-name <name> Name for the test to create (default: "SAT Math Practice Test")
  --dry-run          Show what would be uploaded without actually uploading
  --help             Show this help message

Examples:
  node scripts/upload_questions.js --dry-run --limit 5
  node scripts/upload_questions.js --limit 10
  node scripts/upload_questions.js --test-name "My SAT Practice Test"
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Load questions from JSONL file
 */
function loadQuestions(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file ${filePath} not found`);
  }

  console.log(`Loading questions from ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const questions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const question = JSON.parse(line);
      questions.push(question);
    } catch (error) {
      console.error(`Error parsing line ${i + 1}: ${error.message}`);
      continue;
    }
  }

  console.log(`Loaded ${questions.length} questions`);
  return questions;
}

/**
 * Check database connection and verify schema
 */
async function verifyDatabase() {
  const client = await pool.connect();
  
  try {
    // Check if questions table exists and has the expected structure
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions' 
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(row => row.column_name);
    
    if (!columns.includes('alt_id') || !columns.includes('test_type') || !columns.includes('question_subject') || 
        !columns.includes('question_domain') || !columns.includes('question_skill') || !columns.includes('difficulty')) {
      throw new Error('Questions table does not have the expected structure. Please run migrations.');
    }
    
    console.log('Database schema verified successfully');
    
  } finally {
    client.release();
  }
}

/**
 * Parse the choices_raw HTML into a structured format
 */
function parseChoices(choicesRaw) {
  // For now, we'll store the raw HTML as a simple structure
  // This could be enhanced to parse the actual choices if needed
  return {
    raw_html: choicesRaw || '',
    type: 'multiple_choice'
  };
}

/**
 * Upload questions to the database
 */
async function uploadQuestions(questions, limit = null) {
  if (limit) {
    questions = questions.slice(0, limit);
  }

  const client = await pool.connect();
  let uploadedCount = 0;
  let skippedCount = 0;

  try {
    for (const question of questions) {
      try {
        // Check if question already exists
        const existingResult = await client.query(
          'SELECT id FROM questions WHERE alt_id = $1',
          [question.id]
        );

        if (existingResult.rows.length > 0) {
          console.log(`Skipping existing question: ${question.id}`);
          skippedCount++;
          continue;
        }

        // Insert question with proper field mapping
        await client.query(
          `INSERT INTO questions (
            alt_id, test_type, question_subject, question_domain, question_skill,
            difficulty, question_prompt, question_choices, question_rationale, 
            correct_answer, is_multiple_choice
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )`,
          [
            question.id,                                    // alt_id
            question.attributes[0],                         // test_type
            question.attributes[1],                         // question_subject
            question.attributes[2],                         // question_domain
            question.attributes[3],                         // question_skill
            question.difficulty,                            // difficulty
            question.prompt,                                // question_prompt
            question.choices_raw || '',                     // question_choices (raw HTML)
            question.rationale || '',                       // question_rationale
            question.correct_answer,                        // correct_answer
            question.is_multiple_choice !== false           // is_multiple_choice
          ]
        );

        uploadedCount++;
        if (uploadedCount % 100 === 0) {
          console.log(`Uploaded ${uploadedCount} questions...`);
        }

      } catch (error) {
        console.error(`Error uploading question ${question.id}: ${error.message}`);
        continue;
      }
    }

    console.log(`Upload complete: ${uploadedCount} questions uploaded, ${skippedCount} skipped`);

  } finally {
    client.release();
  }
}

/**
 * Show dry run preview
 */
function showDryRun(questions, limit = null) {
  const previewQuestions = limit ? questions.slice(0, limit) : questions.slice(0, 3);
  
  console.log('Dry run mode - showing questions:');
  previewQuestions.forEach((q, i) => {
    console.log(`\nQuestion ${i + 1}:`);
    console.log(`  ID: ${q.id}`);
    console.log(`  Difficulty: ${q.difficulty}`);
    console.log(`  Attributes: ${JSON.stringify(q.attributes)}`);
    console.log(`  Correct Answer: ${q.correct_answer}`);
    console.log(`  Prompt (first 100 chars): ${q.prompt.substring(0, 100)}...`);
  });
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  try {
    // Load questions
    const questions = loadQuestions(options.input);

    if (questions.length === 0) {
      console.log('No questions found to upload');
      return;
    }

    if (options.dryRun) {
      showDryRun(questions, options.limit);
      return;
    }

    // Connect to database and verify schema
    console.log('Connecting to database...');
    await verifyDatabase();

    // Upload questions directly (no test/module creation needed)
    await uploadQuestions(questions, options.limit);

    console.log('Upload completed successfully!');

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  loadQuestions,
  verifyDatabase,
  uploadQuestions,
  parseChoices
};
