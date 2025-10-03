const pool = require('../config/db');

/**
 * Script to create a full-length adaptive SAT test with:
 * - Test name: "SAT Practice Test - Full Length"
 * - Test code: "SATFL1"
 * - 6 modules total for adaptive testing:
 *   * Reading & Writing: Module 1 (baseline), Module 2 Easy, Module 2 Hard
 *   * Math: Module 1 (baseline), Module 2 Easy, Module 2 Hard
 * - RW modules: 27 questions each, 32 minutes per module (matches actual SAT)
 * - Math modules: 22 questions each, 35 minutes per module (matches actual SAT)
 * - Students complete 4 modules total: 98 questions (54 RW + 44 Math)
 */

async function createSampleTest() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating full-length adaptive SAT test...\n');
    
    // 1. Create the test
    const testResult = await client.query(`
      INSERT INTO tests (name, code)
      VALUES ($1, $2)
      RETURNING id
    `, ['SAT Practice Test - Full Length', 'SATFL1']);
    
    const testId = testResult.rows[0].id;
    console.log(`Created test with ID: ${testId}`);
    
    // 2. Create 6 modules (3 RW, 3 Math) for adaptive testing
    // Module 1s are baseline (everyone takes these first)
    // Module 2s are assigned based on Module 1 performance
    // RW modules: 27 questions each (actual SAT)
    // Math modules: 22 questions each (actual SAT)
    const modules = [
      { name: 'Reading and Writing - Module 1', subject: 'Reading and Writing', order: 0, difficulty: 'medium', questionsPerModule: 27 },
      { name: 'Reading and Writing - Module 2 (Easier)', subject: 'Reading and Writing', order: 1, difficulty: 'easy', questionsPerModule: 27 },
      { name: 'Reading and Writing - Module 2 (Harder)', subject: 'Reading and Writing', order: 2, difficulty: 'hard', questionsPerModule: 27 },
      { name: 'Math - Module 1', subject: 'Math', order: 3, difficulty: 'medium', questionsPerModule: 22 },
      { name: 'Math - Module 2 (Easier)', subject: 'Math', order: 4, difficulty: 'easy', questionsPerModule: 22 },
      { name: 'Math - Module 2 (Harder)', subject: 'Math', order: 5, difficulty: 'hard', questionsPerModule: 22 }
    ];
    
    const moduleData = [];
    
    console.log('\nCreating modules...');
    for (const module of modules) {
      // Set time limit based on subject: RW = 32 min, Math = 35 min
      const timeLimit = module.subject === 'Reading and Writing' ? 32 : 35;
      
      const moduleResult = await client.query(`
        INSERT INTO modules (name, time_limit, subject_name, difficulty)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [module.name, timeLimit, module.subject, module.difficulty]);
      
      const moduleId = moduleResult.rows[0].id;
      moduleData.push({ 
        id: moduleId, 
        order: module.order,
        name: module.name,
        subject: module.subject,
        difficulty: module.difficulty,
        questionsPerModule: module.questionsPerModule
      });
      console.log(`  ${module.name} (${module.difficulty})`);
    }
    
    // 3. Link modules to test
    // Note: We link ALL modules to the test. The adaptive logic will determine
    // which Module 2 variant to assign based on Module 1 performance.
    console.log('\nLinking modules to test...');
    for (const module of moduleData) {
      await client.query(`
        INSERT INTO test_modules (test_id, module_id, order_number)
        VALUES ($1, $2, $3)
      `, [testId, module.id, module.order]);
      
      console.log(`  Linked ${module.name} (order: ${module.order})`);
    }
    
    // 4. Select questions for each module based on difficulty
    console.log('\nSelecting questions by difficulty...');
    
    const questionsByModule = {};
    
    for (const module of moduleData) {
      // Select questions matching the module's difficulty and subject
      const questionsResult = await client.query(`
        SELECT id FROM questions 
        WHERE question_subject = $1 
          AND difficulty = $2
        ORDER BY RANDOM()
        LIMIT $3
      `, [module.subject, module.difficulty, module.questionsPerModule]);
      
      questionsByModule[module.id] = questionsResult.rows.map(row => row.id);
      
      console.log(`  ${module.name}: ${questionsByModule[module.id].length} ${module.difficulty} questions`);
      
      // Warning if we don't have enough questions
      if (questionsByModule[module.id].length < module.questionsPerModule) {
        console.log(`Warning: Only ${questionsByModule[module.id].length} questions available (requested ${module.questionsPerModule})`);
      }
    }
    
    // 5. Link questions to modules
    console.log('\nLinking questions to modules...');
    
    for (const module of moduleData) {
      const questions = questionsByModule[module.id];
      
      for (let i = 0; i < questions.length; i++) {
        await client.query(`
          INSERT INTO module_questions (module_id, question_id, order_number)
          VALUES ($1, $2, $3)
        `, [module.id, questions[i], i]);
      }
      
      console.log(`  ${module.name}: ${questions.length} questions linked`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(70));
    console.log('Full-length adaptive SAT test created successfully!');
    console.log('='.repeat(70));
    console.log(`\nTest ID: ${testId}`);
    console.log(`Test Name: SAT Practice Test - Full Length`);
    console.log(`Test Code: SATFL1`);
    
    console.log('\n' + '-'.repeat(70));
    console.log('MODULES CREATED:');
    console.log('-'.repeat(70));
    
    const rwModules = moduleData.filter(m => m.subject === 'Reading and Writing');
    const mathModules = moduleData.filter(m => m.subject === 'Math');
    
    console.log('\nReading & Writing Modules:');
    rwModules.forEach((module) => {
      const questionCount = questionsByModule[module.id]?.length || 0;
      console.log(`  ${module.order}. ${module.name}`);
      console.log(`     - Difficulty: ${module.difficulty}`);
      console.log(`     - Questions: ${questionCount}`);
      console.log(`     - ID: ${module.id}`);
    });
    
    console.log('\nMath Modules:');
    mathModules.forEach((module) => {
      const questionCount = questionsByModule[module.id]?.length || 0;
      console.log(`  ${module.order}. ${module.name}`);
      console.log(`     - Difficulty: ${module.difficulty}`);
      console.log(`     - Questions: ${questionCount}`);
      console.log(`     - ID: ${module.id}`);
    });
    
    console.log('\n' + '-'.repeat(70));
    console.log('ADAPTIVE TESTING FLOW:');
    console.log('-'.repeat(70));
    console.log('1. Students begin with RW Module 1 (medium difficulty)');
    console.log('2. Based on Module 1 performance:');
    console.log('   - Score < 60% → Module 2 (Easier)');
    console.log('   - Score ≥ 60% → Module 2 (Harder)');
    console.log('3. Same adaptive pattern for Math modules');
    console.log('4. Final SAT score (400-1600) calculated from both sections');
    
    const totalQuestions = Object.values(questionsByModule).reduce((sum, questions) => sum + questions.length, 0);
    const rwQuestionsPerTest = 27 * 2; // Student takes 2 RW modules
    const mathQuestionsPerTest = 22 * 2; // Student takes 2 Math modules
    const studentTotalQuestions = rwQuestionsPerTest + mathQuestionsPerTest;
    
    console.log('\n' + '-'.repeat(70));
    console.log(`Total Modules Available: ${moduleData.length}`);
    console.log(`Total Questions in Bank: ${totalQuestions}`);
    console.log(`Student will complete: 4 modules (${studentTotalQuestions} questions)`);
    console.log(`  - Reading & Writing: 2 modules × 27 = ${rwQuestionsPerTest} questions`);
    console.log(`  - Math: 2 modules × 22 = ${mathQuestionsPerTest} questions`);
    console.log('-'.repeat(70));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sample test:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  createSampleTest()
    .then(() => {
      console.log('\nScript completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSampleTest };
