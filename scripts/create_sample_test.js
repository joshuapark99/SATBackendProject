const pool = require('../config/db');

/**
 * Script to create a sample test file with:
 * - Test name: "sample test 1"
 * - Test code: "1A2B3C"
 * - 4 modules: 2 RW (order 1,2) and 2 Math (order 3,4)
 * - 2 random questions from each subject for each module
 */

async function createSampleTest() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating sample test...');
    
    // 1. Create the test
    const testResult = await client.query(`
      INSERT INTO tests (name, code)
      VALUES ($1, $2)
      RETURNING id
    `, ['sample test 1', '1A2B3C']);
    
    const testId = testResult.rows[0].id;
    console.log(`Created test with ID: ${testId}`);
    
    // 2. Create 4 modules
    const modules = [
      { name: 'Reading and Writing Module 1', subject: 'Reading and Writing', order: 1 },
      { name: 'Reading and Writing Module 2', subject: 'Reading and Writing', order: 2 },
      { name: 'Math Module 1', subject: 'Math', order: 3 },
      { name: 'Math Module 2', subject: 'Math', order: 4 }
    ];
    
    const moduleIds = [];
    
    for (const module of modules) {
      const moduleResult = await client.query(`
        INSERT INTO modules (name, time_limit, subject_name)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [module.name, 32, module.subject]); // 32 minutes per module
      
      const moduleId = moduleResult.rows[0].id;
      moduleIds.push({ id: moduleId, order: module.order });
      console.log(`Created module: ${module.name} with ID: ${moduleId}`);
    }
    
    // 3. Link modules to test
    for (const moduleInfo of moduleIds) {
      await client.query(`
        INSERT INTO test_modules (test_id, module_id, order_number)
        VALUES ($1, $2, $3)
      `, [testId, moduleInfo.id, moduleInfo.order - 1]); // Convert to 0-based indexing
      
      console.log(`Linked module ${moduleInfo.id} to test with order ${moduleInfo.order - 1}`);
    }
    
    // 4. Get random questions for each subject
    console.log('\nSelecting random questions...');
    
    // Get 4 random RW questions (2 for each RW module)
    const rwQuestionsResult = await client.query(`
      SELECT id FROM questions 
      WHERE question_subject = 'Reading and Writing'
      ORDER BY RANDOM()
      LIMIT 4
    `);
    
    const rwQuestionIds = rwQuestionsResult.rows.map(row => row.id);
    console.log(`Selected ${rwQuestionIds.length} RW questions: ${rwQuestionIds.join(', ')}`);
    
    // Get 4 random Math questions (2 for each Math module)
    const mathQuestionsResult = await client.query(`
      SELECT id FROM questions 
      WHERE question_subject = 'Math'
      ORDER BY RANDOM()
      LIMIT 4
    `);
    
    const mathQuestionIds = mathQuestionsResult.rows.map(row => row.id);
    console.log(`Selected ${mathQuestionIds.length} Math questions: ${mathQuestionIds.join(', ')}`);
    
    // 5. Link questions to modules
    console.log('\nLinking questions to modules...');
    
    // RW Module 1 (order 1) - first 2 RW questions
    const rwModule1Id = moduleIds.find(m => m.order === 1).id;
    for (let i = 0; i < 2; i++) {
      await client.query(`
        INSERT INTO module_questions (module_id, question_id, order_number)
        VALUES ($1, $2, $3)
      `, [rwModule1Id, rwQuestionIds[i], i]);
    }
    console.log(`Linked 2 questions to RW Module 1`);
    
    // RW Module 2 (order 2) - next 2 RW questions
    const rwModule2Id = moduleIds.find(m => m.order === 2).id;
    for (let i = 0; i < 2; i++) {
      await client.query(`
        INSERT INTO module_questions (module_id, question_id, order_number)
        VALUES ($1, $2, $3)
      `, [rwModule2Id, rwQuestionIds[i + 2], i]);
    }
    console.log(`Linked 2 questions to RW Module 2`);
    
    // Math Module 1 (order 3) - first 2 Math questions
    const mathModule1Id = moduleIds.find(m => m.order === 3).id;
    for (let i = 0; i < 2; i++) {
      await client.query(`
        INSERT INTO module_questions (module_id, question_id, order_number)
        VALUES ($1, $2, $3)
      `, [mathModule1Id, mathQuestionIds[i], i]);
    }
    console.log(`Linked 2 questions to Math Module 1`);
    
    // Math Module 2 (order 4) - next 2 Math questions
    const mathModule2Id = moduleIds.find(m => m.order === 4).id;
    for (let i = 0; i < 2; i++) {
      await client.query(`
        INSERT INTO module_questions (module_id, question_id, order_number)
        VALUES ($1, $2, $3)
      `, [mathModule2Id, mathQuestionIds[i + 2], i]);
    }
    console.log(`Linked 2 questions to Math Module 2`);
    
    await client.query('COMMIT');
    
    console.log('\nSample test created successfully!');
    console.log(`Test ID: ${testId}`);
    console.log(`Test Name: sample test 1`);
    console.log(`Test Code: 1A2B3C`);
    console.log('\nModules created:');
    moduleIds.forEach((module, index) => {
      const moduleData = modules[index];
      console.log(`  ${moduleData.order}. ${moduleData.name} (ID: ${module.id})`);
    });
    
    console.log('\nQuestion distribution:');
    console.log(`  RW Module 1: ${rwQuestionIds.slice(0, 2).join(', ')}`);
    console.log(`  RW Module 2: ${rwQuestionIds.slice(2, 4).join(', ')}`);
    console.log(`  Math Module 1: ${mathQuestionIds.slice(0, 2).join(', ')}`);
    console.log(`  Math Module 2: ${mathQuestionIds.slice(2, 4).join(', ')}`);
    
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
