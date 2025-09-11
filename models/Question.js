const pool = require('../config/db');

class Question {
  constructor(data) {
    this.id = data.id;
    this.alt_id = data.alt_id;
    this.test_type = data.test_type;
    this.question_subject = data.question_subject;
    this.question_domain = data.question_domain;
    this.question_skill = data.question_skill;
    this.difficulty = data.difficulty;
    this.question_prompt = data.question_prompt;
    this.question_choices = data.question_choices;
    this.question_rationale = data.question_rationale;
    this.correct_answer = data.correct_answer;
    this.is_multiple_choice = data.is_multiple_choice;
    this.created_at = data.created_at;
  }

  // Get all questions with optional filtering
  static async findAll(filters = {}) {
    const {
      subject,
      domain,
      skill,
      difficulty,
      test_type,
      is_multiple_choice,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT * FROM questions 
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (subject) {
      paramCount++;
      query += ` AND question_subject = $${paramCount}`;
      queryParams.push(subject);
    }

    if (domain) {
      paramCount++;
      query += ` AND question_domain = $${paramCount}`;
      queryParams.push(domain);
    }

    if (skill) {
      paramCount++;
      query += ` AND question_skill = $${paramCount}`;
      queryParams.push(skill);
    }

    if (difficulty) {
      paramCount++;
      query += ` AND difficulty = $${paramCount}`;
      queryParams.push(difficulty);
    }

    if (test_type) {
      paramCount++;
      query += ` AND test_type = $${paramCount}`;
      queryParams.push(test_type);
    }

    if (is_multiple_choice !== undefined) {
      paramCount++;
      query += ` AND is_multiple_choice = $${paramCount}`;
      queryParams.push(is_multiple_choice);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    try {
      const result = await pool.query(query, queryParams);
      return result.rows.map(row => new Question(row));
    } catch (error) {
      throw new Error(`Error fetching questions: ${error.message}`);
    }
  }

  // Get a single question by ID
  static async findById(id) {
    const query = 'SELECT * FROM questions WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new Question(result.rows[0]);
    } catch (error) {
      throw new Error(`Error fetching question by ID: ${error.message}`);
    }
  }

  // Get a single question by alt_id
  static async findByAltId(alt_id) {
    const query = 'SELECT * FROM questions WHERE alt_id = $1';
    try {
      const result = await pool.query(query, [alt_id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new Question(result.rows[0]);
    } catch (error) {
      throw new Error(`Error fetching question by alt_id: ${error.message}`);
    }
  }

  // Create a new question
  static async create(questionData) {
    const {
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
      is_multiple_choice = false
    } = questionData;

    const query = `
      INSERT INTO questions (
        alt_id, test_type, question_subject, question_domain, question_skill,
        difficulty, question_prompt, question_choices, question_rationale,
        correct_answer, is_multiple_choice
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      alt_id, test_type, question_subject, question_domain, question_skill,
      difficulty, question_prompt, question_choices, question_rationale,
      correct_answer, is_multiple_choice
    ];

    try {
      const result = await pool.query(query, values);
      return new Question(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error(`Question with alt_id '${alt_id}' already exists`);
      }
      throw new Error(`Error creating question: ${error.message}`);
    }
  }

  // Update a question
  async update(updateData) {
    const allowedFields = [
      'test_type', 'question_subject', 'question_domain', 'question_skill',
      'difficulty', 'question_prompt', 'question_choices', 'question_rationale',
      'correct_answer', 'is_multiple_choice'
    ];

    const updates = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    values.push(this.id);

    const query = `
      UPDATE questions 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Question not found');
      }
      
      // Update the current instance with new data
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      throw new Error(`Error updating question: ${error.message}`);
    }
  }

  // Delete a question
  async delete() {
    const query = 'DELETE FROM questions WHERE id = $1 RETURNING *';
    try {
      const result = await pool.query(query, [this.id]);
      if (result.rows.length === 0) {
        throw new Error('Question not found');
      }
      return true;
    } catch (error) {
      throw new Error(`Error deleting question: ${error.message}`);
    }
  }

  // Get question statistics
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_questions,
        COUNT(CASE WHEN is_multiple_choice = true THEN 1 END) as multiple_choice_count,
        COUNT(CASE WHEN is_multiple_choice = false THEN 1 END) as free_response_count,
        COUNT(DISTINCT question_subject) as subject_count,
        COUNT(DISTINCT question_domain) as domain_count,
        COUNT(DISTINCT difficulty) as difficulty_count
      FROM questions
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching question statistics: ${error.message}`);
    }
  }

  // Get unique values for filtering
  static async getFilterOptions() {
    const query = `
      SELECT 
        ARRAY_AGG(DISTINCT test_type) as test_types,
        ARRAY_AGG(DISTINCT question_subject) as subjects,
        ARRAY_AGG(DISTINCT question_domain) as domains,
        ARRAY_AGG(DISTINCT question_skill) as skills,
        ARRAY_AGG(DISTINCT difficulty) as difficulties
      FROM questions
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching filter options: ${error.message}`);
    }
  }

  // Convert to JSON (excluding sensitive data if needed)
  toJSON() {
    return {
      id: this.id,
      alt_id: this.alt_id,
      test_type: this.test_type,
      question_subject: this.question_subject,
      question_domain: this.question_domain,
      question_skill: this.question_skill,
      difficulty: this.difficulty,
      question_prompt: this.question_prompt,
      question_choices: this.question_choices,
      question_rationale: this.question_rationale,
      correct_answer: this.correct_answer,
      is_multiple_choice: this.is_multiple_choice,
      created_at: this.created_at
    };
  }
}

module.exports = Question;
