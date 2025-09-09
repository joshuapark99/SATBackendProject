#!/usr/bin/env node
/**
 * Test script to display all questions in the database
 */

const pool = require('../config/db');

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to database...');
    
    // Get all questions
    const result = await client.query(`
      SELECT 
        id,
        alt_id,
        test_type,
        question_subject,
        question_domain,
        question_skill,
        difficulty,
        question_prompt,
        question_choices,
        question_rationale,
        correct_answer,
        is_multiple_choice,
        created_at
      FROM questions 
      ORDER BY created_at DESC
    `);
    
    console.log(`\nFound ${result.rows.length} questions in the database:\n`);
    
    if (result.rows.length === 0) {
      console.log('No questions found in the database.');
      return;
    }
    
    result.rows.forEach((question, index) => {
      console.log(`--- Question ${index + 1} ---`);
      console.log(`ID: ${question.id}`);
      console.log(`Alt ID: ${question.alt_id}`);
      console.log(`Test Type: ${question.test_type}`);
      console.log(`Subject: ${question.question_subject}`);
      console.log(`Domain: ${question.question_domain}`);
      console.log(`Skill: ${question.question_skill}`);
      console.log(`Difficulty: ${question.difficulty}`);
      console.log(`Is Multiple Choice: ${question.is_multiple_choice}`);
      console.log(`Correct Answer: ${question.correct_answer}`);
      console.log(`Created At: ${question.created_at}`);
      console.log(`Prompt (first 200 chars):`);
      console.log(JSON.stringify(question.question_prompt.substring(0, 200)));
      console.log(`Choices (first 200 chars):`);
      console.log(JSON.stringify(question.question_choices.substring(0, 200)));
      console.log(`Rationale (first 200 chars):`);
      console.log(JSON.stringify(question.question_rationale.substring(0, 200)));
      console.log('');
    });
    
  } catch (error) {
    console.error('Error querying database:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testDatabase().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { testDatabase };
