const pool = require('../config/db');

class Test {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.created_at = data.created_at;
  }

  // Get test by access code with modules and questions
  static async findByCode(code, includeAnswers = false) {
    // Build query based on whether answers should be included
    const baseFields = `
      t.id,
      t.name,
      t.code,
      t.created_at,
      m.id as module_id,
      m.name as module_name,
      m.time_limit,
      m.subject_name,
      tm.order_number as module_order,
      q.id as question_id,
      q.alt_id,
      q.question_subject,
      q.question_domain,
      q.question_skill,
      q.difficulty,
      q.question_prompt,
      q.question_choices,
      q.is_multiple_choice,
      mq.order_number as question_order
    `;

    const answerFields = includeAnswers ? `
      q.question_rationale,
      q.correct_answer
    ` : `
      NULL as question_rationale,
      NULL as correct_answer
    `;

    const query = `
      SELECT 
        ${baseFields},
        ${answerFields}
      FROM tests t
      LEFT JOIN test_modules tm ON t.id = tm.test_id
      LEFT JOIN modules m ON tm.module_id = m.id
      LEFT JOIN module_questions mq ON m.id = mq.module_id
      LEFT JOIN questions q ON mq.question_id = q.id
      WHERE t.code = $1
      ORDER BY tm.order_number, mq.order_number
    `;

    try {
      const result = await pool.query(query, [code]);
      
      if (result.rows.length === 0) {
        return null;
      }

      // Structure the data
      const testData = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        code: result.rows[0].code,
        created_at: result.rows[0].created_at,
        modules: []
      };

      // Group modules and questions
      const moduleMap = new Map();
      
      result.rows.forEach(row => {
        if (row.module_id && !moduleMap.has(row.module_id)) {
          moduleMap.set(row.module_id, {
            id: row.module_id,
            name: row.module_name,
            time_limit: row.time_limit,
            subject_name: row.subject_name,
            order: row.module_order,
            questions: []
          });
        }

        if (row.question_id) {
          const module = moduleMap.get(row.module_id);
          if (module) {
            const question = {
              id: row.question_id,
              alt_id: row.alt_id,
              question_subject: row.question_subject,
              question_domain: row.question_domain,
              question_skill: row.question_skill,
              difficulty: row.difficulty,
              question_prompt: row.question_prompt,
              question_choices: row.question_choices,
              is_multiple_choice: row.is_multiple_choice,
              order: row.question_order
            };

            // Only include answers and rationale if requested
            if (includeAnswers) {
              question.question_rationale = row.question_rationale;
              question.correct_answer = row.correct_answer;
            }

            module.questions.push(question);
          }
        }
      });

      // Convert map to array and sort by order
      testData.modules = Array.from(moduleMap.values()).sort((a, b) => a.order - b.order);
      
      // Sort questions within each module by order
      testData.modules.forEach(module => {
        module.questions.sort((a, b) => a.order - b.order);
      });

      return testData;
    } catch (error) {
      throw new Error(`Error fetching test by code: ${error.message}`);
    }
  }

  // Get basic test info by code (without modules/questions)
  static async findBasicByCode(code) {
    const query = 'SELECT * FROM tests WHERE code = $1';
    
    try {
      const result = await pool.query(query, [code]);
      if (result.rows.length === 0) {
        return null;
      }
      return new Test(result.rows[0]);
    } catch (error) {
      throw new Error(`Error fetching test by code: ${error.message}`);
    }
  }

  // Get all tests with basic info
  static async findAll() {
    const query = 'SELECT * FROM tests ORDER BY created_at DESC';
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => new Test(row));
    } catch (error) {
      throw new Error(`Error fetching tests: ${error.message}`);
    }
  }

  // Create a new test
  static async create(testData) {
    const { name, code } = testData;

    const query = `
      INSERT INTO tests (name, code)
      VALUES ($1, $2)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [name, code]);
      return new Test(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error(`Test with code '${code}' already exists`);
      }
      throw new Error(`Error creating test: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      created_at: this.created_at
    };
  }
}

module.exports = Test;
